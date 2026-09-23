/**
 * /about/awards/[slug] — dedicated award detail page.
 *
 * Has its own SEO metadata (per-language seo_title_* / seo_desc_*, canonical and
 * hreflang alternates) plus Article + ImageObject structured data, so every
 * award can be indexed and shared independently of the About page.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { LOCALES, Locale, t, pickLocalized } from '@/lib/i18n';
import { data } from '@/lib/data';
import { getAllSettings } from '@/lib/settings';
import { buildPageMetadata, absoluteUrl } from '@/lib/seo';
import { breadcrumbSchema, webPageSchema } from '@/lib/schema';
import JsonLd from '@/components/JsonLd';

export async function generateMetadata({ params }: {
    params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
    const { lang: rawLang, slug } = await params;
    const lang: Locale = (LOCALES as readonly string[]).includes(rawLang) ? (rawLang as Locale) : 'en';
    const award = await data.getPublishedAwardBySlug(slug);
    if (!award) {
        return { title: t(lang, 'about.awardsEmpty'), robots: { index: false, follow: true } };
    }
    const s = await getAllSettings();
    const row = award as unknown as Record<string, unknown>;
    const title = pickLocalized(row, 'title', lang) || award.title_en;
    const seoTitle = pickLocalized(row, 'seo_title', lang) || `${title} — ${s.company_name_en}`;
    const seoDesc =
        pickLocalized(row, 'seo_desc', lang) ||
        pickLocalized(row, 'summary', lang) ||
        pickLocalized(row, 'story', lang).slice(0, 160) ||
        `${title} — ${s.company_name_en}`;

    const media = await data.listAwardMedia(award.id);
    const images = (award.cover_image ? [award.cover_image] : [])
        .concat(media.map((m) => m.file_path))
        .filter(Boolean)
        .slice(0, 4);

    return buildPageMetadata({
        lang,
        path: `/${lang}/about/awards/${award.slug}`,
        title: seoTitle,
        description: seoDesc,
        images: images.length ? images : ['/atora-logo.png'],
        type: 'article',
    });
}

export default async function AwardDetailPage({ params }: {
    params: Promise<{ lang: string; slug: string }>;
}) {
    const { lang: rawLang, slug } = await params;
    const lang: Locale = (LOCALES as readonly string[]).includes(rawLang) ? (rawLang as Locale) : 'en';

    const award = await data.getPublishedAwardBySlug(slug);
    if (!award) notFound();

    const s = await getAllSettings();
    const media = await data.listAwardMedia(award.id);
    const row = award as unknown as Record<string, unknown>;

    const title = pickLocalized(row, 'title', lang) || award.title_en;
    const issuer = pickLocalized(row, 'issuer', lang);
    const summary = pickLocalized(row, 'summary', lang);
    const story = pickLocalized(row, 'story', lang) || summary;
    const pagePath = `/${lang}/about/awards/${award.slug}`;

    const images = media
        .map((m) => {
            const mrow = m as unknown as Record<string, unknown>;
            return {
                id: m.id,
                url: m.file_path,
                thumb: m.thumb_path || m.file_path,
                alt: pickLocalized(mrow, 'alt', lang) || pickLocalized(mrow, 'caption', lang) || title,
                caption: pickLocalized(mrow, 'caption', lang),
            };
        });

    const breadcrumb = breadcrumbSchema(pagePath, [
        { name: t(lang, 'nav.home'), url: `/${lang}` },
        { name: t(lang, 'nav.about'), url: `/${lang}/about` },
        { name: t(lang, 'about.awardsTitle'), url: `/${lang}/about#awards` },
        { name: title, url: pagePath },
    ]);

    const page = webPageSchema({
        lang,
        path: pagePath,
        title,
        description: summary || story.slice(0, 160),
        breadcrumbId: `${absoluteUrl(pagePath)}#breadcrumb`,
    });

    // Award/achievement structured data — no invented claims, all values come
    // from the DB row the admin filled in.
    const awardNode: Record<string, unknown> = {
        '@context': 'https://schema.org',
        '@type': 'CreativeWork',
        '@id': `${absoluteUrl(pagePath)}#award`,
        name: title,
        headline: title,
        description: summary || undefined,
        text: story || undefined,
        datePublished: award.award_date || award.year || undefined,
        image: images.map((i) => absoluteUrl(i.url)),
        creator: { '@type': 'Organization', name: s.company_name_en, url: absoluteUrl(`/${lang}`) },
        ...(issuer ? { publisher: { '@type': 'Organization', name: issuer } } : {}),
        ...(issuer ? { sponsor: { '@type': 'Organization', name: issuer } } : {}),
        url: absoluteUrl(pagePath),
        inLanguage: lang,
    };

    return (
        <div className="container-fluid py-8">
            <JsonLd id="award-detail" data={[breadcrumb, awardNode, page]} />

            {/* Breadcrumbs */}
            <nav className="mb-4 text-sm text-gray-500" aria-label="Breadcrumb">
                <Link href={`/${lang}`} className="hover:text-brand-700">{t(lang, 'nav.home')}</Link>
                <span className="mx-2">/</span>
                <Link href={`/${lang}/about`} className="hover:text-brand-700">{t(lang, 'nav.about')}</Link>
                <span className="mx-2">/</span>
                <Link href={`/${lang}/about#awards`} className="hover:text-brand-700">
                    {t(lang, 'about.awardsTitle')}
                </Link>
                <span className="mx-2">/</span>
                <span className="text-brand-700">{title}</span>
            </nav>

            <article className="grid lg:grid-cols-5 gap-8">
                {/* Media */}
                <div className="lg:col-span-2">
                    <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                        {award.cover_image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={award.cover_image}
                                alt={images[0]?.alt || title}
                                className="mx-auto max-h-[60vh] w-auto object-contain"
                            />
                        ) : (
                            <div className="flex h-64 items-center justify-center text-sm text-gray-400">
                                {t(lang, 'about.galleryEmpty')}
                            </div>
                        )}
                    </div>

                    {images.length > 1 && (
                        <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {images.map((m) => (
                                <div key={m.id} className="aspect-square overflow-hidden rounded border border-gray-200 bg-gray-100">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={m.thumb}
                                        alt={m.alt}
                                        loading="lazy"
                                        decoding="async"
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Story */}
                <div className="lg:col-span-3">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                        {award.year && <span className="badge-blue">{award.year}</span>}
                        {award.award_date && <span className="badge-gray">{award.award_date}</span>}
                    </div>

                    <h1 className="heading-1 mb-3">{title}</h1>

                    {issuer && (
                        <p className="mb-5 text-sm text-gray-600">
                            {t(lang, 'about.issuedBy')}: <span className="font-medium text-gray-800">{issuer}</span>
                        </p>
                    )}

                    {summary && (
                        <div className="card mb-6 p-5">
                            <p className="text-gray-700 leading-relaxed">{summary}</p>
                        </div>
                    )}

                    {story && (
                        <>
                            <h2 className="heading-3 mb-3">{t(lang, 'about.awardStoryTitle')}</h2>
                            <div className="whitespace-pre-line text-gray-700 leading-relaxed">{story}</div>
                        </>
                    )}

                    <div className="mt-8 flex flex-wrap gap-2">
                        <Link href={`/${lang}/about#awards`} className="btn-secondary">
                            {t(lang, 'about.awardsTitle')}
                        </Link>
                        <Link href={`/${lang}/contact`} className="btn-primary">
                            {t(lang, 'common.getQuote')}
                        </Link>
                    </div>
                </div>
            </article>
        </div>
    );
}
