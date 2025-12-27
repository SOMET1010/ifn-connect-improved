CREATE TABLE `voice_recordings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`context_key` varchar(100) NOT NULL,
	`language` varchar(10) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`audio_url` text NOT NULL,
	`audio_key` varchar(255) NOT NULL,
	`duration` int,
	`file_size` int,
	`mime_type` varchar(50) DEFAULT 'audio/mpeg',
	`speaker_name` varchar(255),
	`speaker_notes` text,
	`is_active` boolean NOT NULL DEFAULT true,
	`uploaded_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `voice_recordings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `context_language_idx` ON `voice_recordings` (`context_key`,`language`);--> statement-breakpoint
CREATE INDEX `language_idx` ON `voice_recordings` (`language`);--> statement-breakpoint
CREATE INDEX `is_active_idx` ON `voice_recordings` (`is_active`);