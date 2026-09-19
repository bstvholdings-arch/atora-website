/**
 * GET /api/about/awards/{slug}?lang=en
 *
 * Public single-award endpoint (published rows only).
 */
import { NextRequest, NextResponse } from 'next/server';
import { data } from '@/lib/data';
import { pickLocalized, resolveLocale } from '@/lib/i18n';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lang = resolveLocale(req.nextUrl.searchParams.get('lang'));
  try {
    const award = await data.getPublishedAwardBySlug(slug);
    if (!award) {
      return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });
    }
    const row = award as unknown as Record<string, unknown>;
    const media = await data.listAwardMedia(award.id);

    return NextResponse.json({
      ok: true,
      lang,
      award: {
        id: award.id,
        slug: award.slug,
        year: award.year,
        award_date: award.award_date,
        title: pickLocalized(row, 'title', lang) || award.title_en,
        issuer: pickLocalized(row, 'issuer', lang),
        summary: pickLocalized(row, 'summary', lang),
        story: pickLocalized(row, 'story', lang),
        cover_image: award.cover_image,
        cover_thumb: award.cover_thumb,
        seo: {
          title: pickLocalized(row, 'seo_title', lang) || award.title_en,
          description: pickLocalized(row, 'seo_desc', lang) || pickLocalized(row, 'summary', lang),
        },
        i18n: {
          title_en: award.title_en, title_bm: award.title_bm, title_zh: award.title_zh,
          issuer_en: award.issuer_en, issuer_bm: award.issuer_bm, issuer_zh: award.issuer_zh,
          summary_en: award.summary_en, summary_bm: award.summary_bm, summary_zh: award.summary_zh,
          story_en: award.story_en, story_bm: award.story_bm, story_zh: award.story_zh,
        },
        media: media.map((m) => {
          const mrow = m as unknown as Record<string, unknown>;
          return {
            id: m.id,
            type: m.type,
            file_path: m.file_path,
            thumb_path: m.thumb_path ?? m.file_path,
            caption: pickLocalized(mrow, 'caption', lang),
            alt: pickLocalized(mrow, 'alt', lang) || pickLocalized(mrow, 'caption', lang),
            is_cover: m.is_cover,
            sort_order: m.sort_order,
          };
        }),
      },
    });
  } catch (err) {
    console.error('[api/about/awards/[slug]]', err);
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 });
  }
}
