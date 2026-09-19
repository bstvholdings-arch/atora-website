/**
 * DELETE /api/admin/comments/{id}
 * Permanently removes a comment. Admin role required.
 */
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { data } from '@/lib/data';
import { jsonError, requireModeratorRole } from '@/lib/apiGuard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireModeratorRole();
  if ('response' in guard) return guard.response;
  const { id } = await params;
  const n = Number(id);
  if (!Number.isFinite(n) || n <= 0) return jsonError('invalid_id', 400);

  try {
    await data.deleteComments([n]);
    revalidatePath('/admin/comments');
    revalidatePath('/[lang]/about', 'page');
    return NextResponse.json({ ok: true, deleted: n });
  } catch (err) {
    console.error('[api/admin/comments/[id] DELETE]', err);
    return jsonError('server_error', 500);
  }
}
