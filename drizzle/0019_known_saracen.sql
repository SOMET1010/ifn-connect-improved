CREATE TABLE `merchant_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`merchantId` int NOT NULL,
	`savingsProposalEnabled` boolean NOT NULL DEFAULT true,
	`savingsProposalThreshold` decimal(10,2) NOT NULL DEFAULT '20000',
	`savingsProposalPercentage` decimal(5,2) NOT NULL DEFAULT '2',
	`groupedOrderNotificationsEnabled` boolean NOT NULL DEFAULT true,
	`morningBriefingEnabled` boolean NOT NULL DEFAULT true,
	`morningBriefingTime` varchar(5) DEFAULT '08:00',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `merchant_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `merchant_settings_merchantId_unique` UNIQUE(`merchantId`)
);
--> statement-breakpoint
ALTER TABLE `merchant_settings` ADD CONSTRAINT `merchant_settings_merchantId_merchants_id_fk` FOREIGN KEY (`merchantId`) REFERENCES `merchants`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `merchant_settings_merchant_idx` ON `merchant_settings` (`merchantId`);