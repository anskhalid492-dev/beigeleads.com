CREATE TABLE email_templates (
  key text PRIMARY KEY NOT NULL,
  draft_json text,
  published_json text,
  published_version integer NOT NULL DEFAULT 0,
  updated_at integer,
  updated_by text NOT NULL DEFAULT ''
);
--> statement-breakpoint
CREATE TABLE email_template_versions (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  template_key text NOT NULL,
  version integer NOT NULL,
  content_json text NOT NULL,
  note text NOT NULL DEFAULT '',
  actor text NOT NULL DEFAULT '',
  created_at integer NOT NULL DEFAULT (unixepoch()),
  UNIQUE (template_key, version)
);
--> statement-breakpoint
CREATE TABLE email_delivery_logs (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  template_key text NOT NULL,
  source text NOT NULL DEFAULT 'live',
  recipient text NOT NULL DEFAULT '',
  subject text NOT NULL DEFAULT '',
  reference text NOT NULL DEFAULT '',
  status text NOT NULL,
  provider_id text NOT NULL DEFAULT '',
  error text NOT NULL DEFAULT '',
  created_at integer NOT NULL DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE INDEX email_delivery_logs_created ON email_delivery_logs (created_at);
