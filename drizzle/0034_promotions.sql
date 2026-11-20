-- Promotions & discounts (CLAUDE.md section 90). Run ONE statement at a time in D1 Studio.
CREATE TABLE promotions (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  name text NOT NULL,
  title text NOT NULL,
  code text,
  description text,
  kind text NOT NULL DEFAULT 'percent',
  value integer NOT NULL,
  product_slugs text NOT NULL DEFAULT '[]',
  category_slugs text NOT NULL DEFAULT '[]',
  package_names text NOT NULL DEFAULT '[]',
  min_cart_cents integer NOT NULL DEFAULT 0,
  max_discount_cents integer,
  starts_at integer,
  ends_at integer,
  timezone text NOT NULL DEFAULT 'UTC',
  usage_limit integer,
  per_customer_limit integer,
  first_purchase_only integer NOT NULL DEFAULT 0,
  partner_only integer NOT NULL DEFAULT 0,
  automatic integer NOT NULL DEFAULT 0,
  combinable integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  banner_places text NOT NULL DEFAULT '[]',
  created_at integer NOT NULL DEFAULT (unixepoch()),
  updated_at integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX promotions_code_uq ON promotions (code);
--> statement-breakpoint
CREATE TABLE promotion_redemptions (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  promotion_id integer NOT NULL,
  order_id text NOT NULL,
  email text NOT NULL,
  code text,
  discount_cents integer NOT NULL,
  order_total_cents integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'reserved',
  created_at integer NOT NULL DEFAULT (unixepoch()),
  redeemed_at integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX promotion_redemptions_order_uq ON promotion_redemptions (order_id, promotion_id);
--> statement-breakpoint
CREATE INDEX promotion_redemptions_promo_idx ON promotion_redemptions (promotion_id, status);
--> statement-breakpoint
ALTER TABLE orders ADD COLUMN discount_cents integer;
