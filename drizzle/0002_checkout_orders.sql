PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_order_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` text NOT NULL,
	`product_slug` text NOT NULL,
	`package_name` text NOT NULL,
	`records` integer NOT NULL,
	`price_usd_cents` integer NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
-- order_items is empty before checkout exists, so nothing is copied.
DROP TABLE `order_items`;--> statement-breakpoint
ALTER TABLE `__new_order_items` RENAME TO `order_items`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `payment_attempts` ADD `wallet_id` integer REFERENCES wallets(id);--> statement-breakpoint
ALTER TABLE `payment_attempts` ADD `derivation_index` integer;