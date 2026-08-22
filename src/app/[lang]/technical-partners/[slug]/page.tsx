/**
 * /technical-partners/[slug] — individual partner page with privacy controls.
 */
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { LOCALES, Locale, t, langAlternates } from '@/lib/i18n';
import { data } from '@/lib/data';
import { pickLocalized } from '@/lib/i18n';
import { buildDirectionsUrl } from '@/lib/formatters';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang: rawLang, slug } = await params;
  const lang: Locale = (LOCALES as readonly string[]).includes(rawLang) ? (rawLang as Locale) : 'en';
  const partner = data.getPartnerBySlug(slug);
  if (!partner) return { title: 'Partner — ATORA' };
  const name = partner.company_name_en;
  const desc = pickLocalized(partner as unknown as Record<string, unknown>, 'description', lang) || partner.description_en;
  return {
    title: `${name} — ATORA Partners`,
    description: desc ?? `${name} — Technical partner of ATORA.`,
    alternates: langAlternates(`/${lang}/technical-partners/${partner.slug}`),
  };
}

export default async function PartnerDetailPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang: rawLang, slug } = await params;
  const lang: Locale = (LOCALES as readonly string[]).includes(rawLang) ? (rawLang as Locale) : 'en';
  const partner = data.getPartnerBySlug(slug);
  if (!partner) notFound();

  const name = partner.company_name_en;
  const desc = pickLocalized(partner as unknown as Record<string, unknown>, 'description', lang) || partner.description_en;
  const serviceTypes = (partner.service_types ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  const directions = buildDirectionsUrl({
    placeId: null,
    address: partner.address ?? null,
    latitude: null,
    longitude: null,
  });

  return (
    <div className="container-fluid py-8">
      <nav className="text-sm text-gray-500 mb-4">
        <Link href={`/${lang}`} className="hover:text-brand-700">{t(lang, 'nav.home')}</Link>
        <span className="mx-2">/</span>
        <Link href={`/${lang}/technical-partners`} className="hover:text-brand-700">{t(lang, 'nav.partners')}</Link>
        <span className="mx-2">/</span>
        <span className="text-brand-700">{name}</span>
      </nav>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="card p-6 sm:p-8 flex items-start gap-5 mb-6">
            {partner.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={partner.logo_url} alt={name} className="h-20 w-20 object-contain rounded-md border border-gray-100 bg-white" />
            ) : (
              <div className="h-20 w-20 rounded-md bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-3xl">
                {name.charAt(0)}
              </div>
            )}
            <div className="flex-1">
              <h1 className="heading-2 mb-2">{name}</h1>
              {partner.contact_person && (
                <p className="text-sm text-gray-600">Contact: {partner.contact_person}</p>
              )}
              {partner.service_area && (
                <p className="text-sm text-gray-500 mt-1">{t(lang, 'partners.serviceArea')}: {partner.service_area}</p>
              )}
              {serviceTypes.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {serviceTypes.map((s) => (
                    <span key={s} className="badge-blue">{t(lang, `partners.serviceTypes.${s}`) || s}</span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {desc && (
            <div className="card p-6 mb-6">
              <h3 className="heading-3 mb-3">Description</h3>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">{desc}</p>
            </div>
          )}

          {partner.photo_url && (
            <div className="card overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={partner.photo_url} alt={name} className="w-full h-auto" />
            </div>
          )}
        </div>

        <aside>
          <div className="card p-5 sticky top-32">
            <h3 className="font-semibold text-brand-800 mb-4">Contact</h3>
            <ul className="space-y-3 text-sm">
              {partner.show_phone === 1 && partner.telephone && (
                <li>
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Phone</div>
                  <a href={`tel:${partner.telephone.replace(/\s/g, '')}`} className="font-medium text-brand-700">📞 {partner.telephone}</a>
                </li>
              )}
              {partner.show_whatsapp === 1 && partner.whatsapp && (
                <li>
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">WhatsApp</div>
                  <a
                    href={`https://wa.me/${partner.whatsapp.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-brand-700"
                  >
                    💬 {partner.whatsapp}
                  </a>
                </li>
              )}
              {partner.show_email === 1 && partner.email && (
                <li>
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Email</div>
                  <a href={`mailto:${partner.email}`} className="font-medium text-brand-700 break-all">✉ {partner.email}</a>
                </li>
              )}
              {partner.show_address === 1 && partner.address && (
                <li>
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Address</div>
                  <div className="text-gray-700">{partner.address}{partner.city ? `, ${partner.city}` : ''}{partner.state ? `, ${partner.state}` : ''}</div>
                </li>
              )}
              {partner.show_website === 1 && partner.website && (
                <li>
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Website</div>
                  <a href={partner.website} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-700 break-all">{partner.website}</a>
                </li>
              )}
            </ul>

            <div className="mt-5 space-y-2">
              {partner.telephone && (
                <a href={`tel:${partner.telephone.replace(/\s/g, '')}`} className="btn-primary w-full">{t(lang, 'common.callNow')}</a>
              )}
              {partner.whatsapp && (
                <a
                  href={`https://wa.me/${partner.whatsapp.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-whatsapp w-full"
                >
                  WhatsApp
                </a>
              )}
              {partner.show_website === 1 && partner.website && (
                <a href={partner.website} target="_blank" rel="noopener noreferrer" className="btn-secondary w-full">Visit Website</a>
              )}
              {directions && (
                <a href={directions} target="_blank" rel="noopener noreferrer" className="btn-secondary w-full">{t(lang, 'locations.directions')}</a>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
