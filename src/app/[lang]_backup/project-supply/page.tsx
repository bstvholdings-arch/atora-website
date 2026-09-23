/**
 * /project-supply — commercial project & bulk supply page.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { LOCALES, Locale, t } from '@/lib/i18n';
import { getAllSettings } from '@/lib/settings';
import { buildPageMetadata } from '@/lib/seo';
import { breadcrumbSchema, serviceSchema, webPageSchema } from '@/lib/schema';
import JsonLd from '@/components/JsonLd';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang: rawLang } = await params;
  const lang: Locale = (LOCALES as readonly string[]).includes(rawLang) ? (rawLang as Locale) : 'en';
  return buildPageMetadata({
    lang,
    path: `/${lang}/project-supply`,
    title: `${t(lang, 'projectSupply.pageTitle')} — ATORA`,
    description: t(lang, 'projectSupply.pageSub'),
  });
}

export default async function ProjectSupplyPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: rawLang } = await params;
  const lang: Locale = (LOCALES as readonly string[]).includes(rawLang) ? (rawLang as Locale) : 'en';
  const s = await getAllSettings();
  const served = ['contractors','developers','businesses','offices','shops','restaurants','buildings','projects','bulk'];
  const offered = ['sourcing','brands','quotation','equipment','parts','materials','supply'];

  const jsonLd = [
    breadcrumbSchema(`/${lang}/project-supply`, [
      { name: t(lang, 'nav.home'), url: `/${lang}` },
      { name: t(lang, 'nav.projectSupply'), url: `/${lang}/project-supply` },
    ]),
    serviceSchema({
      settings: s,
      lang,
      path: `/${lang}/project-supply`,
      name: `${t(lang, 'projectSupply.pageTitle')} — ${s.company_name_en}`,
      description: `${s.company_name_en} provides bulk and project aircond supply, sourcing, quotation and parts across Malaysia for contractors, developers and businesses.`,
      serviceType: 'Air conditioner project and bulk supply',
    }),
    webPageSchema({ lang, path: `/${lang}/project-supply`, title: `${t(lang, 'projectSupply.pageTitle')} — ATORA`, description: t(lang, 'projectSupply.pageSub') }),
  ];

  return (
    <div>
      <JsonLd id="project-supply-page" data={jsonLd} />

      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-900 via-brand-700 to-brand-500 text-white">
        <div className="container-fluid py-14">
          <h1 className="heading-1 text-white mb-3">{t(lang, 'projectSupply.pageTitle')}</h1>
          <p className="opacity-90 max-w-3xl">{t(lang, 'projectSupply.pageSub')}</p>
        </div>
      </section>

      <section className="section">
        <div className="container-fluid grid lg:grid-cols-2 gap-12">
          <div>
            <h2 className="heading-2 mb-6">{t(lang, 'projectSupply.whoWeServe')}</h2>
            <ul className="space-y-2">
              {served.map((k) => (
                <li key={k} className="card p-4 flex items-center gap-3">
                  <svg className="w-5 h-5 text-brand-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                  <span className="font-medium text-brand-800">{t(lang, `projectSupply.served.${k}`)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="heading-2 mb-6">{t(lang, 'projectSupply.whatWeOffer')}</h2>
            <ul className="space-y-2">
              {offered.map((k) => (
                <li key={k} className="card p-4 flex items-center gap-3">
                  <svg className="w-5 h-5 text-brand-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                  <span className="font-medium text-brand-800">{t(lang, `projectSupply.offered.${k}`)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="container-fluid mt-10">
          <div className="rounded-lg bg-brand-700 text-white p-8 text-center">
            <p className="text-lg mb-4 opacity-90">{t(lang, 'callForEnquiry')}</p>
            <Link href={`/${lang}/contact?type=project`} className="btn bg-white text-brand-700 hover:bg-brand-50 px-6 py-3 font-semibold">
              {t(lang, 'projectSupply.cta')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
