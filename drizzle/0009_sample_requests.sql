ALTER TABLE sample_requests ADD COLUMN product_slug text;
--> statement-breakpoint
ALTER TABLE sample_requests ADD COLUMN custom_request text;
--> statement-breakpoint
ALTER TABLE sample_requests ADD COLUMN dedupe_key text;
--> statement-breakpoint
ALTER TABLE sample_requests ADD COLUMN email_status text NOT NULL DEFAULT 'pending';
--> statement-breakpoint
ALTER TABLE sample_requests ADD COLUMN email_error text;
--> statement-breakpoint
ALTER TABLE sample_requests ADD COLUMN attempts integer NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE sample_requests ADD COLUMN updated_at integer;
--> statement-breakpoint
ALTER TABLE sample_requests ADD COLUMN admin_note text;
--> statement-breakpoint
CREATE UNIQUE INDEX sample_requests_dedupe_uq ON sample_requests (dedupe_key);
