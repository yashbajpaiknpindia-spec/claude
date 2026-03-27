-- ============================================================
-- BrandForge Database Schema
-- 100% on Render PostgreSQL — No Supabase
-- ============================================================

-- Users (phone + password, no external auth)
CREATE TABLE IF NOT EXISTS users (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone        TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name    TEXT,
  avatar_url   TEXT,
  plan         TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free','pro','agency')),
  credits      INTEGER NOT NULL DEFAULT 5,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User sessions (JWT refresh tokens)
CREATE TABLE IF NOT EXISTS user_sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash   TEXT NOT NULL UNIQUE,
  ip_address   TEXT,
  user_agent   TEXT,
  expires_at   TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_token  ON user_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user   ON user_sessions(user_id);

-- Projects
CREATE TABLE IF NOT EXISTS projects (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type          TEXT NOT NULL CHECK (type IN ('portfolio','resume','business_card')),
  name          TEXT NOT NULL,
  slug          TEXT UNIQUE,
  status        TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  prompt        TEXT,
  layout        JSONB NOT NULL DEFAULT '{}',
  content       JSONB NOT NULL DEFAULT '{}',
  theme         JSONB NOT NULL DEFAULT '{}',
  meta          JSONB NOT NULL DEFAULT '{}',
  score         INTEGER,
  score_feedback JSONB,
  deployed_url  TEXT,
  deployment_id TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_slug    ON projects(slug);

-- Templates
CREATE TABLE IF NOT EXISTS templates (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  description  TEXT,
  type         TEXT NOT NULL CHECK (type IN ('portfolio','resume','business_card')),
  category     TEXT,
  thumbnail_url TEXT,
  layout       JSONB NOT NULL,
  theme        JSONB NOT NULL,
  is_premium   BOOLEAN DEFAULT FALSE,
  use_count    INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Branding profiles
CREATE TABLE IF NOT EXISTS branding_profiles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id       UUID REFERENCES projects(id) ON DELETE SET NULL,
  tagline          TEXT,
  usp              TEXT,
  niche            TEXT,
  tone             TEXT,
  keywords         JSONB,
  linkedin_headline TEXT,
  linkedin_about   TEXT,
  content_ideas    JSONB,
  raw_input        TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Generation jobs
CREATE TABLE IF NOT EXISTS generation_jobs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id   UUID REFERENCES projects(id) ON DELETE SET NULL,
  status       TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','completed','failed')),
  stage        TEXT,
  prompt       TEXT,
  error        TEXT,
  duration_ms  INTEGER,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_jobs_user_id    ON generation_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON generation_jobs(created_at DESC);

-- Analytics events
CREATE TABLE IF NOT EXISTS analytics_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  event_type   TEXT NOT NULL CHECK (event_type IN ('view','click','section_view','cta_click','resume_download')),
  section      TEXT,
  referrer     TEXT,
  country      TEXT,
  session_id   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_project_id  ON analytics_events(project_id);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at  ON analytics_events(created_at DESC);

-- Admin system
CREATE TABLE IF NOT EXISTS admins (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone        TEXT UNIQUE NOT NULL,
  email        TEXT,
  name         TEXT,
  role         TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin','admin')),
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  permissions  JSONB NOT NULL DEFAULT '{}',
  added_by     UUID REFERENCES admins(id) ON DELETE SET NULL,
  last_login   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id     UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  token_hash   TEXT NOT NULL UNIQUE,
  ip_address   TEXT,
  user_agent   TEXT,
  expires_at   TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '8 hours'),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token_hash);

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id     UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  action       TEXT NOT NULL,
  target_type  TEXT,
  target_id    TEXT,
  target_meta  JSONB,
  ip_address   TEXT,
  user_agent   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_created_at ON admin_audit_log(created_at DESC);

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$
LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_updated_at    ON users;
DROP TRIGGER IF EXISTS projects_updated_at ON projects;
DROP TRIGGER IF EXISTS admins_updated_at   ON admins;

CREATE TRIGGER users_updated_at    BEFORE UPDATE ON users    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER admins_updated_at   BEFORE UPDATE ON admins   FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Seed templates
INSERT INTO templates (name, description, type, category, layout, theme, is_premium)
VALUES
  ('Nova Dark', 'Sleek dark portfolio for developers', 'portfolio', 'developer',
   '{"sections":["hero","about","projects","skills","contact"],"heroStyle":"full-bleed"}',
   '{"colors":{"bg":"#0a0a0a","surface":"#111","accent":"#6366f1","text":"#f1f5f9"},"font":{"heading":"Syne","body":"DM Sans"},"mode":"dark"}',
   false),
  ('Clarity Light', 'Clean minimal portfolio', 'portfolio', 'designer',
   '{"sections":["hero","about","projects","testimonials","contact"],"heroStyle":"split"}',
   '{"colors":{"bg":"#ffffff","surface":"#f8fafc","accent":"#0f172a","text":"#1e293b"},"font":{"heading":"Playfair Display","body":"Inter"},"mode":"light"}',
   false),
  ('Tech Resume', 'ATS-optimized for engineers', 'resume', 'developer',
   '{"sections":["resume_header","resume_summary","resume_skills","resume_experience","resume_education"],"layout":"single-column"}',
   '{"colors":{"bg":"#ffffff","accent":"#2563eb","text":"#111827"},"font":{"heading":"IBM Plex Sans","body":"IBM Plex Sans"},"mode":"light"}',
   false),
  ('Obsidian Card', 'Luxury dark business card', 'business_card', 'general',
   '{"style":"horizontal","front":["name","title","contact"]}',
   '{"colors":{"bg":"#09090b","accent":"#ffd700","text":"#fafafa"},"font":{"heading":"Bebas Neue","body":"Montserrat"},"mode":"dark"}',
   true)
ON CONFLICT DO NOTHING;
