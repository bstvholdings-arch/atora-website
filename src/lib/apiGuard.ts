/**
 * Shared helpers for the /api/admin/* JSON endpoints.
 *
 * The admin UI itself uses server actions (`src/lib/actions.ts`); these REST
 * routes exist so the same operations can be driven from scripts, mobile apps
 * or an external dashboard. Both layers call the same repository methods in
 * `src/lib/data.ts`, so there is exactly one implementation of each rule.
 */
import { NextResponse } from 'next/server';
import { getCurrentAdmin, type AdminUser } from '@/lib/auth';
import { slugify } from '@/lib/slug';
import db from '@/lib/db';

export type Guard = { admin: AdminUser } | { response: NextResponse };

/** Require any authenticated admin. */
export async function requireAdmin(): Promise<Guard> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return { response: NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 }) };
  }
  return { admin };
}

/** Require the `admin` / `superadmin` role — needed to moderate or delete. */
export async function requireModeratorRole(): Promise<Guard> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return { response: NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 }) };
  }
  if (admin.role !== 'admin' && admin.role !== 'superadmin') {
    return { response: NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 }) };
  }
  return { admin };
}

export function jsonError(error: string, status = 400, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ ok: false, error, ...extra }, { status });
}

/** Read a JSON (or form-encoded) request body into a plain string map. */
export async function readJsonBody(req: Request): Promise<Record<string, string>> {
  const ct = req.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    const json = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(json)) {
      if (v == null) out[k] = '';
      // Nested arrays / objects (e.g. `items`, `order`, `ids`) are re-serialised
      // so downstream `JSON.parse(str(body.x))` keeps working.
      else if (typeof v === 'object') out[k] = JSON.stringify(v);
      else out[k] = String(v);
    }
    return out;
  }
  const form = await req.formData().catch(() => null);
  const out: Record<string, string> = {};
  if (form) for (const [k, v] of form.entries()) if (!(v instanceof File)) out[k] = v.toString();
  return out;
}

export const str = (v: unknown): string | null => {
  if (v == null) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
};

export const bool = (v: unknown, defaultValue = true): number => {
  if (v == null || v === '') return defaultValue ? 1 : 0;
  const s = String(v).toLowerCase();
  if (['0', 'false', 'off', 'no', 'unpublished', 'draft'].includes(s)) return 0;
  return 1;
};

export const num = (v: unknown, fallback = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

/** Ensure a slug is unique inside a table, ignoring the row being edited. */
export async function uniqueSlugFor(
  table: 'awards' | 'gallery',
  base: string,
  ignoreId?: number
): Promise<string> {
  const seed = slugify(base) || `${table}-${Date.now()}`;
  let candidate = seed;
  let i = 2;
  for (;;) {
    const row = (await db.prepare(`SELECT id FROM ${table} WHERE slug = ?`).get(candidate)) as
      | { id: number }
      | undefined;
    if (!row || row.id === ignoreId) return candidate;
    candidate = `${seed}-${i++}`;
  }
}
