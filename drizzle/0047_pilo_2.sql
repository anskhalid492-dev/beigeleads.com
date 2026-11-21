-- BeigePilot 2.0: negotiation offers + anonymous analytics events. Run ONE statement at a time in D1 Studio.
CREATE TABLE IF NOT EXISTS pilo_offers (id INTEGER PRIMARY KEY AUTOINCREMENT, session_id TEXT NOT NULL, code TEXT NOT NULL, promotion_id INTEGER NOT NULL DEFAULT 0, percent INTEGER NOT NULL, level_no INTEGER NOT NULL DEFAULT 1, status TEXT NOT NULL DEFAULT 'offered', ip_hash TEXT NOT NULL DEFAULT '', cart_json TEXT NOT NULL DEFAULT '[]', expires_at INTEGER NOT NULL, applied_at INTEGER, created_at INTEGER NOT NULL DEFAULT (unixepoch()));
CREATE UNIQUE INDEX IF NOT EXISTS idx_pilo_offers_code ON pilo_offers (code);
CREATE INDEX IF NOT EXISTS idx_pilo_offers_session ON pilo_offers (session_id);
CREATE TABLE IF NOT EXISTS pilo_events (id INTEGER PRIMARY KEY AUTOINCREMENT, session_id TEXT NOT NULL, event TEXT NOT NULL, detail TEXT NOT NULL DEFAULT '', page_type TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL DEFAULT (unixepoch()));
CREATE INDEX IF NOT EXISTS idx_pilo_events_time ON pilo_events (created_at, event);
