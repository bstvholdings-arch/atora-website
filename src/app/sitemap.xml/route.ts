/**
 * /sitemap.xml — auto-generated XML sitemap of all public pages.
 * Reads products / brands / partners / locations from the DB.
 */
import { data } from '@/lib/data';
import { LOCALES } from '@/lib/i18n';

export async function GET() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const now = new Date().toISOString();

  const urls: Array<{ loc: string; lastmod?: string; priority?: number; changefreq?: string }> = [];

  for (const lang of LOCALES) {
    // Static pages
    const staticPaths = ['', '/products', '/brands', '/parts', '/project-supply', '/technical-partners', '/about', '/locations', '/contact', '/faq'];
    for (const p of staticPaths) {
      urls.push({ loc: `${base}/${lang}${p}`, lastmod: now, priority: p === '' ? 1.0 : 0.8, changefreq: 'weekly' });
    }

    // Products
    for (const p of data.listActiveProducts()) {
      urls.push({ loc: `${base}/${lang}/products/${p.slug}`, lastmod: now, priority: 0.7, changefreq: 'weekly' });
    }

    // Brands
    for (const b of data.listActiveBrands()) {
      urls.push({ loc: `${base}/${lang}/brands/${b.slug}`, lastmod: now, priority: 0.6, changefreq: 'weekly' });
    }

    // Partners
    for (const tp of data.listActivePartners()) {
      urls.push({ loc: `${base}/${lang}/technical-partners/${tp.slug}`, lastmod: now, priority: 0.5, changefreq: 'monthly' });
    }
  }

  // English homepage gets highest priority
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}${u.changefreq ? `\n    <changefreq>${u.changefreq}</changefreq>` : ''}${u.priority != null ? `\n    <priority>${u.priority.toFixed(1)}</priority>` : ''}
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
