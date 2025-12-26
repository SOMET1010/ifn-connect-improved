CREATE TABLE `merchant_activity` (
	`id` int AUTO_INCREMENT NOT NULL,
	`merchantId` int NOT NULL,
	`actorType` enum('grossiste','semi-grossiste','detaillant'),
	`products` text,
	`numberOfStores` int DEFAULT 0,
	`tableNumber` varchar(20),
	`boxNumber` varchar(20),
	`sector` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `merchant_activity_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `merchant_edit_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`merchantId` int NOT NULL,
	`editedBy` int NOT NULL,
	`fieldName` varchar(100) NOT NULL,
	`oldValue` text,
	`newValue` text,
	`action` enum('create','update','delete','verify','bulk_update') NOT NULL,
	`comment` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `merchant_edit_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `merchant_social_protection` (
	`id` int AUTO_INCREMENT NOT NULL,
	`merchantId` int NOT NULL,
	`hasCMU` boolean NOT NULL DEFAULT false,
	`cmuNumber` varchar(50),
	`cmuStatus` enum('active','inactive','pending','expired') DEFAULT 'pending',
	`cmuStartDate` timestamp,
	`cmuExpiryDate` timestamp,
	`hasCNPS` boolean NOT NULL DEFAULT false,
	`cnpsNumber` varchar(50),
	`cnpsStatus` enum('active','inactive','pending','expired') DEFAULT 'pending',
	`cnpsStartDate` timestamp,
	`cnpsExpiryDate` timestamp,
	`hasRSTI` boolean NOT NULL DEFAULT false,
	`rstiNumber` varchar(50),
	`rstiStatus` enum('active','inactive','pending','expired') DEFAULT 'pending',
	`rstiStartDate` timestamp,
	`rstiExpiryDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `merchant_social_protection_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `merchant_activity` ADD CONSTRAINT `merchant_activity_merchantId_merchants_id_fk` FOREIGN KEY (`merchantId`) REFERENCES `merchants`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `merchant_edit_history` ADD CONSTRAINT `merchant_edit_history_merchantId_merchants_id_fk` FOREIGN KEY (`merchantId`) REFERENCES `merchants`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `merchant_edit_history` ADD CONSTRAINT `merchant_edit_history_editedBy_users_id_fk` FOREIGN KEY (`editedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `merchant_social_protection` ADD CONSTRAINT `merchant_social_protection_merchantId_merchants_id_fk` FOREIGN KEY (`merchantId`) REFERENCES `merchants`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `merchant_activity_merchant_idx` ON `merchant_activity` (`merchantId`);--> statement-breakpoint
CREATE INDEX `merchant_edit_history_merchant_idx` ON `merchant_edit_history` (`merchantId`);--> statement-breakpoint
CREATE INDEX `merchant_edit_history_edited_by_idx` ON `merchant_edit_history` (`editedBy`);--> statement-breakpoint
CREATE INDEX `merchant_edit_history_created_at_idx` ON `merchant_edit_history` (`createdAt`);--> statement-breakpoint
CREATE INDEX `merchant_social_protection_merchant_idx` ON `merchant_social_protection` (`merchantId`);--> statement-breakpoint
CREATE INDEX `merchant_social_protection_cmu_status_idx` ON `merchant_social_protection` (`cmuStatus`);--> statement-breakpoint
CREATE INDEX `merchant_social_protection_cnps_status_idx` ON `merchant_social_protection` (`cnpsStatus`);