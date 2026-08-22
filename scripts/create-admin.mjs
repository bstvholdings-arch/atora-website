// Create or update an admin user (Postgres / Supabase)
// Usage: node scripts/create-admin.mjs email@example.com password [name]
import db from './pg-helper.mjs';
import bcrypt from 'bcryptjs';

const [, , email, password, name = 'Administrator'] = process.argv;

if (!email || !password) {
  console.log('Usage: node scripts/create-admin.mjs email@example.com password [name]');
  process.exit(1);
}

const existing = await db.prepare('SELECT id FROM admin_users WHERE email = ?').get(email.toLowerCase());
const hash = bcrypt.hashSync(password, 10);

if (existing) {
  await db.prepare('UPDATE admin_users SET name = ?, password_hash = ? WHERE id = ?').run(name, hash, existing.id);
  console.log(`✓ Updated ${email}`);
} else {
  await db
    .prepare('INSERT INTO admin_users (email, name, password_hash, role) VALUES (?, ?, ?, ?)')
    .run(email.toLowerCase(), name, hash, 'superadmin');
  console.log(`✓ Created ${email}`);
}
await db.close();
