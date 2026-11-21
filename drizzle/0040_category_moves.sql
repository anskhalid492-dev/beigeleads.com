CREATE TABLE IF NOT EXISTS catalog_category_moves (id INTEGER PRIMARY KEY AUTOINCREMENT, batch TEXT NOT NULL, product_id INTEGER NOT NULL, product_slug TEXT NOT NULL, from_category_slug TEXT NOT NULL, from_category_name TEXT NOT NULL, to_category_slug TEXT NOT NULL, reason TEXT NOT NULL DEFAULT '', moved_at INTEGER NOT NULL, rolled_back_at INTEGER)
;
