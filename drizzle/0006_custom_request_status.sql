-- Admin-managed status for custom list requests (new table; the request table is untouched).
CREATE TABLE IF NOT EXISTS custom_request_status (
  request_id INTEGER PRIMARY KEY NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  updated_by TEXT NOT NULL,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
