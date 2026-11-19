CREATE TABLE help_categories (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  icon text NOT NULL DEFAULT 'book',
  description text NOT NULL DEFAULT '',
  sort integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'published',
  created_at integer NOT NULL DEFAULT (unixepoch()),
  updated_at integer
);
--> statement-breakpoint
CREATE TABLE help_articles (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  category text NOT NULL,
  slug text NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  keywords text NOT NULL DEFAULT '[]',
  body text NOT NULL DEFAULT '[]',
  related text NOT NULL DEFAULT '[]',
  cta_label text,
  cta_href text,
  grp text NOT NULL DEFAULT '',
  sort integer NOT NULL DEFAULT 0,
  featured integer NOT NULL DEFAULT 0,
  common integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  seo_title text,
  meta_description text,
  noindex integer NOT NULL DEFAULT 0,
  updated text,
  created_at integer NOT NULL DEFAULT (unixepoch()),
  updated_at integer NOT NULL DEFAULT 0,
  UNIQUE (category, slug)
);
--> statement-breakpoint
CREATE TABLE help_search_log (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  q text NOT NULL,
  results integer NOT NULL DEFAULT 0,
  created_at integer NOT NULL DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE TABLE help_views (
  article_id text NOT NULL,
  day text NOT NULL,
  views integer NOT NULL DEFAULT 0,
  PRIMARY KEY (article_id, day)
);
