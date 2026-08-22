/** Mint a valid admin session token into the DB so we can test auth-gated routes. */
const Database = require('better-sqlite3');
const crypto = require('node:crypto');
const path = require('path');

const db = new Database(path.join(process.cwd(), 'data', 'atora.db'));

const admin = db.prepare('SELECT id, email FROM admin_users LIMIT 1').get();
if (!admin) {
  console.error('NO_ADMIN');
  process.exit(2);
}
const token = crypto.randomBytes(32).toString('hex');
const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
db.prepare("INSERT INTO sessions (token, admin_id, expires_at) VALUES (?, ?, ?)").run(token, admin.id, expiresAt);
console.log('TOKEN=' + token);
console.log('ADMIN=' + admin.email);
db.close();
