-- Cart funnel counters (anonymous: event name + item count only). Run ONE statement at a time in D1 Studio.
CREATE TABLE IF NOT EXISTS cart_events (id INTEGER PRIMARY KEY AUTOINCREMENT, event TEXT NOT NULL, items INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL DEFAULT (unixepoch()));
CREATE INDEX IF NOT EXISTS idx_cart_events_event ON cart_events (event, created_at);
