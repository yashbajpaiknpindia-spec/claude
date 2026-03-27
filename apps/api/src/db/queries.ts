import { query, queryOne, count, transaction } from './client';

// ─── Profiles ─────────────────────────────────────────────────

export const users = {
  findById: (id: string) =>
    queryOne(`SELECT * FROM users WHERE id = $1`, [id]),

  findByPhone: (phone: string) =>
    queryOne(`SELECT * FROM users WHERE phone = $1`, [phone]),

  // Users are created via POST /api/auth/signup (routes/auth.ts)
  // This helper is for admin lookups only

  update: (id: string, data: Record<string, unknown>) => {
    const keys   = Object.keys(data);
    const values = Object.values(data);
    const set    = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
    return queryOne(
      `UPDATE users SET ${set}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
  },

  deductCredit: (id: string) =>
    queryOne(
      `UPDATE users SET credits = GREATEST(credits - 1, 0), updated_at = NOW()
       WHERE id = $1 AND credits > 0 RETURNING credits`,
      [id]
    ),
};

// ─── Projects ─────────────────────────────────────────────────

export const projects = {
  findById: (id: string) =>
    queryOne(`SELECT * FROM projects WHERE id = $1`, [id]),

  findBySlug: (slug: string) =>
    queryOne(
      `SELECT id, type, name, layout, content, theme, meta, deployed_url
       FROM projects WHERE slug = $1 AND status = 'published'`,
      [slug]
    ),

  listByUser: (userId: string) =>
    query(
      `SELECT * FROM projects WHERE user_id = $1 ORDER BY updated_at DESC`,
      [userId]
    ),

  findByIdAndUser: (id: string, userId: string) =>
    queryOne(`SELECT * FROM projects WHERE id = $1 AND user_id = $2`, [id, userId]),

  create: (data: {
    userId: string; type: string; name: string; slug: string;
    prompt: string; layout: unknown; content: unknown; theme: unknown; meta: unknown;
  }) =>
    queryOne(
      `INSERT INTO projects
         (user_id, type, name, slug, status, prompt, layout, content, theme, meta)
       VALUES ($1, $2, $3, $4, 'draft', $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        data.userId, data.type, data.name, data.slug, data.prompt,
        JSON.stringify(data.layout), JSON.stringify(data.content),
        JSON.stringify(data.theme), JSON.stringify(data.meta),
      ]
    ),

  update: (id: string, userId: string, data: Record<string, unknown>) => {
    const allowed = ['name', 'slug', 'status', 'layout', 'content', 'theme', 'meta', 'score', 'score_feedback', 'deployed_url', 'deployment_id'];
    const keys    = Object.keys(data).filter(k => allowed.includes(k));
    const values  = keys.map(k => {
      const v = data[k];
      return typeof v === 'object' && v !== null ? JSON.stringify(v) : v;
    });
    const set = keys.map((k, i) => `${k} = $${i + 3}`).join(', ');
    return queryOne(
      `UPDATE projects SET ${set}, updated_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING *`,
      [id, userId, ...values]
    );
  },

  delete: (id: string, userId: string) =>
    query(`DELETE FROM projects WHERE id = $1 AND user_id = $2`, [id, userId]),

  // Admin queries
  countAll: () => count(`SELECT COUNT(*) FROM projects`),
  listAll: (limit = 50, offset = 0, type?: string, status?: string) => {
    const conditions: string[] = [];
    const params: unknown[] = [limit, offset];
    if (type)   { conditions.push(`type = $${params.length + 1}`);   params.push(type); }
    if (status) { conditions.push(`status = $${params.length + 1}`); params.push(status); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    return query(`SELECT * FROM projects ${where} ORDER BY created_at DESC LIMIT $1 OFFSET $2`, params);
  },
};

// ─── Generation Jobs ──────────────────────────────────────────

export const generationJobs = {
  create: (userId: string, prompt: string) =>
    queryOne(
      `INSERT INTO generation_jobs (user_id, status, prompt, stage)
       VALUES ($1, 'running', $2, 'claude') RETURNING *`,
      [userId, prompt]
    ),

  updateStage: (id: string, stage: string) =>
    query(`UPDATE generation_jobs SET stage = $1 WHERE id = $2`, [stage, id]),

  complete: (id: string, projectId: string, durationMs: number) =>
    query(
      `UPDATE generation_jobs
       SET status = 'completed', project_id = $2, duration_ms = $3, completed_at = NOW()
       WHERE id = $1`,
      [id, projectId, durationMs]
    ),

  fail: (id: string, error: string) =>
    query(
      `UPDATE generation_jobs SET status = 'failed', error = $2 WHERE id = $1`,
      [id, error]
    ),

  listByUser: (userId: string, limit = 20) =>
    query(
      `SELECT id, status, prompt, duration_ms, created_at
       FROM generation_jobs WHERE user_id = $1
       ORDER BY created_at DESC LIMIT $2`,
      [userId, limit]
    ),

  countToday: () =>
    count(
      `SELECT COUNT(*) FROM generation_jobs WHERE created_at > NOW() - INTERVAL '24 hours'`
    ),

  recentAll: (limit = 50) =>
    query(
      `SELECT id, status, prompt, created_at, user_id
       FROM generation_jobs ORDER BY created_at DESC LIMIT $1`,
      [limit]
    ),
};

// ─── Branding Profiles ────────────────────────────────────────

export const brandingProfiles = {
  create: (data: {
    userId: string; projectId: string; tagline: string; usp: string;
    niche: string; tone: string; keywords: string[];
    linkedinHeadline: string; linkedinAbout: string;
    contentIdeas: string[]; rawInput: string;
  }) =>
    query(
      `INSERT INTO branding_profiles
         (user_id, project_id, tagline, usp, niche, tone, keywords,
          linkedin_headline, linkedin_about, content_ideas, raw_input)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        data.userId, data.projectId, data.tagline, data.usp,
        data.niche, data.tone,
        JSON.stringify(data.keywords),
        data.linkedinHeadline, data.linkedinAbout,
        JSON.stringify(data.contentIdeas), data.rawInput,
      ]
    ),
};

// ─── Analytics ────────────────────────────────────────────────

export const analytics = {
  trackEvent: (data: {
    projectId: string; eventType: string; section?: string;
    referrer?: string; country?: string; sessionId?: string;
  }) =>
    query(
      `INSERT INTO analytics_events
         (project_id, event_type, section, referrer, country, session_id)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [data.projectId, data.eventType, data.section ?? null,
       data.referrer ?? null, data.country ?? null, data.sessionId ?? null]
    ),

  summary: async (projectId: string, sinceDate: string) => {
    const [views, clicks, downloads, countries, sections, daily] = await Promise.all([
      count(`SELECT COUNT(*) FROM analytics_events WHERE project_id=$1 AND event_type='view' AND created_at>$2`, [projectId, sinceDate]),
      count(`SELECT COUNT(*) FROM analytics_events WHERE project_id=$1 AND event_type='click' AND created_at>$2`, [projectId, sinceDate]),
      count(`SELECT COUNT(*) FROM analytics_events WHERE project_id=$1 AND event_type='resume_download' AND created_at>$2`, [projectId, sinceDate]),
      query(`SELECT country, COUNT(*)::int as count FROM analytics_events WHERE project_id=$1 AND country IS NOT NULL AND created_at>$2 GROUP BY country ORDER BY count DESC LIMIT 5`, [projectId, sinceDate]),
      query(`SELECT COALESCE(section,'page') as section, COUNT(*)::int as count FROM analytics_events WHERE project_id=$1 AND created_at>$2 GROUP BY section ORDER BY count DESC`, [projectId, sinceDate]),
      query(`SELECT DATE(created_at) as date, COUNT(*)::int as views FROM analytics_events WHERE project_id=$1 AND event_type='view' AND created_at>$2 GROUP BY DATE(created_at) ORDER BY date`, [projectId, sinceDate]),
    ]);
    return { totalViews: views, totalClicks: clicks, resumeDownloads: downloads, topCountries: countries, sectionEngagement: sections, dailyViews: daily };
  },

  platformTotal: async () => {
    const [views, clicks] = await Promise.all([
      count(`SELECT COUNT(*) FROM analytics_events WHERE event_type='view' AND created_at > NOW() - INTERVAL '30 days'`),
      count(`SELECT COUNT(*) FROM analytics_events WHERE event_type='click' AND created_at > NOW() - INTERVAL '30 days'`),
    ]);
    return { totalViews: views, totalClicks: clicks };
  },
};

// ─── Admins ───────────────────────────────────────────────────

export const admins = {
  findByPhone: (phone: string) =>
    queryOne(`SELECT * FROM admins WHERE phone = $1`, [phone]),

  findById: (id: string) =>
    queryOne(`SELECT * FROM admins WHERE id = $1`, [id]),

  listAll: () =>
    query(`SELECT * FROM admins ORDER BY created_at ASC`),

  create: (data: {
    phone: string; name?: string; email?: string;
    role: string; permissions: unknown; addedBy?: string;
  }) =>
    queryOne(
      `INSERT INTO admins (phone, name, email, role, permissions, added_by, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,true) RETURNING *`,
      [data.phone, data.name ?? null, data.email ?? null,
       data.role, JSON.stringify(data.permissions), data.addedBy ?? null]
    ),

  update: (id: string, data: Record<string, unknown>) => {
    const keys   = Object.keys(data);
    const values = keys.map(k => {
      const v = data[k];
      return typeof v === 'object' && v !== null ? JSON.stringify(v) : v;
    });
    const set = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
    return queryOne(
      `UPDATE admins SET ${set}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
  },

  updateLastLogin: (id: string) =>
    query(`UPDATE admins SET last_login = NOW() WHERE id = $1`, [id]),

  delete: (id: string) =>
    query(`DELETE FROM admins WHERE id = $1`, [id]),

  createSession: (data: { adminId: string; tokenHash: string; ipAddress?: string; userAgent?: string }) =>
    query(
      `INSERT INTO admin_sessions (admin_id, token_hash, ip_address, user_agent, expires_at)
       VALUES ($1,$2,$3,$4, NOW() + INTERVAL '8 hours')`,
      [data.adminId, data.tokenHash, data.ipAddress ?? null, data.userAgent ?? null]
    ),

  findSession: (tokenHash: string) =>
    queryOne(
      `SELECT admin_id, expires_at FROM admin_sessions WHERE token_hash = $1`,
      [tokenHash]
    ),

  deleteSession: (tokenHash: string) =>
    query(`DELETE FROM admin_sessions WHERE token_hash = $1`, [tokenHash]),

  deleteAllSessions: (adminId: string) =>
    query(`DELETE FROM admin_sessions WHERE admin_id = $1`, [adminId]),

  auditLog: (data: {
    adminId: string; action: string; targetType?: string;
    targetId?: string; targetMeta?: unknown; ipAddress?: string; userAgent?: string;
  }) =>
    query(
      `INSERT INTO admin_audit_log
         (admin_id, action, target_type, target_id, target_meta, ip_address, user_agent)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        data.adminId, data.action, data.targetType ?? null,
        data.targetId ?? null,
        data.targetMeta ? JSON.stringify(data.targetMeta) : null,
        data.ipAddress ?? null, data.userAgent ?? null,
      ]
    ),

  getAuditLog: (limit = 100) =>
    query(
      `SELECT l.*, a.name as admin_name, a.phone as admin_phone
       FROM admin_audit_log l
       JOIN admins a ON a.id = l.admin_id
       ORDER BY l.created_at DESC LIMIT $1`,
      [limit]
    ),
};

// ─── Platform stats (admin overview) ─────────────────────────

export const stats = {
  overview: async () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    const [totalUsers, proUsers, totalProjects, todayGens, todaySignups] = await Promise.all([
      count(`SELECT COUNT(*) FROM users`),
      count(`SELECT COUNT(*) FROM users WHERE plan = 'pro'`),
      count(`SELECT COUNT(*) FROM projects`),
      count(`SELECT COUNT(*) FROM generation_jobs WHERE created_at > $1`, [yesterday]),
      count(`SELECT COUNT(*) FROM users WHERE created_at > $1`, [yesterday]),
    ]);
    return { totalUsers, proUsers, totalProjects, todayGenerations: todayGens, todaySignups, mrr: proUsers * 12 };
  },
};
