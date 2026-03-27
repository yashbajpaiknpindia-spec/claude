import { Pool, PoolClient } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (err: Error) => {
  console.error('[db] Pool error:', err.message);
});

// ─── Query helpers ────────────────────────────────────────────

export async function query<T = Record<string, unknown>>(
  sql: string, params: unknown[] = []
): Promise<T[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result.rows as T[];
  } finally {
    client.release();
  }
}

export async function queryOne<T = Record<string, unknown>>(
  sql: string, params: unknown[] = []
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

export async function transaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function count(sql: string, params: unknown[] = []): Promise<number> {
  const rows = await query<{ count: string }>(sql, params);
  return parseInt(rows[0]?.count ?? '0', 10);
}

export async function testConnection(): Promise<boolean> {
  try { await query('SELECT 1'); return true; }
  catch { return false; }
}

// ─── Auto-setup: runs once on startup ────────────────────────
// Creates all tables if they don't exist.
// Safe to run every time — uses IF NOT EXISTS everywhere.

export async function setupDatabase(): Promise<void> {
  const client = await pool.connect();
  try {
    console.log('[db] Running auto-setup...');

    await client.query(`
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";

      -- Users (phone + password auth)
      CREATE TABLE IF NOT EXISTS users (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        phone         TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name     TEXT,
        plan          TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free','pro','agency')),
        credits       INTEGER NOT NULL DEFAULT 5,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- Projects
      CREATE TABLE IF NOT EXISTS projects (
        id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type           TEXT NOT NULL CHECK (type IN ('portfolio','resume','business_card')),
        name           TEXT NOT NULL,
        slug           TEXT UNIQUE,
        status         TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
        prompt         TEXT,
        layout         JSONB NOT NULL DEFAULT '{}',
        content        JSONB NOT NULL DEFAULT '{}',
        theme          JSONB NOT NULL DEFAULT '{}',
        meta           JSONB NOT NULL DEFAULT '{}',
        score          INTEGER,
        score_feedback JSONB,
        deployed_url   TEXT,
        deployment_id  TEXT,
        created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
      CREATE INDEX IF NOT EXISTS idx_projects_slug    ON projects(slug);

      -- Templates
      CREATE TABLE IF NOT EXISTS templates (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name          TEXT NOT NULL,
        description   TEXT,
        type          TEXT NOT NULL CHECK (type IN ('portfolio','resume','business_card')),
        category      TEXT,
        layout        JSONB NOT NULL DEFAULT '{}',
        theme         JSONB NOT NULL DEFAULT '{}',
        is_premium    BOOLEAN DEFAULT FALSE,
        use_count     INTEGER DEFAULT 0,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- Branding profiles
      CREATE TABLE IF NOT EXISTS branding_profiles (
        id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        project_id        UUID REFERENCES projects(id) ON DELETE SET NULL,
        tagline           TEXT,
        usp               TEXT,
        niche             TEXT,
        tone              TEXT,
        keywords          JSONB,
        linkedin_headline TEXT,
        linkedin_about    TEXT,
        content_ideas     JSONB,
        raw_input         TEXT,
        created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- Generation jobs
      CREATE TABLE IF NOT EXISTS generation_jobs (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        project_id   UUID REFERENCES projects(id) ON DELETE SET NULL,
        status       TEXT NOT NULL DEFAULT 'queued',
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
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        event_type  TEXT NOT NULL,
        section     TEXT,
        referrer    TEXT,
        country     TEXT,
        session_id  TEXT,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_analytics_project_id ON analytics_events(project_id);
      CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics_events(created_at DESC);

      -- Admins
      CREATE TABLE IF NOT EXISTS admins (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        phone       TEXT UNIQUE NOT NULL,
        email       TEXT,
        name        TEXT,
        role        TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin','admin')),
        is_active   BOOLEAN NOT NULL DEFAULT TRUE,
        permissions JSONB NOT NULL DEFAULT '{}',
        added_by    UUID REFERENCES admins(id) ON DELETE SET NULL,
        last_login  TIMESTAMPTZ,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- Admin sessions
      CREATE TABLE IF NOT EXISTS admin_sessions (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        admin_id    UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
        token_hash  TEXT NOT NULL UNIQUE,
        ip_address  TEXT,
        user_agent  TEXT,
        expires_at  TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '8 hours'),
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token_hash);

      -- Admin audit log
      CREATE TABLE IF NOT EXISTS admin_audit_log (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        admin_id    UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
        action      TEXT NOT NULL,
        target_type TEXT,
        target_id   TEXT,
        target_meta JSONB,
        ip_address  TEXT,
        user_agent  TEXT,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_audit_created_at ON admin_audit_log(created_at DESC);

      -- Auto-update timestamps trigger
      CREATE OR REPLACE FUNCTION update_updated_at()
      RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$
      LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS users_updated_at    ON users;
      DROP TRIGGER IF EXISTS projects_updated_at ON projects;
      DROP TRIGGER IF EXISTS admins_updated_at   ON admins;

      CREATE TRIGGER users_updated_at
        BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
      CREATE TRIGGER projects_updated_at
        BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
      CREATE TRIGGER admins_updated_at
        BEFORE UPDATE ON admins FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    `);

    // Seed templates (only if table is empty)
    const { rows: tCount } = await client.query(`SELECT COUNT(*) FROM templates`);
    if (parseInt(tCount[0].count) === 0) {
      await client.query(`
        INSERT INTO templates (name, description, type, category, layout, theme, is_premium) VALUES
        ('Nova Dark', 'Sleek dark portfolio for developers', 'portfolio', 'developer',
         '{"sections":["hero","about","projects","skills","contact"],"heroStyle":"full-bleed"}',
         '{"colors":{"bg":"#0a0a0a","surface":"#111","accent":"#6366f1","text":"#f1f5f9"},"font":{"heading":"Syne","body":"DM Sans"},"mode":"dark"}',
         false),
        ('Clarity Light', 'Clean minimal portfolio', 'portfolio', 'designer',
         '{"sections":["hero","about","projects","testimonials","contact"],"heroStyle":"split"}',
         '{"colors":{"bg":"#ffffff","surface":"#f8fafc","accent":"#0f172a","text":"#1e293b"},"font":{"heading":"Playfair Display","body":"Inter"},"mode":"light"}',
         false),
        ('Tech Resume', 'ATS-optimized for engineers', 'resume', 'developer',
         '{"sections":["resume_header","resume_summary","resume_skills","resume_experience","resume_education"]}',
         '{"colors":{"bg":"#ffffff","accent":"#2563eb","text":"#111827"},"font":{"heading":"IBM Plex Sans","body":"IBM Plex Sans"},"mode":"light"}',
         false),
        ('Obsidian Card', 'Luxury dark business card', 'business_card', 'general',
         '{"style":"horizontal","front":["name","title","contact"]}',
         '{"colors":{"bg":"#09090b","accent":"#ffd700","text":"#fafafa"},"font":{"heading":"Bebas Neue","body":"Montserrat"},"mode":"dark"}',
         true)
        ON CONFLICT DO NOTHING
      `);
      console.log('[db] Templates seeded');
    }

    // Seed super admin from env vars — never hardcode credentials.
    // Set ADMIN_PHONE + ADMIN_PASSWORD in Render environment variables.
    const adminPhone = process.env.ADMIN_PHONE;
    if (adminPhone) {
      await client.query(`
        INSERT INTO admins (phone, name, role, is_active, permissions)
        VALUES (
          $1,
          'Super Admin',
          'super_admin',
          TRUE,
          '{"view_users":true,"view_projects":true,"view_analytics":true,"view_revenue":true,"view_activity":true,"manage_users":true,"manage_admins":true,"suspend_users":true,"delete_projects":true}'
        )
        ON CONFLICT (phone) DO NOTHING
      `, [adminPhone]);
    } else {
      console.warn('[db] ADMIN_PHONE not set — super admin not seeded. Set it in Render env vars.');
    }

    console.log('[db] Auto-setup complete ✓');

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[db] Auto-setup failed:', msg);
    throw err;
  } finally {
    client.release();
  }
}

export default pool;
