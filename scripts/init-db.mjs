// Initialise the ATORA database schema on Supabase / PostgreSQL.
// Idempotent: CREATE TABLE IF NOT EXISTS — safe to run repeatedly.
// Usage: npm run db:init   (requires DATABASE_URL in .env)
import db, { runSqlFile } from './pg-helper.mjs';

console.log('[init-db] Applying schema from scripts/supabase-schema.sql ...');
await runSqlFile('scripts/supabase-schema.sql');
console.log('[init-db] Schema ready (idempotent — no data inserted).');
console.log('[init-db] Next: npm run db:seed');
await db.close();
