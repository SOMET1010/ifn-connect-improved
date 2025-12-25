CREATE TABLE `event_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`merchantId` int NOT NULL,
	`alertType` enum('7_days','3_days','1_day','today') NOT NULL,
	`message` text NOT NULL,
	`isRead` boolean NOT NULL DEFAULT false,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `event_alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `event_stock_recommendations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`productName` varchar(100) NOT NULL,
	`category` varchar(50),
	`priority` enum('high','medium','low') NOT NULL DEFAULT 'medium',
	`estimatedDemandIncrease` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `event_stock_recommendations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `local_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`type` enum('religious','national','cultural','commercial') NOT NULL,
	`date` date NOT NULL,
	`endDate` date,
	`description` text,
	`isRecurring` boolean NOT NULL DEFAULT false,
	`iconEmoji` varchar(10),
	`color` varchar(20),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `local_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `event_alerts` ADD CONSTRAINT `event_alerts_eventId_local_events_id_fk` FOREIGN KEY (`eventId`) REFERENCES `local_events`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `event_alerts` ADD CONSTRAINT `event_alerts_merchantId_merchants_id_fk` FOREIGN KEY (`merchantId`) REFERENCES `merchants`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `event_stock_recommendations` ADD CONSTRAINT `event_stock_recommendations_eventId_local_events_id_fk` FOREIGN KEY (`eventId`) REFERENCES `local_events`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `alerts_event_idx` ON `event_alerts` (`eventId`);--> statement-breakpoint
CREATE INDEX `alerts_merchant_idx` ON `event_alerts` (`merchantId`);--> statement-breakpoint
CREATE INDEX `alerts_read_idx` ON `event_alerts` (`isRead`);--> statement-breakpoint
CREATE INDEX `stock_rec_event_idx` ON `event_stock_recommendations` (`eventId`);--> statement-breakpoint
CREATE INDEX `stock_rec_priority_idx` ON `event_stock_recommendations` (`priority`);--> statement-breakpoint
CREATE INDEX `events_date_idx` ON `local_events` (`date`);--> statement-breakpoint
CREATE INDEX `events_type_idx` ON `local_events` (`type`);