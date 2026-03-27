import { Router, Request, Response } from 'express';
import { query, queryOne } from '../db/client';
import { requireAdmin, requireSuperAdmin, requirePermission, generateSessionToken, hashToken, verifyPassword, auditLog } from '../middleware/admin-auth';

const router = Router();
// Guaranteed to be set — env validation in index.ts runs before any route.
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD as string;

// ── Login ─────────────────────────────────────────────────────
router.post('/auth/login', async (req: Request, res: Response) => {
  const { phone, password } = req.body;
  if (!phone || !password) return res.status(400).json({ error: 'Phone and password required' });

  const cleanPhone = phone.replace(/\D/g, '');
  const admin = await queryOne<{ id: string; phone: string; name: string; role: string; permissions: unknown; is_active: boolean }>(
    `SELECT id, phone, name, role, permissions, is_active FROM admins WHERE phone = $1`, [cleanPhone]
  );

  const valid = verifyPassword(password, ADMIN_PASSWORD);
  if (!admin || !valid) {
    if (admin) auditLog(admin.id, 'login_failed', undefined, undefined, { phone: cleanPhone }, req);
    return res.status(401).json({ error: 'Invalid phone number or password' });
  }
  if (!admin.is_active) return res.status(403).json({ error: 'Admin account deactivated' });

  const token     = generateSessionToken();
  const tokenHash = hashToken(token);

  await query(
    `INSERT INTO admin_sessions (admin_id, token_hash, ip_address, user_agent, expires_at)
     VALUES ($1, $2, $3, $4, NOW() + INTERVAL '8 hours')`,
    [admin.id, tokenHash, req.headers['x-forwarded-for'] as string || req.socket.remoteAddress, req.headers['user-agent']]
  );

  await query(`UPDATE admins SET last_login = NOW() WHERE id = $1`, [admin.id]);
  auditLog(admin.id, 'login', undefined, undefined, { phone: cleanPhone }, req);

  return res.json({
    token,
    admin: { id: admin.id, phone: admin.phone, name: admin.name, role: admin.role, permissions: admin.permissions },
    expiresAt: new Date(Date.now() + 8 * 3600000).toISOString(),
  });
});

// ── Logout ────────────────────────────────────────────────────
router.post('/auth/logout', requireAdmin, async (req: Request, res: Response) => {
  await query(`DELETE FROM admin_sessions WHERE token_hash = $1`, [hashToken(req.headers['x-admin-token'] as string)]);
  auditLog(req.admin!.id, 'logout', undefined, undefined, undefined, req);
  return res.json({ message: 'Logged out' });
});

router.get('/auth/me', requireAdmin, (req: Request, res: Response) => res.json({ data: req.admin }));

// ── Overview ──────────────────────────────────────────────────
router.get('/overview', requireAdmin, requirePermission('view_analytics'), async (req: Request, res: Response) => {
  const yesterday = new Date(Date.now() - 86400000).toISOString();
  const [users, pro, projects, todayGen, todaySignups] = await Promise.all([
    queryOne<{ count: string }>(`SELECT COUNT(*)::text as count FROM users`),
    queryOne<{ count: string }>(`SELECT COUNT(*)::text as count FROM users WHERE plan = 'pro'`),
    queryOne<{ count: string }>(`SELECT COUNT(*)::text as count FROM projects`),
    queryOne<{ count: string }>(`SELECT COUNT(*)::text as count FROM generation_jobs WHERE created_at > $1`, [yesterday]),
    queryOne<{ count: string }>(`SELECT COUNT(*)::text as count FROM users WHERE created_at > $1`, [yesterday]),
  ]);
  const proCount = parseInt(pro?.count || '0');
  auditLog(req.admin!.id, 'view_overview', undefined, undefined, undefined, req);
  return res.json({ data: {
    totalUsers: parseInt(users?.count || '0'), proUsers: proCount,
    totalProjects: parseInt(projects?.count || '0'),
    todayGenerations: parseInt(todayGen?.count || '0'),
    todaySignups: parseInt(todaySignups?.count || '0'),
    mrr: proCount * 12,
  }});
});

// ── Users ─────────────────────────────────────────────────────
router.get('/users', requireAdmin, requirePermission('view_users'), async (req: Request, res: Response) => {
  const { search = '', plan = '', page = '1', limit = '20' } = req.query;
  const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
  const conditions: string[] = [];
  const params: unknown[] = [parseInt(limit as string), offset];
  if (search) { conditions.push(`(phone ILIKE $${params.length+1} OR full_name ILIKE $${params.length+1})`); params.push(`%${search}%`); }
  if (plan && plan !== 'all') { conditions.push(`plan = $${params.length+1}`); params.push(plan); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const rows  = await query(`SELECT id, phone, full_name, plan, credits, created_at, updated_at FROM users ${where} ORDER BY created_at DESC LIMIT $1 OFFSET $2`, params);
  const total = await queryOne<{ count: string }>(`SELECT COUNT(*)::text as count FROM users ${where}`, params.slice(2));
  auditLog(req.admin!.id, 'view_users_list', undefined, undefined, { search, plan }, req);
  return res.json({ data: rows, total: parseInt(total?.count || '0') });
});

router.get('/users/:userId', requireAdmin, requirePermission('view_users'), async (req: Request, res: Response) => {
  const { userId } = req.params;
  const [profile, projects, jobs] = await Promise.all([
    queryOne(`SELECT id, phone, full_name, plan, credits, created_at FROM users WHERE id = $1`, [userId]),
    query(`SELECT id, name, type, status, score, deployed_url, created_at FROM projects WHERE user_id = $1 ORDER BY created_at DESC`, [userId]),
    query(`SELECT id, status, prompt, duration_ms, created_at FROM generation_jobs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`, [userId]),
  ]);
  if (!profile) return res.status(404).json({ error: 'User not found' });
  auditLog(req.admin!.id, 'view_user_detail', 'user', userId, undefined, req);
  return res.json({ data: { profile, projects, recentGenerations: jobs } });
});

router.patch('/users/:userId/plan', requireAdmin, requirePermission('manage_users'), async (req: Request, res: Response) => {
  const { plan, credits } = req.body;
  const sets: string[] = ['updated_at = NOW()'];
  const params: unknown[] = [req.params.userId];
  if (plan)             { sets.push(`plan = $${params.length+1}`);    params.push(plan); }
  if (credits !== undefined) { sets.push(`credits = $${params.length+1}`); params.push(parseInt(credits)); }
  await query(`UPDATE users SET ${sets.join(', ')} WHERE id = $1`, params);
  auditLog(req.admin!.id, 'change_user_plan', 'user', req.params.userId, { plan, credits }, req);
  return res.json({ message: 'Updated' });
});

// ── Projects ──────────────────────────────────────────────────
router.get('/projects', requireAdmin, requirePermission('view_projects'), async (req: Request, res: Response) => {
  const { page = '1', limit = '25', type, status } = req.query;
  const offset = (parseInt(page as string)-1) * parseInt(limit as string);
  const conditions: string[] = [];
  const params: unknown[] = [parseInt(limit as string), offset];
  if (type)   { conditions.push(`type = $${params.length+1}`);   params.push(type); }
  if (status) { conditions.push(`status = $${params.length+1}`); params.push(status); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const rows  = await query(`SELECT p.*, u.phone as user_phone FROM projects p JOIN users u ON u.id = p.user_id ${where} ORDER BY p.created_at DESC LIMIT $1 OFFSET $2`, params);
  const total = await queryOne<{ count: string }>(`SELECT COUNT(*)::text as count FROM projects ${where}`, params.slice(2));
  return res.json({ data: rows, total: parseInt(total?.count || '0') });
});

router.delete('/projects/:projectId', requireAdmin, requirePermission('delete_projects'), async (req: Request, res: Response) => {
  const proj = await queryOne(`SELECT name FROM projects WHERE id = $1`, [req.params.projectId]);
  await query(`DELETE FROM projects WHERE id = $1`, [req.params.projectId]);
  auditLog(req.admin!.id, 'delete_project', 'project', req.params.projectId, { name: (proj as {name:string})?.name }, req);
  return res.json({ message: 'Deleted' });
});

// ── Activity ──────────────────────────────────────────────────
router.get('/activity', requireAdmin, requirePermission('view_activity'), async (req: Request, res: Response) => {
  const [jobs, publishes] = await Promise.all([
    query(`SELECT j.id, j.status, j.prompt, j.created_at, u.phone as user_phone FROM generation_jobs j JOIN users u ON u.id = j.user_id ORDER BY j.created_at DESC LIMIT 50`),
    query(`SELECT p.id, p.name, p.type, p.slug, p.updated_at, u.phone as user_phone FROM projects p JOIN users u ON u.id = p.user_id WHERE p.status = 'published' ORDER BY p.updated_at DESC LIMIT 20`),
  ]);
  return res.json({ data: { recentGenerations: jobs, recentPublishes: publishes } });
});

// ── Revenue ───────────────────────────────────────────────────
router.get('/revenue', requireAdmin, requirePermission('view_revenue'), async (req: Request, res: Response) => {
  const counts = await queryOne<{ pro: string; agency: string }>(
    `SELECT SUM(CASE WHEN plan='pro' THEN 1 ELSE 0 END)::text as pro, SUM(CASE WHEN plan='agency' THEN 1 ELSE 0 END)::text as agency FROM users`
  );
  const pro = parseInt(counts?.pro || '0'), agency = parseInt(counts?.agency || '0');
  auditLog(req.admin!.id, 'view_revenue', undefined, undefined, undefined, req);
  return res.json({ data: { mrr: pro*12 + agency*49, arr: (pro*12+agency*49)*12, proSubscribers: pro, agencySubscribers: agency } });
});

// ── Admins ────────────────────────────────────────────────────
router.get('/admins', requireAdmin, requireSuperAdmin, async (_req: import('express').Request, res: import('express').Response) => {
  const rows = await query(`SELECT id, phone, name, role, is_active, permissions, last_login, created_at FROM admins ORDER BY created_at`);
  return res.json({ data: rows });
});

router.post('/admins', requireAdmin, requireSuperAdmin, async (req: Request, res: Response) => {
  const { phone, name, email, role = 'admin', permissions } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone required' });
  const cleanPhone = phone.replace(/\D/g,'');
  const exists = await queryOne(`SELECT id FROM admins WHERE phone = $1`, [cleanPhone]);
  if (exists) return res.status(409).json({ error: 'Phone already registered as admin' });
  const defaultPerms = { view_users:true, view_projects:true, view_analytics:true, view_revenue:false, view_activity:true, manage_users:false, manage_admins:false, suspend_users:false, delete_projects:false };
  const newAdmin = await queryOne(
    `INSERT INTO admins (phone, email, name, role, permissions, added_by, is_active) VALUES ($1,$2,$3,$4,$5,$6,true) RETURNING *`,
    [cleanPhone, email||null, name||null, role, JSON.stringify(permissions||defaultPerms), req.admin!.id]
  );
  auditLog(req.admin!.id, 'add_admin', 'admin', (newAdmin as {id:string}).id, { phone: cleanPhone, name, role }, req);
  return res.status(201).json({ data: newAdmin, message: 'Admin added' });
});

router.patch('/admins/:adminId', requireAdmin, requireSuperAdmin, async (req: Request, res: Response) => {
  const target = await queryOne<{ role:string; phone:string }>(`SELECT role, phone FROM admins WHERE id = $1`, [req.params.adminId]);
  if (target?.role === 'super_admin' && target.phone === '7897671348') return res.status(403).json({ error: 'Cannot modify primary super admin' });
  const allowed = ['name','email','is_active','role','permissions'];
  const sets: string[] = ['updated_at = NOW()'];
  const params: unknown[] = [req.params.adminId];
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      const v = typeof req.body[key] === 'object' ? JSON.stringify(req.body[key]) : req.body[key];
      sets.push(`${key} = $${params.length+1}`);
      params.push(v);
    }
  }
  const updated = await queryOne(`UPDATE admins SET ${sets.join(',')} WHERE id = $1 RETURNING *`, params);
  auditLog(req.admin!.id, 'update_admin', 'admin', req.params.adminId, req.body, req);
  return res.json({ data: updated, message: 'Admin updated' });
});

router.delete('/admins/:adminId', requireAdmin, requireSuperAdmin, async (req: Request, res: Response) => {
  const target = await queryOne<{ phone:string }>(`SELECT phone FROM admins WHERE id = $1`, [req.params.adminId]);
  if (target?.phone === '7897671348') return res.status(403).json({ error: 'Cannot remove primary super admin' });
  if (req.params.adminId === req.admin!.id) return res.status(403).json({ error: 'Cannot remove yourself' });
  await query(`DELETE FROM admin_sessions WHERE admin_id = $1`, [req.params.adminId]);
  await query(`DELETE FROM admins WHERE id = $1`, [req.params.adminId]);
  auditLog(req.admin!.id, 'remove_admin', 'admin', req.params.adminId, { phone: target?.phone }, req);
  return res.json({ message: 'Admin removed' });
});

// ── Audit log ─────────────────────────────────────────────────
router.get('/audit-log', requireAdmin, requireSuperAdmin, async (req: Request, res: Response) => {
  const { limit = '100' } = req.query;
  const rows = await query(
    `SELECT l.*, a.name as admin_name, a.phone as admin_phone FROM admin_audit_log l JOIN admins a ON a.id = l.admin_id ORDER BY l.created_at DESC LIMIT $1`,
    [parseInt(limit as string)]
  );
  return res.json({ data: rows });
});

export default router;
