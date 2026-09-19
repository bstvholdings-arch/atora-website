/**
 * GET /api/about/awards?lang=en
 *
 * Public, read-only list of published awards for the About Us page.
 * Multilingual columns are resolved to the requested locale, with the raw
 * `_en/_bm/_zh` values kept alongside for clients that do their own switching.
 */
import { NextRequest, NextResponse } from 'next/server';
import { data } from '@/lib/data';
import { pickLocalized, resolveLocale, type Locale } from '@/lib/i18n';
import type { Award, AwardMedia } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function localizedAward(a: Award, lang: Locale) {
  const row = a as unknown as Record<string, unknown>;
  return {
    id: a.id,
    slug: a.slug,
    year: a.year,
    award_date: a.award_date,
    title: pickLocalized(row, 'title', lang) || a.title_en,
    issuer: pickLocalized(row, 'issuer', lang),
    summary: pickLocalized(row, 'summary', lang),
    story: pickLocalized(row, 'story', lang),
    cover_image: a.cover_image,
    cover_thumb: a.cover_thumb,
    seo: {
      title: pickLocalized(row, 'seo_title', lang) || a.title_en,
      description: pickLocalized(row, 'seo_desc', lang) || pickLocalized(row, 'summary', lang),
    },
    i18n: {
      title_en: a.title_en, title_bm: a.title_bm, title_zh: a.title_zh,
      issuer_en: a.issuer_en, issuer_bm: a.issuer_bm, issuer_zh: a.issuer_zh,
      summary_en: a.summary_en, summary_bm: a.summary_bm, summary_zh: a.summary_zh,
      story_en: a.story_en, story_bm: a.story_bm, story_zh: a.story_zh,
    },
    sort_order: a.sort_order,
  };
}

function localizedMedia(m: AwardMedia, lang: Locale) {
  const row = m as unknown as Record<string, unknown>;
  return {
    id: m.id,
    award_id: m.award_id,
    type: m.type,
    file_path: m.file_path,
    thumb_path: m.thumb_path ?? m.file_path,
    caption: pickLocalized(row, 'caption', lang),
    alt: pickLocalized(row, 'alt', lang) || pickLocalized(row, 'caption', lang),
    is_cover: m.is_cover,
    sort_order: m.sort_order,
  };
}

export async function GET(req: NextRequest) {
  const lang = resolveLocale(req.nextUrl.searchParams.get('lang'));
  try {
    const awards = await data.listPublishedAwards();
    const allMedia = await data.listAllAwardMedia();
    const withMedia = req.nextUrl.searchParams.get('media') !== '0';
    return NextResponse.json({
      ok: true,
      lang,
      count: awards.length,
      awards: awards.map((a) => ({
        ...localizedAward(a, lang),
        media: withMedia
          ? allMedia.filter((m) => m.award_id === a.id).map((m) => localizedMedia(m, lang))
          : undefined,
      })),
    });
  } catch (err) {
    console.error('[api/about/awards]', err);
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 });
  }
}
