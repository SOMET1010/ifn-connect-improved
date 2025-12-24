CREATE TABLE `badges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text NOT NULL,
	`icon` varchar(50) NOT NULL,
	`color` varchar(50) NOT NULL,
	`requirement` text NOT NULL,
	`category` varchar(50) NOT NULL,
	`points` int NOT NULL DEFAULT 10,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `badges_id` PRIMARY KEY(`id`),
	CONSTRAINT `badges_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `merchant_badges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`merchantId` int NOT NULL,
	`badgeId` int NOT NULL,
	`unlockedAt` timestamp NOT NULL DEFAULT (now()),
	`isNew` boolean NOT NULL DEFAULT true,
	CONSTRAINT `merchant_badges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `merchant_badges` ADD CONSTRAINT `merchant_badges_merchantId_merchants_id_fk` FOREIGN KEY (`merchantId`) REFERENCES `merchants`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `merchant_badges` ADD CONSTRAINT `merchant_badges_badgeId_badges_id_fk` FOREIGN KEY (`badgeId`) REFERENCES `badges`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `merchant_id_idx` ON `merchant_badges` (`merchantId`);--> statement-breakpoint
CREATE INDEX `badge_id_idx` ON `merchant_badges` (`badgeId`);