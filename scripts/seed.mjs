/**
 * Seed script — populate the ATORA Supabase/PostgreSQL DB with all sample data.
 *
 * Run with: `npm run db:seed`   (requires DATABASE_URL in .env)
 *
 * The schema is applied idempotently from scripts/supabase-schema.sql first,
 * so a single `db:seed` fully provisions a fresh database.
 */
import db, { runSqlFile } from './pg-helper.mjs';
import bcrypt from 'bcryptjs';
import { seedDatabase } from './seed-data.mjs';

console.log('[seed] Applying schema (scripts/supabase-schema.sql)...');
await runSqlFile('scripts/supabase-schema.sql');

console.log('[seed] Clearing admin users (keep superadmin)...');
await db.exec(`DELETE FROM admin_users WHERE role != 'superadmin';`);

console.log('[seed] Inserting admin...');
const adminHash = bcrypt.hashSync(process.env.ADMIN_DEFAULT_PASSWORD || 'Atora@2026', 10);
await db
  .prepare(
    `INSERT INTO admin_users (email, name, password_hash, role) VALUES (?, ?, ?, 'superadmin')
     ON CONFLICT(email) DO UPDATE SET password_hash = excluded.password_hash, name = excluded.name`
  )
  .run(
    (process.env.ADMIN_DEFAULT_EMAIL || 'admin@atora.com.my').toLowerCase(),
    process.env.ADMIN_DEFAULT_NAME || 'Administrator',
    adminHash
  );

console.log('[seed] Seeding content tables...');
await seedDatabase(db);

console.log('[seed] Done!');
console.log('');
console.log('  Admin login: ' + (process.env.ADMIN_DEFAULT_EMAIL || 'admin@atora.com.my'));
console.log('  Admin password: ' + (process.env.ADMIN_DEFAULT_PASSWORD || 'Atora@2026'));
console.log('  Start the site: npm run dev');
console.log('  Visit: http://localhost:3000');
await db.close();
