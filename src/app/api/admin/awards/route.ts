/**
 * /api/admin/awards
 *   GET  — list every award (published + draft), with media.
 *   POST — create an award.
 */
import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { data } from '@/lib/data';
import { bool, jsonError, num, readJsonBody, requireAdmin, str, uniqueSlugFor } from '@/lib/apiGuard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const guard = await requireAdmin();
  if ('response' in guard) return guard.response;
  try {
    const [awards, media] = await Promise.all([data.listAllAwards(), data.listAllAwardMedia()]);
    return NextResponse.json({
      ok: true,
      count: awards.length,
      awards: awards.map((a) => ({ ...a, media: media.filter((m) => m.award_id === a.id) })),
    });
  } catch (err) {
    console.error('[api/admin/awards GET]', err);
    return jsonError('server_error', 500);
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if ('response' in guard) return guard.response;

  const body = await readJsonBody(req);
  const titleEn = str(body.title_en);
  if (!titleEn) return jsonError('title_en_required', 400);

  try {
    const slug = await uniqueSlugFor('awards', str(body.slug) || titleEn);
    const id = await data.createAward({
      slug,
      year: str(body.year),
      award_date: str(body.award_date),
      title_en: titleEn,
      title_bm: str(body.title_bm),
      title_zh: str(body.title_zh),
      issuer_en: str(body.issuer_en),
      issuer_bm: str(body.issuer_bm),
      issuer_zh: str(body.issuer_zh),
      summary_en: str(body.summary_en),
      summary_bm: str(body.summary_bm),
      summary_zh: str(body.summary_zh),
      story_en: str(body.story_en),
      story_bm: str(body.story_bm),
      story_zh: str(body.story_zh),
      cover_image: str(body.cover_image),
      cover_thumb: str(body.cover_thumb),
      seo_title_en: str(body.seo_title_en),
      seo_title_bm: str(body.seo_title_bm),
      seo_title_zh: str(body.seo_title_zh),
      seo_desc_en: str(body.seo_desc_en),
      seo_desc_bm: str(body.seo_desc_bm),
      seo_desc_zh: str(body.seo_desc_zh),
      sort_order: num(body.sort_order, 0),
      is_published: bool(body.is_published, true),
    });
    return NextResponse.json({ ok: true, id, slug }, { status: 201 });
  } catch (err) {
    console.error('[api/admin/awards POST]', err);
    return jsonError('server_error', 500);
  }
}
