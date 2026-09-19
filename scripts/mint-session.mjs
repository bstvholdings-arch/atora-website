// Mint a valid admin session token into the PostgreSQL database so auth-gated
// routes (/api/admin/*, /admin/*) can be exercised from curl during QA.
// Usage: node scripts/mint-session.mjs
// Prints: TOKEN=... ADMIN=...
import crypto from 'node:crypto';
import db from './pg-helper.mjs';

const admin = await db.prepare('SELECT id, email, role FROM admin_users ORDER BY id LIMIT 1').get();
if (!admin) {
  console.error('NO_ADMIN — run `npm run admin:create` first.');
  process.exit(2);
}

const token = crypto.randomBytes(32).toString('hex');
const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
await db.prepare('INSERT INTO sessions (token, admin_id, expires_at) VALUES (?, ?, ?)').run(token, admin.id, expiresAt);

console.log('TOKEN=' + token);
console.log('ADMIN=' + admin.email);
console.log('ROLE=' + (admin.role ?? 'admin'));
await db.close();
