-- Blog CMS. Article bodies, revisions and images live in R2 (binding LISTS, prefix blog/);
-- D1 holds what must be searched, filtered and kept unique.
CREATE TABLE IF NOT EXISTS blog_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  seo_title TEXT NOT NULL DEFAULT '',
  meta_description TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE UNIQUE INDEX IF NOT EXISTS blog_categories_slug_uq ON blog_categories (slug);

CREATE TABLE IF NOT EXISTS blog_tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  slug TEXT NOT NULL,
  name TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS blog_tags_slug_uq ON blog_tags (slug);

CREATE TABLE IF NOT EXISTS blog_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft',
  category_id INTEGER,
  author TEXT NOT NULL DEFAULT '',
  featured_image TEXT,
  featured_alt TEXT NOT NULL DEFAULT '',
  reading_minutes INTEGER NOT NULL DEFAULT 1,
  search_text TEXT NOT NULL DEFAULT '',
  seo_title TEXT NOT NULL DEFAULT '',
  meta_description TEXT NOT NULL DEFAULT '',
  canonical_url TEXT NOT NULL DEFAULT '',
  noindex INTEGER NOT NULL DEFAULT 0,
  og_title TEXT NOT NULL DEFAULT '',
  og_description TEXT NOT NULL DEFAULT '',
  og_image TEXT,
  focus_keyword TEXT NOT NULL DEFAULT '',
  related_json TEXT NOT NULL DEFAULT '[]',
  published_at INTEGER,
  scheduled_at INTEGER,
  version INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_by TEXT NOT NULL DEFAULT ''
);
CREATE UNIQUE INDEX IF NOT EXISTS blog_posts_slug_uq ON blog_posts (slug);
CREATE INDEX IF NOT EXISTS blog_posts_status_idx ON blog_posts (status, published_at);

CREATE TABLE IF NOT EXISTS blog_post_tags (
  post_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (post_id, tag_id)
);

CREATE TABLE IF NOT EXISTS blog_revisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  post_id INTEGER NOT NULL,
  version INTEGER NOT NULL,
  title TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  editor TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'manual',
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS blog_revisions_post_idx ON blog_revisions (post_id, id);

CREATE TABLE IF NOT EXISTS blog_media (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  key TEXT NOT NULL,
  filename TEXT NOT NULL,
  mime TEXT NOT NULL,
  size INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  alt TEXT NOT NULL DEFAULT '',
  uploaded_by TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE UNIQUE INDEX IF NOT EXISTS blog_media_key_uq ON blog_media (key);

CREATE TABLE IF NOT EXISTS blog_post_media (
  post_id INTEGER NOT NULL,
  media_id INTEGER NOT NULL,
  PRIMARY KEY (post_id, media_id)
);

CREATE TABLE IF NOT EXISTS blog_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  post_id INTEGER,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
