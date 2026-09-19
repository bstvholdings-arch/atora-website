/**
 * /api/admin/awards/{id}/media
 *   GET  — list the award's medal / trophy photos.
 *   POST — attach already-uploaded files (public URLs) to the award.
 *
 * Files are uploaded through POST /api/upload (kind=photo) first; this endpoint
 * only records the resulting URLs, so it can also be called from a script.
 * Body: { items: [{ file_path, thumb_path?, is_cover? }] }  (or a single file_path)
 */
import { NextRequest, NextResponse } from 'next/server';
import { data } from '@/lib/data';
import { jsonError, readJsonBody, requireAdmin, str } from '@/lib/apiGuard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if ('response' in guard) return guard.response;
  const { id } = await params;
  const award = await data.getAwardById(Number(id));
  if (!award) return jsonError('not_found', 404);
  return NextResponse.json({ ok: true, media: await data.listAwardMedia(award.id) });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if ('response' in guard) return guard.response;
  const { id } = await params;
  const award = await data.getAwardById(Number(id));
  if (!award) return jsonError('not_found', 404);

  const body = await readJsonBody(req);
  let items: { file_path: string; thumb_path: string | null; type?: string; is_cover?: boolean }[] = [];

  const raw = str(body.items);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        items = parsed
          .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
          .map((x) => ({
            file_path: String(x.file_path ?? x.url ?? ''),
            thumb_path: x.thumb_path ? String(x.thumb_path) : null,
            type: x.type ? String(x.type) : 'image',
            is_cover: Boolean(x.is_cover),
          }))
          .filter((x) => x.file_path);
      }
    } catch {
      return jsonError('invalid_items', 400);
    }
  } else if (str(body.file_path)) {
    items = [
      {
        file_path: str(body.file_path) as string,
        thumb_path: str(body.thumb_path),
        type: str(body.type) ?? 'image',
        is_cover: Boolean(body.is_cover),
      },
    ];
  }

  if (items.length === 0) return jsonError('no_items', 400);

  try {
    const added = await data.addAwardMedia(award.id, items);
    return NextResponse.json({ ok: true, added, media: await data.listAwardMedia(award.id) }, { status: 201 });
  } catch (err) {
    console.error('[api/admin/awards/[id]/media POST]', err);
    return jsonError('server_error', 500);
  }
}
