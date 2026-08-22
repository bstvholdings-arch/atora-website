# ATORA — Full Local Run & QA Report

**Project:** ATORA AIR COND & ELECTRICAL SDN. BHD. (东京冷气电器有限公司) — B2B aircond wholesale/parts site
**Stack:** Next.js 14 (App Router) + TypeScript + Tailwind + better-sqlite3
**Date:** 2026-08-19
**Method:** Real local server (custom single-process Next server on port 3300 — `next dev`/`next start` cannot fork in this sandbox), HTTP status + content grep, DB verification, and a data-layer CRUD battery mirroring every admin Server Action.

---

## BUILD
**PASS** — `next build` compiled successfully with **0 TypeScript errors**. 38 routes generated (15 public `[lang]` pages, 13 admin pages, 2 APIs, sitemap, robots).

## LOCAL SERVER
**PASS** — Live HTTP server boots and serves:
- `/en`, `/bm`, `/zh` → 200
- `/` → 307 redirect to `/en`
- `/admin` → 307 → `/admin/dashboard` → 307 → `/admin/login` (auth-gated)

## FRONTEND
**PASS**
- Company name **东京冷气电器有限公司** renders on `/zh` (and `ATORA AIR COND & ELECTRICAL SDN. BHD.` on `/en`).
- White background + blue `brand` palette applied throughout (Tailwind `brand` 50–950).
- Header nav, footer, language switcher, and WhatsApp CTA present (29 `wa.me` deep-links across pages).
- Three-language content verified per URL: EN `Aircond/Wholesale`, BM `Borong/Alat Ganti`, ZH `冷气/批发/零件`; nav labels switch (Products / Produk / 产品).

## ADMIN
**PASS** — Auth guard works correctly:
- All 11 admin sections (`dashboard, products, brands, categories, locations, partners, faqs, homepage, settings, enquiries, media`) → **307 redirect to login when no session**, **200 when authenticated**.
- `/admin/login` → 200.
- Session = httpOnly cookie `atora_admin` + DB `sessions` row, 7-day TTL.

## DATABASE
**PASS** — better-sqlite3 (WAL, FK on), seed counts exactly as specified:
- brands = 9 · categories = 33 · products = 15 · product_media = 4 · locations = 3 · technical_partners = 3 · faqs = 12 · admin_users = 1
- Price display modes covered: SHOW_PRICE (11), CONTACT_FOR_PRICE (1), SHOW_PRICE_RANGE (1), SHOW_PROMOTION_PRICE (1), SHOW_WHOLESALE_PRICE (1).
- Admin password stored as **bcrypt** (`$2a$10$…`), not plaintext.

## PRODUCTS
**PASS** — 15 products listed with 15 detail links; 4 products carry seeded media (4 `<img>` rendered), the other 11 show a clean **"No image"** placeholder (no broken images). Media manager is wired into the admin product edit modal.

## GOOGLE MAPS / LOCATIONS
**PASS** — 3 locations, each with **Directions** buttons and **Google Maps** links (6 occurrences = 2 per location incl. HQ). HQ phone (`60103838222`) and HQ address present on the locations page.

## TECHNICAL PARTNERS
**PASS** — 3 technical partners listed with detail pages (`/en/technical-partners/<slug>`).

## SEO
**PASS**
- `sitemap.xml` → 200, covers **en (37) / bm (37) / zh (37)** URLs, **0 `/admin`** entries.
- `robots.txt` → 200, `Disallow: /admin/` and `Disallow: /api/`, Sitemap declared.
- **hreflang FIXED this run:** all 13 `[lang]` page `generateMetadata` now emit `alternates.languages` (en/bm/zh) via the `langAlternates()` helper, e.g. `/zh/products/<slug>` emits canonical + `hreflang="en/bm/zh"`. Previously these were dropped by page-level canonical-only overrides.

## MOBILE
**PASS (structural)** — Rendered HTML contains responsive utility classes (`md:` ×13, `lg:` ×31) and the `MobileBottomBar` fixed bottom nav. *Caveat:* not visually rendered in a real viewport in this headless sandbox.

## SECURITY
**PASS**
- Admin auth guard (307 unauth / 200 auth) verified on all sections.
- `POST /api/upload` → **401** without session.
- Admin password is bcrypt, never plaintext.
- No `.env` / secret leakage: `/.env`, `/env`, `/package.json` → 404; served HTML contains none of `Atora@2026`, `ADMIN_DEFAULT_PASSWORD`, `DATABASE_URL`, etc.
- `robots.txt` hides `/admin/` and `/api/`.

## ADMIN CRUD (Create→Edit→Verify→Delete)
**PASS (data-layer)** — A 22-check battery exercised the exact DB operations every admin Server Action runs, for all 7 entities (brand, category, product, product_media, location, partner, faq): each create→read→update→delete cycle returned counts to baseline (22/22). *Caveat:* UI click-through (form → Server Action → revalidate) was not performed in a browser; the underlying logic and the admin forms are present and verified at the data layer.

## SITE SETTINGS SYNC
**PASS** — Mutating `company_name_en` in `site_settings` was reflected live on `/en` (then reverted to the original). Settings are read per-request (no stale cache). All 24 setting keys present (company names, email, footer, hq, seo, tagline, whatsapp…).

## API / DB
**PASS**
- `POST /api/enquiry` accepts JSON → **200** (returns enquiry id + WhatsApp link); rejects empty `name`+`message` → 400; `GET` → 405 (POST-only). Enquiries persist to DB.
- `POST /api/upload` requires admin session → 401 unauth.

---

## ISSUES FIXED (this run)
1. **hreflang dropped.** All 13 `[lang]` page `generateMetadata` overrode the layout's `alternates` with canonical-only, so `<head>` had no `hreflang`. Fixed by applying `langAlternates()` (helper added to `src/lib/i18n.ts`) to every page; re-verified hreflang links now emit correctly.
2. **Language switcher non-functional.** `LanguageSwitcher` only set a cookie + `router.refresh()`, but the active locale is URL-driven (`/[lang]`), so clicking a language did nothing. Fixed to rewrite the locale path segment and `router.push()` to it. Rebuilt and verified EN/BM/ZH content per URL.

## REMAINING ISSUES / CAVEATS
- **Admin CRUD** verified at the data layer, not via real browser clicks (no browser in sandbox). Recommend a manual click-through on the Windows PC (login → create/edit/delete each entity → confirm on public site).
- **Root `/`** always redirects to default `/en` and does **not** honor the `atora_locale` cookie (no middleware). Explicit `/bm` and `/zh` URLs + the fixed switcher fully cover 3-language navigation. Optional: add middleware to redirect `/` by cookie/`Accept-Language`.
- **Mobile** verified structurally (responsive classes + bottom bar), not pixel-rendered in a viewport.

---

## FINAL STATUS
**READY FOR PRODUCTION** — all critical build, server, frontend, admin, database, product, maps, partners, SEO, mobile, security, CRUD, settings, and API checks pass. Two real defects found during QA (hreflang omission, broken language switcher) were **root-caused and fixed**, not worked around or removed. The only open items are enhancement/verification caveats listed above (browser click-through, root cookie redirect, viewport render), none of which block launch.
