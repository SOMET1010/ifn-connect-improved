CREATE TABLE `cooperative_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cooperativeId` int NOT NULL,
	`merchantId` int NOT NULL,
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	`isActive` boolean NOT NULL DEFAULT true,
	CONSTRAINT `cooperative_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `cooperative_members` ADD CONSTRAINT `cooperative_members_cooperativeId_cooperatives_id_fk` FOREIGN KEY (`cooperativeId`) REFERENCES `cooperatives`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cooperative_members` ADD CONSTRAINT `cooperative_members_merchantId_merchants_id_fk` FOREIGN KEY (`merchantId`) REFERENCES `merchants`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `cooperative_merchant_idx` ON `cooperative_members` (`cooperativeId`,`merchantId`);