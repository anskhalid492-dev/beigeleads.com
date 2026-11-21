-- Email List Verification Service (CLAUDE.md section 120). Run one statement at a time in D1 Studio.
CREATE TABLE ev_orders (id TEXT PRIMARY KEY, order_id TEXT NOT NULL, email TEXT NOT NULL, package_name TEXT NOT NULL, limit_count INTEGER NOT NULL, price_cents INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'awaiting_payment', token_hash TEXT NOT NULL, submitted_count INTEGER NOT NULL DEFAULT 0, note TEXT NOT NULL DEFAULT '', action_reason TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL DEFAULT (unixepoch()), paid_at INTEGER, submitted_at INTEGER, processing_at INTEGER, completed_at INTEGER, delivered_at INTEGER, reminder_sent_at INTEGER, purged_at INTEGER);
CREATE UNIQUE INDEX ev_orders_order ON ev_orders (order_id);
CREATE UNIQUE INDEX ev_orders_token ON ev_orders (token_hash);
CREATE INDEX ev_orders_status ON ev_orders (status, created_at);
CREATE TABLE ev_files (id TEXT PRIMARY KEY, ev_order_id TEXT NOT NULL, kind TEXT NOT NULL, state TEXT NOT NULL DEFAULT 'pending', r2_key TEXT NOT NULL, filename TEXT NOT NULL, size_bytes INTEGER NOT NULL DEFAULT 0, format TEXT NOT NULL DEFAULT '', source TEXT NOT NULL DEFAULT 'upload', entry_count INTEGER NOT NULL DEFAULT 0, column_label TEXT NOT NULL DEFAULT '', candidates_json TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL DEFAULT (unixepoch()), deleted_at INTEGER);
CREATE INDEX ev_files_order ON ev_files (ev_order_id, kind);
CREATE TABLE ev_quotes (id INTEGER PRIMARY KEY AUTOINCREMENT, reference TEXT NOT NULL, name TEXT NOT NULL, email TEXT NOT NULL, estimated_count TEXT NOT NULL DEFAULT '', requirements TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'new', note TEXT NOT NULL DEFAULT '', dedupe_key TEXT NOT NULL, owner_notify TEXT NOT NULL DEFAULT 'pending', created_at INTEGER NOT NULL DEFAULT (unixepoch()));
CREATE UNIQUE INDEX ev_quotes_dedupe ON ev_quotes (dedupe_key);
CREATE TABLE ev_events (id INTEGER PRIMARY KEY AUTOINCREMENT, ev_order_id TEXT NOT NULL, actor TEXT NOT NULL, action TEXT NOT NULL, detail TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL DEFAULT (unixepoch()));
CREATE INDEX ev_events_order ON ev_events (ev_order_id, id);
