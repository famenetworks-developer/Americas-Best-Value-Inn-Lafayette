CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE CHECK (email = lower(email)),
  name text NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('super_admin','editor','author')),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS sessions (
  id_hash bytea PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  csrf_hash bytea NOT NULL, expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions(expires_at);
CREATE TABLE IF NOT EXISTS login_attempts (
  key_hash bytea PRIMARY KEY, attempts integer NOT NULL DEFAULT 0,
  window_started_at timestamptz NOT NULL DEFAULT now(), blocked_until timestamptz
);
CREATE TABLE IF NOT EXISTS content_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), content_type text NOT NULL,
  slug text NOT NULL, title text NOT NULL, status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','scheduled')),
  draft jsonb NOT NULL DEFAULT '{}'::jsonb, published jsonb,
  scheduled_at timestamptz, display_order integer NOT NULL DEFAULT 0, active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES users(id), updated_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), published_at timestamptz,
  UNIQUE(content_type, slug)
);
CREATE INDEX IF NOT EXISTS content_type_status_idx ON content_entries(content_type,status);
CREATE TABLE IF NOT EXISTS content_revisions (
  id bigserial PRIMARY KEY, entry_id uuid NOT NULL REFERENCES content_entries(id) ON DELETE CASCADE,
  data jsonb NOT NULL, status text NOT NULL, created_by uuid REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), filename text NOT NULL, storage_key text NOT NULL UNIQUE,
  mime_type text NOT NULL, size_bytes bigint NOT NULL CHECK(size_bytes >= 0), width integer, height integer,
  alt_text text NOT NULL DEFAULT '', caption text NOT NULL DEFAULT '', category text NOT NULL DEFAULT 'general',
  created_by uuid REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS site_settings (
  key text PRIMARY KEY, draft jsonb NOT NULL DEFAULT '{}'::jsonb, published jsonb,
  updated_by uuid REFERENCES users(id), updated_at timestamptz NOT NULL DEFAULT now(), published_at timestamptz
);
CREATE TABLE IF NOT EXISTS activity_logs (
  id bigserial PRIMARY KEY, user_id uuid REFERENCES users(id), action text NOT NULL,
  entity_type text NOT NULL, entity_id text, metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip inet, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS activity_created_idx ON activity_logs(created_at DESC);
