CREATE TABLE `merchant_daily_logins` (
	`id` int AUTO_INCREMENT NOT NULL,
	`merchantId` int NOT NULL,
	`loginDate` date NOT NULL,
	`firstLoginTime` timestamp NOT NULL DEFAULT (now()),
	`briefingShown` boolean NOT NULL DEFAULT false,
	`briefingSkipped` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `merchant_daily_logins_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `merchant_daily_logins` ADD CONSTRAINT `merchant_daily_logins_merchantId_merchants_id_fk` FOREIGN KEY (`merchantId`) REFERENCES `merchants`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `merchant_daily_logins_merchant_idx` ON `merchant_daily_logins` (`merchantId`);--> statement-breakpoint
CREATE INDEX `merchant_daily_logins_date_idx` ON `merchant_daily_logins` (`loginDate`);