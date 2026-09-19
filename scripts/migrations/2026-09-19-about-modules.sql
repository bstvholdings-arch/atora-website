-- ============================================================================
-- ATORA — About Us modules migration (awards / photo wall / comment board)
-- Date: 2026-09-19
-- Idempotent: safe to run repeatedly (CREATE TABLE / INDEX IF NOT EXISTS).
-- Apply with:  node scripts/apply-migration.mjs scripts/migrations/2026-09-19-about-modules.sql
--          or: paste into the Supabase SQL editor.
-- ============================================================================

-- Awards & medals ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS awards (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  year TEXT,
  award_date TEXT,
  title_en TEXT NOT NULL,
  title_bm TEXT,
  title_zh TEXT,
  issuer_en TEXT,
  issuer_bm TEXT,
  issuer_zh TEXT,
  summary_en TEXT,
  summary_bm TEXT,
  summary_zh TEXT,
  story_en TEXT,
  story_bm TEXT,
  story_zh TEXT,
  cover_image TEXT,
  cover_thumb TEXT,
  seo_title_en TEXT,
  seo_title_bm TEXT,
  seo_title_zh TEXT,
  seo_desc_en TEXT,
  seo_desc_bm TEXT,
  seo_desc_zh TEXT,
  sort_order INTEGER DEFAULT 0,
  is_published INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Award media (medal / trophy / certificate photos) --------------------------
CREATE TABLE IF NOT EXISTS award_media (
  id SERIAL PRIMARY KEY,
  award_id INTEGER NOT NULL REFERENCES awards(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'image',
  file_path TEXT NOT NULL,
  thumb_path TEXT,
  caption_en TEXT,
  caption_bm TEXT,
  caption_zh TEXT,
  alt_en TEXT,
  alt_bm TEXT,
  alt_zh TEXT,
  is_cover INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Photo wall / album ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS gallery (
  id SERIAL PRIMARY KEY,
  title_en TEXT,
  title_bm TEXT,
  title_zh TEXT,
  caption_en TEXT,
  caption_bm TEXT,
  caption_zh TEXT,
  alt_en TEXT,
  alt_bm TEXT,
  alt_zh TEXT,
  year TEXT,
  event_name TEXT,
  file_path TEXT NOT NULL,
  thumb_path TEXT,
  sort_order INTEGER DEFAULT 0,
  is_cover INTEGER DEFAULT 0,
  is_published INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Comment board --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  parent_id INTEGER REFERENCES comments(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  message TEXT NOT NULL,
  rating INTEGER,
  language TEXT DEFAULT 'en',
  page TEXT,
  award_id INTEGER REFERENCES awards(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending',
  ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_awards_published ON awards(is_published, sort_order);
CREATE INDEX IF NOT EXISTS idx_awards_slug ON awards(slug);
CREATE INDEX IF NOT EXISTS idx_award_media_award ON award_media(award_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_gallery_published ON gallery(is_published, sort_order);
CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status, created_at);
CREATE INDEX IF NOT EXISTS idx_comments_award ON comments(award_id);
