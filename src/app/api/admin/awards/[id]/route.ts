/**
 * /api/admin/awards/{id}
 *   GET    — read one award with its media.
 *   PUT    — update (partial payload; omitted fields keep their current value).
 *   DELETE — delete the award and its media (admin role only).
 */
import { NextRequest, NextResponse } from 'next/server';
import { data } from '@/lib/data';
import { deleteFromStorage, parsePublicStorageUrl } from '@/lib/storage';
import {
  bool,
  jsonError,
  num,
  readJsonBody,
  requireAdmin,
  requireModeratorRole,
  str,
  uniqueSlugFor,
} from '@/lib/apiGuard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function findAward(id: number) {
  const n = Number(id);
  if (!Number.isFinite(n) || n <= 0) return null;
  return data.getAwardById(n);
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if ('response' in guard) return guard.response;
  const { id } = await params;
  const award = await findAward(Number(id));
  if (!award) return jsonError('not_found', 404);
  const media = await data.listAwardMedia(award.id);
  return NextResponse.json({ ok: true, award: { ...award, media } });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if ('response' in guard) return guard.response;
  const { id } = await params;
  const existing = await findAward(Number(id));
  if (!existing) return jsonError('not_found', 404);

  const body = await readJsonBody(req);
  // Partial update: fall back to the stored value when a field is absent.
  const pick = (key: keyof typeof existing, incoming: string | null) =>
    key in body ? incoming : ((existing[key] as string | null) ?? null);

  try {
    const slug = await uniqueSlugFor('awards', str(body.slug) || existing.slug, existing.id);
    await data.updateAward(existing.id, {
      slug,
      year: pick('year', str(body.year)),
      award_date: pick('award_date', str(body.award_date)),
      title_en: ('title_en' in body ? str(body.title_en) : existing.title_en) ?? existing.title_en,
      title_bm: pick('title_bm', str(body.title_bm)),
      title_zh: pick('title_zh', str(body.title_zh)),
      issuer_en: pick('issuer_en', str(body.issuer_en)),
      issuer_bm: pick('issuer_bm', str(body.issuer_bm)),
      issuer_zh: pick('issuer_zh', str(body.issuer_zh)),
      summary_en: pick('summary_en', str(body.summary_en)),
      summary_bm: pick('summary_bm', str(body.summary_bm)),
      summary_zh: pick('summary_zh', str(body.summary_zh)),
      story_en: pick('story_en', str(body.story_en)),
      story_bm: pick('story_bm', str(body.story_bm)),
      story_zh: pick('story_zh', str(body.story_zh)),
      cover_image: pick('cover_image', str(body.cover_image)),
      cover_thumb: pick('cover_thumb', str(body.cover_thumb)),
      seo_title_en: pick('seo_title_en', str(body.seo_title_en)),
      seo_title_bm: pick('seo_title_bm', str(body.seo_title_bm)),
      seo_title_zh: pick('seo_title_zh', str(body.seo_title_zh)),
      seo_desc_en: pick('seo_desc_en', str(body.seo_desc_en)),
      seo_desc_bm: pick('seo_desc_bm', str(body.seo_desc_bm)),
      seo_desc_zh: pick('seo_desc_zh', str(body.seo_desc_zh)),
      sort_order: 'sort_order' in body ? num(body.sort_order, existing.sort_order) : existing.sort_order,
      is_published: 'is_published' in body ? bool(body.is_published, true) : existing.is_published,
    });
    return NextResponse.json({ ok: true, id: existing.id, slug });
  } catch (err) {
    console.error('[api/admin/awards PUT]', err);
    return jsonError('server_error', 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireModeratorRole();
  if ('response' in guard) return guard.response;
  const { id } = await params;
  const award = await findAward(Number(id));
  if (!award) return jsonError('not_found', 404);

  try {
    const media = await data.listAwardMedia(award.id);
    for (const m of media) {
      for (const url of [m.file_path, m.thumb_path]) {
        const parsed = url ? parsePublicStorageUrl(url) : null;
        if (parsed) await deleteFromStorage(parsed.bucket, parsed.path).catch(() => undefined);
      }
    }
    await data.deleteAward(award.id);
    return NextResponse.json({ ok: true, deleted: award.id });
  } catch (err) {
    console.error('[api/admin/awards DELETE]', err);
    return jsonError('server_error', 500);
  }
}
