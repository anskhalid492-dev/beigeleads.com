-- WooCommerce product import + imported catalog (CLAUDE.md section 91). Run ONE statement at a time in D1 Studio.
CREATE TABLE catalog_imports (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  source text NOT NULL DEFAULT 'woocommerce',
  filename text,
  status text NOT NULL DEFAULT 'running',
  total integer NOT NULL DEFAULT 0,
  created integer NOT NULL DEFAULT 0,
  updated integer NOT NULL DEFAULT 0,
  skipped integer NOT NULL DEFAULT 0,
  failed integer NOT NULL DEFAULT 0,
  note text,
  created_at integer NOT NULL DEFAULT (unixepoch()),
  finished_at integer,
  rolled_back_at integer
);
--> statement-breakpoint
CREATE TABLE catalog_products (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  import_id integer,
  source_id text,
  slug text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  name text NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  original_description text,
  category_slug text NOT NULL,
  category_name text NOT NULL,
  channel text NOT NULL,
  grp text NOT NULL DEFAULT 'general',
  job_title text,
  country_slug text NOT NULL,
  country_code text NOT NULL,
  country_name text NOT NULL,
  region text,
  city text,
  restricted_json text NOT NULL DEFAULT '[]',
  flags_json text NOT NULL DEFAULT '[]',
  record_count integer,
  packages_json text NOT NULL DEFAULT '[]',
  seo_title text,
  meta_description text,
  image_url text,
  tags_json text NOT NULL DEFAULT '[]',
  source_json text NOT NULL DEFAULT '{}',
  note text,
  created_at integer NOT NULL DEFAULT (unixepoch()),
  updated_at integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX catalog_products_slug_uq ON catalog_products (slug);
--> statement-breakpoint
CREATE UNIQUE INDEX catalog_products_source_uq ON catalog_products (source_id);
--> statement-breakpoint
CREATE INDEX catalog_products_import_idx ON catalog_products (import_id, status);
--> statement-breakpoint
CREATE TABLE catalog_import_errors (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  import_id integer NOT NULL,
  source_id text,
  message text NOT NULL,
  created_at integer NOT NULL DEFAULT (unixepoch())
);
