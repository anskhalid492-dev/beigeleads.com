ALTER TABLE email_templates ADD COLUMN name text NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE email_templates ADD COLUMN base_key text NOT NULL DEFAULT '';
--> statement-breakpoint
CREATE TABLE email_branding (
  key text PRIMARY KEY NOT NULL,
  value text NOT NULL DEFAULT '',
  updated_at integer,
  updated_by text NOT NULL DEFAULT ''
);
