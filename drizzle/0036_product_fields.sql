-- Editable product fields, built-in products in the database, samples and old-slug redirects (section 96). Run ONE statement at a time in D1 Studio.
ALTER TABLE catalog_products ADD COLUMN data_fields_json text NOT NULL DEFAULT '[]';
ALTER TABLE catalog_products ADD COLUMN file_formats text;
ALTER TABLE catalog_products ADD COLUMN coverage text;
ALTER TABLE catalog_products ADD COLUMN last_updated text;
ALTER TABLE catalog_products ADD COLUMN origin text NOT NULL DEFAULT 'import';
ALTER TABLE catalog_products ADD COLUMN placeholder integer NOT NULL DEFAULT 0;
ALTER TABLE catalog_products ADD COLUMN for_sale integer NOT NULL DEFAULT 1;
ALTER TABLE catalog_products ADD COLUMN accuracy_pct integer;
ALTER TABLE catalog_products ADD COLUMN scope text;
ALTER TABLE catalog_products ADD COLUMN sample_json text;
CREATE TABLE slug_aliases (old_slug text PRIMARY KEY NOT NULL, new_slug text NOT NULL, created_at integer NOT NULL DEFAULT (unixepoch()));
