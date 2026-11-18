-- Custom list builder 2.0. Old columns stay and are still filled (category = industries joined, country = countries joined, ...),
-- so historical requests and the old admin view keep working. New structured data lives in detail_json.
ALTER TABLE custom_list_requests ADD COLUMN reference TEXT;
ALTER TABLE custom_list_requests ADD COLUMN name TEXT;
ALTER TABLE custom_list_requests ADD COLUMN company TEXT;
ALTER TABLE custom_list_requests ADD COLUMN audience TEXT;
ALTER TABLE custom_list_requests ADD COLUMN detail_json TEXT;
ALTER TABLE custom_list_requests ADD COLUMN dedupe_key TEXT;
ALTER TABLE custom_list_requests ADD COLUMN owner_notify TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE custom_list_requests ADD COLUMN customer_email_status TEXT NOT NULL DEFAULT 'pending';
CREATE UNIQUE INDEX IF NOT EXISTS custom_list_requests_reference_uq ON custom_list_requests (reference);
CREATE UNIQUE INDEX IF NOT EXISTS custom_list_requests_dedupe_uq ON custom_list_requests (dedupe_key);
ALTER TABLE custom_request_status ADD COLUMN note TEXT NOT NULL DEFAULT '';
