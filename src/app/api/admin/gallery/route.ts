/**
 * /api/admin/gallery
 *   GET  — list every photo (published + hidden).
 *   POST — add one or more photos: { items: [{ file_path, thumb_path?, title_*… }] }
 */
import { NextRequest, NextResponse } from 'next/server';
import { data } from '@/lib/data';
import { deleteFromStorage, parsePublicStorageUrl } from '@/lib/storage';
import { bool, jsonError, num, readJsonBody, requireAdmin, requireModeratorRole, str } from '@/lib/apiGuard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const guard = await requireAdmin();
  if ('response' in guard) return guard.response;
  try {
    const photos = await data.listAllGallery();
    return NextResponse.json({ ok: true, count: photos.length, photos });
  } catch (err) {
    console.error('[api/admin/gallery GET]', err);
    return jsonError('server_error', 500);
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if ('response' in guard) return guard.response;
  const body = await readJsonBody(req);

  type Item = Record<string, unknown>;
  let items: Item[] = [];
  const raw = str(body.items);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) items = parsed.filter((x): x is Item => !!x && typeof x === 'object');
    } catch {
      return jsonError('invalid_items', 400);
    }
  } else if (str(body.file_path)) {
    items = [body as unknown as Item];
  }
  if (items.length === 0) return jsonError('no_items', 400);

  const mapped = items
    .map((it) => ({
      file_path: String(it.file_path ?? it.url ?? ''),
      thumb_path: it.thumb_path ? String(it.thumb_path) : null,
      title_en: str(it.title_en),
      title_bm: str(it.title_bm),
      title_zh: str(it.title_zh),
      caption_en: str(it.caption_en),
      caption_bm: str(it.caption_bm),
      caption_zh: str(it.caption_zh),
      alt_en: str(it.alt_en),
      alt_bm: str(it.alt_bm),
      alt_zh: str(it.alt_zh),
      year: str(it.year),
      event_name: str(it.event_name),
      is_cover: bool(it.is_cover, false),
      is_published: bool(it.is_published, true),
    }))
    .filter((it) => it.file_path);

  if (mapped.length === 0) return jsonError('no_items', 400);

  try {
    const added = await data.createGalleryItems(mapped);
    return NextResponse.json({ ok: true, added }, { status: 201 });
  } catch (err) {
    console.error('[api/admin/gallery POST]', err);
    return jsonError('server_error', 500);
  }
}

/** PATCH — reorder the whole wall: { order: [id, id, …] } */
export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin();
  if ('response' in guard) return guard.response;
  const body = await readJsonBody(req);
  const raw = str(body.order);
  if (!raw) return jsonError('order_required', 400);
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return jsonError('invalid_order', 400);
    await data.reorderGallery(parsed.map((v) => num(v, 0)).filter((n) => n > 0));
    return NextResponse.json({ ok: true });
  } catch {
    return jsonError('invalid_order', 400);
  }
}

/** DELETE — bulk delete: { ids: [1,2,3] }. Admin role required. */
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
    for (const id of ids) {
      const photo = await data.getGalleryItem(id);
      if (!photo) continue;
      for (const url of [photo.file_path, photo.thumb_path]) {
        const parsed = url ? parsePublicStorageUrl(url) : null;
        if (parsed) await deleteFromStorage(parsed.bucket, parsed.path).catch(() => undefined);
      }
      await data.deleteGalleryItem(id);
    }
    return NextResponse.json({ ok: true, deleted: ids.length });
  } catch (err) {
    console.error('[api/admin/gallery DELETE]', err);
    return jsonError('server_error', 500);
  }
}
