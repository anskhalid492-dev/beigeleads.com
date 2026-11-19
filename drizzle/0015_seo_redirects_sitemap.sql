CREATE TABLE `seo_redirects` (`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL, `from_path` text NOT NULL, `to_path` text NOT NULL, `status` integer NOT NULL DEFAULT 301, `enabled` integer NOT NULL DEFAULT 1, `note` text NOT NULL DEFAULT '', `created_at` integer NOT NULL DEFAULT (unixepoch()), `updated_at` integer NOT NULL DEFAULT (unixepoch()), `updated_by` text NOT NULL DEFAULT '');
--> statement-breakpoint
CREATE UNIQUE INDEX `seo_redirects_from_uq` ON `seo_redirects` (`from_path`);
--> statement-breakpoint
CREATE TABLE `seo_sitemap_exclusions` (`path` text PRIMARY KEY NOT NULL, `created_at` integer NOT NULL DEFAULT (unixepoch()), `created_by` text NOT NULL DEFAULT '');
