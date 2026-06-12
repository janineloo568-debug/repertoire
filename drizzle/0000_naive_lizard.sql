CREATE TABLE `feed_activities` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`piece_id` text NOT NULL,
	`tag_id` text,
	`note_excerpt` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`piece_id`) REFERENCES `pieces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `feed_activities_user_created_idx` ON `feed_activities` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `follows` (
	`follower_id` text NOT NULL,
	`following_id` text NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`follower_id`, `following_id`),
	FOREIGN KEY (`follower_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`following_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `follows_follower_idx` ON `follows` (`follower_id`);--> statement-breakpoint
CREATE INDEX `follows_following_idx` ON `follows` (`following_id`);--> statement-breakpoint
CREATE TABLE `notes` (
	`id` text PRIMARY KEY NOT NULL,
	`piece_id` text NOT NULL,
	`user_id` text NOT NULL,
	`body` text DEFAULT '' NOT NULL,
	`is_public` integer DEFAULT false NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`piece_id`) REFERENCES `pieces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `notes_piece_user` ON `notes` (`piece_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `piece_practice_goals` (
	`piece_id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`target_tempo_bpm` integer,
	`dynamics_notes` text DEFAULT '' NOT NULL,
	`emotion_notes` text DEFAULT '' NOT NULL,
	`passage_notes` text DEFAULT '' NOT NULL,
	`goals_text` text DEFAULT '' NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`piece_id`) REFERENCES `pieces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `piece_practice_goals_user_idx` ON `piece_practice_goals` (`user_id`);--> statement-breakpoint
CREATE TABLE `piece_tags` (
	`piece_id` text NOT NULL,
	`tag_id` text NOT NULL,
	PRIMARY KEY(`piece_id`, `tag_id`),
	FOREIGN KEY (`piece_id`) REFERENCES `pieces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `piece_vibe_scores` (
	`piece_id` text NOT NULL,
	`tag_id` text NOT NULL,
	`user_id` text NOT NULL,
	`fit_score` integer NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`piece_id`, `tag_id`, `user_id`),
	FOREIGN KEY (`piece_id`) REFERENCES `pieces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `pieces` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`composer` text,
	`instrument` text NOT NULL,
	`difficulty` integer NOT NULL,
	`source_type` text NOT NULL,
	`storage_key` text,
	`external_url` text,
	`mime_type` text,
	`file_name_original` text,
	`date_added` integer NOT NULL,
	`repertoire_status` text DEFAULT 'learning' NOT NULL,
	`is_public` integer DEFAULT false NOT NULL,
	`metadata_json` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `pieces_user_date_idx` ON `pieces` (`user_id`,`date_added`);--> statement-breakpoint
CREATE TABLE `practice_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`piece_id` text NOT NULL,
	`user_id` text NOT NULL,
	`body` text DEFAULT '' NOT NULL,
	`passage_notes` text DEFAULT '' NOT NULL,
	`audio_storage_key` text,
	`audio_mime_type` text,
	`audio_analysis` text,
	`coach_response` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`piece_id`) REFERENCES `pieces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `practice_logs_piece_user_created_idx` ON `practice_logs` (`piece_id`,`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `practice_logs_user_created_idx` ON `practice_logs` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `ratings` (
	`piece_id` text NOT NULL,
	`user_id` text NOT NULL,
	`overall` integer NOT NULL,
	`difficulty_user` integer NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`piece_id`, `user_id`),
	FOREIGN KEY (`piece_id`) REFERENCES `pieces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `suggestion_batches` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`model` text NOT NULL,
	`prompt_version` text DEFAULT 'v1' NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `suggestions` (
	`id` text PRIMARY KEY NOT NULL,
	`batch_id` text NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`composer` text,
	`difficulty_estimate` integer NOT NULL,
	`why_blurb` text NOT NULL,
	`find_sheet_music_url` text NOT NULL,
	`url_type` text NOT NULL,
	`instrument_hint` text,
	`vibe_hints` text,
	`source_piece_ids` text NOT NULL,
	`dismissed_at` integer,
	`added_piece_id` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`batch_id`) REFERENCES `suggestion_batches`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`added_piece_id`) REFERENCES `pieces`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`slug` text NOT NULL,
	`display_name` text NOT NULL,
	`is_preset` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_preset_slug` ON `tags` (`slug`) WHERE "tags"."user_id" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `tags_user_slug` ON `tags` (`user_id`,`slug`) WHERE "tags"."user_id" IS NOT NULL;--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text,
	`username` text,
	`bio` text,
	`instruments_played` text DEFAULT '[]',
	`avatar_storage_key` text,
	`password_hash` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_username` ON `users` (`username`);