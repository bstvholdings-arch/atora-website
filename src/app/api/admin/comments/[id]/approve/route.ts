/**
 * PATCH /api/admin/comments/{id}/approve
 * Approves a pending comment so it becomes visible on the public About page.
 * Admin role required.
 */
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { data } from '@/lib/data';
import { jsonError, requireModeratorRole } from '@/lib/apiGuard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireModeratorRole();
  if ('response' in guard) return guard.response;
  const { id } = await params;
  const n = Number(id);
  if (!Number.isFinite(n) || n <= 0) return jsonError('invalid_id', 400);

  try {
    await data.setCommentsStatus([n], 'approved');
    revalidatePath('/admin/comments');
    revalidatePath('/[lang]/about', 'page');
    return NextResponse.json({ ok: true, id: n, status: 'approved' });
  } catch (err) {
    console.error('[api/admin/comments/[id]/approve]', err);
    return jsonError('server_error', 500);
  }
}
