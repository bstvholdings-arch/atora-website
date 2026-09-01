/**
 * /sitemap.xml — auto-generated, multilingual XML sitemap of every public page.
 *
 *  - Reads products / brands / partners / locations from the database.
 *  - Emits `xhtml:link rel="alternate" hreflang=...` for every URL so Google,
 *    Bing and AI crawlers can resolve the en / bm / zh versions.
 *  - Uses real `created_at` timestamps where the row has one; no fake lastmod.
 */
import { data } from '@/lib/data';
import { LOCALES, HREFLANG_TAGS } from '@/lib/i18n';
import { absoluteUrl } from '@/lib/seo';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Entry = {
  /** Path WITHOUT the locale prefix, e.g. "/products" or "" (home). */
  path: string;
  priority: number;
  changefreq: 'daily' | 'weekly' | 'monthly';
  lastmod?: string;
};

const xmlEscape = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const localizedUrl = (path: string, lang: string) => absoluteUrl(`/${lang}${path}`);

/** Build the <url> block for one path, with hreflang alternates for all locales. */
function urlBlock(e: Entry): string {
  const alternates = [
    ...LOCALES.map(
      (l) =>
        `    <xhtml:link rel="alternate" hreflang="${HREFLANG_TAGS[l]}" href="${xmlEscape(localizedUrl(e.path, l))}"/>`
    ),
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${xmlEscape(localizedUrl(e.path, 'en'))}"/>`,
  ].join('\n');

  // One <url> per language version, each advertising all alternates.
  return LOCALES.map(
    (l) => `  <url>
    <loc>${xmlEscape(localizedUrl(e.path, l))}</loc>
${e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>\n` : ''}    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority.toFixed(1)}</priority>
${alternates}
  </url>`
  ).join('\n');
}

function isoDate(v: unknown): string | undefined {
  if (!v) return undefined;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

export async function GET() {
  const [products, brands, partners] = await Promise.all([
    data.listActiveProducts(),
    data.listActiveBrands(),
    data.listActivePartners(),
  ]);

  const entries: Entry[] = [];

  // ---- Static pages -------------------------------------------------
  const staticPages: Array<[string, number, Entry['changefreq']]> = [
    ['', 1.0, 'weekly'],
    ['/products', 0.9, 'daily'],
    ['/parts', 0.9, 'daily'],
    ['/brands', 0.8, 'weekly'],
    ['/aircond-wholesale-malaysia', 0.8, 'monthly'],
    ['/project-supply', 0.8, 'monthly'],
    ['/technical-partners', 0.7, 'weekly'],
    ['/about', 0.6, 'monthly'],
    ['/locations', 0.6, 'monthly'],
    ['/contact', 0.7, 'monthly'],
    ['/faq', 0.7, 'monthly'],
  ];
  for (const [path, priority, changefreq] of staticPages) {
    entries.push({ path, priority, changefreq });
  }

  // ---- Products -----------------------------------------------------
  for (const p of products) {
    entries.push({
      path: `/products/${p.slug}`,
      priority: 0.7,
      changefreq: 'weekly',
      lastmod: isoDate(p.updated_at ?? p.created_at),
    });
  }

  // ---- Brands -------------------------------------------------------
  for (const b of brands) {
    entries.push({
      path: `/brands/${b.slug}`,
      priority: 0.6,
      changefreq: 'weekly',
      lastmod: isoDate(b.updated_at ?? b.created_at),
    });
  }

  // ---- Technical partners -------------------------------------------
  for (const tp of partners) {
    entries.push({ path: `/technical-partners/${tp.slug}`, priority: 0.5, changefreq: 'monthly' });
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.map(urlBlock).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
