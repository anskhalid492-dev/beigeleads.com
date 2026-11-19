CREATE TABLE `system_settings` (`key` text PRIMARY KEY NOT NULL, `value` text NOT NULL DEFAULT '', `updated_at` integer NOT NULL DEFAULT (unixepoch()), `updated_by` text NOT NULL DEFAULT '');
--> statement-breakpoint
CREATE TABLE `settings_audit_log` (`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL, `actor` text NOT NULL, `category` text NOT NULL, `setting_key` text NOT NULL, `old_value` text NOT NULL DEFAULT '', `new_value` text NOT NULL DEFAULT '', `result` text NOT NULL DEFAULT 'saved', `created_at` integer NOT NULL DEFAULT (unixepoch()));
