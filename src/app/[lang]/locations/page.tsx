/**
 * /locations — all branches and HQ, with LocalBusiness structured data.
 */
import type { Metadata } from 'next';
import { LOCALES, Locale, t } from '@/lib/i18n';
import { data } from '@/lib/data';
import { getAllSettings } from '@/lib/settings';
import { buildPageMetadata } from '@/lib/seo';
import { breadcrumbSchema, localBusinessSchema, serviceSchema, webPageSchema } from '@/lib/schema';
import JsonLd from '@/components/JsonLd';
import LocationCard from '@/components/LocationCard';
export async function generateMetadata({ params }: {
    params: Promise<{
        lang: string;
    }>;
}): Promise<Metadata> {
    let _params = await params;
    const { lang: rawLang } = _params;
    const lang: Locale = (LOCALES as readonly string[]).includes(rawLang) ? (rawLang as Locale) : 'en';
    return buildPageMetadata({
        lang,
        path: `/${lang}/locations`,
        title: `${t(lang, 'locations.pageTitle')} — ATORA`,
        description: t(lang, 'locations.pageSub'),
    });
}
export default async function LocationsPage({ params }: {
    params: Promise<{
        lang: string;
    }>;
}) {
    let _params = await params;
    const { lang: rawLang } = _params;
    const lang: Locale = (LOCALES as readonly string[]).includes(rawLang) ? (rawLang as Locale) : 'en';
    const s = await getAllSettings();
    const locations = await data.listActiveLocations();
    const hq = locations.find((l) => l.is_hq === 1);
    const branches = locations.filter((l) => l.is_hq !== 1);
    const jsonLd = [
        breadcrumbSchema(`/${lang}/locations`, [
            { name: t(lang, 'nav.home'), url: `/${lang}` },
            { name: t(lang, 'nav.locations'), url: `/${lang}/locations` },
        ]),
        // Each DB location becomes a LocalBusiness node (nationwide service).
        ...locations.map((loc) => localBusinessSchema(loc, s)),
        // Nationwide aircond wholesale & parts supply service.
        serviceSchema({
            settings: s,
            lang,
            path: `/${lang}/locations`,
            name: `${t(lang, 'serviceNationwide')} — ${s.company_name_en}`,
            description: `${s.company_name_en} supplies air conditioners, spare parts and accessories to installers, contractors and businesses across Malaysia.`,
            serviceType: 'Air conditioner wholesale and parts supply',
        }),
        webPageSchema({ lang, path: `/${lang}/locations`, title: `${t(lang, 'locations.pageTitle')} — ATORA`, description: t(lang, 'locations.pageSub') }),
    ];
    return (<div>
      <JsonLd id="locations-page" data={jsonLd} />

      <section className="bg-gradient-to-br from-brand-900 via-brand-700 to-brand-500 text-white">
        <div className="container-fluid py-14">
          <h1 className="heading-1 text-white mb-3">{t(lang, 'locations.pageTitle')}</h1>
          <p className="opacity-90 max-w-3xl">{t(lang, 'locations.pageSub')}</p>
        </div>
      </section>

      <section className="section">
        <div className="container-fluid">
          <div className="rounded-lg bg-brand-50 p-4 mb-8 text-center text-sm text-brand-800">
            <span className="font-bold">{t(lang, 'serviceNationwide')}</span>
          </div>

          {hq && (<>
              <h2 className="heading-2 mb-4">{t(lang, 'locations.hq')}</h2>
              <div className="grid md:grid-cols-2 gap-6 mb-10">
                <LocationCard location={hq} lang={lang}/>
                {hq.google_maps_url && (<div className="rounded-lg overflow-hidden border border-gray-200 min-h-[300px]">
                    <iframe src={`https://www.google.com/maps?q=${encodeURIComponent(hq.address ?? '')}&output=embed`} className="w-full h-full min-h-[300px]" loading="lazy" title={`Map — ${hq.name_en}`}/>
                  </div>)}
              </div>
            </>)}

          {branches.length > 0 && (<>
              <h2 className="heading-2 mb-4">{t(lang, 'locations.branch')}</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {branches.map((loc) => (<LocationCard key={loc.id} location={loc} lang={lang}/>))}
              </div>
            </>)}
        </div>
      </section>
    </div>);
}
