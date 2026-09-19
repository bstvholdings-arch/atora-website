/**
 * GET /api/about/gallery?lang=en
 *
 * Public photo wall for the About Us page (published photos only).
 */
import { NextRequest, NextResponse } from 'next/server';
import { data } from '@/lib/data';
import { pickLocalized, resolveLocale } from '@/lib/i18n';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const lang = resolveLocale(req.nextUrl.searchParams.get('lang'));
  const year = req.nextUrl.searchParams.get('year');
  try {
    let photos = await data.listPublishedGallery();
    if (year) photos = photos.filter((p) => (p.year ?? '') === year);

    return NextResponse.json({
      ok: true,
      lang,
      count: photos.length,
      photos: photos.map((p) => {
        const row = p as unknown as Record<string, unknown>;
        return {
          id: p.id,
          title: pickLocalized(row, 'title', lang),
          caption: pickLocalized(row, 'caption', lang),
          alt: pickLocalized(row, 'alt', lang) || pickLocalized(row, 'title', lang),
          year: p.year,
          event_name: p.event_name,
          file_path: p.file_path,
          thumb_path: p.thumb_path ?? p.file_path,
          is_cover: p.is_cover,
          sort_order: p.sort_order,
          i18n: {
            title_en: p.title_en, title_bm: p.title_bm, title_zh: p.title_zh,
            caption_en: p.caption_en, caption_bm: p.caption_bm, caption_zh: p.caption_zh,
            alt_en: p.alt_en, alt_bm: p.alt_bm, alt_zh: p.alt_zh,
          },
        };
      }),
    });
  } catch (err) {
    console.error('[api/about/gallery]', err);
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 });
  }
}
