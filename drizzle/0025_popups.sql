-- Popup campaigns (Phase 1). Run ONE statement at a time in D1 Studio.
CREATE TABLE IF NOT EXISTS popup_campaigns (id TEXT PRIMARY KEY, name TEXT NOT NULL, stage TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'draft', priority INTEGER NOT NULL DEFAULT 50, content_json TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 1, created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()));
CREATE TABLE IF NOT EXISTS popup_events (id INTEGER PRIMARY KEY AUTOINCREMENT, campaign_id TEXT NOT NULL, event TEXT NOT NULL, page_type TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL DEFAULT (unixepoch()));
CREATE INDEX IF NOT EXISTS idx_popup_events_campaign ON popup_events (campaign_id, event, created_at);
