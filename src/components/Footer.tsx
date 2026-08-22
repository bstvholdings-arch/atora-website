import Link from 'next/link';
import { Locale, t } from '@/lib/i18n';
import { Brand, Location } from '@/lib/db';

type Props = {
  lang: Locale;
  brands: Brand[];
  locations: Location[];
  company: {
    nameEn: string;
    nameZh: string;
    registrationNo: string;
    hqPhone: string;
    whatsappNumber: string;
    email: string;
    facebook?: string;
    instagram?: string;
    seoDefaultTitleEn: string;
    openingHoursEn: string;
    footerAboutEn: string;
    hqAddress: string;
  };
};

export default function Footer({ lang, brands, locations, company }: Props) {
  return (
    <footer className="bg-brand-900 text-brand-50 mt-12">
      {/* Service Region Strip */}
      <div className="bg-brand-950 py-3 text-center text-xs sm:text-sm">
        <div className="container-fluid">
          <span className="font-semibold tracking-wider">{t(lang, 'footer.serviceArea')}</span>
          <span className="mx-2 opacity-50">·</span>
          <span className="opacity-80">{t(lang, 'footer.serviceAreaBilingual')}</span>
        </div>
      </div>

      <div className="container-fluid py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* About */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white text-brand-700 font-bold">
                A
              </div>
              <div className="leading-tight">
                <div className="font-bold text-white">{t(lang, 'common.companyName')}</div>
                <div className="text-xs opacity-80">{t(lang, 'common.companyNameZh')}</div>
              </div>
            </div>
            <p className="text-sm opacity-80 leading-relaxed">{company.footerAboutEn}</p>
            <p className="text-xs mt-3 opacity-60">
              {t(lang, 'footer.registration')}: {company.registrationNo}
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-white font-semibold mb-3 text-sm">{t(lang, 'footer.quickLinks')}</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href={`/${lang}/products`} className="opacity-80 hover:opacity-100">{t(lang, 'nav.products')}</Link></li>
              <li><Link href={`/${lang}/brands`} className="opacity-80 hover:opacity-100">{t(lang, 'nav.brands')}</Link></li>
              <li><Link href={`/${lang}/parts`} className="opacity-80 hover:opacity-100">{t(lang, 'nav.parts')}</Link></li>
              <li><Link href={`/${lang}/project-supply`} className="opacity-80 hover:opacity-100">{t(lang, 'nav.projectSupply')}</Link></li>
              <li><Link href={`/${lang}/technical-partners`} className="opacity-80 hover:opacity-100">{t(lang, 'nav.partners')}</Link></li>
              <li><Link href={`/${lang}/about`} className="opacity-80 hover:opacity-100">{t(lang, 'nav.about')}</Link></li>
              <li><Link href={`/${lang}/locations`} className="opacity-80 hover:opacity-100">{t(lang, 'nav.locations')}</Link></li>
              <li><Link href={`/${lang}/contact`} className="opacity-80 hover:opacity-100">{t(lang, 'nav.contact')}</Link></li>
              <li><Link href={`/${lang}/faq`} className="opacity-80 hover:opacity-100">{t(lang, 'nav.faq')}</Link></li>
            </ul>
          </div>

          {/* Brands */}
          <div>
            <h3 className="text-white font-semibold mb-3 text-sm">{t(lang, 'footer.brandsHeading')}</h3>
            <ul className="space-y-2 text-sm">
              {brands.slice(0, 9).map((b) => (
                <li key={b.id}>
                  <Link href={`/${lang}/brands/${b.slug}`} className="opacity-80 hover:opacity-100">
                    {b.name_en}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-3 text-sm">{t(lang, 'footer.contactHeading')}</h3>
            <ul className="space-y-2 text-sm">
              <li className="opacity-80"><span className="block text-xs uppercase tracking-wider opacity-60">{t(lang, 'footer.regionsHeading')}</span>Padang Serai · Sungai Petani · Kulim · Kedah · Malaysia</li>
              <li className="opacity-80">Tel: <a href={`tel:${company.hqPhone.replace(/\s/g, '')}`} className="opacity-100">{company.hqPhone}</a></li>
              <li className="opacity-80">WhatsApp: <a href={`https://wa.me/${company.whatsappNumber.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="opacity-100">{company.whatsappNumber}</a></li>
              <li className="opacity-80">Email: <a href={`mailto:${company.email}`} className="opacity-100">{company.email}</a></li>
              <li className="opacity-80"><span className="block text-xs uppercase tracking-wider opacity-60">{t(lang, 'footer.businessHours')}</span>{company.openingHoursEn}</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-brand-700 flex flex-col sm:flex-row justify-between gap-3 text-xs opacity-70">
          <div>{t(lang, 'footer.copyright')}</div>
          <div className="flex gap-4">
            <Link href={`/${lang}/about`} className="opacity-80 hover:opacity-100">{t(lang, 'nav.about')}</Link>
            <Link href={`/${lang}/contact`} className="opacity-80 hover:opacity-100">{t(lang, 'nav.contact')}</Link>
            <span className="opacity-50">·</span>
            <span>REG: {company.registrationNo}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
