CREATE TABLE `seo_settings` (`key` text PRIMARY KEY NOT NULL, `value` text NOT NULL DEFAULT '', `updated_at` integer NOT NULL DEFAULT (unixepoch()), `updated_by` text NOT NULL DEFAULT '');
