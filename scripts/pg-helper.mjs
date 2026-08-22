/**
 * pg-helper — a tiny better-sqlite3-style wrapper around node-postgres so the
 * seed / admin / init scripts can keep the same `db.prepare(...).run/get/all`
 * API they used with better-sqlite3.
 *
 *  - `?` placeholders are rewritten to `$1, $2, ...` for PostgreSQL.
 *  - `datetime('now')` (and variants) are rewritten to `CURRENT_TIMESTAMP`.
 *  - Plain INSERTs get `RETURNING id` appended so `.run().lastInsertRowid` works.
 *
 * Connection: reads DATABASE_URL (or DIRECT_URL / POSTGRES_URL) from the env.
 */
import { Pool } from 'pg';
import fs from 'node:fs';
import path from 'node:path';

const connectionString =
  process.env.DATABASE_URL || process.env.DIRECT_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  console.error('[pg-helper] Missing DATABASE_URL / DIRECT_URL. Set it in .env');
  process.exit(1);
}

const isRemote = /supabase|amazonaws|pooler|railway|render|neon/i.test(connectionString);

const pool = new Pool({
  connectionString,
  ssl: isRemote ? { rejectUnauthorized: false } : undefined,
  max: 5,
});

/** Convert SQLite-style placeholders / datetime() to PostgreSQL syntax. */
function toPg(sql) {
  let i = 0;
  let out = sql.replace(/\?/g, () => `$${++i}`);
  out = out.replace(/datetime\('now',\s*'localtime'\)/gi, 'CURRENT_TIMESTAMP');
  out = out.replace(/datetime\('now',\s*'utc'\)/gi, 'CURRENT_TIMESTAMP');
  out = out.replace(/datetime\('now'\)/gi, 'CURRENT_TIMESTAMP');
  // Strip any remaining datetime(...) wrapper (rare casting usage)
  out = out.replace(/datetime\(([^)]+)\)/gi, '$1');
  return out;
}

export const db = {
  prepare(sql) {
    const psql = toPg(sql);
    const isInsert = /^\s*INSERT\s+(?:OR\s+IGNORE\s+)?INTO/i.test(psql) && !/RETURNING/i.test(psql);
    const execSql = isInsert ? `${psql} RETURNING id` : psql;
    return {
      async get(...params) {
        const r = await pool.query(execSql, params);
        return r.rows[0];
      },
      async all(...params) {
        const r = await pool.query(execSql, params);
        return r.rows;
      },
      async run(...params) {
        const r = await pool.query(execSql, params);
        return {
          lastInsertRowid: r.rows[0]?.id ?? undefined,
          changes: r.rowCount ?? 0,
        };
      },
    };
  },

  /** Run a multi-statement SQL string (e.g. the schema file), split on ';'. */
  async exec(sql) {
    const stmts = sql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    for (const s of stmts) {
      await pool.query(s);
    }
  },

  async close() {
    await pool.end();
  },
};

/** Read a .sql file relative to project root and execute it. */
export async function runSqlFile(relPath) {
  const sql = fs.readFileSync(path.join(process.cwd(), relPath), 'utf8');
  await db.exec(sql);
}

export default db;
