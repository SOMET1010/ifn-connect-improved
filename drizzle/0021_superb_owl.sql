CREATE TABLE `merchant_daily_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`merchantId` int NOT NULL,
	`sessionDate` date NOT NULL,
	`openedAt` timestamp,
	`closedAt` timestamp,
	`openingNotes` text,
	`closingNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `merchant_daily_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_merchant_date` UNIQUE(`merchantId`,`sessionDate`)
);
--> statement-breakpoint
ALTER TABLE `merchant_daily_sessions` ADD CONSTRAINT `merchant_daily_sessions_merchantId_merchants_id_fk` FOREIGN KEY (`merchantId`) REFERENCES `merchants`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `merchant_date_idx` ON `merchant_daily_sessions` (`merchantId`,`sessionDate`);--> statement-breakpoint
CREATE INDEX `opened_at_idx` ON `merchant_daily_sessions` (`openedAt`);--> statement-breakpoint
CREATE INDEX `closed_at_idx` ON `merchant_daily_sessions` (`closedAt`);