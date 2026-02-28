ALTER TABLE `programs` ADD `sync_handle` text;
--> statement-breakpoint
ALTER TABLE `programs` ADD `last_synced_at` integer;
--> statement-breakpoint
ALTER TABLE `targets` ADD `sync_source` text;
--> statement-breakpoint
ALTER TABLE `targets` ADD `sync_program_handle` text;
