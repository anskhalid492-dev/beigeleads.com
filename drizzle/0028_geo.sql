-- Geography catalog (regions and cities per country) + real inventory per industry and place. Run ONE statement at a time in D1 Studio.
CREATE TABLE IF NOT EXISTS geo_areas (id INTEGER PRIMARY KEY AUTOINCREMENT, country_slug TEXT NOT NULL, parent_id INTEGER, parent_key INTEGER NOT NULL DEFAULT 0, level TEXT NOT NULL, slug TEXT NOT NULL, name TEXT NOT NULL, indexable INTEGER NOT NULL DEFAULT 1, created_at INTEGER NOT NULL DEFAULT (unixepoch()));
CREATE UNIQUE INDEX IF NOT EXISTS geo_areas_uq ON geo_areas (country_slug, parent_key, slug);
CREATE TABLE IF NOT EXISTS geo_coverage (id INTEGER PRIMARY KEY AUTOINCREMENT, category_slug TEXT NOT NULL, area_id INTEGER NOT NULL, record_count INTEGER NOT NULL, updated_at INTEGER NOT NULL DEFAULT (unixepoch()));
CREATE UNIQUE INDEX IF NOT EXISTS geo_coverage_uq ON geo_coverage (category_slug, area_id);
