import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { queryOne, query } from '../db/client';
import { signToken, requireAuth } from '../middleware/auth';

const router = Router();

// ── POST /api/auth/signup ─────────────────────────────────────
// Body: { phone, password, fullName? }
router.post('/signup', async (req: Request, res: Response) => {
  const { phone, password, fullName } = req.body;

  if (!phone || !password) {
    return res.status(400).json({ error: 'Phone and password are required' });
  }

  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length < 7) {
    return res.status(400).json({ error: 'Enter a valid phone number' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  // Check already exists
  const existing = await queryOne(
    `SELECT id FROM users WHERE phone = $1`,
    [cleanPhone]
  );
  if (existing) {
    return res.status(409).json({ error: 'Phone number already registered' });
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);

  // Create user
  const user = await queryOne<{ id: string; phone: string; plan: string; credits: number; full_name: string }>(
    `INSERT INTO users (phone, password_hash, full_name)
     VALUES ($1, $2, $3)
     RETURNING id, phone, plan, credits, full_name`,
    [cleanPhone, passwordHash, fullName || null]
  );

  if (!user) return res.status(500).json({ error: 'Failed to create account' });

  const token = signToken(user.id);

  return res.status(201).json({
    data: {
      token,
      user: {
        id:       user.id,
        phone:    user.phone,
        fullName: user.full_name,
        plan:     user.plan,
        credits:  user.credits,
      },
    },
  });
});

// ── POST /api/auth/login ──────────────────────────────────────
// Body: { phone, password }
router.post('/login', async (req: Request, res: Response) => {
  const { phone, password } = req.body;

  if (!phone || !password) {
    return res.status(400).json({ error: 'Phone and password are required' });
  }

  const cleanPhone = phone.replace(/\D/g, '');

  const user = await queryOne<{
    id: string; phone: string; password_hash: string;
    plan: string; credits: number; full_name: string;
  }>(
    `SELECT id, phone, password_hash, plan, credits, full_name
     FROM users WHERE phone = $1`,
    [cleanPhone]
  );

  // Always run bcrypt even if user not found (prevents timing attacks)
  const passwordToCheck = user?.password_hash || '$2b$12$invalid.hash.to.prevent.timing';
  const valid = await bcrypt.compare(password, passwordToCheck);

  if (!user || !valid) {
    return res.status(401).json({ error: 'Incorrect phone number or password' });
  }

  const token = signToken(user.id);

  return res.json({
    data: {
      token,
      user: {
        id:       user.id,
        phone:    user.phone,
        fullName: user.full_name,
        plan:     user.plan,
        credits:  user.credits,
      },
    },
  });
});

// ── GET /api/auth/me ──────────────────────────────────────────
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  const user = await queryOne(
    `SELECT id, phone, full_name, plan, credits, created_at FROM users WHERE id = $1`,
    [req.user!.id]
  );
  return res.json({ data: user });
});

// ── POST /api/auth/change-password ───────────────────────────
router.post('/change-password', requireAuth, async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Both passwords required' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }

  const user = await queryOne<{ password_hash: string }>(
    `SELECT password_hash FROM users WHERE id = $1`,
    [req.user!.id]
  );

  const valid = await bcrypt.compare(currentPassword, user?.password_hash || '');
  if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

  const newHash = await bcrypt.hash(newPassword, 12);
  await query(`UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`, [newHash, req.user!.id]);

  return res.json({ message: 'Password updated successfully' });
});

export default router;
