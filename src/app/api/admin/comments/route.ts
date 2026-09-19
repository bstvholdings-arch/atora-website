/**
 * /api/admin/comments
 *   GET — list comments with optional filters: ?status=pending&q=...&limit=200
 *
 * Returns the full admin record (including email / phone / ip) — this endpoint
 * requires an authenticated admin session and must never be exposed publicly.
 */
import { NextRequest, NextResponse } from 'next/server';
import { data } from '@/lib/data';
import { jsonError, num, readJsonBody, requireAdmin, requireModeratorRole, str } from '@/lib/apiGuard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_STATUS = new Set(['pending', 'approved', 'rejected', 'spam']);

export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if ('response' in guard) return guard.response;
  const sp = req.nextUrl.searchParams;
  try {
    const [comments, stats] = await Promise.all([
      data.listComments({
        status: sp.get('status') ?? 'all',
        q: sp.get('q') ?? undefined,
        limit: Number(sp.get('limit') ?? 500) || 500,
      }),
      data.countCommentsByStatus(),
    ]);
    return NextResponse.json({ ok: true, count: comments.length, stats, comments });
  } catch (err) {
    console.error('[api/admin/comments GET]', err);
    return jsonError('server_error', 500);
  }
}

/**
 * PATCH — bulk moderation.
 * Body: { ids: [1,2,3], status: 'approved' | 'rejected' | 'spam' | 'pending' }
 * Requires the admin role (only admins may approve or reject comments).
 */
export async function PATCH(req: NextRequest) {
  const guard = await requireModeratorRole();
  if ('response' in guard) return guard.response;

  const body = await readJsonBody(req);
  const status = str(body.status);
  if (!status || !VALID_STATUS.has(status)) return jsonError('invalid_status', 400);

  const raw = str(body.ids);
  let ids: number[] = [];
  try {
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    if (Array.isArray(parsed)) ids = parsed.map((v) => num(v, 0)).filter((n) => n > 0);
  } catch {
    return jsonError('invalid_ids', 400);
  }
  if (ids.length === 0) return jsonError('ids_required', 400);

  try {
    await data.setCommentsStatus(ids, status);
    return NextResponse.json({ ok: true, updated: ids.length, status });
  } catch (err) {
    console.error('[api/admin/comments PATCH]', err);
    return jsonError('server_error', 500);
  }
}

/** DELETE — bulk delete. Body: { ids: [1,2,3] } */
export async function DELETE(req: NextRequest) {
  const guard = await requireModeratorRole();
  if ('response' in guard) return guard.response;
  const body = await readJsonBody(req);
  const raw = str(body.ids);
  let ids: number[] = [];
  try {
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    if (Array.isArray(parsed)) ids = parsed.map((v) => num(v, 0)).filter((n) => n > 0);
  } catch {
    return jsonError('invalid_ids', 400);
  }
  if (ids.length === 0) return jsonError('ids_required', 400);
  try {
    await data.deleteComments(ids);
    return NextResponse.json({ ok: true, deleted: ids.length });
  } catch (err) {
    console.error('[api/admin/comments DELETE]', err);
    return jsonError('server_error', 500);
  }
}
