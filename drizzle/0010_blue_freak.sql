CREATE TABLE `social_protection_renewals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`merchantId` int NOT NULL,
	`type` enum('cnps','cmu','rsti') NOT NULL,
	`currentExpiryDate` timestamp,
	`requestedExpiryDate` timestamp NOT NULL,
	`status` enum('pending','approved','rejected','cancelled') NOT NULL DEFAULT 'pending',
	`proofDocumentUrl` text,
	`proofDocumentKey` varchar(255),
	`merchantNotes` text,
	`adminNotes` text,
	`requestedAt` timestamp NOT NULL DEFAULT (now()),
	`reviewedAt` timestamp,
	`reviewedBy` int,
	`approvedAt` timestamp,
	`rejectedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `social_protection_renewals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `social_protection_renewals` ADD CONSTRAINT `social_protection_renewals_merchantId_merchants_id_fk` FOREIGN KEY (`merchantId`) REFERENCES `merchants`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `social_protection_renewals` ADD CONSTRAINT `social_protection_renewals_reviewedBy_users_id_fk` FOREIGN KEY (`reviewedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `social_protection_renewals_merchant_idx` ON `social_protection_renewals` (`merchantId`);--> statement-breakpoint
CREATE INDEX `social_protection_renewals_status_idx` ON `social_protection_renewals` (`status`);--> statement-breakpoint
CREATE INDEX `social_protection_renewals_type_idx` ON `social_protection_renewals` (`type`);--> statement-breakpoint
CREATE INDEX `social_protection_renewals_requested_at_idx` ON `social_protection_renewals` (`requestedAt`);