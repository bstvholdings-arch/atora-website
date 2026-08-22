/**
 * Admin session — bcrypt password hashing + simple cookie-based session.
 */
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import db from './db';
import { DEFAULT_SETTINGS, getSetting } from './settings';

const SESSION_COOKIE = 'atora_admin';
const SESSION_TTL_HOURS = 24 * 7; // 7 days

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(plain, hash);
  } catch {
    return false;
  }
}

export type AdminUser = {
  id: number;
  email: string;
  name: string | null;
  role: string;
};

/** Look up an admin by email. */
export function findAdminByEmail(email: string): (AdminUser & { password_hash: string }) | null {
  const row = db
    .prepare('SELECT id, email, name, role, password_hash FROM admin_users WHERE email = ?')
    .get(email.toLowerCase().trim()) as
    | (AdminUser & { password_hash: string })
    | undefined;
  return row ?? null;
}

/** Create the default admin if no admin exists. Uses env vars. */
export async function ensureDefaultAdmin(): Promise<void> {
  const row = db.prepare('SELECT COUNT(*) as c FROM admin_users').get() as { c: number };
  if (row.c > 0) return;

  const email = (process.env.ADMIN_DEFAULT_EMAIL || DEFAULT_SETTINGS.company_name_en)
    .toLowerCase()
    .trim();
  const password = process.env.ADMIN_DEFAULT_PASSWORD || 'Atora@2026';
  const name = process.env.ADMIN_DEFAULT_NAME || 'Administrator';
  const hash = await hashPassword(password);

  db.prepare(
    `INSERT INTO admin_users (email, name, password_hash, role)
     VALUES (?, ?, ?, 'superadmin')`
  ).run(email, name, hash);
  console.log(`[auth] Created default admin: ${email} / ${password}`);
}

export async function createSession(adminId: number): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 3600 * 1000).toISOString();
  db.prepare(
    `INSERT INTO sessions (token, admin_id, expires_at) VALUES (?, ?, ?)`
  ).run(token, adminId, expiresAt);
  db.prepare(`UPDATE admin_users SET last_login_at = datetime('now') WHERE id = ?`).run(adminId);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(expiresAt),
    path: '/',
  });
  return token;
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    cookieStore.delete(SESSION_COOKIE);
  }
}

export async function getCurrentAdmin(): Promise<AdminUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const row = db
    .prepare(
      `SELECT a.id, a.email, a.name, a.role
       FROM sessions s
       JOIN admin_users a ON a.id = s.admin_id
       WHERE s.token = ? AND datetime(s.expires_at) > datetime('now')`
    )
    .get(token) as AdminUser | undefined;
  return row ?? null;
}

export { SESSION_COOKIE };
