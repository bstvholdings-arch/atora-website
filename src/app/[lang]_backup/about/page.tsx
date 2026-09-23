/**
 * /about — About Us page.
 *
 * Sections:
 *  1. Hero + company facts (from site_settings)
 *  2. Who we are / What we supply / Who we serve
 *  3. Our Story (rich text, managed in /admin/about)
 *  4. Awards & medals — Grid / Timeline with a story modal (AwardsSection)
 *  5. Activity & award photo wall — masonry + lightbox (PhotoWall)
 *  6. Comment board — moderated messages & testimonials (CommentBoard)
 *
 * All three new modules are tri-lingual: the DB stores <field>_en / _bm / _zh and
 * this server component resolves the active locale before handing plain strings
 * to the client components, so switching language swaps every string, alt text
 * and SEO tag.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { LOCALES, Locale, t, pickLocalized } from '@/lib/i18n';
import { getAllSettings } from '@/lib/settings';
import { data } from '@/lib/data';
import { buildPageMetadata } from '@/lib/seo';
import { breadcrumbSchema, itemListSchema, webPageSchema } from '@/lib/schema';
import { recaptchaSiteKey } from '@/lib/security';
import JsonLd from '@/components/JsonLd';
import AwardsSection, { type AwardView } from '@/components/about/AwardsSection';
import PhotoWall, { type PhotoView } from '@/components/about/PhotoWall';
import CommentBoard, { type CommentLabels, type PublicCommentView } from '@/components/about/CommentBoard';

const COMMENTS_PER_PAGE = 6;

export async function generateMetadata({ params }: {
    params: Promise<{
        lang: string;
    }>;
}): Promise<Metadata> {
    const _params = await params;
    const { lang: rawLang } = _params;
    const lang: Locale = (LOCALES as readonly string[]).includes(rawLang) ? (rawLang as Locale) : 'en';
    const s = await getAllSettings();

    // Prefer a settings-driven description so the SEO copy stays editable in the
    // admin panel; fall back to the localised UI string.
    const description =
        (lang === 'zh' ? s.seo_default_description_zh : lang === 'bm' ? s.seo_default_description_bm : s.seo_default_description_en) ||
        t(lang, 'about.pageSub');
    const title = `${t(lang, 'about.pageTitle')} — ${s.company_name_en}`;

    return buildPageMetadata({
        lang,
        path: `/${lang}/about`,
        title,
        description,
        images: ['/atora-logo.png'],
    });
}

export default async function AboutPage({ params }: {
    params: Promise<{
        lang: string;
    }>;
}) {
    const _params = await params;
    const { lang: rawLang } = _params;
    const lang: Locale = (LOCALES as readonly string[]).includes(rawLang) ? (rawLang as Locale) : 'en';

    const s = await getAllSettings();
    const [story, legacyPhotos, awards, awardMedia, gallery, comments, commentTotal] = await Promise.all([
        data.getAboutStory(),
        data.listAboutPhotos(),
        data.listPublishedAwards(),
        data.listAllAwardMedia(),
        data.listPublishedGallery(),
        data.listApprovedComments({ page: 1, perPage: COMMENTS_PER_PAGE, order: 'newest' }),
        data.countApprovedComments(),
    ]);

    const served = ['installers', 'technicians', 'contractors', 'retailers', 'commercial', 'project', 'bulk'];

    /* ---------- Localise the awards ---------- */
    const awardViews: AwardView[] = awards.map((a) => {
        const row = a as unknown as Record<string, unknown>;
        const media = awardMedia
            .filter((m) => m.award_id === a.id)
            .map((m) => {
                const mrow = m as unknown as Record<string, unknown>;
                return {
                    id: m.id,
                    url: m.file_path,
                    thumb: m.thumb_path || m.file_path,
                    alt: pickLocalized(mrow, 'alt', lang) || pickLocalized(mrow, 'caption', lang) || a.title_en,
                    caption: pickLocalized(mrow, 'caption', lang),
                };
            });
        return {
            id: a.id,
            slug: a.slug,
            year: a.year,
            award_date: a.award_date,
            title: pickLocalized(row, 'title', lang) || a.title_en,
            issuer: pickLocalized(row, 'issuer', lang),
            summary: pickLocalized(row, 'summary', lang),
            story: pickLocalized(row, 'story', lang),
            cover: a.cover_image,
            coverThumb: a.cover_thumb,
            media,
        };
    });

    /* ---------- Localise the photo wall ----------
     * Falls back to the legacy about_gallery rows (single-language alt text) when
     * the new tri-lingual gallery module has not been populated yet. */
    const photoViews: PhotoView[] = gallery.length
        ? gallery.map((p) => {
              const row = p as unknown as Record<string, unknown>;
              return {
                  id: p.id,
                  title: pickLocalized(row, 'title', lang),
                  caption: pickLocalized(row, 'caption', lang),
                  alt: pickLocalized(row, 'alt', lang) || pickLocalized(row, 'title', lang) || p.event_name || '',
                  year: p.year,
                  eventName: p.event_name,
                  thumb: p.thumb_path || p.file_path,
                  full: p.file_path,
              };
          })
        : legacyPhotos.map((p) => ({
              id: p.id,
              title: '',
              caption: '',
              alt: p.alt_text ?? '',
              year: null,
              eventName: null,
              thumb: p.url,
              full: p.url,
          }));

    /* ---------- Localise the comments ---------- */
    const commentViews: PublicCommentView[] = comments.map((c) => ({
        id: c.id,
        name: c.name,
        message: c.message,
        rating: c.rating,
        awardTitle:
            (lang === 'zh' ? c.award_title_zh : lang === 'bm' ? c.award_title_bm : c.award_title_en) ||
            c.award_title_en ||
            null,
        createdAt: c.created_at,
    }));

    const awardOptions = awardViews.map((a) => ({ id: a.id, title: a.title }));

    const awardLabels = {
        title: t(lang, 'about.awardsTitle'),
        sub: t(lang, 'about.awardsSub'),
        viewGrid: t(lang, 'about.viewGrid'),
        viewTimeline: t(lang, 'about.viewTimeline'),
        readStory: t(lang, 'about.readStory'),
        issuedBy: t(lang, 'about.issuedBy'),
        close: t(lang, 'about.close'),
        openFullPage: t(lang, 'about.openFullPage'),
        storyTitle: t(lang, 'about.awardStoryTitle'),
        empty: t(lang, 'about.awardsEmpty'),
    };

    const wallLabels = {
        title: t(lang, 'about.galleryTitle'),
        sub: t(lang, 'about.gallerySub'),
        empty: t(lang, 'about.galleryEmpty'),
        photoCount: t(lang, 'about.photoCountLabel'),
        close: t(lang, 'about.close'),
        previous: t(lang, 'common.previous'),
        next: t(lang, 'common.next'),
    };

    const commentLabels: CommentLabels = {
        title: t(lang, 'about.commentsTitle'),
        sub: t(lang, 'about.commentsSub'),
        formName: t(lang, 'about.commentsFormName'),
        formEmail: t(lang, 'about.commentsFormEmail'),
        formPhone: t(lang, 'about.commentsFormPhone'),
        formMessage: t(lang, 'about.commentsFormMessage'),
        formRating: t(lang, 'about.commentsFormRating'),
        formAward: t(lang, 'about.commentsFormAward'),
        formAwardNone: t(lang, 'about.commentsFormAwardNone'),
        formSubmit: t(lang, 'about.commentsFormSubmit'),
        formPrivacy: t(lang, 'about.commentsFormPrivacy'),
        success: t(lang, 'about.commentsSuccess'),
        error: t(lang, 'about.commentsError'),
        rateLimited: t(lang, 'about.commentsRateLimited'),
        errName: t(lang, 'about.commentsErrName'),
        errMessage: t(lang, 'about.commentsErrMessage'),
        errEmail: t(lang, 'about.commentsErrEmail'),
        errPhone: t(lang, 'about.commentsErrPhone'),
        errCaptcha: t(lang, 'about.commentsErrCaptcha'),
        listTitle: t(lang, 'about.commentsListTitle'),
        empty: t(lang, 'about.commentsEmpty'),
        sortNewest: t(lang, 'about.commentsSortNewest'),
        sortOldest: t(lang, 'about.commentsSortOldest'),
        prev: t(lang, 'about.commentsPrev'),
        next: t(lang, 'about.commentsNext'),
        pageOf: t(lang, 'about.commentsPageOf'),
    };

    const pageTitle = `${t(lang, 'about.pageTitle')} — ${s.company_name_en}`;
    const pagePath = `/${lang}/about`;

    const jsonLd: Record<string, unknown>[] = [
        breadcrumbSchema(pagePath, [
            { name: t(lang, 'nav.home'), url: `/${lang}` },
            { name: t(lang, 'nav.about'), url: pagePath },
        ]),
        webPageSchema({ lang, path: pagePath, title: pageTitle, description: t(lang, 'about.pageSub') }),
    ];
    if (awardViews.length > 0) {
        jsonLd.push(
            itemListSchema({
                path: pagePath,
                name: t(lang, 'about.awardsTitle'),
                items: awardViews.map((a) => ({
                    name: a.title,
                    url: `/${lang}/about/awards/${a.slug}`,
                    image: a.coverThumb || a.cover || null,
                })),
            })
        );
    }

    return (<div>
      <JsonLd id="about-page" data={jsonLd} />

      <section className="bg-gradient-to-br from-brand-900 via-brand-700 to-brand-500 text-white">
        <div className="container-fluid py-14">
          <h1 className="heading-1 text-white mb-3">{t(lang, 'about.pageTitle')}</h1>
          <p className="opacity-90 max-w-3xl text-lg">{t(lang, 'about.pageSub')}</p>
        </div>
      </section>

      <section className="section">
        <div className="container-fluid grid lg:grid-cols-2 gap-12">
          <div>
            <h2 className="heading-2 mb-4">{t(lang, 'about.who')}</h2>
            <div className="card p-6">
              <p className="font-bold text-brand-800 text-lg mb-2">{s.company_name_en}</p>
              <p className="text-gray-600 text-sm mb-1">{s.company_name_zh}</p>
              <p className="text-gray-500 text-xs">{t(lang, 'footer.registration')}: {s.registration_no}</p>
            </div>
            <p className="text-gray-700 mt-4 leading-relaxed">
              {lang === 'zh'
            ? '我们是一家专业冷气批发与零件供应商，致力于为安装商、维修商、承包商及商业客户提供高质量产品与专业服务。我们的业务覆盖全马来西亚，分店位于马来西亚北部吉打州。'
            : lang === 'bm'
                ? 'Kami adalah pembekal borong dan alat ganti penyaman udara profesional yang berdedikasi untuk menyediakan produk berkualiti tinggi dan perkhidmatan profesional kepada pemasang, juruteknik, kontraktor dan pelanggan komersial. Kami melayani pelanggan di seluruh Malaysia dengan cawangan di Kedah, utara Malaysia.'
                : 'We are a professional aircond wholesale and parts supplier, dedicated to providing high-quality products and professional services to installers, technicians, contractors, and commercial customers across Malaysia. With branches in Kedah, northern Malaysia, we serve customers nationwide.'}
            </p>
          </div>

          <div>
            <h2 className="heading-2 mb-4">{t(lang, 'about.supply')}</h2>
            <div className="card p-6">
              <ul className="space-y-2 text-gray-700">
                <li>• {lang === 'zh' ? '冷气机' : lang === 'bm' ? 'Penyaman udara' : 'Air Conditioners'}</li>
                <li>• {lang === 'zh' ? '冷气零件' : lang === 'bm' ? 'Alat ganti aircond' : 'Aircond Parts'}</li>
                <li>• {lang === 'zh' ? '备件' : lang === 'bm' ? 'Alat ganti' : 'Spare Parts'}</li>
                <li>• {lang === 'zh' ? '配件' : lang === 'bm' ? 'Aksesori' : 'Accessories'}</li>
                <li>• {lang === 'zh' ? '安装材料' : lang === 'bm' ? 'Bahan pemasangan' : 'Installation Materials'}</li>
                <li>• {lang === 'zh' ? '电气元件' : lang === 'bm' ? 'Komponen elektrik' : 'Electrical Components'}</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="container-fluid mt-10">
          <h2 className="heading-2 mb-6">{t(lang, 'about.serve')}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {served.map((k) => (<div key={k} className="card p-5 text-center">
                <div className="font-medium text-brand-700">{t(lang, `about.served.${k}`)}</div>
              </div>))}
          </div>

          <div className="text-center mt-10">
            <Link href={`/${lang}/contact`} className="btn-primary">{t(lang, 'common.getQuote')}</Link>
          </div>
        </div>
      </section>

      {/* Our Story — managed from the admin About page */}
      {story && (() => {
        const storyTitle =
          (pickLocalized(story as unknown as Record<string, unknown>, 'title', lang) as string | null) ||
          story.title_en;
        const storyBody =
          (pickLocalized(story as unknown as Record<string, unknown>, 'body', lang) as string | null) ||
          story.body_en;
        if (!storyTitle && !storyBody) return null;
        return (
          <section className="section bg-gray-50/50">
            <div className="container-fluid max-w-4xl">
              <h2 className="heading-2 mb-6 text-center">
                {storyTitle || (lang === 'zh' ? '我们的故事' : lang === 'bm' ? 'Kisah Kami' : 'Our Story')}
              </h2>
              {storyBody && (
                <div
                  className="rte-content text-gray-700 leading-relaxed text-base"
                  dangerouslySetInnerHTML={{ __html: storyBody }}
                />
              )}
            </div>
          </section>
        );
      })()}

      {/* Awards & medals — Grid / Timeline with a story modal */}
      <AwardsSection awards={awardViews} labels={awardLabels} lang={lang} />

      {/* Activity & award photo wall — masonry + lightbox */}
      <PhotoWall photos={photoViews} labels={wallLabels} />

      {/* Comment board — moderated visitor messages */}
      <CommentBoard
        lang={lang}
        labels={commentLabels}
        awards={awardOptions}
        initialComments={commentViews}
        initialTotal={commentTotal}
        perPage={COMMENTS_PER_PAGE}
        recaptchaSiteKey={recaptchaSiteKey()}
      />
    </div>);
}
