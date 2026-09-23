/**
 * /faq — list all FAQs in the user's language, with FAQPage structured data.
 */
import type { Metadata } from 'next';
import { LOCALES, Locale, t, pickLocalized } from '@/lib/i18n';
import { data } from '@/lib/data';
import { buildPageMetadata } from '@/lib/seo';
import { breadcrumbSchema, faqSchema, webPageSchema } from '@/lib/schema';
import JsonLd from '@/components/JsonLd';
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
        path: `/${lang}/faq`,
        title: `${t(lang, 'faq.pageTitle')} — ATORA`,
        description: t(lang, 'faq.pageSub'),
    });
}
export default async function FaqPage({ params }: {
    params: Promise<{
        lang: string;
    }>;
}) {
    let _params = await params;
    const { lang: rawLang } = _params;
    const lang: Locale = (LOCALES as readonly string[]).includes(rawLang) ? (rawLang as Locale) : 'en';
    const faqs = await data.listActiveFaqs();
    const jsonLd = [
        breadcrumbSchema(`/${lang}/faq`, [
            { name: t(lang, 'nav.home'), url: `/${lang}` },
            { name: t(lang, 'nav.faq'), url: `/${lang}/faq` },
        ]),
        // Escaped through JsonLd to prevent </script> breakouts from DB content.
        faqSchema(faqs, lang),
        webPageSchema({ lang, path: `/${lang}/faq`, title: `${t(lang, 'faq.pageTitle')} — ATORA`, description: t(lang, 'faq.pageSub') }),
    ];
    return (<div className="container-fluid py-8 max-w-4xl">
      <JsonLd id="faq-page" data={jsonLd} />

      <header className="mb-8">
        <h1 className="heading-1 mb-2">{t(lang, 'faq.pageTitle')}</h1>
        <p className="text-gray-600">{t(lang, 'faq.pageSub')}</p>
        <p className="mt-4 text-sm text-gray-500">
          {lang === 'zh'
            ? 'ATORA 是一家覆盖全马来西亚的多品牌冷气批发与零部件供应商，以下为安装商、承包商及商业客户最常咨询的问题。'
            : lang === 'bm'
              ? 'ATORA ialah pembekal borong penyaman udara pelbagai jenama yang berkhidmat di seluruh Malaysia. Berikut ialah soalan lazim daripada pemasang, kontraktor dan pelanggan komersial.'
              : 'ATORA is a multi-brand aircond wholesale and parts supplier serving customers across Malaysia. Below are the most common questions from installers, contractors and commercial customers.'}
        </p>
      </header>

      {faqs.length === 0 ? (<div className="card p-12 text-center text-gray-500">—</div>) : (<div className="space-y-3">
          {faqs.map((f) => {
                const q = pickLocalized(f as unknown as Record<string, unknown>, 'question', lang) || f.question_en;
                const a = pickLocalized(f as unknown as Record<string, unknown>, 'answer', lang) || f.answer_en;
                return (<details key={f.id} className="card p-5 group">
                <summary className="font-semibold text-brand-800 cursor-pointer flex items-center justify-between gap-3">
                  <span>{q}</span>
                  <svg className="w-5 h-5 transition group-open:rotate-180 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
                </summary>
                <p className="mt-4 text-gray-600 leading-relaxed">{a}</p>
              </details>);
            })}
        </div>)}
    </div>);
}
