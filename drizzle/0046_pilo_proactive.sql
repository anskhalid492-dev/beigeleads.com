-- Proactive Pilo messages: anonymous analytics (one row per session + stage + event). Run ONE statement at a time in D1 Studio.
CREATE TABLE IF NOT EXISTS beigepilot_proactive_events (id INTEGER PRIMARY KEY AUTOINCREMENT, session_id TEXT NOT NULL, stage INTEGER NOT NULL, event TEXT NOT NULL, template_id TEXT NOT NULL DEFAULT '', page_type TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL DEFAULT (unixepoch()));
CREATE UNIQUE INDEX IF NOT EXISTS idx_bpp_unique ON beigepilot_proactive_events (session_id, stage, event);
CREATE INDEX IF NOT EXISTS idx_bpp_time ON beigepilot_proactive_events (created_at);
