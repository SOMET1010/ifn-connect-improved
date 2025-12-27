CREATE TABLE `audio_library` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(255) NOT NULL,
	`category` varchar(100) NOT NULL,
	`text_fr` text NOT NULL,
	`text_dioula` text,
	`audio_url` varchar(500),
	`audio_duration` int,
	`context` text,
	`priority` int DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `audio_library_id` PRIMARY KEY(`id`),
	CONSTRAINT `audio_library_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE INDEX `key_idx` ON `audio_library` (`key`);--> statement-breakpoint
CREATE INDEX `category_idx` ON `audio_library` (`category`);