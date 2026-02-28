CREATE TABLE `programs` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`platform` text DEFAULT 'custom' NOT NULL,
	`url` text,
	`scope_url` text,
	`min_bounty` integer,
	`max_bounty` integer,
	`status` text DEFAULT 'active' NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `targets` (
	`id` text PRIMARY KEY NOT NULL,
	`program_id` text,
	`type` text DEFAULT 'domain' NOT NULL,
	`value` text NOT NULL,
	`status` text DEFAULT 'in_scope' NOT NULL,
	`technologies` text,
	`notes` text,
	`last_scanned_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `findings` (
	`id` text PRIMARY KEY NOT NULL,
	`target_id` text,
	`title` text NOT NULL,
	`severity` text DEFAULT 'info' NOT NULL,
	`type` text NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`description` text,
	`steps_to_reproduce` text,
	`impact` text,
	`evidence` text,
	`bounty_amount` integer,
	`report_url` text,
	`agent_id` text,
	`tool_id` text,
	`raw_output` text,
	`reported_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tools` (
	`id` text PRIMARY KEY NOT NULL,
	`catalog_id` text,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`category` text NOT NULL,
	`description` text,
	`docker_image` text,
	`install_cmd` text,
	`source_url` text,
	`version` text,
	`installed` integer DEFAULT 0 NOT NULL,
	`enabled` integer DEFAULT 1 NOT NULL,
	`config` text,
	`mcp_server_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tools_slug_unique` ON `tools` (`slug`);
--> statement-breakpoint
CREATE TABLE `docker_containers` (
	`id` text PRIMARY KEY NOT NULL,
	`tool_id` text,
	`container_id` text,
	`image_name` text NOT NULL,
	`status` text DEFAULT 'created' NOT NULL,
	`agent_id` text,
	`ports` text,
	`env` text,
	`logs` text,
	`created_at` integer NOT NULL,
	`stopped_at` integer
);
