-- System Emails Phase 3: delivery status from Resend webhooks. Run ONE statement at a time in D1 Studio.
ALTER TABLE email_delivery_logs ADD COLUMN delivery_status TEXT NOT NULL DEFAULT '';
ALTER TABLE email_delivery_logs ADD COLUMN delivery_detail TEXT NOT NULL DEFAULT '';
ALTER TABLE email_delivery_logs ADD COLUMN status_at INTEGER;
CREATE INDEX IF NOT EXISTS idx_email_logs_provider ON email_delivery_logs (provider_id);
CREATE TABLE IF NOT EXISTS email_webhook_events (id TEXT PRIMARY KEY, type TEXT NOT NULL, provider_id TEXT NOT NULL DEFAULT '', matched INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL DEFAULT (unixepoch()));
