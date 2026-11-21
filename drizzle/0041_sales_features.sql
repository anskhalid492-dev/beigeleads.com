-- Sales features (CLAUDE.md section 113): Second Purchase Offer codes. Run ONE statement per message in D1 Studio.
ALTER TABLE promotions ADD COLUMN bound_email text;
--> statement-breakpoint
ALTER TABLE promotions ADD COLUMN origin text NOT NULL DEFAULT 'admin';
--> statement-breakpoint
CREATE TABLE reward_codes (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  email text NOT NULL,
  first_order_id text NOT NULL,
  promotion_id integer NOT NULL,
  code text NOT NULL,
  percent integer NOT NULL,
  max_discount_cents integer,
  status text NOT NULL DEFAULT 'active',
  created_at integer NOT NULL DEFAULT (unixepoch()),
  expires_at integer NOT NULL,
  email_status text NOT NULL DEFAULT 'pending',
  email_error text,
  reminder1_at integer,
  reminder2_at integer,
  revoked_at integer,
  UNIQUE (email),
  UNIQUE (first_order_id),
  UNIQUE (code)
);
