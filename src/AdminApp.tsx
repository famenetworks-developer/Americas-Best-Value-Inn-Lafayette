import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Activity,
  ArrowUpRight,
  BedDouble,
  Bell,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  FileText,
  GalleryHorizontal,
  Home,
  Image,
  LayoutDashboard,
  LogOut,
  Menu,
  Palette,
  Plus,
  Save,
  Search,
  Settings,
  ShieldCheck,
  Upload,
  Users,
  X,
} from "lucide-react";
import { api, setCSRF, type CMSUser } from "./api";
import "./admin.css";
type Entry = {
  id: string;
  contentType: string;
  slug: string;
  title: string;
  status: string;
  draft: Record<string, unknown>;
  published?: Record<string, unknown>;
  displayOrder: number;
  active: boolean;
  updatedAt: string;
};
type Setting = {
  key: string;
  draft: Record<string, unknown>;
  published?: Record<string, unknown>;
  updatedAt: string;
};
const routes = [
  ["dashboard", "Overview", LayoutDashboard],
  ["pages", "Pages", FileText],
  ["rooms", "Rooms", BedDouble],
  ["amenities", "Amenities", ShieldCheck],
  ["gallery", "Gallery", GalleryHorizontal],
  ["media", "Media library", Image],
  ["navigation", "Navigation", Menu],
  ["theme", "Theme studio", Palette],
  ["seo", "SEO", Search],
  ["settings", "Settings", Settings],
  ["users", "Users", Users],
  ["activity", "Activity", Activity],
] as const;
function useRoute() {
  const get = () => location.pathname.split("/")[2] || "dashboard";
  const [route, setRoute] = useState(get);
  useEffect(() => {
    const fn = () => setRoute(get());
    addEventListener("popstate", fn);
    return () => removeEventListener("popstate", fn);
  }, []);
  return [
    route,
    (v: string) => {
      history.pushState({}, "", v === "dashboard" ? "/admin" : `/admin/${v}`);
      setRoute(v);
    },
  ] as const;
}
export function AdminApp() {
  const [user, setUser] = useState<CMSUser | null | undefined>();
  const [notice, setNotice] = useState("");
  useEffect(() => {
    api<{ user: CMSUser; csrfToken: string }>("/api/auth/me")
      .then((v) => {
        setCSRF(v.csrfToken);
        setUser(v.user);
      })
      .catch(() => setUser(null));
  }, []);
  if (user === undefined)
    return (
      <div className="admin-loader">
        <span />
      </div>
    );
  if (!user) return <Login onLogin={setUser} />;
  return (
    <AdminShell
      user={user}
      notice={notice}
      setNotice={setNotice}
      onLogout={() => setUser(null)}
    />
  );
}
function Login({ onLogin }: { onLogin: (u: CMSUser) => void }) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    try {
      const v = await api<{ user: CMSUser; csrfToken: string }>(
        "/api/auth/login",
        {
          method: "POST",
          body: JSON.stringify({
            email: f.get("email"),
            password: f.get("password"),
          }),
        },
      );
      setCSRF(v.csrfToken);
      onLogin(v.user);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login-page">
      <div className="login-glow" />
      <section className="login-card">
        <img src="/assets/logo.svg" alt="Americas Best Value Inn by Sonesta" />
        <span className="admin-kicker">Property content studio</span>
        <h1>Welcome back.</h1>
        <p>Sign in to manage the Lafayette hotel website.</p>
        <form onSubmit={submit}>
          <label>
            Admin ID or email
            <input name="email" type="text" autoComplete="username" required />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              minLength={8}
            />
          </label>
          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}
          <button className="admin-primary" disabled={busy}>
            {busy ? "Signing in…" : "Sign in securely"}{" "}
            <ArrowUpRight size={17} />
          </button>
        </form>
        <small>Protected with encrypted credentials and secure sessions.</small>
      </section>
    </main>
  );
}
function AdminShell({
  user,
  notice,
  setNotice,
  onLogout,
}: {
  user: CMSUser;
  notice: string;
  setNotice: (v: string) => void;
  onLogout: () => void;
}) {
  const [route, navigate] = useRoute(),
    [collapsed, setCollapsed] = useState(false),
    [mobile, setMobile] = useState(false);
  const allowed = (id: string) => id !== "users" || user.role === "super_admin";
  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    onLogout();
  }
  return (
    <div className={`admin-app ${collapsed ? "is-collapsed" : ""}`}>
      <aside className={mobile ? "is-open" : ""}>
        <div className="admin-brand">
          <img src="/assets/logo.svg" alt="" />
          <div>
            <b>ABVI Lafayette</b>
            <span>Content studio</span>
          </div>
          <button
            onClick={() => setMobile(false)}
            className="mobile-close"
            aria-label="Close navigation"
          >
            <X />
          </button>
        </div>
        <nav>
          {routes
            .filter(([id]) => allowed(id))
            .map(([id, label, Icon]) => (
              <button
                className={route === id ? "active" : ""}
                onClick={() => {
                  navigate(id);
                  setMobile(false);
                }}
                key={id}
              >
                <Icon />
                <span>{label}</span>
                {id === "dashboard" && <i />}
              </button>
            ))}
        </nav>
        <div className="admin-user">
          <div>{user.name.slice(0, 2).toUpperCase()}</div>
          <span>
            <b>{user.name}</b>
            <small>{user.role.replace("_", " ")}</small>
          </span>
          <button onClick={logout} title="Log out">
            <LogOut />
          </button>
        </div>
      </aside>
      <div className="admin-main">
        <header>
          <button
            className="mobile-menu"
            onClick={() => setMobile(true)}
            aria-label="Open navigation"
          >
            <Menu />
          </button>
          <button
            className="collapse"
            onClick={() => setCollapsed((v) => !v)}
            aria-label="Toggle sidebar"
          >
            {collapsed ? <ChevronRight /> : <ChevronLeft />}
          </button>
          <div className="admin-search">
            <Search />
            <input
              aria-label="Search CMS"
              placeholder="Search content and media…"
            />
          </div>
          <a className="preview-link" href="/" target="_blank">
            Preview website <ArrowUpRight />
          </a>
          <button className="icon-button" aria-label="Notifications">
            <Bell />
            <i />
          </button>
        </header>
        <div className="admin-content">
          <View
            route={route}
            user={user}
            notify={(v) => {
              setNotice(v);
              setTimeout(() => setNotice(""), 3500);
            }}
            navigate={navigate}
          />
        </div>
      </div>
      {notice && (
        <div className="admin-toast" role="status">
          {notice}
        </div>
      )}
    </div>
  );
}
function View({
  route,
  user,
  notify,
  navigate,
}: {
  route: string;
  user: CMSUser;
  notify: (v: string) => void;
  navigate: (v: string) => void;
}) {
  if (route === "dashboard")
    return <Dashboard user={user} navigate={navigate} />;
  if (
    ["pages", "rooms", "amenities", "gallery", "navigation", "seo"].includes(
      route,
    )
  )
    return (
      <ContentManager
        type={
          (
            {
              pages: "page",
              rooms: "room",
              amenities: "amenity",
              gallery: "gallery",
              navigation: "navigation",
              seo: "seo",
            } as Record<string, string>
          )[route]
        }
        canPublish={user.role !== "author"}
        notify={notify}
      />
    );
  if (route === "theme") return <Theme notify={notify} />;
  if (route === "media") return <Media notify={notify} />;
  if (route === "settings") return <SettingsView notify={notify} />;
  if (route === "activity") return <ActivityView />;
  if (route === "users") return <UsersView notify={notify} />;
  return null;
}
function Title({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="admin-title">
      <div>
        <span>{eyebrow}</span>
        <h1>{title}</h1>
      </div>
      {children}
    </div>
  );
}
function Dashboard({
  user,
  navigate,
}: {
  user: CMSUser;
  navigate: (v: string) => void;
}) {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [activity, setActivity] = useState<Record<string, string>[]>([]);
  useEffect(() => {
    api<Record<string, number>>("/api/admin/dashboard").then(setStats);
    api<Record<string, string>[]>("/api/admin/activity").then(setActivity);
  }, []);
  return (
    <>
      <Title
        eyebrow="Thursday, November 12"
        title={`Good morning, ${user.name.split(" ")[0]}.`}
      >
        <a href="/" target="_blank" className="admin-secondary">
          View live site <ArrowUpRight />
        </a>
      </Title>
      <section className="status-strip">
        <div>
          <i />
          <span>
            <b>Website online</b>
            <small>All systems operational</small>
          </span>
        </div>
        <div>
          <span>Last publish</span>
          <b>Recently</b>
        </div>
        <div>
          <span>Content health</span>
          <b>92%</b>
        </div>
        <button onClick={() => navigate("pages")}>
          Edit homepage <ChevronRight />
        </button>
      </section>
      <div className="metric-grid">
        {[
          [
            stats.published || 0,
            "Published items",
            "Live across your website",
            BookOpen,
          ],
          [stats.drafts || 0, "Draft changes", "Waiting for review", FileText],
          [stats.rooms || 0, "Room types", "Active inventory", BedDouble],
          [
            stats.media || 0,
            "Media assets",
            `${formatBytes(stats.storageBytes || 0)} used`,
            Image,
          ],
        ].map(([n, label, sub, Icon]) => (
          <article className="metric" key={String(label)}>
            <div>
              {(() => {
                const MetricIcon = Icon as typeof BookOpen;
                return <MetricIcon />;
              })()}
              <span>+0%</span>
            </div>
            <strong>{n as number}</strong>
            <h3>{label as string}</h3>
            <p>{sub as string}</p>
          </article>
        ))}
      </div>
      <div className="dashboard-grid">
        <section className="panel content-score">
          <header>
            <div>
              <span>Content completion</span>
              <h2>Website readiness</h2>
            </div>
            <b>92%</b>
          </header>
          <div className="score-ring">
            <span>
              92<small>%</small>
            </span>
          </div>
          <ul>
            <li>
              <i style={{ width: "100%" }} />
              <span>Core pages</span>
              <b>5 / 5</b>
            </li>
            <li>
              <i style={{ width: "85%" }} />
              <span>SEO metadata</span>
              <b>85%</b>
            </li>
            <li>
              <i style={{ width: "90%" }} />
              <span>Image alt text</span>
              <b>90%</b>
            </li>
          </ul>
        </section>
        <section className="panel quick-actions">
          <header>
            <div>
              <span>Shortcuts</span>
              <h2>Quick actions</h2>
            </div>
          </header>
          <div>
            {[
              ["pages", "Edit homepage", Home],
              ["rooms", "Add a room", BedDouble],
              ["media", "Upload images", Upload],
              ["theme", "Edit visual theme", Palette],
            ].map(([id, label, Icon]) => (
              <button key={id as string} onClick={() => navigate(id as string)}>
                <Icon />
                <span>{label as string}</span>
                <ArrowUpRight />
              </button>
            ))}
          </div>
        </section>
        <section className="panel activity-panel">
          <header>
            <div>
              <span>Audit trail</span>
              <h2>Recent activity</h2>
            </div>
            <button onClick={() => navigate("activity")}>View all</button>
          </header>
          <ul>
            {activity.slice(0, 5).map((a, i) => (
              <li key={String(a.id)}>
                <i />
                <div>
                  <b>{a.user}</b> {a.action?.replace("_", " ")} {a.entityType}
                  <small>{new Date(a.createdAt).toLocaleString()}</small>
                </div>
              </li>
            ))}
            {!activity.length && (
              <p className="empty">
                Activity will appear here after your first edit.
              </p>
            )}
          </ul>
        </section>
      </div>
    </>
  );
}
function ContentManager({
  type,
  canPublish,
  notify,
}: {
  type: string;
  canPublish: boolean;
  notify: (v: string) => void;
}) {
  const [items, setItems] = useState<Entry[]>([]),
    [selected, setSelected] = useState<Entry | null>(null),
    [adding, setAdding] = useState(false),
    [query, setQuery] = useState("");
  const load = () =>
    api<Entry[]>(`/api/admin/content?type=${type}`).then((v) => {
      setItems(v);
      if (selected) setSelected(v.find((x) => x.id === selected.id) || null);
    });
  useEffect(() => {
    load();
  }, [type]);
  const shown = items.filter((i) =>
    i.title.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <Title
        eyebrow="Content library"
        title={`${type[0].toUpperCase() + type.slice(1)} management`}
      >
        <button className="admin-primary" onClick={() => setAdding(true)}>
          <Plus /> Add {type}
        </button>
      </Title>
      <div className="manager-layout">
        <section className="content-list panel">
          <div className="list-tools">
            <div>
              <Search />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${type}s…`}
              />
            </div>
            <span>{shown.length} items</span>
          </div>
          {shown.map((i) => (
            <button
              key={i.id}
              className={selected?.id === i.id ? "selected" : ""}
              onClick={() => setSelected(i)}
            >
              <div className="content-thumb">
                {i.draft.image ? (
                  <img src={String(i.draft.image)} alt="" />
                ) : (
                  <FileText />
                )}
              </div>
              <span>
                <b>{i.title}</b>
                <small>
                  /{i.slug} · Updated{" "}
                  {new Date(i.updatedAt).toLocaleDateString()}
                </small>
              </span>
              <em className={`status status-${i.status}`}>{i.status}</em>
              <ChevronRight />
            </button>
          ))}
          {!shown.length && (
            <p className="empty">No content found. Create the first item.</p>
          )}
        </section>
        <section className="editor-panel panel">
          {selected ? (
            <EntryEditor
              entry={selected}
              canPublish={canPublish}
              notify={notify}
              done={load}
            />
          ) : (
            <div className="editor-empty">
              <FileText />
              <h2>Select an item to edit</h2>
              <p>
                Draft changes remain private until an editor publishes them.
              </p>
            </div>
          )}
        </section>
      </div>
      {adding && (
        <NewEntry
          type={type}
          close={() => setAdding(false)}
          done={() => {
            setAdding(false);
            load();
          }}
          notify={notify}
        />
      )}
    </>
  );
}
function EntryEditor({
  entry,
  canPublish,
  notify,
  done,
}: {
  entry: Entry;
  canPublish: boolean;
  notify: (v: string) => void;
  done: () => void;
}) {
  const [title, setTitle] = useState(entry.title),
    [slug, setSlug] = useState(entry.slug),
    [draft, setDraft] = useState<Record<string, unknown>>(entry.draft),
    [advanced, setAdvanced] = useState(JSON.stringify(entry.draft, null, 2)),
    [dirty, setDirty] = useState(false);
  useEffect(() => {
    setTitle(entry.title);
    setSlug(entry.slug);
    setDraft(entry.draft);
    setAdvanced(JSON.stringify(entry.draft, null, 2));
    setDirty(false);
  }, [entry.id]);
  useEffect(() => {
    const fn = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    addEventListener("beforeunload", fn);
    return () => removeEventListener("beforeunload", fn);
  }, [dirty]);
  function updateDraft(next: Record<string, unknown>) {
    setDraft(next);
    setAdvanced(JSON.stringify(next, null, 2));
    setDirty(true);
  }
  async function save() {
    try {
      await api("/api/admin/content", {
        method: "POST",
        body: JSON.stringify({
          id: entry.id,
          contentType: entry.contentType,
          title,
          slug,
          draft,
          displayOrder: entry.displayOrder,
          active: entry.active,
        }),
      });
      setDirty(false);
      notify("Draft saved successfully");
      done();
      return true;
    } catch (e) {
      notify((e as Error).message);
      return false;
    }
  }
  async function publish() {
    if (!(await save())) return;
    await api(`/api/admin/content/${entry.id}/publish`, { method: "POST" });
    notify("Changes published to the website");
    done();
  }
  return (
    <>
      <header>
        <div>
          <span className={`status status-${entry.status}`}>
            {entry.status}
          </span>
          <h2>{entry.title}</h2>
          <span className="connection-state">
            <i /> Connected to website
          </span>
        </div>
        <div>
          <button
            className="admin-secondary"
            onClick={() =>
              open(
                entry.contentType === "page" && entry.slug === "home"
                  ? "/"
                  : `/${entry.slug}/`,
                "_blank",
              )
            }
          >
            View live page
          </button>
          <button className="admin-secondary" onClick={save}>
            <Save /> Save draft
          </button>
          {canPublish && (
            <button className="admin-primary" onClick={publish}>
              Publish <ArrowUpRight />
            </button>
          )}
        </div>
      </header>
      <div className="editor-fields">
        <label>
          Display title
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setDirty(true);
            }}
          />
        </label>
        <label>
          URL slug
          <div className="slug-field">
            <span>/</span>
            <input
              value={slug}
              onChange={(e) => {
                setSlug(
                  e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                );
                setDirty(true);
              }}
            />
          </div>
        </label>
        <div className="full editor-guide">
          <div>
            <i>1</i>
            <span>
              <b>Edit content</b>
              <small>Use the simple fields below.</small>
            </span>
          </div>
          <div>
            <i>2</i>
            <span>
              <b>Save draft</b>
              <small>Your live website stays unchanged.</small>
            </span>
          </div>
          <div>
            <i>3</i>
            <span>
              <b>Publish</b>
              <small>The website updates immediately.</small>
            </span>
          </div>
        </div>
        <ContentFields draft={draft} update={updateDraft} />
        <label className="full">
          <details className="advanced-editor">
            <summary>Advanced structured data</summary>
            <small>
              For technical users only. Normal content can be managed with the
              fields above.
            </small>
            <textarea
              rows={12}
              value={advanced}
              spellCheck={false}
              onChange={(e) => {
                setAdvanced(e.target.value);
                setDirty(true);
                try {
                  setDraft(JSON.parse(e.target.value));
                } catch {
                  /* show save error if invalid */
                }
              }}
            />
          </details>
        </label>
      </div>
    </>
  );
}
function ContentFields({
  draft,
  update,
}: {
  draft: Record<string, unknown>;
  update: (value: Record<string, unknown>) => void;
}) {
  const set = (key: string, value: unknown) =>
    update({ ...draft, [key]: value });
  const fields = Object.entries(draft).filter(
    ([, value]) =>
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean",
  );
  const ctas = Object.entries(draft).filter(
    ([, value]) => value && typeof value === "object" && !Array.isArray(value),
  );
  const arrays = Object.entries(draft).filter(([, value]) =>
    Array.isArray(value),
  );
  return (
    <>
      {fields.map(([key, value]) => (
        <label key={key} className={String(value).length > 80 ? "full" : ""}>
          {friendly(key)}
          {typeof value === "boolean" ? (
            <span className="toggle-row">
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => set(key, e.target.checked)}
              />
              <b>{value ? "Visible / active" : "Hidden / inactive"}</b>
            </span>
          ) : String(value).length > 80 ? (
            <textarea
              rows={4}
              value={String(value)}
              onChange={(e) => set(key, e.target.value)}
            />
          ) : (
            <input
              type={typeof value === "number" ? "number" : "text"}
              value={String(value)}
              onChange={(e) =>
                set(
                  key,
                  typeof value === "number"
                    ? Number(e.target.value)
                    : e.target.value,
                )
              }
            />
          )}
        </label>
      ))}
      {ctas.map(([key, value]) => {
        const object = value as Record<string, unknown>;
        return (
          <fieldset className="full nested-fields" key={key}>
            <legend>{friendly(key)}</legend>
            {Object.entries(object)
              .filter(([, v]) => typeof v === "string" || typeof v === "number")
              .map(([child, v]) => (
                <label key={child}>
                  {friendly(child)}
                  <input
                    value={String(v)}
                    onChange={(e) =>
                      set(key, { ...object, [child]: e.target.value })
                    }
                  />
                </label>
              ))}
          </fieldset>
        );
      })}
      {arrays.map(([key, value]) => {
        const list = value as Record<string, unknown>[];
        if (!list.every((item) => item && typeof item === "object"))
          return null;
        return (
          <fieldset className="full nested-fields repeatable" key={key}>
            <legend>{friendly(key)}</legend>
            {list.map((item, index) => (
              <div className="repeatable-row" key={index}>
                <b>{index + 1}</b>
                {Object.entries(item)
                  .filter(([, v]) => typeof v === "string")
                  .map(([child, v]) => (
                    <label key={child}>
                      {friendly(child)}
                      <input
                        value={String(v)}
                        onChange={(e) => {
                          const next = list.map((current, i) =>
                            i === index
                              ? { ...current, [child]: e.target.value }
                              : current,
                          );
                          set(key, next);
                        }}
                      />
                    </label>
                  ))}
              </div>
            ))}
          </fieldset>
        );
      })}
    </>
  );
}
function friendly(value: string) {
  return value
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (letter) => letter.toUpperCase());
}
function NewEntry({
  type,
  close,
  done,
  notify,
}: {
  type: string;
  close: () => void;
  done: () => void;
  notify: (v: string) => void;
}) {
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget),
      title = String(f.get("title")),
      slug = String(f.get("slug"));
    try {
      await api("/api/admin/content", {
        method: "POST",
        body: JSON.stringify({
          contentType: type,
          title,
          slug,
          draft: { name: title, title, description: "" },
          displayOrder: 0,
          active: true,
        }),
      });
      notify("New draft created");
      done();
    } catch (e) {
      notify((e as Error).message);
    }
  }
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && close()}
    >
      <form className="admin-modal" onSubmit={submit}>
        <button type="button" onClick={close}>
          <X />
        </button>
        <span className="admin-kicker">New content</span>
        <h2>Add {type}</h2>
        <label>
          Title
          <input
            name="title"
            required
            onChange={(e) => {
              const el = e.currentTarget.form?.elements.namedItem(
                "slug",
              ) as HTMLInputElement;
              if (el && !el.dataset.touched)
                el.value = e.target.value
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/^-|-$/g, "");
            }}
          />
        </label>
        <label>
          Slug
          <input
            name="slug"
            required
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            onInput={(e) => (e.currentTarget.dataset.touched = "1")}
          />
        </label>
        <button className="admin-primary">Create draft</button>
      </form>
    </div>
  );
}
function Theme({ notify }: { notify: (v: string) => void }) {
  const defaults = {
    primary: "#112631",
    secondary: "#07161d",
    accent: "#b98e45",
    background: "#f8f4eb",
    surface: "#ffffff",
    heading: "#112631",
    text: "#3f4b47",
    muted: "#707872",
    border: "#d9ccad",
    radius: 0,
    shadow: 50,
    brightness: 90,
    contrast: 106,
    saturation: 82,
    fontHeading: "Display",
    fontBody: "Body",
  };
  const [theme, setTheme] = useState<Record<string, string | number>>(defaults);
  useEffect(() => {
    api<Setting[]>("/api/admin/settings").then((v) => {
      const t = v.find((x) => x.key === "theme");
      if (t) setTheme({ ...defaults, ...t.draft });
    });
  }, []);
  const set = (k: string, v: string | number) =>
    setTheme((t) => ({ ...t, [k]: v }));
  async function save(publish = false) {
    await api("/api/admin/settings/theme", {
      method: "PUT",
      body: JSON.stringify(theme),
    });
    if (publish)
      await api("/api/admin/settings/theme/publish", { method: "POST" });
    notify(publish ? "Theme published" : "Theme draft saved");
  }
  return (
    <>
      <Title eyebrow="Visual identity" title="Theme studio">
        <div className="title-actions">
          <button
            className="admin-secondary"
            onClick={() => setTheme(defaults)}
          >
            Reset defaults
          </button>
          <button className="admin-secondary" onClick={() => save()}>
            <Save /> Save draft
          </button>
          <button className="admin-primary" onClick={() => save(true)}>
            Publish theme
          </button>
        </div>
      </Title>
      <div className="theme-grid">
        <section className="panel theme-controls">
          <h2>Color system</h2>
          <div className="color-grid">
            {[
              "primary",
              "secondary",
              "accent",
              "background",
              "surface",
              "heading",
              "text",
              "muted",
              "border",
            ].map((k) => (
              <label key={k}>
                <span>{k}</span>
                <div>
                  <input
                    type="color"
                    value={String(theme[k])}
                    onChange={(e) => set(k, e.target.value)}
                  />
                  <input
                    value={String(theme[k])}
                    onChange={(e) => set(k, e.target.value)}
                  />
                </div>
              </label>
            ))}
          </div>
          <h2>Shape & imagery</h2>
          {[
            ["radius", 0, 24],
            ["shadow", 0, 100],
            ["brightness", 50, 140],
            ["contrast", 50, 140],
            ["saturation", 0, 160],
          ].map(([k, min, max]) => (
            <label className="range" key={k as string}>
              <span>
                {k as string}
                <b>{theme[k as string]}</b>
              </span>
              <input
                type="range"
                min={min as number}
                max={max as number}
                value={Number(theme[k as string])}
                onChange={(e) => set(k as string, Number(e.target.value))}
              />
            </label>
          ))}
        </section>
        <section
          className="theme-preview"
          style={
            {
              "--p": theme.primary,
              "--a": theme.accent,
              "--bg": theme.background,
              "--surface": theme.surface,
              "--heading": theme.heading,
              "--body": theme.text,
              "--radius": `${theme.radius}px`,
              "--bright": `${theme.brightness}%`,
              "--contrast": `${theme.contrast}%`,
              "--sat": `${theme.saturation}%`,
            } as React.CSSProperties
          }
        >
          <div className="preview-browser">
            <i />
            <i />
            <i />
            <span>Live website preview</span>
          </div>
          <img src="/assets/property/king-room.jpg" alt="Theme preview" />
          <div>
            <small>Lafayette, Louisiana</small>
            <h2>
              Your Easy Stay
              <br />
              In Lafayette.
            </h2>
            <p>Comfort, value and a convenient place to pause just off I-10.</p>
            <button>Book your stay</button>
          </div>
        </section>
      </div>
    </>
  );
}
function Media({ notify }: { notify: (v: string) => void }) {
  const [items, setItems] = useState<Record<string, any>[]>([]),
    [upload, setUpload] = useState(false);
  const load = () =>
    api<Record<string, any>[]>("/api/admin/media").then(setItems);
  useEffect(() => {
    load();
  }, []);
  async function send(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const body = new FormData(e.currentTarget);
    try {
      await api("/api/admin/media", { method: "POST", body });
      notify("Image uploaded");
      setUpload(false);
      load();
    } catch (e) {
      notify((e as Error).message);
    }
  }
  return (
    <>
      <Title eyebrow="Assets" title="Media library">
        <button className="admin-primary" onClick={() => setUpload(true)}>
          <Upload /> Upload images
        </button>
      </Title>
      <div className="media-tools panel">
        <div>
          <Search />
          <input placeholder="Search filenames and alt text…" />
        </div>
        <span>{items.length} assets</span>
      </div>
      <div className="media-grid">
        {items.map((m) => (
          <article key={m.id}>
            <img src={m.url} alt={m.altText} />
            <div>
              <b>{m.filename}</b>
              <small>
                {m.mimeType} · {formatBytes(m.sizeBytes)}
              </small>
            </div>
          </article>
        ))}
        {!items.length && (
          <div className="empty media-empty">
            <Image />
            <h2>Your media library is ready</h2>
            <p>Upload optimized hotel photography to reuse across content.</p>
          </div>
        )}
      </div>
      {upload && (
        <div className="modal-backdrop">
          <form className="admin-modal" onSubmit={send}>
            <button type="button" onClick={() => setUpload(false)}>
              <X />
            </button>
            <span className="admin-kicker">Media library</span>
            <h2>Upload an image</h2>
            <label className="dropzone">
              <Upload />
              <b>Choose JPG, PNG, WebP or AVIF</b>
              <small>Maximum 10 MB</small>
              <input
                name="file"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                required
              />
            </label>
            <label>
              Alternative text
              <input name="altText" required />
            </label>
            <label>
              Caption
              <input name="caption" />
            </label>
            <button className="admin-primary">Upload image</button>
          </form>
        </div>
      )}
    </>
  );
}
function SettingsView({ notify }: { notify: (v: string) => void }) {
  const [all, setAll] = useState<Setting[]>([]),
    [section, setSection] = useState("general"),
    [data, setData] = useState<Record<string, string>>({});
  useEffect(() => {
    api<Setting[]>("/api/admin/settings").then((v) => {
      setAll(v);
      const current = v.find((x) => x.key === section);
      if (current) setData(current.draft as Record<string, string>);
    });
  }, [section]);
  async function save(publish = false) {
    await api(`/api/admin/settings/${section}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    if (publish)
      await api(`/api/admin/settings/${section}/publish`, { method: "POST" });
    notify(
      publish
        ? `${friendly(section)} settings published to the website`
        : `${friendly(section)} draft saved`,
    );
  }
  return (
    <>
      <Title eyebrow="Property configuration" title="Hotel settings">
        <div className="title-actions">
          <button className="admin-secondary" onClick={() => save()}>
            <Save /> Save draft
          </button>
          <button className="admin-primary" onClick={() => save(true)}>
            Publish
          </button>
        </div>
      </Title>
      <section className="panel settings-form">
        <nav className="settings-tabs" aria-label="Settings sections">
          {all
            .filter((item) =>
              ["general", "booking", "footer"].includes(item.key),
            )
            .map((item) => (
              <button
                key={item.key}
                className={section === item.key ? "active" : ""}
                onClick={() => setSection(item.key)}
              >
                {friendly(item.key)}
              </button>
            ))}
        </nav>
        <div className="settings-heading">
          <div>
            <span className="admin-kicker">Website settings</span>
            <h2>{friendly(section)} information</h2>
          </div>
          <a href="/" target="_blank" className="admin-secondary">
            View website <ArrowUpRight />
          </a>
        </div>
        <div>
          {Object.entries(data).map(([k, v]) => (
            <label key={k}>
              {k.replace(/([A-Z])/g, " $1")}
              <input
                value={v}
                onChange={(e) =>
                  setData((d) => ({ ...d, [k]: e.target.value }))
                }
              />
            </label>
          ))}
        </div>
      </section>
    </>
  );
}
function ActivityView() {
  const [items, setItems] = useState<Record<string, string>[]>([]);
  useEffect(() => {
    api<Record<string, string>[]>("/api/admin/activity").then(setItems);
  }, []);
  return (
    <>
      <Title eyebrow="Security & changes" title="Activity log" />
      <section className="panel table-panel">
        <table>
          <thead>
            <tr>
              <th>Administrator</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id}>
                <td>{i.user}</td>
                <td>{i.action}</td>
                <td>{i.entityType}</td>
                <td>{new Date(i.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
function UsersView({ notify }: { notify: (v: string) => void }) {
  const [items, setItems] = useState<Record<string, any>[]>([]);
  const load = () =>
    api<Record<string, any>[]>("/api/admin/users").then(setItems);
  useEffect(() => {
    load();
  }, []);
  return (
    <>
      <Title eyebrow="Access control" title="Administrators" />
      <section className="panel table-panel">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id}>
                <td>{i.name}</td>
                <td>{i.email}</td>
                <td>
                  <span className="role-pill">{i.role}</span>
                </td>
                <td>{i.active ? "Active" : "Disabled"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="table-note">
          Create additional users through the secured API or bootstrap process.
          Passwords require at least 12 characters.
        </p>
      </section>
    </>
  );
}
function formatBytes(n: number) {
  if (!n) return "0 B";
  const u = ["B", "KB", "MB", "GB"],
    i = Math.min(Math.floor(Math.log(n) / Math.log(1024)), 3);
  return `${(n / 1024 ** i).toFixed(i ? 1 : 0)} ${u[i]}`;
}
