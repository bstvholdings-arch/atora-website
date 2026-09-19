/**
 * PATCH /api/admin/comments/{id}/reject
 * Rejects a comment (kept in the DB for the audit trail, never shown publicly).
 * Admin role required.
 */
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { data } from '@/lib/data';
import { jsonError, requireModeratorRole, readJsonBody } from '@/lib/apiGuard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireModeratorRole();
  if ('response' in guard) return guard.response;
  const { id } = await params;
  const n = Number(id);
  if (!Number.isFinite(n) || n <= 0) return jsonError('invalid_id', 400);

  // Optional ?as=spam marks it as junk instead of a plain rejection.
  const body = await readJsonBody(req).catch(() => ({}) as Record<string, string>);
  const asSpam = req.nextUrl.searchParams.get('as') === 'spam' || body.as === 'spam';
  const status = asSpam ? 'spam' : 'rejected';

  try {
    await data.setCommentsStatus([n], status);
    revalidatePath('/admin/comments');
    revalidatePath('/[lang]/about', 'page');
    return NextResponse.json({ ok: true, id: n, status });
  } catch (err) {
    console.error('[api/admin/comments/[id]/reject]', err);
    return jsonError('server_error', 500);
  }
}
