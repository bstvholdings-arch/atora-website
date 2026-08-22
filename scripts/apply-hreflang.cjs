/**
 * Mechanical fix: apply langAlternates() to every [lang] page generateMetadata
 * so hreflang <link> tags are emitted in <head> instead of being dropped by the
 * page-level canonical-only alternates override.
 */
const fs = require('fs');

const files = [
  'src/app/[lang]/faq/page.tsx',
  'src/app/[lang]/contact/page.tsx',
  'src/app/[lang]/technical-partners/[slug]/page.tsx',
  'src/app/[lang]/technical-partners/page.tsx',
  'src/app/[lang]/about/page.tsx',
  'src/app/[lang]/parts/page.tsx',
  'src/app/[lang]/locations/page.tsx',
  'src/app/[lang]/brands/page.tsx',
  'src/app/[lang]/project-supply/page.tsx',
  'src/app/[lang]/products/page.tsx',
  'src/app/[lang]/brands/[slug]/page.tsx',
  'src/app/[lang]/products/[slug]/page.tsx',
  'src/app/[lang]/page.tsx',
];

let changed = 0;
for (const rel of files) {
  const f = rel;
  let src = fs.readFileSync(f, 'utf8');
  const before = src;

  // 1. Add langAlternates to the first i18n import (LOCALES, Locale, t)
  src = src.replace(
    /import\s+\{\s*LOCALES,\s*Locale,\s*t\s*\}\s+from\s+'@\/lib\/i18n';/,
    "import { LOCALES, Locale, t, langAlternates } from '@/lib/i18n';"
  );

  // 2. Replace alternates: { canonical: `...` } with alternates: langAlternates(`...`)
  src = src.replace(
    /alternates:\s*\{\s*canonical:\s*(`[^`]+`)\s*\}/,
    'alternates: langAlternates($1)'
  );

  if (src !== before) {
    fs.writeFileSync(f, src);
    changed++;
    console.log('CHANGED', f);
  } else {
    console.log('UNCHANGED', f);
  }
}
console.log('Total changed:', changed, '/', files.length);
