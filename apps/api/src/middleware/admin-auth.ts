import { Request, Response, NextFunction } from 'express';
import { query, queryOne } from '../db/client';
import crypto from 'crypto';

export interface AdminUser {
  id: string; phone: string; name: string;
  role: 'super_admin' | 'admin';
  permissions: Record<string, boolean>;
}

declare global {
  namespace Express {
    interface Request { admin?: AdminUser; }
  }
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateSessionToken(): string {
  return crypto.randomBytes(48).toString('hex');
}

export function verifyPassword(input: string, stored: string): boolean {
  const a = Buffer.from(input), b = Buffer.from(stored);
  if (a.length !== b.length) { crypto.timingSafeEqual(Buffer.alloc(16), Buffer.alloc(16)); return false; }
  return crypto.timingSafeEqual(a, b);
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = req.headers['x-admin-token'] as string;
  if (!token) return res.status(401).json({ error: 'Admin authentication required' });

  const session = await queryOne<{ admin_id: string; expires_at: string }>(
    `SELECT admin_id, expires_at FROM admin_sessions WHERE token_hash = $1`,
    [hashToken(token)]
  );

  if (!session) return res.status(401).json({ error: 'Invalid or expired session' });
  if (new Date(session.expires_at) < new Date()) {
    query(`DELETE FROM admin_sessions WHERE token_hash = $1`, [hashToken(token)]);
    return res.status(401).json({ error: 'Session expired. Please log in again.' });
  }

  const admin = await queryOne<AdminUser & { is_active: boolean }>(
    `SELECT id, phone, name, role, permissions, is_active FROM admins WHERE id = $1`,
    [session.admin_id]
  );

  if (!admin || !admin.is_active) return res.status(403).json({ error: 'Admin account inactive' });

  query(`UPDATE admins SET last_login = NOW() WHERE id = $1`, [admin.id]);
  req.admin = admin as AdminUser;
  next();
}

export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.admin) return res.status(401).json({ error: 'Unauthorized' });
    if (!req.admin.permissions[permission]) return res.status(403).json({ error: `Permission denied: ${permission}` });
    next();
  };
}

export function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.admin || req.admin.role !== 'super_admin') return res.status(403).json({ error: 'Super admin only' });
  next();
}

export async function auditLog(adminId: string, action: string, targetType?: string, targetId?: string, targetMeta?: unknown, req?: Request) {
  query(
    `INSERT INTO admin_audit_log (admin_id, action, target_type, target_id, target_meta, ip_address, user_agent)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [adminId, action, targetType||null, targetId||null, targetMeta ? JSON.stringify(targetMeta) : null,
     req?.headers['x-forwarded-for'] as string || req?.socket?.remoteAddress || null,
     req?.headers['user-agent'] || null]
  );
}
