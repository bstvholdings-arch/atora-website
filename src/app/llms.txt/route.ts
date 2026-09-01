/**
 * /llms.txt — a plain-text, LLM-friendly summary of ATORA.
 *
 * Consumed by AI crawlers / answer engines (ChatGPT, Perplexity, Gemini,
 * Claude, Copilot) that look for a canonical, low-noise description of a site.
 * Every line is generated from the database — nothing is invented.
 */
import { data } from '@/lib/data';
import { getAllSettings } from '@/lib/settings';
import { SITE_URL, absoluteUrl } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export async function GET() {
  const [s, brands, products, locations, faqs, categories, partners] = await Promise.all([
    getAllSettings(),
    data.listActiveBrands(),
    data.listActiveProducts(),
    data.listActiveLocations(),
    data.listActiveFaqs(),
    data.listCategoryGroups(),
    data.listActivePartners(),
  ]);

  const L = (p: string) => absoluteUrl(p);

  const lines: string[] = [];
  lines.push('# ATORA');
  lines.push('');
  lines.push(`> ${s.seo_default_description_en || s.tagline_en}`);
  lines.push('');
  lines.push('ATORA is an independent, multi-brand air conditioner (aircond) wholesale and spare parts supplier based in Malaysia. It serves installers, technicians, contractors, retailers, businesses and project buyers. Sales enquiries are handled by phone, WhatsApp and the website contact form.');
  lines.push('');

  lines.push('## Company facts');
  lines.push(`- Legal name: ${s.company_name_en}`);
  if (s.company_name_zh) lines.push(`- Chinese name: ${s.company_name_zh}`);
  if (s.registration_no) lines.push(`- Malaysia company registration number (SSM): ${s.registration_no}`);
  lines.push(`- Website: ${SITE_URL}`);
  if (s.hq_phone) lines.push(`- Phone: ${s.hq_phone}`);
  if (s.whatsapp_number)
    lines.push(`- WhatsApp: https://wa.me/${s.whatsapp_number.replace(/[^0-9]/g, '')}`);
  if (s.email) lines.push(`- Email: ${s.email}`);
  if (s.hq_address) lines.push(`- Registered / HQ address: ${s.hq_address}`);
  if (s.opening_hours_en) lines.push(`- Business hours: ${s.opening_hours_en}`);
  lines.push('');

  lines.push('## What ATORA supplies');
  for (const c of categories) lines.push(`- ${c.name_en}`);
  lines.push('');

  lines.push('## Brands supplied (independent multi-brand wholesaler)');
  for (const b of brands) {
    const desc = (b.description_en || '').trim();
    lines.push(`- [${b.name_en}](${L(`/en/brands/${b.slug}`)})${desc ? `: ${desc}` : ''}`);
  }
  lines.push('- ATORA is an independent supplier. It does not claim to be an official distributor or authorised dealer of any brand listed above.');
  lines.push('');

  lines.push('## Service coverage');
  lines.push('- Serves customers nationwide across Malaysia.');
  for (const loc of locations) {
    const parts = [loc.city, loc.state].filter(Boolean).join(', ');
    lines.push(`- ${loc.name_en}${parts ? ` (${parts})` : ''}${loc.is_hq === 1 ? ' — headquarters' : ''}`);
  }
  lines.push('');

  if (products.length) {
    lines.push('## Product catalogue (sample of active listings)');
    for (const p of products.slice(0, 50)) {
      const bits = [p.model, p.capacity].filter(Boolean).join(' · ');
      lines.push(`- [${p.name_en}](${L(`/en/products/${p.slug}`)})${bits ? ` — ${bits}` : ''}`);
    }
    lines.push('');
  }

  if (partners.length) {
    lines.push('## Technical partners');
    for (const p of partners) {
      const bits = [p.city, p.state].filter(Boolean).join(', ');
      lines.push(`- [${p.company_name_en}](${L(`/en/technical-partners/${p.slug}`)})${bits ? ` (${bits})` : ''}${p.service_types ? ` — ${p.service_types}` : ''}`);
    }
    lines.push('');
  }

  if (faqs.length) {
    lines.push('## Frequently asked questions');
    for (const f of faqs) {
      lines.push(`- Q: ${f.question_en}`);
      lines.push(`  A: ${f.answer_en.replace(/\s*\n\s*/g, ' ').trim()}`);
    }
    lines.push('');
  }

  lines.push('## Key pages');
  lines.push(`- Homepage: ${L('/en')}`);
  lines.push(`- Air conditioners catalogue: ${L('/en/products')}`);
  lines.push(`- Spare parts: ${L('/en/parts')}`);
  lines.push(`- Brands: ${L('/en/brands')}`);
  lines.push(`- Project & bulk supply: ${L('/en/project-supply')}`);
  lines.push(`- Wholesale aircond supplier in Malaysia: ${L('/en/aircond-wholesale-malaysia')}`);
  lines.push(`- Locations: ${L('/en/locations')}`);
  lines.push(`- Technical partners: ${L('/en/technical-partners')}`);
  lines.push(`- About ATORA: ${L('/en/about')}`);
  lines.push(`- Contact: ${L('/en/contact')}`);
  lines.push(`- FAQ: ${L('/en/faq')}`);
  lines.push(`- Sitemap: ${L('/sitemap.xml')}`);
  lines.push(`- Structured data: JSON-LD (Organization, WebSite, WebPage, BreadcrumbList, Product, Service, FAQPage, LocalBusiness, ItemList, Brand) is embedded on every page.`);
  lines.push('');

  lines.push('## Languages');
  lines.push(`- English: ${L('/en')}`);
  lines.push(`- Bahasa Malaysia: ${L('/bm')}`);
  lines.push(`- Chinese (Simplified): ${L('/zh')}`);
  lines.push('');

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
