/**
 * /contact — public contact form (also saves to DB).
 */
import type { Metadata } from 'next';
import { LOCALES, Locale, t } from '@/lib/i18n';
import { getAllSettings } from '@/lib/settings';
import { buildPageMetadata } from '@/lib/seo';
import { breadcrumbSchema, webPageSchema } from '@/lib/schema';
import JsonLd from '@/components/JsonLd';
import ContactForm from '@/components/ContactForm';
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
        path: `/${lang}/contact`,
        title: `${t(lang, 'contact.pageTitle')} — ATORA`,
        description: t(lang, 'contact.pageSub'),
    });
}
export default async function ContactPage({ params, searchParams, }: {
    params: Promise<{
        lang: string;
    }>;
    searchParams: Promise<{
        type?: string;
        product?: string;
    }>;
}) {
    let _searchParams = await searchParams;
    let _params = await params;
    const { lang: rawLang } = _params;
    const lang: Locale = (LOCALES as readonly string[]).includes(rawLang) ? (rawLang as Locale) : 'en';
    const sp = _searchParams;
    const s = await getAllSettings();
    const jsonLd = [
        breadcrumbSchema(`/${lang}/contact`, [
            { name: t(lang, 'nav.home'), url: `/${lang}` },
            { name: t(lang, 'nav.contact'), url: `/${lang}/contact` },
        ]),
        webPageSchema({ lang, path: `/${lang}/contact`, title: `${t(lang, 'contact.pageTitle')} — ATORA`, description: t(lang, 'contact.pageSub') }),
    ];
    return (<div className="container-fluid py-8">
      <JsonLd id="contact-page" data={jsonLd} />

      <header className="mb-8">
        <h1 className="heading-1 mb-2">{t(lang, 'contact.pageTitle')}</h1>
        <p className="text-gray-600">{t(lang, 'contact.pageSub')}</p>
      </header>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <ContactForm lang={lang} initialType={sp.type ?? 'general'} initialProduct={sp.product ?? ''}/>
        </div>

        <aside>
          <div className="card p-6 sticky top-32 space-y-4">
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{t(lang, 'footer.contactHeading')}</div>
              <h3 className="font-bold text-brand-800 text-lg">{s.company_name_en}</h3>
              <p className="text-xs text-gray-500">{s.company_name_zh}</p>
            </div>

            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Phone</div>
              <a href={`tel:${s.hq_phone.replace(/\s/g, '')}`} className="font-medium text-brand-700">📞 {s.hq_phone}</a>
            </div>

            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">WhatsApp</div>
              <a href={`https://wa.me/${s.whatsapp_number.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-700">
                💬 {s.whatsapp_number}
              </a>
            </div>

            {s.email && (<div>
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Email</div>
                <a href={`mailto:${s.email}`} className="font-medium text-brand-700 break-all text-sm">✉ {s.email}</a>
              </div>)}

            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{t(lang, 'footer.businessHours')}</div>
              <div className="text-sm text-gray-700">{s.opening_hours_en}</div>
            </div>

            <div className="pt-3 border-t border-gray-100">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">{t(lang, 'serviceNationwide')}</div>
              <div className="flex flex-wrap gap-1">
                {['Padang Serai', 'Sungai Petani', 'Kulim', 'Kedah', 'Malaysia'].map((loc) => (<span key={loc} className="badge-blue">{loc}</span>))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>);
}
