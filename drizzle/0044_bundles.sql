-- Database Bundles marketplace (CLAUDE.md section 119). Run ONE statement at a time in D1 Studio.
CREATE TABLE bundle_categories (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  slug text NOT NULL,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0
);
--> statement-breakpoint
CREATE UNIQUE INDEX bundle_categories_slug_uq ON bundle_categories (slug);
--> statement-breakpoint
CREATE TABLE bundles (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  slug text NOT NULL,
  name text NOT NULL,
  short_description text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  category_slug text NOT NULL DEFAULT '',
  label text NOT NULL DEFAULT '',
  image text NOT NULL DEFAULT '',
  items_json text NOT NULL DEFAULT '[]',
  price_mode text NOT NULL DEFAULT 'percent',
  discount_percent integer NOT NULL DEFAULT 0,
  fixed_price_cents integer NOT NULL DEFAULT 0,
  featured integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  excluded_json text NOT NULL DEFAULT '[]',
  seo_title text NOT NULL DEFAULT '',
  meta_description text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at integer NOT NULL DEFAULT (unixepoch()),
  updated_at integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX bundles_slug_uq ON bundles (slug);
--> statement-breakpoint
CREATE TABLE order_bundles (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  order_id text NOT NULL,
  bundle_slug text NOT NULL,
  bundle_name text NOT NULL,
  price_cents integer NOT NULL,
  list_cents integer NOT NULL,
  items_json text NOT NULL DEFAULT '[]',
  created_at integer NOT NULL DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE INDEX order_bundles_order_idx ON order_bundles (order_id);
