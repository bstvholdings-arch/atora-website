/**
 * /api/admin/gallery/{id}
 *   PUT    — update the tri-lingual fields / publish state / cover.
 *   DELETE — remove the photo (admin role only).
 */
import { NextRequest, NextResponse } from 'next/server';
import { data } from '@/lib/data';
import { deleteFromStorage, parsePublicStorageUrl } from '@/lib/storage';
import { bool, jsonError, readJsonBody, requireAdmin, requireModeratorRole, str } from '@/lib/apiGuard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if ('response' in guard) return guard.response;
  const { id } = await params;
  const photo = await data.getGalleryItem(Number(id));
  if (!photo) return jsonError('not_found', 404);

  const body = await readJsonBody(req);
  const pick = (key: keyof typeof photo, incoming: string | null) =>
    key in body ? incoming : ((photo[key] as string | null) ?? null);

  try {
    await data.updateGalleryItem(photo.id, {
      title_en: pick('title_en', str(body.title_en)),
      title_bm: pick('title_bm', str(body.title_bm)),
      title_zh: pick('title_zh', str(body.title_zh)),
      caption_en: pick('caption_en', str(body.caption_en)),
      caption_bm: pick('caption_bm', str(body.caption_bm)),
      caption_zh: pick('caption_zh', str(body.caption_zh)),
      alt_en: pick('alt_en', str(body.alt_en)),
      alt_bm: pick('alt_bm', str(body.alt_bm)),
      alt_zh: pick('alt_zh', str(body.alt_zh)),
      year: pick('year', str(body.year)),
      event_name: pick('event_name', str(body.event_name)),
      file_path: pick('file_path', str(body.file_path)) ?? photo.file_path,
      thumb_path: pick('thumb_path', str(body.thumb_path)),
      is_published: 'is_published' in body ? bool(body.is_published, true) : photo.is_published,
    });
    if (bool(body.is_cover, false) === 1) await data.setGalleryCover(photo.id);
    return NextResponse.json({ ok: true, id: photo.id });
  } catch (err) {
    console.error('[api/admin/gallery/[id] PUT]', err);
    return jsonError('server_error', 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireModeratorRole();
  if ('response' in guard) return guard.response;
  const { id } = await params;
  const photo = await data.getGalleryItem(Number(id));
  if (!photo) return jsonError('not_found', 404);
  try {
    for (const url of [photo.file_path, photo.thumb_path]) {
      const parsed = url ? parsePublicStorageUrl(url) : null;
      if (parsed) await deleteFromStorage(parsed.bucket, parsed.path).catch(() => undefined);
    }
    await data.deleteGalleryItem(photo.id);
    return NextResponse.json({ ok: true, deleted: photo.id });
  } catch (err) {
    console.error('[api/admin/gallery/[id] DELETE]', err);
    return jsonError('server_error', 500);
  }
}
