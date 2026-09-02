# ATORA — AI GEO / AI-Search Optimization — V3 FINAL REPORT

**Date:** 2026-09-02
**Scope:** ATORA website (`atora-website`, Next.js 14.2.13 App Router, Vercel, Supabase PostgreSQL)
**Governing brief:** ATORA AI GEO MASTER PROMPT V3 — FINAL (38 sections)
**Build status:** `npm run build` → **0 TypeScript errors, 0 build errors** (68 routes generated)

---

## 1. Final Entity Confirmation (V3 §2 / §30)

> **ATORA = Malaysia Aircond Wholesale & Air Conditioning Parts Supplier**
> Headquartered in Kedah (Northern Malaysia); **Nationwide Malaysia Delivery**.

- **PRIMARY entity = nationwide Malaysia.** "Northern Malaysia / Kedah" is retained **only as a Local/Regional GEO** (HQ + local-service market) — it is **NOT** used as the PRIMARY positioning anywhere.
- Core signal phrase deployed everywhere: **"Nationwide Malaysia Delivery"** (`Penghantaran Seluruh Malaysia` / `马来西亚全国配送`).
- Confirmed present in: `src/lib/positioning.ts` (`POSITIONING.primary` + `nationwideSignal`), `src/lib/settings.ts` defaults, live `site_settings` table, root `layout.tsx`, `[lang]/layout.tsx` Organization JSON-LD, `service-area` H1, `locations/[slug]` title, `aircond-wholesale-malaysia` H1, and `llms.txt`.

---

## 2. GEO Coverage Map (V3 §14 / §15)

| Layer | Entity | Status |
|---|---|---|
| Country (PRIMARY) | **Malaysia** — `GEO.country = 'Malaysia'`, `GEO.nationwide = 'Malaysia'` | ✅ Published as primary |
| Local/Regional GEO | **Northern Malaysia (Kedah)** — `GEO.localRegion`, HQ in Padang Serai | ✅ Published as HQ + local-service only |
| Site-wide JSON-LD `areaServed` | `[GEO.nationwide]` (was northern states only) | ✅ Now nationwide |
| States/cities | Only where real delivery/service exists | ✅ No fabricated branches/stores/warehouses |

**Real, DB-resident locations (3 — all Kedah, all genuine towns):**

| Slug | Name | State | City | Type |
|---|---|---|---|---|
| `padang-serai-hq` | ATORA HQ — Padang Serai | Kedah | Padang Serai | hq |
| `kulim` | ATORA Kulim | Kedah | Kulim | branch (real local service point) |
| `sungai-petani` | ATORA Sungai Petani | Kedah | Sungai Petani | branch (real local service point) |

> Per V3 §14/§15, no fake branches, stores, warehouses, or postal addresses were invented. The two `type='branch'` rows are real service points in Kedah towns, consistent with the Local GEO.

---

## 3. Active Brand Portfolio (V3 §11)

**9 active brands** (8 V3-allowed + TCL, which exists in the DB):

`Acson`, `AUX`, `Daikin`, `Haier`, `Hisense`, `Midea`, `Panasonic`, `TCL`, `Topaire`

Mitsubishi Electric is **fully removed** (see §5). All brand references in copy/SEO/JSON-LD now use this list.

---

## 4. Spare Parts GEO — Data-Driven System (V3 §4–§11 / §32)

Built as a **truth-source-driven** pipeline (never invents products):

- `src/lib/spareParts.ts` — `STANDARD_SPARE_PART_CATEGORIES` (10 buckets) + `classifySparePart()` (path 1: DB category-slug → HIGH; path 2: EN/BM/ZH + abbreviation semantic recognition) + `buildSparePartsGEO()` (reads live `products`/`categories`, classifies **only** `aircond-parts-*` products, preserves real product names verbatim).
- `src/app/api/geo/spare-parts/route.ts` — live endpoint exposing the GEO to AI engines.

**Verified live output (`GET /api/geo/spare-parts`):**

| Metric | Value | V3 limit |
|---|---|---|
| `taxonomyCap` | 100 | ≤ 100 ✅ |
| `taxonomySize` (standard buckets defined) | 10 | ≤ 100 ✅ |
| `totalActualSpareParts` (real DB products) | **4** | real-only ✅ |
| `categoriesRepresented` (with live products) | 3 of 10 | n/a |

**Actual spare-parts list (truth source = live catalog, names unaltered):**

| # | Product (real name) | DB category | Mapped standard GEO | Confidence |
|---|---|---|---|---|
| 1 | Universal Aircond Compressor 1.5HP | aircond-parts-compressor | compressor | HIGH |
| 2 | Indoor Fan Motor 1/2HP | aircond-parts-fan-motor | fan-motor | HIGH |
| 3 | Aircond PCB Control Board | aircond-parts-pcb-board | pcb-board | HIGH |
| 4 | media *(see data-quality note)* | aircond-parts-fan-motor | fan-motor | HIGH |

**Standard taxonomy (10 buckets, ready slots — only 3 currently populated with real products):**
`compressor` (HIGH), `pcb-board` (HIGH), `fan-motor` (HIGH), `capacitor` (MEDIUM), `sensor` (MEDIUM), `thermostat` (MEDIUM), `relay` (MEDIUM), `contactor` (MEDIUM), `electrical-components` (MEDIUM), `replacement-parts` (MEDIUM). Each carries `confidence` + `adminVerified:false` for editorial sign-off.

> Per V3 §4, the 7 currently-empty buckets are **valid taxonomy scaffolding, not fake products** — no products were invented to fill them.

---

## 5. Data Integrity — Mitsubishi Elimination (V3 §12)

**Final Mitsubishi Electric reference count = 0** (verified against live Supabase DB):

| Table | Before | After |
|---|---|---|
| `brands` | 1 | **0** |
| `products` | 3 | **0** |
| `product_media` | 1 | **0** |
| `faqs` (answers) | stripped | **0** |
| `site_settings` (values) | stripped | **0** |
| **Total** | — | **0** ✅ |

- Code layer: removed `MitsubishiElectricLogo` + registration from `src/components/BrandLogos.tsx`; purged from `scripts/seed-data.mjs` (brand, product, media, FAQ, SEO description); `grep -rin "mitsubishi" src/` → **0 hits**.
- Live DB: `scripts/cleanup-mitsubishi.mjs` executed (brands 1→0, products 3→0, media 1→0); FAQ & `site_settings` rows retained but token-stripped.

**Fake-location check:** 0 fabricated branches/stores/warehouses/addresses (heuristic scan of location names → 0 suspicious).

---

## 6. Technical GEO — PASS / FAIL (V3 §36 / §37)

| # | Check | Result |
|---|---|---|
| T1 | PRIMARY entity = Malaysia Aircond Wholesale & Air Conditioning Parts Supplier | ✅ PASS |
| T2 | "Nationwide Malaysia Delivery" signal deployed (EN/BM/ZH) | ✅ PASS |
| T3 | Northern Malaysia used ONLY as Local/Regional GEO (no forbidden primary framing) | ✅ PASS |
| T4 | Mitsubishi fully removed (code + DB, count 0) | ✅ PASS |
| T5 | Spare Parts GEO data-driven, ≤100 taxonomy, real names preserved | ✅ PASS (10 / 4) |
| T6 | Location GEO: Malaysia-first, only real locations, no fakes | ✅ PASS |
| T7 | `npm run build` → 0 TS errors, 0 build errors | ✅ PASS (68 routes) |
| T8 | `robots.txt` / `sitemap.xml` / `llms.txt` consistent, Mitsubishi-free | ✅ PASS (HTTP 200, live-data) |
| T9 | Site-wide Organization JSON-LD `areaServed` = nationwide Malaysia | ✅ PASS |
| T10 | `site_settings` (DB) synced to V3 copy | ✅ PASS (15 rows) |

**Overall: 10 / 10 PASS.**

---

## 7. Files Changed (this session, V3)

- `src/lib/positioning.ts` — V2 "Northern Malaysia" primary → V3 nationwide-primary; added `nationwideSignal` / `localGeo`; `GEO` rewritten (Malaysia primary, Northern Malaysia local).
- `src/lib/settings.ts` — V3 defaults (tagline / seo title / seo description / positioning_primary / footer_about), Mitsubishi removed, Nationwide Delivery added.
- `src/lib/spareParts.ts` — **NEW**: Spare Parts GEO engine (10 standard categories + classifier + builder).
- `src/app/api/geo/spare-parts/route.ts` — **NEW**: live GEO API.
- `src/app/layout.tsx` — root metadata → nationwide primary.
- `src/app/[lang]/layout.tsx` — `serviceStates: [GEO.nationwide]`.
- `src/app/[lang]/service-area/page.tsx` — H1/badge/schema → `POSITIONING.primary`.
- `src/app/[lang]/locations/[slug]/page.tsx` — title/badge → `POSITIONING.primary`.
- `src/app/[lang]/aircond-wholesale-malaysia/page.tsx` — H1/badge/schema → `POSITIONING.primary` (Kedah kept as HQ Local GEO only).
- `src/app/[lang]/aircond-guide/page.tsx` + `[slug]/page.tsx` — badge/intro → `POSITIONING.primary`.
- `src/components/BrandLogos.tsx` — removed Mitsubishi logo + registration.
- `src/app/llms.txt/route.ts` — Malaysia-first intro + Nationwide Delivery; "Malaysia service area" links.
- `scripts/seed-data.mjs` — Mitsubishi purged; TCL/Topaire retained.
- `scripts/cleanup-mitsubishi.mjs` — **NEW** (DB deletion, idempotent).
- `scripts/update-v3-settings.mjs` — **NEW** (pushes 15 V3 `site_settings` rows).
- `scripts/verify-v3.mjs` — **NEW** (data-integrity + spare-parts verification).

---

## 8. Recommendations / Follow-ups

1. **Data-quality:** Product `id=20` (name literally `"media"`, `sku=30`) under `aircond-parts-fan-motor` is a junk/test row. Recommend admin review and removal (not auto-deleted here to respect data safety). It currently counts as 1 of the 4 "actual" spare parts.
2. **Empty taxonomy buckets:** 7 of 10 standard spare-parts categories have no live product yet. Populate from the real catalog as stock arrives — do **not** create placeholder products.
3. **admin_verified:** All 10 standard categories ship with `adminVerified:false`; flip to `true` after editorial sign-off in the admin console.
4. **Geographic expansion:** When real delivery/service begins outside Kedah, add those locations to the DB (and only then publish them) — keep §14/§15 "real-only" rule.

---

*Report generated per V3 §37. All claims verified against the live Supabase database and the production build.*
