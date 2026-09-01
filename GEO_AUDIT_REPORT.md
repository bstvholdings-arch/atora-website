# ATORA GEO + AI SEARCH — FINAL AUDIT REPORT

Generated: 2026-09-01 · Verified against a live production build (`npm run build` → `next start`, port 3000).

## STEP 2 — GEO AUDIT (real inspection, not theory)

| # | Area | Status | Evidence |
|---|------|--------|----------|
| 1 | Organization JSON-LD | PASS | Rendered site-wide from `[lang]/layout.tsx` |
| 2 | WebSite JSON-LD | PASS | Rendered site-wide |
| 3 | WebPage JSON-LD | PASS | Every public page |
| 4 | BreadcrumbList JSON-LD | PASS | products, brands, brand-detail, faq, locations, project-supply, partners, partner-detail |
| 5 | Product JSON-LD (+Offer) | PASS | product detail; verified `Product`+`Offer`+`Brand` |
| 6 | Service JSON-LD | PASS | project-supply, locations, GEO hub |
| 7 | FAQPage JSON-LD | PASS | /faq and GEO hub (escaped via `JsonLd`) |
| 8 | LocalBusiness JSON-LD | PASS | one node per DB location + layout |
| 9 | ItemList JSON-LD | PASS | home brands, products, brands, brand-detail, partners, hub |
| 10 | Brand JSON-LD | PASS | brand detail page |
| 11 | Partner Organization JSON-LD | PASS | partner detail, privacy-aware (show_* flags honored) |
| 12 | hreflang (en-MY / ms-MY / zh-MY / x-default) | PASS | `<head>` alternates + 504 sitemap `<xhtml:link>`; "bm" internal code mapped to `ms-MY` |
| 13 | Canonical + title/description + Open Graph + Twitter | PASS | centralized in `buildPageMetadata` |
| 14 | robots.txt (AI bots allowed; /admin,/api,secrets blocked) | PASS | GPTBot, OAI-SearchBot, PerplexityBot, ClaudeBot, Google-Extended, Applebot-Extended, Amazonbot, cohere-ai, Diffbot allowed |
| 15 | sitemap.xml (multilingual + hreflang) | PASS | 504 `xhtml:link` alternates, real `lastmod` |
| 16 | /llms.txt (LLM-facing summary) | PASS | DB-driven, no fabricated data, explicit "independent supplier" statement |
| 17 | Nationwide positioning + no "official distributor" claim | WARNING | Positioning = nationwide Malaysia (verified). 2 of the 9 prompt-listed brands — **Mitsubishi Electric** & **Topaire** — exist ONLY as legacy product SKUs (NULL `brand_id`), NOT as catalogued brands, so their brand pages were intentionally NOT created to avoid fake claims. All 8 real brand pages PASS. |

## 13-POINT DELIVERABLE LIST

1. **Fabrication-free JSON-LD layer** — `src/lib/seo.ts` (`buildPageMetadata`, `SITE_URL`), `src/lib/schema.ts` (all builders), `src/components/JsonLd.tsx` (escapes `<` `>` `&` to block `</script>` injection). No company fact is hard-coded; all come from DB / `site_settings`.
2. **Site-wide entity graph** — `[lang]/layout.tsx` emits `Organization` + `WebSite` + one `LocalBusiness` per DB location on every page.
3. **Per-page structured data** — `WebPage`, `BreadcrumbList`, `ItemList` (home/products/brands/partners/hub), `Product`+`Offer` (detail), `Service` (project-supply/locations/hub), `FAQPage` (faq/hub), `Brand` (brand detail), `Partner` (partner detail, privacy-aware).
4. **Unified metadata** — all public pages use `buildPageMetadata` (canonical, hreflang, Open Graph, Twitter card, robots, `content-language`).
5. **robots.txt rewrite** — allows all major AI crawlers; protects `/admin`, `/api/`, `*.env`, `_next`, and query-param-filtered URLs.
6. **sitemap.xml rewrite** — multilingual with valid BCP-47 hreflang alternates (incl. `x-default`); real `lastmod` from `updated_at`/`created_at`.
7. **`/llms.txt`** — plain-text, LLM-facing summary generated from DB; explicitly states ATORA is independent and not an official distributor/authorised dealer of any brand.
8. **GEO content hub** — `/[lang]/aircond-wholesale-malaysia`: answer-first, nationwide, DB-driven (brands/categories/products/locations/FAQs), internal links, emits `Service`+`ItemList`+`FAQPage`+`WebPage`+`BreadcrumbList`.
9. **hreflang correctness** — centralized `langAlternates`/`HREFLANG_TAGS` maps internal `bm` → public `ms-MY`; applied across all pages + sitemap.
10. **Multilingual language signal** — `content-language` meta (`en-MY`/`ms-MY`/`zh-MY`) on every page + client-side `<html lang>` correction via `HtmlLang.tsx`.
11. **Category-hierarchy data bug fixed** — `effectiveParentId` / `childCategoryIds` / `listChildCategories` + JS-side group expansion in `searchProducts`; restores correct category crawlability (was showing ~2 items / flattening hierarchy).
12. **No-fake-data correction** — removed "Mitsubishi Electric, Topaire" from the brand blurb (`seo_default_description_en` DB row + `layout.tsx`/`settings.ts` defaults + en/bm/zh `why1Desc`/`a2`); added the real, previously-missing brand **TCL**. Fixed GEO-unsafe "Authorised Multi-Brand Distributor" → "Multi-Brand Aircond Supplier".
13. **Build green + live-verified** — `npm run build` passes (typecheck + lint clean, 20 routes). Verified live: robots/sitemap/llms.txt content, JSON-LD types per page, `<head>` hreflang, `content-language`, and absence of "official distributor" claims.

## CARRY-OVER (requires user action)
- Changes are **uncommitted**. Sandbox `git push` is blocked by Git Credential Manager browser auth.
- To go live: `git add -A && git commit && git push origin main`, add Vercel env vars (`DATABASE_URL`, `NEXT_PUBLIC_SITE_URL`, and Supabase vars if uploads are enabled), then deploy.
- Optional: if you want Mitsubishi Electric / Topaire treated as first-class brands (per the original brand list), add them to the `brands` table — their product pages and brand pages will then resolve automatically.
