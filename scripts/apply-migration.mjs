// Apply a .sql migration file to the configured PostgreSQL (Supabase) database.
// Usage: node scripts/apply-migration.mjs scripts/migrations/<file>.sql
//        npm run db:migrate -- scripts/migrations/<file>.sql
// Idempotent by design — the migration files use CREATE ... IF NOT EXISTS.
import db, { runSqlFile } from './pg-helper.mjs';

const file = process.argv[2];
if (!file) {
  console.error('[migrate] Usage: node scripts/apply-migration.mjs <path-to.sql>');
  process.exit(1);
}

console.log(`[migrate] Applying ${file} ...`);
try {
  await runSqlFile(file);
  console.log('[migrate] Done.');
} catch (e) {
  console.error('[migrate] FAILED:', e?.message ?? e);
  process.exitCode = 1;
} finally {
  await db.close();
}
