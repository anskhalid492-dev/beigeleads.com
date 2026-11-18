-- Blog authors. Posts keep their old text "author" column (legacy names are preserved);
-- author_id links a post to a real profile when one is chosen.
CREATE TABLE IF NOT EXISTS blog_authors (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  slug TEXT NOT NULL,
  full_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  short_bio TEXT NOT NULL DEFAULT '',
  full_bio TEXT NOT NULL DEFAULT '',
  expertise_json TEXT NOT NULL DEFAULT '[]',
  company TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  photo TEXT,
  links_json TEXT NOT NULL DEFAULT '{}',
  seo_title TEXT NOT NULL DEFAULT '',
  meta_description TEXT NOT NULL DEFAULT '',
  og_image TEXT,
  canonical_url TEXT NOT NULL DEFAULT '',
  noindex INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_by TEXT NOT NULL DEFAULT ''
);
CREATE UNIQUE INDEX IF NOT EXISTS blog_authors_slug_uq ON blog_authors (slug);
ALTER TABLE blog_posts ADD COLUMN author_id INTEGER;
CREATE INDEX IF NOT EXISTS blog_posts_author_idx ON blog_posts (author_id);
