CREATE TABLE creator_inquiries (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  reference text NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  company text,
  platforms text NOT NULL,
  niche text NOT NULL,
  country text NOT NULL,
  follower_range text NOT NULL,
  quantity integer NOT NULL,
  language text,
  audience_geo text,
  engagement text,
  notes text,
  estimated_cents integer NOT NULL,
  dedupe_key text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  internal_note text,
  assigned_to text,
  respond_by integer NOT NULL,
  responded_at integer,
  reminder_sent_at integer,
  overdue_sent_at integer,
  email_status text NOT NULL DEFAULT 'pending',
  email_error text,
  attempts integer NOT NULL DEFAULT 0,
  owner_notify text NOT NULL DEFAULT 'pending',
  created_at integer NOT NULL,
  updated_at integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX creator_inquiries_dedupe_uq ON creator_inquiries (dedupe_key);
--> statement-breakpoint
CREATE UNIQUE INDEX creator_inquiries_reference_uq ON creator_inquiries (reference);
--> statement-breakpoint
CREATE INDEX creator_inquiries_deadline_idx ON creator_inquiries (status, respond_by);
