CREATE TABLE `help_feedback` (`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL, `article_id` text NOT NULL, `helpful` integer NOT NULL, `created_at` integer NOT NULL DEFAULT (unixepoch()));
--> statement-breakpoint
CREATE INDEX `help_feedback_article_idx` ON `help_feedback` (`article_id`);
