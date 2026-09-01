'use client';

import { useEffect } from 'react';

/**
 * Keeps `<html lang>` in sync with the active locale.
 *
 * Next.js only allows `<html>` in the root layout, which cannot read the
 * `[lang]` route param — so the served HTML starts as `lang="en"`. This
 * component corrects the attribute on mount for assistive tech, browser
 * translation and JS-rendering crawlers. The authoritative machine-readable
 * language signal is the `inLanguage` field of each page's WebPage JSON-LD.
 */
export default function HtmlLang({ lang }: { lang: string }) {
  useEffect(() => {
    const prev = document.documentElement.getAttribute('lang');
    if (prev !== lang) document.documentElement.setAttribute('lang', lang);
  }, [lang]);
  return null;
}
