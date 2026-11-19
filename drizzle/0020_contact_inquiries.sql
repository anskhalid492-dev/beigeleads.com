CREATE TABLE contact_inquiries (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  reference text NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  inquiry_type text NOT NULL,
  order_number text,
  subject text NOT NULL,
  message text NOT NULL,
  dedupe_key text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  internal_note text,
  email_status text NOT NULL DEFAULT 'pending',
  email_error text,
  attempts integer NOT NULL DEFAULT 0,
  owner_notify text NOT NULL DEFAULT 'pending',
  created_at integer NOT NULL DEFAULT (unixepoch()),
  updated_at integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX contact_inquiries_dedupe_uq ON contact_inquiries (dedupe_key);
--> statement-breakpoint
CREATE UNIQUE INDEX contact_inquiries_reference_uq ON contact_inquiries (reference);
