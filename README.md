# ATORA — Aircond Wholesale & Parts Supplier Website

Multi-brand B2B website for **ATORA AIR COND & ELECTRICAL SDN. BHD.** (东京冷气电器有限公司).

- **Stack**: Next.js 14 (App Router) + TypeScript + Tailwind CSS + better-sqlite3
- **Languages**: English (default) · Bahasa Malaysia · 简体中文
- **Service area**: Nationwide Malaysia (HQ + branches in Padang Serai, Sungai Petani, Kulim)
- **Database**: SQLite (file in `data/atora.db`). Swap for PostgreSQL/Supabase for production.

---

## Quick start

```bash
# 1) Install dependencies
npm install

# 2) Create your local .env file
cp .env.example .env   # (or just keep the defaults — they work out of the box)

# 3) Seed the database (admin, settings, 9 brands, 33 categories, 15 sample products + images, 3 locations, 3 partners, 12 FAQs)
npm run db:seed

# 4) Run the dev server
npm run dev

# Open:
#   http://localhost:3000        (auto-redirects to /en)
#   http://localhost:3000/admin  (admin login)
```

### Default admin login

```
Email:    admin@atora.com.my
Password: Atora@2026
```

**Change these immediately** via `/admin/settings` and `npm run admin:create` for a new account.

---

## Scripts

| Command | What it does |
| ------- | ------------ |
| `npm run dev` | Start dev server on `http://localhost:3000` |
| `npm run build` | Production build |
| `npm start` | Run production build |
| `npm run db:seed` | Reset + seed DB with sample data |
| `npm run admin:create -- email password "Name"` | Create or update an admin user |

---

## Project structure

```
atora-website/
├── data/                 SQLite DB lives here (gitignored)
├── messages/             i18n translation files (en, bm, zh)
├── public/uploads/       Media library (images, videos)
├── scripts/              CLI: init, seed, create-admin
├── src/
│   ├── app/
│   │   ├── [lang]/       Public site (en / bm / zh)
│   │   │   ├── page.tsx            Homepage (16 sections)
│   │   │   ├── products/           List + [slug] detail
│   │   │   ├── brands/             List + [slug] detail
│   │   │   ├── parts/              Aircond parts catalogue
│   │   │   ├── project-supply/
│   │   │   ├── technical-partners/ List + [slug] detail
│   │   │   ├── about/
│   │   │   ├── locations/
│   │   │   ├── contact/
│   │   │   └── faq/
│   │   ├── admin/        Admin dashboard
│   │   │   ├── login/
│   │   │   ├── dashboard/
│   │   │   ├── products/  Brands, Categories, Locations,
│   │   │   ├── brands/    Partners, Enquiries, FAQs,
│   │   │   ├── categories/ Media, Settings, Homepage
│   │   │   ├── ...
│   │   ├── api/
│   │   │   ├── enquiry/  POST: customer enquiry + uploads
│   │   │   └── upload/   POST: admin media upload
│   │   ├── sitemap.xml/  Auto-generated XML sitemap
│   │   └── robots.txt/
│   ├── components/       Shared UI (Header, Footer, ProductCard, …)
│   └── lib/              db, auth, i18n, settings, actions, formatters
└── tailwind.config.ts    Brand colours (white + blue palette)
```

---

## Admin walkthrough

After logging in at `/admin`, use the sidebar to manage:

| Section | What you can do |
| ------- | --------------- |
| **Dashboard** | Counts + recent enquiries |
| **Products** | Add / edit / delete / duplicate products, upload multiple images & videos, manage prices & price display mode |
| **Brands** | Manage aircond brands (logos, names in 3 languages) |
| **Categories** | Manage product categories |
| **Enquiries** | Status workflow: NEW → CONTACTED → QUOTED → COMPLETED → CANCELLED |
| **Locations** | Manage HQ, branches, warehouses. Add Google Maps Place ID, lat/lng, opening hours |
| **Partners** | Technical partner directory with privacy controls (show/hide phone/whatsapp/email/address/website) |
| **Homepage Content** | Edit dynamic homepage sections (product videos, etc.) |
| **Media Library** | List + preview all uploaded files |
| **Settings** | Company name (3 languages), HQ/branch phones, WhatsApp number, opening hours, SEO defaults, footer text |
| **FAQs** | Multilingual FAQ editor (covers the 12 mandatory questions) |

### Adding a product (typical flow)

1. `Products → + Add Product`
2. Fill in EN name (required), BM/Chinese names, SKU, model, capacity
3. Select **Brand** and **Category**
4. Write description in EN / BM / ZH
5. Set **Retail**, **Wholesale**, **Promotion**, **Min/Max** prices
6. Pick **Price Display Mode** (Show Price / Wholesale / Promotion / Range / Contact)
7. Toggle **Featured** + **Active**
8. Click *Create Product* → modal closes → row appears in the list
9. Click *Edit* on the new row → scroll down to the **Media** section (added below the form) to upload images and videos, reorder, and set a primary image

### Adding a location

1. `Locations → + Add Location`
2. Fill in **Name (EN)**, address, city, state, postal code
3. Add **Telephone**, **WhatsApp**, **Email**, **Opening Hours**
4. Either:
   - Add a **Google Maps URL** (e.g., `https://maps.app.goo.gl/...`), or
   - Add **Latitude + Longitude** (recommended for accuracy)
   - Optionally add **Google Maps Place ID** for the most reliable Directions link
5. Toggle **HQ** / **Active** / **Display Order**
6. Upload a **store photo**

### Adding a technical partner

1. `Partners → + Add Partner`
2. Fill in **Company Name (EN)** + at least one contact method
3. Pick **Service Types** (multi-select: Aircond Installation, Repair, Maintenance, etc.)
4. Add a **Service Area** (e.g. *"Northern Malaysia"*)
5. Upload **Logo** and **Photo**
6. Use the **Privacy** checkboxes to control which contact details are public
7. Set **Featured = ✓** to display on the homepage

---

## Languages

The site ships with **English (default)**, **Bahasa Malaysia**, and **简体中文**.

Users switch languages via the `EN | BM | 中文` controls in the header/footer. The choice is stored in a cookie (`atora_locale`) and persists across pages.

To translate a new product or FAQ field, add the EN field (required) and optionally fill in the BM/ZH equivalents. Public pages fall back to English when a translation is missing.

### Adding a new language

1. Add a translation file: `src/messages/<code>.json` (copy of `en.json`)
2. Add the code to `src/lib/i18n.ts` `LOCALES` array
3. Add the label to `LOCALE_LABELS` in the same file
4. Rebuild — done.

---

## Database

- Database file: `data/atora.db` (auto-created on first run)
- Schema: see `src/lib/db.ts`
- Tables: `products`, `brands`, `categories`, `product_media`, `enquiries`, `admin_users`, `sessions`, `site_settings`, `locations`, `faqs`, `technical_partners`, `price_history`, `homepage_content`

### Migrating to PostgreSQL / Supabase

The schema is plain SQL. The `src/lib/db.ts` and `src/lib/data.ts` files currently use `better-sqlite3`. To migrate:

1. Spin up a Supabase / Postgres instance
2. Translate the schema in `initSchema()` to Postgres syntax (mainly `AUTOINCREMENT → SERIAL` and `datetime('now') → NOW()`)
3. Swap `better-sqlite3` for `postgres-js` (or your driver of choice) in `src/lib/db.ts`
4. Adapt the few `db.prepare(sql).get/all(...)` calls to async if using a network-backed driver

All other code (pages, components, actions) is driver-agnostic and works unchanged.

---

## File uploads

- Endpoint: `POST /api/upload` (admin session only)
- Public endpoint: `POST /api/enquiry` (customer enquiry, accepts photo/video)
- Allowed **images**: JPG, JPEG, PNG, WEBP — max 8 MB
- Allowed **videos**: MP4, MOV, WEBM — max 50 MB
- Server checks MIME type + extension before writing
- Files are stored in `public/uploads/` with random names and served as `/uploads/<file>`

For production, swap the storage layer to Supabase Storage / Cloudinary / AWS S3 — the wrapper logic lives only in `src/app/api/upload/route.ts`.

---

## WhatsApp integration

- A single **WhatsApp number** controls the entire site (`Settings → whatsapp_number`)
- All `WhatsApp` CTAs dynamically build a `https://wa.me/<number>?text=<msg>` URL
- The `ProductCard`, `LocationCard`, `PartnerCard`, and enquiry forms all use this single source

To change the WhatsApp number: `Admin → Settings → Contact → WhatsApp Number (international, no +)`. Save. Done.

---

## SEO

- Each page sets `<title>` + `<meta description>` + `<link rel="canonical">`
- Sitemap: `GET /sitemap.xml` returns an XML sitemap of all products / brands / partners in all languages
- Robots: `GET /robots.txt` allows the site, excludes `/admin/` and `/api/`
- FAQ page includes **FAQ Schema** structured data
- Open Graph + hreflang tags are pre-wired

Set the canonical site URL via `NEXT_PUBLIC_SITE_URL` in `.env` (default: `https://atora.com.my`).

---

## Production deployment

```bash
# Build the production bundle
npm run build

# Start the production server
npm start
```

### Required environment variables

| Variable | Required | Description |
| -------- | -------- | ----------- |
| `NEXT_PUBLIC_SITE_URL` | yes (for SEO) | Public site URL, e.g. `https://atora.com.my` |
| `DATABASE_PATH` | optional | SQLite file path (default: `./data/atora.db`) |
| `UPLOAD_DIR` | optional | Media storage path (default: `./public/uploads`) |
| `ADMIN_DEFAULT_EMAIL` | for seed only | Admin email (default: `admin@atora.com.my`) |
| `ADMIN_DEFAULT_PASSWORD` | for seed only | Admin password (default: `Atora@2026`) |

### Recommended production targets

- **Vercel** — zero-config Next.js hosting (use a managed Postgres for the DB)
- **Railway / Render** — Docker host for long-running SQLite
- **Self-host with PM2 + nginx** — Linux VPS, persistent volume for `data/` and `public/uploads/`

### Recommended production hardening (before going live)

1. **Change the default admin password** (`/admin/settings` + run `npm run admin:create`)
2. **Switch the database to PostgreSQL** for write concurrency
3. **Move uploads to S3 / Cloudinary / Supabase Storage** (replace `src/app/api/upload/route.ts`)
4. **Set `NEXT_PUBLIC_SITE_URL`** to the real domain (sitemap + canonical tags)
5. **Configure HTTPS** at the proxy (Caddy / nginx / Cloudflare)
6. **Set up daily DB backups** (`data/atora.db`)
7. **Add Sentry / Logflare** for error tracking
8. **Add Google Analytics / Plausible** if you want traffic data

---

## Tests to run before going live

| Area | What to check |
| ---- | ------------- |
| **Three Languages** | Toggle EN / BM / 中文 — every label and page text should switch |
| **Product Search** | Try a partial model number in `/products?q=` |
| **Product Filter** | Filter by brand and category |
| **Product Page** | Open a product, verify price display mode, gallery, WhatsApp link |
| **Price Management** | Edit a product's prices → verify the change appears on the public page |
| **Image Upload** | Upload a JPG via product editor → confirm it appears |
| **Video Upload** | Upload an MP4 → confirm playback |
| **Customer Enquiry** | Submit the homepage quick enquiry + /contact form → check `/admin/enquiries` |
| **WhatsApp** | Click any "WhatsApp" button — should open wa.me with prefilled text |
| **Telephone** | Click any "Call" button on mobile → should dial |
| **Google Maps** | On `/locations`, click "Get Directions" — should open Google Maps |
| **Admin Login** | Wrong password → error; correct → dashboard |
| **Admin Pages** | Open each of: Products, Brands, Categories, Locations, Partners, Enquiries, FAQs, Media, Settings, Homepage — make sure none throw errors |
| **SEO** | View source on each page — confirm title, description, canonical, hreflang |
| **Mobile** | Open on a phone — bottom mobile bar visible, everything tappable, no horizontal scroll |
| **Page Speed** | Lighthouse → aim for 80+ on mobile, 90+ desktop |

---

## Support & maintenance

For any field that's currently a placeholder (store photos, product photos, video files, partner logos, exact Google Maps Place IDs), use the admin to upload them — the system is fully data-driven and there are no hard-coded paths in the public site code.
