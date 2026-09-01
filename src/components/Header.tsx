'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import LanguageSwitcher from './LanguageSwitcher';
import { Locale, t } from '@/lib/i18n';

type Props = {
  lang: Locale;
  whatsappNumber: string;
  companyNameEn: string;
  companyNameZh: string;
};

export default function Header({ lang, whatsappNumber, companyNameEn, companyNameZh }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const nav = [
    { key: 'home', href: `/${lang}` },
    { key: 'products', href: `/${lang}/products` },
    { key: 'brands', href: `/${lang}/brands` },
    { key: 'parts', href: `/${lang}/parts` },
    { key: 'projectSupply', href: `/${lang}/project-supply` },
    { key: 'partners', href: `/${lang}/technical-partners` },
    { key: 'about', href: `/${lang}/about` },
    { key: 'locations', href: `/${lang}/locations` },
    { key: 'serviceArea', href: `/${lang}/service-area` },
    { key: 'contact', href: `/${lang}/contact` },
  ];

  const isActive = (href: string) =>
    href === `/${lang}` ? pathname === `/${lang}` : pathname?.startsWith(href);

  return (
    <header className="sticky top-0 z-40 bg-brand-950/95 backdrop-blur border-b border-white/10">
      {/* Top bar — language + tagline */}
      <div className="border-b border-white/5 bg-brand-950">
        <div className="container-fluid flex items-center justify-between py-2 text-xs text-white/70">
          <div className="hidden sm:block truncate">
            <span className="font-semibold text-white">{t(lang, 'footer.serviceArea')}</span>
            <span className="mx-2 text-white/30">·</span>
            <span>{t(lang, 'common.tagline')}</span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <span className="hidden sm:inline text-white/50">{t(lang, 'common.language')}:</span>
            <LanguageSwitcher current={lang} size="sm" />
          </div>
        </div>
      </div>

      {/* Main bar — logo + nav + CTAs */}
      <div className="container-fluid flex items-center justify-between py-3">
        {/* Logo */}
        <Link href={`/${lang}`} className="group flex items-center">
          <img
            src="/atora-logo.png"
            alt="ATORA Aircond & Electrical Sdn Bhd"
            className="h-10 sm:h-12 w-auto"
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {nav.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={[
                'px-3 py-2 rounded-md text-sm font-medium transition',
                isActive(item.href)
                  ? 'text-white bg-white/10'
                  : 'text-white/80 hover:text-white hover:bg-white/5',
              ].join(' ')}
            >
              {t(lang, `nav.${item.key}`)}
            </Link>
          ))}
        </nav>

        {/* CTAs */}
        <div className="hidden md:flex items-center gap-2">
          <a
            href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-whatsapp"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23-1.48 0-2.93-.39-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.264 8.264 0 0 1-1.26-4.38c.01-4.54 3.7-8.24 8.25-8.24zM8.53 7.33c-.16 0-.43.06-.66.31-.22.25-.87.86-.87 2.07 0 1.22.89 2.39 1 2.56.14.17 1.76 2.67 4.25 3.73.59.27 1.05.42 1.41.53.59.19 1.13.16 1.56.1.48-.07 1.46-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.07-.1-.23-.16-.48-.27-.25-.14-1.47-.74-1.69-.82-.23-.08-.37-.12-.56.12-.16.25-.64.81-.78.97-.15.17-.29.19-.53.07-.26-.13-1.06-.39-2-1.23-.74-.66-1.23-1.47-1.38-1.72-.12-.24-.01-.39.11-.5.11-.11.27-.29.37-.44.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.11-.56-1.35-.77-1.84-.2-.48-.4-.42-.56-.43-.14 0-.3-.01-.47-.01z"/></svg>
            <span>WhatsApp</span>
          </a>
          <Link href={`/${lang}/contact`} className="btn bg-white text-brand-900 hover:bg-brand-50 hidden lg:inline-flex">
            {t(lang, 'common.getQuote')}
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden ml-2 p-2 rounded-md text-white hover:bg-white/10"
          aria-label={t(lang, 'common.menu')}
        >
          {mobileOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
          )}
        </button>
      </div>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-white/10 bg-brand-950">
          <div className="container-fluid py-3 space-y-1">
            {nav.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={[
                  'block px-3 py-2 rounded-md text-sm font-medium',
                  isActive(item.href)
                    ? 'text-white bg-white/10'
                    : 'text-white/80 hover:bg-white/5',
                ].join(' ')}
              >
                {t(lang, `nav.${item.key}`)}
              </Link>
            ))}
            <div className="flex gap-2 pt-2">
              <a
                href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`}
                className="btn-whatsapp flex-1"
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp
              </a>
              <Link href={`/${lang}/contact`} className="btn bg-white text-brand-900 hover:bg-brand-50 flex-1">
                {t(lang, 'common.getQuote')}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
