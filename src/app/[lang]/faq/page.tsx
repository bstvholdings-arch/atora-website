/**
 * /faq — list all FAQs in the user's language.
 */
import type { Metadata } from 'next';
import { LOCALES, Locale, t, langAlternates } from '@/lib/i18n';
import { data } from '@/lib/data';
import { pickLocalized } from '@/lib/i18n';
export async function generateMetadata({ params }: {
    params: Promise<{
        lang: string;
    }>;
}): Promise<Metadata> {
    let _params = await params;
    const { lang: rawLang } = _params;
    const lang: Locale = (LOCALES as readonly string[]).includes(rawLang) ? (rawLang as Locale) : 'en';
    return {
        title: `${t(lang, 'faq.pageTitle')} — ATORA`,
        description: t(lang, 'faq.pageSub'),
        alternates: langAlternates(`/${lang}/faq`),
    };
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
    return (<div className="container-fluid py-8 max-w-4xl">
      <header className="mb-8">
        <h1 className="heading-1 mb-2">{t(lang, 'faq.pageTitle')}</h1>
        <p className="text-gray-600">{t(lang, 'faq.pageSub')}</p>
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

      {/* FAQ Schema structured data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{
            __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'FAQPage',
                mainEntity: faqs.map((f) => ({
                    '@type': 'Question',
                    name: pickLocalized(f as unknown as Record<string, unknown>, 'question', lang) || f.question_en,
                    acceptedAnswer: {
                        '@type': 'Answer',
                        text: pickLocalized(f as unknown as Record<string, unknown>, 'answer', lang) || f.answer_en,
                    },
                })),
            }),
        }}/>
    </div>);
}
