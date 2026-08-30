/**
 * /about — about us page.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { LOCALES, Locale, t, langAlternates, pickLocalized } from '@/lib/i18n';
import { getAllSettings } from '@/lib/settings';
import { data } from '@/lib/data';
export async function generateMetadata({ params }: {
    params: Promise<{
        lang: string;
    }>;
}): Promise<Metadata> {
    let _params = await params;
    const { lang: rawLang } = _params;
    const lang: Locale = (LOCALES as readonly string[]).includes(rawLang) ? (rawLang as Locale) : 'en';
    return {
        title: `${t(lang, 'about.pageTitle')} — ATORA`,
        description: t(lang, 'about.pageSub'),
        alternates: langAlternates(`/${lang}/about`),
    };
}
export default async function AboutPage({ params }: {
    params: Promise<{
        lang: string;
    }>;
}) {
    let _params = await params;
    const { lang: rawLang } = _params;
    const lang: Locale = (LOCALES as readonly string[]).includes(rawLang) ? (rawLang as Locale) : 'en';
    const s = await getAllSettings();
    const story = await data.getAboutStory();
    const photos = await data.listAboutPhotos();
    const served = ['installers', 'technicians', 'contractors', 'retailers', 'commercial', 'project', 'bulk'];
    return (<div>
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

      {/* Photo gallery — cover (is_primary) shown first */}
      {photos.length > 0 && (
        <section className="section">
          <div className="container-fluid">
            <h2 className="heading-2 mb-6 text-center">
              {lang === 'zh' ? '我们的相册' : lang === 'bm' ? 'Galeri Kami' : 'Our Gallery'}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {photos.map((ph) => (
                <div key={ph.id} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={ph.url} alt={ph.alt_text ?? ''} className="object-cover w-full h-full" />
                  {ph.is_primary === 1 && (
                    <span className="absolute top-2 left-2 badge-green">Cover</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>);
}
