CREATE TABLE `custom_list_requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`category` text NOT NULL,
	`country` text NOT NULL,
	`region` text,
	`quantity` integer,
	`job_titles` text,
	`fields_json` text NOT NULL,
	`notes` text,
	`original_query` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
