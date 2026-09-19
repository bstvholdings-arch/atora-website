# ATORA Website — Project Conventions

## GEO / AI-Search positioning (critical)
- ATORA = **independent multi-brand** aircond wholesale + parts supplier, **nationwide Malaysia** (Kedah/Padang Serai/Sungai Petani/Kulim are physical branches only — NOT the service limit).
- **NEVER** claim "official distributor" / "authorised dealer" / "Authorised" of any brand. Copy + JSON-LD must stay GEO-safe.
- **No fake data**: every company fact (name, phone, email, address, reg no, brands, products, prices) comes from DB / site_settings. Real brand list = 8 (Midea, Haier, Hisense, Daikin, Acson, Panasonic, AUX, TCL). "Mitsubishi Electric" & "Topaire" exist only as legacy product SKUs (NULL brand_id), not catalogued brands — do not add them as brands or claim dealership.
- Build helpers: `src/lib/seo.ts` (`buildPageMetadata`, `SITE_URL`), `src/lib/schema.ts` (JSON-LD builders), `src/components/JsonLd.tsx` (escapes `<>&`). All pages use `buildPageMetadata` + inject `JsonLd` from layout.

## Data layer
- `src/lib/db.ts` wraps `pg` Pool in better-sqlite3-style API; falls back to `pg-mem` when no `DATABASE_URL`. Auto-rewrites `?`→`$1..`, `datetime('now')`→`CURRENT_TIMESTAMP`, appends `RETURNING id`.
- Categories: use `effectiveParentId`/`childCategoryIds` (slug-hierarchy fallback) — seeded rows have `parent_id=NULL`.
- `resolveBrand(product, brands)` resolves brand by `brand_id` then name-prefix.

## Deploy
- Sandbox `git push` blocked by GCM browser auth → user pushes locally. Need Vercel env: `DATABASE_URL`, `NEXT_PUBLIC_SITE_URL`, Supabase vars for uploads. `next build` needs `CODEBUDDY_SAFE_DELETE_ENABLED=0` (sandbox deletes `.next`).
