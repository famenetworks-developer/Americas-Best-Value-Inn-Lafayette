package cms

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"embed"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

//go:embed migrations/*.sql
var migrations embed.FS

type app struct {
	db       *pgxpool.Pool
	mediaDir string
	secure   bool
}
type user struct {
	ID    uuid.UUID `json:"id"`
	Email string    `json:"email"`
	Name  string    `json:"name"`
	Role  string    `json:"role"`
}
type ctxKey int

const userKey ctxKey = 1

var slugRE = regexp.MustCompile(`^[a-z0-9]+(?:-[a-z0-9]+)*$`)

var handlerOnce sync.Once
var sharedHandler http.Handler

// Handler returns the long-lived application handler used by both the local
// server and Vercel's Go function. Database connections are reused per warm instance.
func Handler() http.Handler {
	handlerOnce.Do(func() { sharedHandler = newHandler() })
	return sharedHandler
}

func newHandler() http.Handler {
	dsn := env("DATABASE_URL", "postgres://abvi:local-development-only@localhost:55432/abvi_cms?sslmode=disable")
	db, err := pgxpool.New(context.Background(), dsn)
	must(err)
	must(db.Ping(context.Background()))
	must(runMigrations(db))
	must(bootstrap(db))
	media := env("MEDIA_DIR", "public/uploads")
	must(os.MkdirAll(media, 0750))
	a := &app{db: db, mediaDir: media, secure: env("COOKIE_SECURE", "false") == "true"}
	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/health", func(w http.ResponseWriter, r *http.Request) { write(w, 200, map[string]any{"ok": true}) })
	mux.HandleFunc("POST /api/auth/login", a.login)
	mux.HandleFunc("POST /api/auth/logout", a.auth(a.csrf(a.logout), "author"))
	mux.HandleFunc("GET /api/auth/me", a.auth(a.me, "author"))
	mux.HandleFunc("GET /api/public/content", a.publicContent)
	mux.HandleFunc("GET /api/admin/dashboard", a.auth(a.dashboard, "author"))
	mux.HandleFunc("GET /api/admin/content", a.auth(a.listContent, "author"))
	mux.HandleFunc("POST /api/admin/content", a.auth(a.csrf(a.upsertContent), "author"))
	mux.HandleFunc("GET /api/admin/content/{id}/revisions", a.auth(a.revisions, "author"))
	mux.HandleFunc("POST /api/admin/content/{id}/publish", a.auth(a.csrf(a.publish), "editor"))
	mux.HandleFunc("POST /api/admin/content/{id}/restore/{revision}", a.auth(a.csrf(a.restore), "editor"))
	mux.HandleFunc("GET /api/admin/settings", a.auth(a.settings, "author"))
	mux.HandleFunc("PUT /api/admin/settings/{key}", a.auth(a.csrf(a.saveSetting), "editor"))
	mux.HandleFunc("POST /api/admin/settings/{key}/publish", a.auth(a.csrf(a.publishSetting), "editor"))
	mux.HandleFunc("GET /api/admin/media", a.auth(a.mediaList, "author"))
	mux.HandleFunc("POST /api/admin/media", a.auth(a.csrf(a.mediaUpload), "editor"))
	mux.HandleFunc("DELETE /api/admin/media/{id}", a.auth(a.csrf(a.mediaDelete), "editor"))
	mux.HandleFunc("GET /api/admin/activity", a.auth(a.activity, "author"))
	mux.HandleFunc("GET /api/admin/users", a.auth(a.users, "super_admin"))
	mux.HandleFunc("POST /api/admin/users", a.auth(a.csrf(a.createUser), "super_admin"))
	mux.Handle("/uploads/", http.StripPrefix("/uploads/", http.FileServer(http.Dir(media))))
	if _, err := os.Stat("dist"); err == nil {
		mux.Handle("/", spa(http.FileServer(http.Dir("dist"))))
	}
	return security(mux)
}

func runMigrations(db *pgxpool.Pool) error {
	files, _ := migrations.ReadDir("migrations")
	for _, f := range files {
		b, e := migrations.ReadFile("migrations/" + f.Name())
		if e != nil {
			return e
		}
		if _, e = db.Exec(context.Background(), string(b)); e != nil {
			return fmt.Errorf("%s: %w", f.Name(), e)
		}
	}
	return nil
}
func bootstrap(db *pgxpool.Pool) error {
	email := strings.ToLower(strings.TrimSpace(os.Getenv("ADMIN_EMAIL")))
	pass := os.Getenv("ADMIN_PASSWORD")
	if email == "" || pass == "" {
		return nil
	}
	if len(pass) < 8 {
		return errors.New("ADMIN_PASSWORD must be at least 8 characters")
	}
	h, _ := bcrypt.GenerateFromPassword([]byte(pass), 12)
	_, e := db.Exec(context.Background(), `INSERT INTO users(email,name,password_hash,role) VALUES($1,$2,$3,'super_admin') ON CONFLICT(email) DO NOTHING`, email, env("ADMIN_NAME", "Site Administrator"), string(h))
	return e
}
func (a *app) login(w http.ResponseWriter, r *http.Request) {
	var in struct{ Email, Password string }
	if !decode(w, r, &in) {
		return
	}
	email := strings.ToLower(strings.TrimSpace(in.Email))
	key := hash(remoteIP(r) + "|" + email)
	var blocked *time.Time
	var attempts int
	_ = a.db.QueryRow(r.Context(), `SELECT attempts,blocked_until FROM login_attempts WHERE key_hash=$1`, key).Scan(&attempts, &blocked)
	if blocked != nil && blocked.After(time.Now()) {
		problem(w, 429, "Too many login attempts. Try again later.")
		return
	}
	var u user
	var ph string
	err := a.db.QueryRow(r.Context(), `SELECT id,email,name,role,password_hash FROM users WHERE email=$1 AND active`, email).Scan(&u.ID, &u.Email, &u.Name, &u.Role, &ph)
	if err != nil || bcrypt.CompareHashAndPassword([]byte(ph), []byte(in.Password)) != nil {
		attempts++
		until := any(nil)
		if attempts >= 5 {
			until = time.Now().Add(15 * time.Minute)
		}
		_, _ = a.db.Exec(r.Context(), `INSERT INTO login_attempts(key_hash,attempts,window_started_at,blocked_until) VALUES($1,$2,now(),$3) ON CONFLICT(key_hash) DO UPDATE SET attempts=$2,blocked_until=$3`, key, attempts, until)
		problem(w, 401, "Invalid email or password")
		return
	}
	_, _ = a.db.Exec(r.Context(), `DELETE FROM login_attempts WHERE key_hash=$1`, key)
	token := random(32)
	csrf := random(24)
	_, err = a.db.Exec(r.Context(), `INSERT INTO sessions(id_hash,user_id,csrf_hash,expires_at) VALUES($1,$2,$3,$4)`, hash(token), u.ID, hash(csrf), time.Now().Add(12*time.Hour))
	if err != nil {
		problem(w, 500, "Unable to create session")
		return
	}
	http.SetCookie(w, &http.Cookie{Name: "abvi_session", Value: token, Path: "/", HttpOnly: true, Secure: a.secure, SameSite: http.SameSiteStrictMode, MaxAge: 43200})
	audit(a.db, r, u.ID, "login", "session", "")
	write(w, 200, map[string]any{"user": u, "csrfToken": csrf})
}
func (a *app) logout(w http.ResponseWriter, r *http.Request) {
	c, _ := r.Cookie("abvi_session")
	if c != nil {
		_, _ = a.db.Exec(r.Context(), `DELETE FROM sessions WHERE id_hash=$1`, hash(c.Value))
	}
	http.SetCookie(w, &http.Cookie{Name: "abvi_session", Path: "/", MaxAge: -1, HttpOnly: true, Secure: a.secure, SameSite: http.SameSiteStrictMode})
	write(w, 200, map[string]bool{"ok": true})
}
func (a *app) me(w http.ResponseWriter, r *http.Request) {
	u := current(r)
	var csrf []byte // Rotate a CSRF token on session discovery so refresh stays usable.
	c, _ := r.Cookie("abvi_session")
	token := random(24)
	_, _ = a.db.Exec(r.Context(), `UPDATE sessions SET csrf_hash=$1 WHERE id_hash=$2`, hash(token), hash(c.Value))
	_ = csrf
	write(w, 200, map[string]any{"user": u, "csrfToken": token})
}
func (a *app) auth(next http.HandlerFunc, min string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		c, e := r.Cookie("abvi_session")
		if e != nil {
			problem(w, 401, "Authentication required")
			return
		}
		var u user
		e = a.db.QueryRow(r.Context(), `SELECT u.id,u.email,u.name,u.role FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.id_hash=$1 AND s.expires_at>now() AND u.active`, hash(c.Value)).Scan(&u.ID, &u.Email, &u.Name, &u.Role)
		if e != nil {
			problem(w, 401, "Session expired")
			return
		}
		if rank(u.Role) < rank(min) {
			problem(w, 403, "Insufficient permissions")
			return
		}
		next(w, r.WithContext(context.WithValue(r.Context(), userKey, u)))
	}
}
func (a *app) csrf(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		c, _ := r.Cookie("abvi_session")
		token := r.Header.Get("X-CSRF-Token")
		if c == nil || token == "" {
			problem(w, 403, "CSRF token required")
			return
		}
		var ok bool
		_ = a.db.QueryRow(r.Context(), `SELECT EXISTS(SELECT 1 FROM sessions WHERE id_hash=$1 AND csrf_hash=$2 AND expires_at>now())`, hash(c.Value), hash(token)).Scan(&ok)
		if !ok {
			problem(w, 403, "Invalid CSRF token")
			return
		}
		next(w, r)
	}
}
func (a *app) publicContent(w http.ResponseWriter, r *http.Request) {
	rows, e := a.db.Query(r.Context(), `SELECT content_type,slug,title,published FROM content_entries WHERE status='published' AND active AND published IS NOT NULL ORDER BY display_order,title`)
	if e != nil {
		problem(w, 500, "Content unavailable")
		return
	}
	defer rows.Close()
	out := map[string][]map[string]any{}
	for rows.Next() {
		var typ, slug, title string
		var data map[string]any
		_ = rows.Scan(&typ, &slug, &title, &data)
		data["slug"] = slug
		data["title"] = title
		out[typ] = append(out[typ], data)
	}
	settings := map[string]any{}
	sr, _ := a.db.Query(r.Context(), `SELECT key,published FROM site_settings WHERE published IS NOT NULL`)
	if sr != nil {
		defer sr.Close()
		for sr.Next() {
			var k string
			var v any
			_ = sr.Scan(&k, &v)
			settings[k] = v
		}
	}
	write(w, 200, map[string]any{"content": out, "settings": settings})
}
func (a *app) dashboard(w http.ResponseWriter, r *http.Request) {
	var published, drafts, rooms, pages, media, storage int64
	_ = a.db.QueryRow(r.Context(), `SELECT count(*) FILTER(WHERE status='published'),count(*) FILTER(WHERE status='draft'),count(*) FILTER(WHERE content_type='room'),count(*) FILTER(WHERE content_type='page') FROM content_entries`).Scan(&published, &drafts, &rooms, &pages)
	_ = a.db.QueryRow(r.Context(), `SELECT count(*),coalesce(sum(size_bytes),0) FROM media_assets`).Scan(&media, &storage)
	write(w, 200, map[string]any{"published": published, "drafts": drafts, "rooms": rooms, "pages": pages, "media": media, "storageBytes": storage})
}
func (a *app) listContent(w http.ResponseWriter, r *http.Request) {
	typ := r.URL.Query().Get("type")
	rows, e := a.db.Query(r.Context(), `SELECT id,content_type,slug,title,status,draft,published,display_order,active,updated_at,published_at FROM content_entries WHERE ($1='' OR content_type=$1) ORDER BY content_type,display_order,title`, typ)
	if e != nil {
		problem(w, 500, "Unable to load content")
		return
	}
	defer rows.Close()
	items := []map[string]any{}
	for rows.Next() {
		var id uuid.UUID
		var contentType, slug, title, status string
		var draft, published any
		var order int
		var active bool
		var updated time.Time
		var publishedAt *time.Time
		_ = rows.Scan(&id, &contentType, &slug, &title, &status, &draft, &published, &order, &active, &updated, &publishedAt)
		m := map[string]any{"id": id, "contentType": contentType, "slug": slug, "title": title, "status": status, "draft": draft, "published": published, "displayOrder": order, "active": active, "updatedAt": updated, "publishedAt": publishedAt}
		items = append(items, m)
	}
	write(w, 200, items)
}
func (a *app) upsertContent(w http.ResponseWriter, r *http.Request) {
	var in struct {
		ID, ContentType, Slug, Title string
		Draft                        map[string]any
		DisplayOrder                 int
		Active                       *bool
	}
	if !decode(w, r, &in) {
		return
	}
	if !slugRE.MatchString(in.Slug) || in.Title == "" || in.ContentType == "" {
		problem(w, 422, "A valid type, title, and lowercase slug are required")
		return
	}
	u := current(r)
	active := true
	if in.Active != nil {
		active = *in.Active
	}
	b, _ := json.Marshal(in.Draft)
	tx, e := a.db.Begin(r.Context())
	if e != nil {
		problem(w, 500, "Save failed")
		return
	}
	defer tx.Rollback(r.Context())
	var id uuid.UUID
	if in.ID == "" {
		e = tx.QueryRow(r.Context(), `INSERT INTO content_entries(content_type,slug,title,draft,display_order,active,created_by,updated_by) VALUES($1,$2,$3,$4,$5,$6,$7,$7) RETURNING id`, in.ContentType, in.Slug, in.Title, b, in.DisplayOrder, active, u.ID).Scan(&id)
	} else {
		id, e = uuid.Parse(in.ID)
		if e == nil {
			_, e = tx.Exec(r.Context(), `UPDATE content_entries SET slug=$1,title=$2,draft=$3,display_order=$4,active=$5,updated_by=$6,updated_at=now(),status=CASE WHEN status='scheduled' THEN 'draft' ELSE status END WHERE id=$7`, in.Slug, in.Title, b, in.DisplayOrder, active, u.ID, id)
		}
	}
	if e != nil {
		if strings.Contains(e.Error(), "unique") {
			problem(w, 409, "That slug is already in use")
		} else {
			problem(w, 500, "Save failed")
		}
		return
	}
	_, e = tx.Exec(r.Context(), `INSERT INTO content_revisions(entry_id,data,status,created_by) VALUES($1,$2,'draft',$3)`, id, b, u.ID)
	if e == nil {
		e = tx.Commit(r.Context())
	}
	if e != nil {
		problem(w, 500, "Save failed")
		return
	}
	audit(a.db, r, u.ID, "save_draft", in.ContentType, id.String())
	write(w, 200, map[string]any{"id": id, "saved": true})
}
func (a *app) publish(w http.ResponseWriter, r *http.Request) {
	id, e := uuid.Parse(r.PathValue("id"))
	if e != nil {
		problem(w, 400, "Invalid content ID")
		return
	}
	u := current(r)
	tag, e := a.db.Exec(r.Context(), `UPDATE content_entries SET published=draft,status='published',published_at=now(),updated_at=now(),updated_by=$1 WHERE id=$2`, u.ID, id)
	if e != nil || tag.RowsAffected() == 0 {
		problem(w, 404, "Content not found")
		return
	}
	audit(a.db, r, u.ID, "publish", "content", id.String())
	write(w, 200, map[string]bool{"published": true})
}
func (a *app) revisions(w http.ResponseWriter, r *http.Request) {
	rows, e := a.db.Query(r.Context(), `SELECT r.id,r.status,r.data,r.created_at,coalesce(u.name,'System') FROM content_revisions r LEFT JOIN users u ON u.id=r.created_by WHERE entry_id=$1 ORDER BY r.created_at DESC LIMIT 50`, r.PathValue("id"))
	if e != nil {
		problem(w, 400, "Invalid content ID")
		return
	}
	defer rows.Close()
	out := []map[string]any{}
	for rows.Next() {
		var id int64
		var status, author string
		var data any
		var created time.Time
		_ = rows.Scan(&id, &status, &data, &created, &author)
		m := map[string]any{"id": id, "status": status, "data": data, "createdAt": created, "author": author}
		out = append(out, m)
	}
	write(w, 200, out)
}
func (a *app) restore(w http.ResponseWriter, r *http.Request) {
	u := current(r)
	tag, e := a.db.Exec(r.Context(), `UPDATE content_entries c SET draft=r.data,updated_by=$1,updated_at=now() FROM content_revisions r WHERE c.id=$2 AND r.id=$3 AND r.entry_id=c.id`, u.ID, r.PathValue("id"), r.PathValue("revision"))
	if e != nil || tag.RowsAffected() == 0 {
		problem(w, 404, "Revision not found")
		return
	}
	audit(a.db, r, u.ID, "restore_revision", "content", r.PathValue("id"))
	write(w, 200, map[string]bool{"restored": true})
}
func (a *app) settings(w http.ResponseWriter, r *http.Request) {
	rows, e := a.db.Query(r.Context(), `SELECT key,draft,published,updated_at,published_at FROM site_settings ORDER BY key`)
	if e != nil {
		problem(w, 500, "Settings unavailable")
		return
	}
	defer rows.Close()
	out := []map[string]any{}
	for rows.Next() {
		var key string
		var draft, published any
		var updated time.Time
		var publishedAt *time.Time
		_ = rows.Scan(&key, &draft, &published, &updated, &publishedAt)
		m := map[string]any{"key": key, "draft": draft, "published": published, "updatedAt": updated, "publishedAt": publishedAt}
		out = append(out, m)
	}
	write(w, 200, out)
}
func (a *app) saveSetting(w http.ResponseWriter, r *http.Request) {
	var data map[string]any
	if !decode(w, r, &data) {
		return
	}
	key := r.PathValue("key")
	if key == "theme" && !validTheme(data) {
		problem(w, 422, "Theme contains an invalid color or value")
		return
	}
	u := current(r)
	b, _ := json.Marshal(data)
	_, e := a.db.Exec(r.Context(), `INSERT INTO site_settings(key,draft,updated_by) VALUES($1,$2,$3) ON CONFLICT(key) DO UPDATE SET draft=$2,updated_by=$3,updated_at=now()`, key, b, u.ID)
	if e != nil {
		problem(w, 500, "Unable to save settings")
		return
	}
	audit(a.db, r, u.ID, "save_draft", "setting", key)
	write(w, 200, map[string]bool{"saved": true})
}
func (a *app) publishSetting(w http.ResponseWriter, r *http.Request) {
	key := r.PathValue("key")
	u := current(r)
	tag, e := a.db.Exec(r.Context(), `UPDATE site_settings SET published=draft,published_at=now(),updated_at=now(),updated_by=$1 WHERE key=$2`, u.ID, key)
	if e != nil || tag.RowsAffected() == 0 {
		problem(w, 404, "Setting not found")
		return
	}
	audit(a.db, r, u.ID, "publish", "setting", key)
	write(w, 200, map[string]bool{"published": true})
}
func (a *app) mediaList(w http.ResponseWriter, r *http.Request) {
	rows, e := a.db.Query(r.Context(), `SELECT id,filename,'/uploads/'||storage_key,mime_type,size_bytes,width,height,alt_text,caption,category,created_at FROM media_assets ORDER BY created_at DESC LIMIT 200`)
	if e != nil {
		problem(w, 500, "Media unavailable")
		return
	}
	defer rows.Close()
	out := []map[string]any{}
	for rows.Next() {
		var id uuid.UUID
		var filename, url, mime, alt, caption, category string
		var size int64
		var width, height *int
		var created time.Time
		_ = rows.Scan(&id, &filename, &url, &mime, &size, &width, &height, &alt, &caption, &category, &created)
		m := map[string]any{"id": id, "filename": filename, "url": url, "mimeType": mime, "sizeBytes": size, "width": width, "height": height, "altText": alt, "caption": caption, "category": category, "createdAt": created}
		out = append(out, m)
	}
	write(w, 200, out)
}
func (a *app) mediaUpload(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, 12<<20)
	if e := r.ParseMultipartForm(12 << 20); e != nil {
		problem(w, 413, "Upload must be 10 MB or smaller")
		return
	}
	f, h, e := r.FormFile("file")
	if e != nil {
		problem(w, 422, "Choose an image")
		return
	}
	defer f.Close()
	mime := h.Header.Get("Content-Type")
	if !map[string]bool{"image/jpeg": true, "image/png": true, "image/webp": true, "image/avif": true}[mime] {
		problem(w, 415, "Only JPG, PNG, WebP, and AVIF images are accepted")
		return
	}
	ext := map[string]string{"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/avif": ".avif"}[mime]
	key := uuid.NewString() + ext
	dest, e := os.OpenFile(filepath.Join(a.mediaDir, key), os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0640)
	if e != nil {
		problem(w, 500, "Upload failed")
		return
	}
	n, e := io.Copy(dest, f)
	_ = dest.Close()
	if e != nil {
		_ = os.Remove(filepath.Join(a.mediaDir, key))
		problem(w, 500, "Upload failed")
		return
	}
	u := current(r)
	var id uuid.UUID
	e = a.db.QueryRow(r.Context(), `INSERT INTO media_assets(filename,storage_key,mime_type,size_bytes,alt_text,caption,category,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`, filepath.Base(h.Filename), key, mime, n, r.FormValue("altText"), r.FormValue("caption"), value(r.FormValue("category"), "general"), u.ID).Scan(&id)
	if e != nil {
		_ = os.Remove(filepath.Join(a.mediaDir, key))
		problem(w, 500, "Upload failed")
		return
	}
	audit(a.db, r, u.ID, "upload", "media", id.String())
	write(w, 201, map[string]any{"id": id, "url": "/uploads/" + key})
}
func (a *app) mediaDelete(w http.ResponseWriter, r *http.Request) {
	u := current(r)
	var key string
	e := a.db.QueryRow(r.Context(), `DELETE FROM media_assets WHERE id=$1 RETURNING storage_key`, r.PathValue("id")).Scan(&key)
	if e != nil {
		problem(w, 404, "Media not found")
		return
	}
	_ = os.Remove(filepath.Join(a.mediaDir, key))
	audit(a.db, r, u.ID, "delete", "media", r.PathValue("id"))
	write(w, 200, map[string]bool{"deleted": true})
}
func (a *app) activity(w http.ResponseWriter, r *http.Request) {
	rows, e := a.db.Query(r.Context(), `SELECT a.id,coalesce(u.name,'System'),a.action,a.entity_type,a.entity_id,a.created_at FROM activity_logs a LEFT JOIN users u ON u.id=a.user_id ORDER BY a.created_at DESC LIMIT 100`)
	if e != nil {
		problem(w, 500, "Activity unavailable")
		return
	}
	defer rows.Close()
	out := []map[string]any{}
	for rows.Next() {
		var id int64
		var username, action, entityType string
		var entityID *string
		var created time.Time
		_ = rows.Scan(&id, &username, &action, &entityType, &entityID, &created)
		m := map[string]any{"id": id, "user": username, "action": action, "entityType": entityType, "entityId": entityID, "createdAt": created}
		out = append(out, m)
	}
	write(w, 200, out)
}
func (a *app) users(w http.ResponseWriter, r *http.Request) {
	rows, e := a.db.Query(r.Context(), `SELECT id,email,name,role,active,created_at FROM users ORDER BY name`)
	if e != nil {
		problem(w, 500, "Users unavailable")
		return
	}
	defer rows.Close()
	out := []map[string]any{}
	for rows.Next() {
		var id uuid.UUID
		var email, name, role string
		var active bool
		var created time.Time
		_ = rows.Scan(&id, &email, &name, &role, &active, &created)
		m := map[string]any{"id": id, "email": email, "name": name, "role": role, "active": active, "createdAt": created}
		out = append(out, m)
	}
	write(w, 200, out)
}
func (a *app) createUser(w http.ResponseWriter, r *http.Request) {
	var in struct{ Email, Name, Password, Role string }
	if !decode(w, r, &in) {
		return
	}
	in.Email = strings.ToLower(strings.TrimSpace(in.Email))
	if !strings.Contains(in.Email, "@") || len(in.Password) < 12 || rank(in.Role) == 0 {
		problem(w, 422, "Valid email, role, and a 12+ character password are required")
		return
	}
	h, _ := bcrypt.GenerateFromPassword([]byte(in.Password), 12)
	var id uuid.UUID
	e := a.db.QueryRow(r.Context(), `INSERT INTO users(email,name,password_hash,role) VALUES($1,$2,$3,$4) RETURNING id`, in.Email, in.Name, string(h), in.Role).Scan(&id)
	if e != nil {
		problem(w, 409, "A user with that email already exists")
		return
	}
	u := current(r)
	audit(a.db, r, u.ID, "create", "user", id.String())
	write(w, 201, map[string]any{"id": id})
}

func audit(db *pgxpool.Pool, r *http.Request, uid uuid.UUID, action, typ, id string) {
	ip := net.ParseIP(remoteIP(r))
	_, _ = db.Exec(r.Context(), `INSERT INTO activity_logs(user_id,action,entity_type,entity_id,ip) VALUES($1,$2,$3,$4,$5)`, uid, action, typ, id, ip)
}
func current(r *http.Request) user { return r.Context().Value(userKey).(user) }
func rank(s string) int            { return map[string]int{"author": 1, "editor": 2, "super_admin": 3}[s] }
func validTheme(v map[string]any) bool {
	color := regexp.MustCompile(`^#[0-9a-fA-F]{6}$`)
	for _, k := range []string{"primary", "secondary", "accent", "background", "surface", "heading", "text", "muted", "border"} {
		if x, ok := v[k]; ok && !color.MatchString(fmt.Sprint(x)) {
			return false
		}
	}
	return true
}
func random(n int) string  { b := make([]byte, n); _, _ = rand.Read(b); return hex.EncodeToString(b) }
func hash(v string) []byte { x := sha256.Sum256([]byte(v)); return x[:] }
func remoteIP(r *http.Request) string {
	h, _, e := net.SplitHostPort(r.RemoteAddr)
	if e == nil {
		return h
	}
	return r.RemoteAddr
}
func decode(w http.ResponseWriter, r *http.Request, v any) bool {
	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
	d := json.NewDecoder(r.Body)
	d.DisallowUnknownFields()
	if e := d.Decode(v); e != nil {
		problem(w, 400, "Invalid request")
		return false
	}
	return true
}
func write(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}
func problem(w http.ResponseWriter, status int, msg string) {
	write(w, status, map[string]any{"error": msg})
}
func security(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "SAMEORIGIN")
		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
		w.Header().Set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
		next.ServeHTTP(w, r)
	})
}
func spa(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		p := strings.TrimPrefix(filepath.Clean(r.URL.Path), string(filepath.Separator))
		if _, e := os.Stat(filepath.Join("dist", p)); e != nil && !strings.HasPrefix(r.URL.Path, "/api/") {
			index, readErr := os.ReadFile(filepath.Join("dist", "index.html"))
			if readErr != nil {
				http.Error(w, "Application build not found", http.StatusNotFound)
				return
			}
			w.Header().Set("Content-Type", "text/html; charset=utf-8")
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write(index)
			return
		}
		next.ServeHTTP(w, r)
	})
}
func env(k, d string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return d
}
func value(v, d string) string {
	if v == "" {
		return d
	}
	return v
}
func must(e error) {
	if e != nil && !errors.Is(e, http.ErrServerClosed) {
		panic(e)
	}
}

var _ multipart.File
var _ = pgx.ErrNoRows
var _ = strconv.Itoa
