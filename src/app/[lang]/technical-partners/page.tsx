/**
 * /technical-partners — search & filter partner directory.
 */
import type { Metadata } from 'next';
import { LOCALES, Locale, t, langAlternates } from '@/lib/i18n';
import { data } from '@/lib/data';
import PartnerCard from '@/components/PartnerCard';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang: rawLang } = await params;
  const lang: Locale = (LOCALES as readonly string[]).includes(rawLang) ? (rawLang as Locale) : 'en';
  return {
    title: `${t(lang, 'partners.pageTitle')} — ATORA`,
    description: t(lang, 'partners.pageSub'),
    alternates: langAlternates(`/${lang}/technical-partners`),
  };
}

const SERVICE_TYPES = [
  'installation', 'repair', 'maintenance', 'electrical',
  'hvac', 'commercial', 'industrial', 'project', 'support', 'other',
];

export default async function PartnersListPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ q?: string; service?: string }>;
}) {
  const { lang: rawLang } = await params;
  const lang: Locale = (LOCALES as readonly string[]).includes(rawLang) ? (rawLang as Locale) : 'en';
  const sp = await searchParams;

  const partners = data.searchPartners({
    q: sp.q,
    serviceType: sp.service,
  });

  return (
    <div className="container-fluid py-8">
      <header className="mb-8">
        <h1 className="heading-1 mb-2">{t(lang, 'partners.pageTitle')}</h1>
        <p className="text-gray-600">{t(lang, 'partners.pageSub')}</p>
      </header>

      <form className="card p-4 mb-6 grid sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2">
          <input
            type="text"
            name="q"
            defaultValue={sp.q}
            placeholder={t(lang, 'partners.searchPlaceholder')}
            className="input"
          />
        </div>
        <select name="service" defaultValue={sp.service ?? ''} className="input">
          <option value="">{t(lang, 'partners.serviceType')}</option>
          {SERVICE_TYPES.map((s) => (
            <option key={s} value={s}>
              {t(lang, `partners.serviceTypes.${s}`)}
            </option>
          ))}
        </select>
        <div className="sm:col-span-3 flex gap-2">
          <button type="submit" className="btn-primary">{t(lang, 'common.search')}</button>
        </div>
      </form>

      {partners.length === 0 ? (
        <div className="card p-12 text-center text-gray-500">{t(lang, 'partners.noResults')}</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {partners.map((p) => (
            <PartnerCard key={p.id} partner={p} lang={lang} />
          ))}
        </div>
      )}
    </div>
  );
}
