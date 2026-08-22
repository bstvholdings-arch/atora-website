# ATORA — Phase B Deploy Prep (production domain: `atora.com.my`)

Generated 2026-08-22. Based on a full read of the actual code (`next.config.mjs`,
`src/lib/auth.ts`, `src/lib/db.ts`, `src/app/api/upload/route.ts`,
`src/app/page.tsx`, `package.json`, `.env` / `.env.local`).

Status: CRUD verified against live Supabase (Phase A complete). Phase B config +
env/DNS checklist done. **Phase C in progress** — Vercel decided; `vercel.json`
added; admin password rotated; go-live runbook in §8.

---

## 1. `next.config.mjs` — review & changes applied

**Already production-sane:**
- `reactStrictMode: true`
- `experimental.serverActions.bodySizeLimit: '50mb'` — required for the media
  upload server action (images ≤8 MB, videos ≤50 MB).
- Locales are **folder-based** (`/en`, `/bm`, `/zh`), not Next `i18n`. The root
  `/` already redirects to `/{locale}` in `src/app/page.tsx` (cookie
  `atora_locale` wins, default `/en`) — so the `/` locale redirect works
  server-side; a `middleware.ts` is **not** strictly required.

**Changed in this phase (additive, build-verified `BUILD_EXIT=0`):**
- Added `async headers()` with `X-Content-Type-Options`, `Referrer-Policy`,
  `Permissions-Policy`, `Strict-Transport-Security` (max-age 2y, includeSubDomains,
  preload), and a moderate `Content-Security-Policy`. `/admin/*` additionally gets
  `X-Frame-Options: DENY` (clickjacking protection on the admin).
- `images.remotePatterns` left **permissive** (`https://**`) on purpose — seeded
  brand/partner logos and uploaded media can live on many hosts. Tighten to an
  explicit allow-list (`atora.com.my` + your Supabase Storage bucket) once every
  image origin is known.

**Optional future hardening (not blocking):**
- `output: 'standalone'` if you containerize — produces a minimal server. Note the
  project also ships `scripts/server.cjs` (a single-process Node server that avoids
  `next start`'s fork) — pick one, don't run both.
- Upgrade CSP to nonces (drop `'unsafe-inline'`) — currently kept for Next/Tailwind
  inline styles.

---

## 2. Environment variables — what the host needs

| Variable | Required | Scope | Value for `atora.com.my` | Notes |
|---|---|---|---|---|
| `NODE_ENV` | Recommended | runtime | `production` | `next start` sets it; set explicitly for `scripts/server.cjs`. |
| `DATABASE_URL` | **REQUIRED** | runtime (+ db scripts) | `postgresql://postgres:JUNYO%4019813939@db.umnnzabvivodfqzyfnco.supabase.co:5432/postgres` | Supabase Postgres. **Password `@` is percent-encoded as `%40` — keep it.** `pg` decodes `%40`→`@` on connect; do NOT put a raw `@` in the password. Host auto-detected → SSL `rejectUnauthorized:false`. Also accepts `DIRECT_URL` / `POSTGRES_URL`. |
| `NEXT_PUBLIC_SITE_URL` | **REQUIRED** | **build-time** | `https://atora.com.my` | `NEXT_PUBLIC_*` is inlined into the client bundle at `next build`. **Must be set BEFORE `npm run build`**, not just at runtime, or canonical/sitemap URLs will be wrong. |
| `ADMIN_DEFAULT_EMAIL` | Optional | `admin:create` script | `admin@atora.com.my` | Admin user already exists in Supabase (`admin_users=1`); only used if you re-run `npm run admin:create`. |
| `ADMIN_DEFAULT_PASSWORD` | **Recommended** | `admin:create` script | a strong unique value | **SECURITY: current default is `Atora@2026` — rotate it before go-live.** Used only by the create-admin script. |
| `ADMIN_DEFAULT_NAME` | Optional | `admin:create` script | `Administrator` | Display name. |
| `SESSION_SECRET` | **Unused** | — | (ignore) | Stale. `src/lib/auth.ts` uses a DB-backed random token session, **not** a signed JWT. Do not rely on this. |
| `DATABASE_PATH` | Unused | — | (ignore) | SQLite leftover. |
| `UPLOAD_DIR` | Optional | runtime | leave default | Local-disk fallback for uploads. Only used when Supabase Storage env is absent (local dev). Ignored on Vercel when Storage is configured (see §4). |
| `SUPABASE_URL` | **REQUIRED (prod)** | runtime | `https://db.umnnzabvivodfqzyfnco.supabase.co` | Base URL of the Supabase project (no trailing slash). Enables object-storage uploads via `src/lib/storage.ts`. **Server-only — never prefix with `NEXT_PUBLIC_`.** |
| `SUPABASE_SERVICE_ROLE_KEY` | **REQUIRED (prod)** | runtime | (Supabase → Project Settings → API) | Service-role secret. Used by `uploadToStorage()` to write to Storage. **Highly privileged — never expose to the client.** Set as a Vercel *Secret*. |
| `SUPABASE_BUCKET` | Optional | runtime | `media` | Public Storage bucket name for uploads. Defaults to `media` if unset. **Must be created as a PUBLIC bucket in Supabase Storage** (see §8). |

> `.env` / `.env.local` carry extra SQLite-era keys (`DATABASE_PATH`,
> `UPLOAD_DIR`, `SESSION_SECRET`) that are **dead** for the Supabase build — keep
> them out of production env (or leave them; they're ignored).

### Copy-paste template (`.env.production` on the host)

```bash
NODE_ENV=production
DATABASE_URL=postgresql://postgres:JUNYO%4019813939@db.umnnzabvivodfqzyfnco.supabase.co:5432/postgres
NEXT_PUBLIC_SITE_URL=https://atora.com.my
ADMIN_DEFAULT_EMAIL=admin@atora.com.my
ADMIN_DEFAULT_PASSWORD=__SET_A_STRONG_UNIQUE_PASSWORD__
ADMIN_DEFAULT_NAME=Administrator

# --- Object storage (Supabase Storage) — REQUIRED for Vercel ---
SUPABASE_URL=https://db.umnnzabvivodfqzyfnco.supabase.co
SUPABASE_SERVICE_ROLE_KEY=__PASTE_SERVICE_ROLE_KEY__
SUPABASE_BUCKET=media
```

---

## 3. DNS & TLS checklist — `atora.com.my`

- [ ] **Apex record:** point `atora.com.my` at the host.
  - PaaS (Vercel/Render/Railway/Fly): use the provider's **CNAME/ALIAS/ANAME**
    target (apex often needs ALIAS/ANAME or Cloudflare CNAME-flattening — a bare
    `A` to a PaaS IP is brittle).
  - VPS: `A`/`AAAA` → server IP.
- [ ] **`www` subdomain:** `CNAME www.atora.com.my` → same target, then redirect
      `www` → apex (or vice-versa) at the proxy.
- [ ] **TLS:** provision HTTPS (Let's Encrypt via Caddy/nginx, or provider-managed).
      HSTS header is already sent (max-age 2y, `includeSubDomains`, `preload`) — so
      **both apex and www must serve HTTPS before enabling `preload`**, and you
      cannot easily roll HSTS back once submitted.
- [ ] **Reverse proxy (self-host VPS only):** nginx/Caddy in front →
      `proxy_pass` to `localhost:3000` (or `:3100` for `scripts/server.cjs`),
      terminate TLS, force HTTP→HTTPS, and proxy `/uploads` to the persisted volume.
- [ ] **App consequence:** admin cookie is `secure` only when
      `NODE_ENV==='production'` → admin login **requires HTTPS**. Don't serve the
      app over plain HTTP.
- [ ] **Verify:** `https://atora.com.my/en` → 200; `https://atora.com.my/admin/login` → 200; `http://…` redirects to `https://…`.

---

## 4. Uploads persistence — RESOLVED: object storage (Supabase Storage)

Decision for `atora.com.my`: **(b) Object storage.** Code is already implemented
(`src/lib/storage.ts` + `src/app/api/upload/route.ts`): uploads go to a **public**
Supabase Storage bucket `media` first; if Storage env is missing it falls back to
local `public/uploads` (local dev only). This makes uploads survive Vercel's
ephemeral filesystem across redeploys.

- [x] **(b) Object storage** — `uploadToStorage()` POSTs to
      `${SUPABASE_URL}/storage/v1/object/${BUCKET}/uploads/<name>` with the
      service-role key and returns the public URL. The client (`MediaUploader.tsx`)
      uses the returned URL as-is.
- [ ] **Action required:** create the **public** bucket `media` in Supabase Storage
      (Storage → New bucket → name `media`, **Public** = on). Without a matching
      bucket the upload errors and falls back to local disk (which Vercel will lose).
      See §8 step 3.
- [ ] **(a) Persistent volume** — not needed on Vercel.
- [ ] **(c) Accept loss** — rejected.

Note: the `<img>`/`<Image>` tag loads the Supabase URL directly. `next.config.mjs`
`images.remotePatterns` is already `https://**`, so the Supabase host is allowed.

---

## 5. Build & run (host commands)

```bash
# 1) set env (incl. NEXT_PUBLIC_SITE_URL) BEFORE build
npm ci
NODE_OPTIONS= npm run build      # on the real host plain `npm run build` works;
                                 # the NODE_OPTIONS= form only avoids the sandbox
                                 # safe-delete shim in this dev environment
# 2) run
npm start                        # next start -p 3000  (standard)
#   OR the custom single-process server:
PORT=3100 node scripts/server.cjs
```

- **Do NOT** run `npm run db:init` / `npm run db:seed` on the host — tables already
  exist in Supabase. Only run `npm run admin:create` if you need to (re)create the
  admin (idempotent: skips if one exists).
- Health: `GET /en` and `GET /admin/login` should return 200; `/` should 302 → `/en`.

---

## 6. Pre-Phase C decisions — RESOLVED

1. **Deploy target → Vercel** (serverless Next.js). `vercel.json` added (§8).
   Custom `scripts/server.cjs` is **not** used on Vercel (custom servers are
   unsupported there — Vercel runs the standard Next.js output).
2. **Uploads → Object storage (Supabase Storage)** — resolved in §4.
3. **Admin password → ROTATED** (Task 23). Old `Atora@2026` replaced by a freshly
   generated 20-char hash in live Supabase (`admin_users` id=1). **See §8 "Credentials".**
4. **Apex + www both on Vercel** (no Cloudflare proxy in front unless desired).
   Vercel assigns apex ANAME/ALIAS + `www` CNAME automatically once the domain is
   added (§8 step 6).
5. **HSTS `preload`** — enable only after both apex + www return HTTPS for a while
   (do not submit to the preload list on day one).

All five go/no-go items are resolved — proceed to §8.

---

## 7. Security notes (carried forward)

- Rotate the admin password before go-live.
- HSTS `preload` is irreversible-ish once submitted to the preload list — verify
  both hostnames over HTTPS first.
- CSP currently allows `'unsafe-inline'` (Next/Tailwind requirement); tighten with
  nonces in a later pass.
- Images allow all `https` hosts — tighten once all origins are enumerated.

---

## 8. Phase C — Vercel go-live runbook (`atora.com.my`)

**Prereqs**
- Repo pushed to GitHub/GitLab/Bitbucket (Vercel imports from git).
- Vercel account; `vercel` CLI optional (`npm i -g vercel`).
- Supabase project live (already is) + the service-role key handy.

### Step 1 — Import the repo
- Vercel dashboard → **Add New → Project** → pick the `atora-website` repo.
- Framework preset auto-detects **Next.js**. `vercel.json` pins `installCommand`,
  `buildCommand`, region `sin1`, and the upload function's `maxDuration`.

### Step 2 — Set environment variables (Project Settings → Environment Variables)
Set for **Production** (and Preview if you want staging). Use these exact values:

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | `postgresql://postgres:JUNYO%4019813939@db.umnnzabvivodfqzyfnco.supabase.co:5432/postgres` |
| `NEXT_PUBLIC_SITE_URL` | `https://atora.com.my` |
| `ADMIN_DEFAULT_EMAIL` | `admin@atora.com.my` |
| `ADMIN_DEFAULT_PASSWORD` | (any strong value — only used if you re-run `admin:create`) |
| `SUPABASE_URL` | `https://db.umnnzabvivodfqzyfnco.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | `«paste service-role key»` |
| `SUPABASE_BUCKET` | `media` |

> `NEXT_PUBLIC_SITE_URL` is **build-time** — it must be present before the first
> build, not just at runtime, or canonical/sitemap URLs point at localhost.
> `SUPABASE_SERVICE_ROLE_KEY` is a Vercel **Secret** (server-only); it is never
> inlined into the client bundle.

### Step 3 — Create the public `media` bucket (Supabase)
- Supabase → **Storage → New bucket** → name `media`, tick **Public**.
- (Optional) add an RLS policy allowing anon `SELECT` on `media` (public buckets
  already serve objects via the public URL; this is for completeness).
- Without this bucket, `/api/upload` returns an error and falls back to local disk,
  which Vercel discards on every redeploy.

### Step 4 — Deploy
- Push to the production branch (e.g. `main`) → Vercel auto-builds, **or**
  `vercel --prod` from the repo root.
- Watch the build log: it must show `✓ Compiled successfully` and `✓ Generating
  static pages`. If it fails, the most likely cause is a missing `NEXT_PUBLIC_*`
  (re-run with env set) or a Supabase connection error during `next build` (the
  app does **not** connect to the DB at build time, so a build failure points to
  code/types, not the DB).

### Step 5 — Add the custom domains
- Vercel → Project → **Settings → Domains** → add `atora.com.my` and `www.atora.com.my`.
- Vercel shows the DNS records to set at your registrar:
  - Apex `atora.com.my` → Vercel **ANAME/ALIAS** target (or the two A records
    `76.76.21.21` / `66.33.60.130` if your DNS host lacks ALIAS).
  - `www.atora.com.my` → **CNAME** to `cname.vercel-dns.com`.
- Vercel auto-provisions TLS (HTTPS) for both and redirects `www` → apex (or set
  the redirect in the Domains panel).

### Step 6 — Post-deploy verification
- [ ] `https://atora.com.my/en` → 200.
- [ ] `https://atora.com.my/admin/login` → 200.
- [ ] `http://atora.com.my/en` → 308 redirect to `https://…` (HSTS active).
- [ ] Login at `/admin/login` with the **new** password (§8 Credentials).
- [ ] Create → upload a logo in admin → confirm the returned URL is
      `https://db.umnnzabvivodfqzyfnco.supabase.co/storage/v1/object/public/media/…`
      (proves object storage path, not local disk).
- [ ] Edit + Delete a test row → brands count returns to baseline in Supabase.

### Credentials (deliver to site owner, then store in a password manager)
- **Admin email:** `admin@atora.com.my`
- **Admin password (rotated 2026-08-22):** `7xQtYCdPnZJWTngt4rWU`
  (replaces the old insecure default `Atora@2026`). This is the only copy — it is
  a bcrypt hash in `admin_users`; there is no recovery except `admin:create`.

### Gotchas / notes
- **Custom `scripts/server.cjs` is NOT used on Vercel.** Vercel runs the standard
  Next.js serverless output. Don't set a custom `start` command.
- **Video uploads > platform body limit.** Vercel serverless function request body
  is capped (~4.5 MB on Hobby, larger on Pro). Logo images (≤8 MB) may still exceed
  Hobby's limit. For reliable 50 MB video uploads, either use a **Pro** plan or
  switch to a client-side direct-to-Supabase upload (signed URL) — future work.
- **`@supabase/supabase-js` is intentionally not added.** `src/lib/storage.ts` uses
  the Storage REST API via `fetch` — one less dependency, smaller bundle.
- **Rollback:** Vercel keeps immutable deployments; to roll back, promote the prior
  deployment from the Deployments list. DB/schema are untouched by app deploys.
- **HSTS `preload`:** only submit `atora.com.my` to hstspreload.org after both apex
  and www have served HTTPS reliably for a few weeks.
