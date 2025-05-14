CREATE TABLE `cast_members` (
	`id` text PRIMARY KEY NOT NULL,
	`sketch_id` text NOT NULL,
	`name` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`sketch_id`) REFERENCES `sketches`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `character_performers` (
	`id` text PRIMARY KEY NOT NULL,
	`sketch_id` text NOT NULL,
	`character_name` text NOT NULL,
	`performer_name` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`sketch_id`) REFERENCES `sketches`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sketch_shows` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sketch_tech_details` (
	`id` text PRIMARY KEY NOT NULL,
	`sketch_id` text NOT NULL,
	`cues` text,
	`props` text,
	`costume` text,
	`stage_dressing` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`sketch_id`) REFERENCES `sketches`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sketch_tech_details_sketch_id_idx` ON `sketch_tech_details` (`sketch_id`);--> statement-breakpoint
CREATE TABLE `sketches` (
	`id` text PRIMARY KEY NOT NULL,
	`show_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`duration` integer NOT NULL,
	`chars` integer NOT NULL,
	`casted` integer NOT NULL,
	`locked` integer DEFAULT false NOT NULL,
	`position` integer NOT NULL,
	`raw_data` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`show_id`) REFERENCES `sketch_shows`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`age` integer,
	`username` text NOT NULL,
	`password_hash` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_username_unique` ON `user` (`username`);