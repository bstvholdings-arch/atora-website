# ATORA GEO V2 — Implementation & Audit Report

**Site:** https://www.atora.com.my (Next.js 14.2.13 App Router · Vercel · Supabase PostgreSQL)
**Date:** 2026-08-30
**Scope:** GEO (Generative Engine Optimisation) V2 — reposition ATORA as a **Northern Malaysia Aircond Specialist** while keeping Malaysia-nationwide as the broader service area; add service-area + location entity pages, an aircond guide hub, GEO-intent FAQs, and strengthen structured data / internal linking.

---

## 1. Positioning (single source of truth)

All public pages, the site-wide Organization schema and `/llms.txt` read V2 positioning from one place:

- **`src/lib/positioning.ts`** — `POSITIONING.primary` (3-language canonical equivalents):
  - EN: *Northern Malaysia Aircond Specialist*
  - BM: *Pakar Aircond Utara Malaysia*
  - ZH: *北马专业冷气专门店*
- `GEO` = primary state **Kedah**, primary region **Northern Malaysia**, key locations (Padang Serai, Kulim, Sungai Petani, Alor Setar), northern states (Kedah, Penang, Perlis, Perak), nationwide = Malaysia.
- `SERVICE_AREAS` — curated, factual copy for all 8 entity pages (no fake branches).
- `resolveServiceArea()` / `serviceAreaUrlSlug()` — single, correct slug↔config resolution (the V2 bug below is fixed).

Mirrored into `site_settings` as `positioning_primary_*` / `positioning_secondary_*` rows and aligned `tagline_*`, `seo_default_*`, `footer_about_*`, `company_name_zh` (= 东京冷气电器有限公司), `email` (= atoraaircond12@gmail.com).

---

## 2. New pages / routes (all build + verify 200)

| Route | Type | Notes |
|---|---|---|
| `/[lang]/service-area` | ƒ dynamic | **Core V2 entity page.** Title: *Northern Malaysia Aircond Specialist \| ATORA*. Kedah-based, serves Northern Malaysia + Penang/Perlis/Northern Perak + nationwide. |
| `/[lang]/aircond-guide` | ƒ dynamic | Content hub listing 8 guides. |
| `/[lang]/aircond-guide/[slug]` | ● SSG | 8 articles × 3 langs = 24 pre-rendered paths. |
| `/[lang]/locations/[slug]` | ● SSG | Unified route: real DB branches **and** service-area configs. 8 slugs × 3 langs = 24 paths. |

### Location / service-area slugs (8, all 200; bad slug → 404)
`padang-serai` (HQ branch) · `kulim` (branch) · `sungai-petani` (branch) · `alor-setar` (service area) · `kedah` · `penang` · `northern-malaysia` · `malaysia`

**Real branches** (Padang Serai / Kulim / Sungai Petani) render as `LocalBusiness` with address, opening hours, phone, Google Maps CTA.
**Non-branch areas** (Alor Setar, Kedah, Penang, Northern Malaysia, Malaysia) are explicitly labelled **"Service Area"** — never "Branch". No fabricated shops.

---

## 3. Bug fixed (blocker from prior session)

`SERVICE_AREA_SLUGS` only listed 5 slugs while `SERVICE_AREAS` had 8 keys, and `resolveServiceArea()` returned `null` for `padang-serai`/`kulim`/`sungai-petani` (→ 404) and mis-resolved `alor-setar`.

**Fix:** `SERVICE_AREA_KEYS` now holds all 8 config keys; `resolveServiceArea()` iterates `SERVICE_AREAS` and matches via `serviceAreaUrlSlug()`. Verified: all 8 slugs → 200; `does-not-exist` → 404.

---

## 4. Aircond guide hub (8 articles, data-driven)

Content lives in `src/lib/guides.ts` (3-language editorial copy, no fabricated prices/stock). Adding a guide needs **no page-code change**. Topics:

1. Best Aircond Options for Malaysian Homes
2. How to Choose 1 / 1.5 / 2 / 2.5 HP
3. Inverter vs Non-Inverter
4. Aircond for Bedroom
5. Buying Guide for Kedah Homes
6. Spare Parts Guide
7. Midea Aircond Guide (Midea Pro Shop — no dealer claim)
8. Maintenance Guide

Each article cross-links to real routes (catalogue, brands, parts, service-area, wholesale, contact) → strengthens internal linking.

---

## 5. Structured data / GEO signals (verified live)

- **Organization** (`[lang]/layout.tsx`): `areaServed` now includes `State` nodes for Northern Malaysia (`serviceStates: [...GEO.northernStates]`); canonical name `ATORA AIR COND & ELECTRICAL SDN. BHD.`, `alternateName` = 东京冷气电器有限公司.
- **Service-area page JSON-LD:** `Service` (name "…Northern Malaysia Aircond Specialist") + `ItemList` (8 areas) + `BreadcrumbList` + `WebPage` + `FAQPage`.
- **Location pages JSON-LD:** `BreadcrumbList` + `Service` + (branch only) `LocalBusiness` + `ItemList` (brands) + `WebPage`.
- **`<head>`:** `canonical`, `hreflang` (en-MY / ms-MY / zh-MY / x-default), `content-language` (en-MY etc.) all present and valid.
- **robots.txt:** explicitly allows AI crawlers (GPTBot, Google-Extended, ClaudeBot, PerplexityBot, …); declares `Sitemap:` + `LLM-Txt:`.
- **sitemap.xml:** new `/service-area`, 8 `/locations/*`, `/aircond-guide` + 8 articles — each with 3-language `hreflang` alternates.
- **llms.txt:** rewritten intro states *"Northern Malaysia aircond specialist … based in Kedah"*; adds primary-market service coverage + `/en/service-area` link.

---

## 6. GEO-intent FAQs (DB, ids 25–30)

Inserted 6 factual Q&A (EN/BM/ZH) covering: Northern Malaysia specialist, Kedah supply, Midea Pro Shop in Padang Serai, "Can ChatGPT/Gemini/Perplexity/DeepSeek find ATORA?", which Northern Malaysia areas we serve, and the *no-authorised-distributor* clarification. Surfaced via `FAQPage` schema on the guide/service-area/wholesale hubs and the `/faq` page.

---

## 7. Red-line compliance (V2 §25)

- ✅ No fake data, no hidden text, no keyword stuffing.
- ✅ No "official distributor / authorised dealer" claim for any brand (Midea Pro Shop stated; independent multi-brand supplier).
- ✅ Real branches vs service areas distinguished (no fake branches).
- ✅ Existing systems intact: `/en/products`, `/en/brands` (now 10 incl. Topaire + Mitsubishi Electric), `/en/parts`, `/en/faq`, `/en/locations`, `/admin/login` (200), `/api/enquiry` (405 GET / 400 POST as designed) — no 500s.
- ✅ i18n, SEO, DB, auth, WhatsApp/Maps/partners links untouched.

---

## 8. Build & deploy status

- `npm run build` → **0 TypeScript errors**, all new routes compiled.
- Live server re-verified on `:3000` after killing a stale prior-session server that held the port.
- **Not yet pushed:** `git push` is blocked by Git Credential Manager (browser auth) in this environment.

### To deploy
1. `git push origin main` (from a terminal with Git auth).
2. Confirm Vercel project env vars (`DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`, etc.) match `.env.local`.
3. Trigger a Vercel deploy (or it auto-deploys on push).
4. Re-run GEO checks against `https://www.atora.com.my` (sitemap.xml, llms.txt, robots.txt, a sample `/en/service-area` + `/en/locations/alor-setar`).
