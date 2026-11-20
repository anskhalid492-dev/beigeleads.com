-- Data Reseller Partners (CLAUDE.md section 87). Run ONE statement at a time in D1 Studio.
CREATE TABLE partner_applications (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  reference text NOT NULL,
  full_name text NOT NULL,
  business_name text NOT NULL,
  email text NOT NULL,
  website text NOT NULL,
  country text NOT NULL,
  business_type text NOT NULL,
  resale_plan text NOT NULL,
  monthly_volume text,
  notes text,
  terms_accepted_at integer NOT NULL,
  dedupe_key text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  internal_note text,
  email_status text NOT NULL DEFAULT 'pending',
  decision_email text,
  owner_notify text NOT NULL DEFAULT 'pending',
  decided_at integer,
  decided_by text,
  created_at integer NOT NULL DEFAULT (unixepoch()),
  updated_at integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX partner_applications_dedupe_uq ON partner_applications (dedupe_key);
--> statement-breakpoint
CREATE UNIQUE INDEX partner_applications_reference_uq ON partner_applications (reference);
--> statement-breakpoint
CREATE TABLE partner_discounts (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  application_id integer NOT NULL,
  code text NOT NULL,
  email text NOT NULL,
  percent integer NOT NULL DEFAULT 50,
  active integer NOT NULL DEFAULT 1,
  uses integer NOT NULL DEFAULT 0,
  created_at integer NOT NULL DEFAULT (unixepoch()),
  deactivated_at integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX partner_discounts_code_uq ON partner_discounts (code);
--> statement-breakpoint
CREATE UNIQUE INDEX partner_discounts_application_uq ON partner_discounts (application_id);
--> statement-breakpoint
ALTER TABLE orders ADD COLUMN discount_code text;
--> statement-breakpoint
ALTER TABLE orders ADD COLUMN discount_percent integer;
--> statement-breakpoint
ALTER TABLE orders ADD COLUMN subtotal_cents integer;
