# Create or update admin user
# Usage: node scripts/create-admin.mjs email@example.com password [name]
import Database from 'better-sqlite3';
import path from 'node:path';
import bcrypt from 'bcryptjs';

const [, , email, password, name = 'Administrator'] = process.argv;

if (!email || !password) {
  console.log('Usage: node scripts/create-admin.mjs email@example.com password [name]');
  process.exit(1);
}

const DB = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'atora.db');
const db = new Database(DB);

const existing = db.prepare('SELECT id FROM admin_users WHERE email = ?').get(email.toLowerCase());
const hash = bcrypt.hashSync(password, 10);

if (existing) {
  db.prepare('UPDATE admin_users SET name = ?, password_hash = ? WHERE id = ?').run(name, hash, existing.id);
  console.log(`✓ Updated ${email}`);
} else {
  db.prepare('INSERT INTO admin_users (email, name, password_hash, role) VALUES (?, ?, ?, ?)')
    .run(email.toLowerCase(), name, hash, 'superadmin');
  console.log(`✓ Created ${email}`);
}
db.close();
