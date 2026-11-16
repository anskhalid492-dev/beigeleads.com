CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`parent_id` integer,
	`description` text,
	`icon` text,
	`is_active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_slug_uq` ON `categories` (`slug`);--> statement-breakpoint
CREATE TABLE `category_requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`requested_category` text NOT NULL,
	`details` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `cities` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`country_code` text NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	FOREIGN KEY (`country_code`) REFERENCES `countries`(`code`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cities_country_slug_uq` ON `cities` (`country_code`,`slug`);--> statement-breakpoint
CREATE TABLE `contact_messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text,
	`email` text NOT NULL,
	`message` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `countries` (
	`code` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `download_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`token_id` integer NOT NULL,
	`ip_hash` text NOT NULL,
	`user_agent` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`token_id`) REFERENCES `download_tokens`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `download_tokens` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_item_id` integer NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` integer NOT NULL,
	`max_downloads` integer DEFAULT 5 NOT NULL,
	`download_count` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`order_item_id`) REFERENCES `order_items`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `download_tokens_hash_uq` ON `download_tokens` (`token_hash`);--> statement-breakpoint
CREATE TABLE `list_files` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`r2_key` text NOT NULL,
	`row_count` integer NOT NULL,
	`checksum` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` text NOT NULL,
	`product_id` integer NOT NULL,
	`tier_id` integer NOT NULL,
	`price_usd_cents` integer NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tier_id`) REFERENCES `price_tiers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`total_usd_cents` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`paid_at` integer
);
--> statement-breakpoint
CREATE INDEX `orders_status_idx` ON `orders` (`status`);--> statement-breakpoint
CREATE TABLE `payment_attempts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` text NOT NULL,
	`coin` text NOT NULL,
	`network` text NOT NULL,
	`address` text NOT NULL,
	`expected_amount` text NOT NULL,
	`locked_rate` text NOT NULL,
	`expires_at` integer NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `payment_attempts_status_idx` ON `payment_attempts` (`status`);--> statement-breakpoint
CREATE TABLE `payment_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`attempt_id` integer NOT NULL,
	`tx_hash` text NOT NULL,
	`amount` text NOT NULL,
	`confirmations` integer DEFAULT 0 NOT NULL,
	`raw_json` text,
	`seen_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`attempt_id`) REFERENCES `payment_attempts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payment_events_tx_uq` ON `payment_events` (`tx_hash`);--> statement-breakpoint
CREATE TABLE `price_tiers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`name` text NOT NULL,
	`record_limit` integer NOT NULL,
	`price_usd_cents` integer NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `product_samples` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`masked_rows_json` text NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`category_id` integer NOT NULL,
	`country_code` text,
	`city_id` integer,
	`title` text NOT NULL,
	`record_count` integer DEFAULT 0 NOT NULL,
	`fields_json` text DEFAULT '[]' NOT NULL,
	`last_verified_at` integer,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`country_code`) REFERENCES `countries`(`code`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`city_id`) REFERENCES `cities`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_slug_uq` ON `products` (`slug`);--> statement-breakpoint
CREATE INDEX `products_category_idx` ON `products` (`category_id`);--> statement-breakpoint
CREATE TABLE `sample_requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`product_id` integer,
	`status` text DEFAULT 'queued' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sample_requests_email_product_uq` ON `sample_requests` (`email`,`product_id`);--> statement-breakpoint
CREATE TABLE `suppressions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email_hash` text,
	`domain` text,
	`reason` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `suppressions_hash_idx` ON `suppressions` (`email_hash`);--> statement-breakpoint
CREATE INDEX `suppressions_domain_idx` ON `suppressions` (`domain`);--> statement-breakpoint
CREATE TABLE `wallet_audit_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`wallet_id` integer,
	`actor` text NOT NULL,
	`action` text NOT NULL,
	`old_value` text,
	`new_value` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`wallet_id`) REFERENCES `wallets`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `wallets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`coin` text NOT NULL,
	`network` text NOT NULL,
	`address_or_xpub` text NOT NULL,
	`next_index` integer DEFAULT 0 NOT NULL,
	`enabled` integer DEFAULT false NOT NULL,
	`activates_at` integer NOT NULL,
	`min_confirmations` integer DEFAULT 1 NOT NULL
);
