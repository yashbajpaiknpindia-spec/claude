import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { queryOne } from '../db/client';

// Never fall back to a hardcoded secret in production — env validation in
// index.ts guarantees JWT_SECRET is set before any request is handled.
const JWT_SECRET = process.env.JWT_SECRET as string;

export interface AuthUser {
  id: string;
  phone: string;
  plan: string;
  credits: number;
}

declare global {
  namespace Express {
    interface Request { user?: AuthUser; }
  }
}

// Verify JWT from Authorization: Bearer <token>
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };

    // Load fresh user from DB
    const user = await queryOne<AuthUser>(
      `SELECT id, phone, plan, credits FROM users WHERE id = $1`,
      [payload.userId]
    );

    if (!user) return res.status(401).json({ error: 'User not found' });

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Check plan tier
export function requirePlan(minPlan: string) {
  const order: Record<string, number> = { free: 0, pro: 1, agency: 2 };
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if ((order[req.user.plan] ?? 0) < (order[minPlan] ?? 0)) {
      return res.status(403).json({ error: `Requires ${minPlan} plan`, upgrade: true });
    }
    next();
  };
}

// Generate access token (short lived — 7 days)
export function signToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}
