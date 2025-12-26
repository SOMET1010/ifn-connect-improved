CREATE TABLE `grouped_order_participants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`groupedOrderId` int NOT NULL,
	`merchantId` int NOT NULL,
	`quantity` int NOT NULL,
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `grouped_order_participants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `grouped_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cooperativeId` int NOT NULL,
	`productName` varchar(255) NOT NULL,
	`totalQuantity` int NOT NULL,
	`unitPrice` decimal(10,2),
	`totalAmount` decimal(10,2),
	`status` enum('draft','pending','confirmed','delivered','cancelled') NOT NULL DEFAULT 'draft',
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`confirmedAt` timestamp,
	`deliveredAt` timestamp,
	CONSTRAINT `grouped_orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `grouped_order_participants` ADD CONSTRAINT `grouped_order_participants_groupedOrderId_grouped_orders_id_fk` FOREIGN KEY (`groupedOrderId`) REFERENCES `grouped_orders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `grouped_order_participants` ADD CONSTRAINT `grouped_order_participants_merchantId_merchants_id_fk` FOREIGN KEY (`merchantId`) REFERENCES `merchants`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `grouped_orders` ADD CONSTRAINT `grouped_orders_cooperativeId_cooperatives_id_fk` FOREIGN KEY (`cooperativeId`) REFERENCES `cooperatives`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `grouped_orders` ADD CONSTRAINT `grouped_orders_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `grouped_order_merchant_idx` ON `grouped_order_participants` (`groupedOrderId`,`merchantId`);--> statement-breakpoint
CREATE INDEX `cooperative_status_idx` ON `grouped_orders` (`cooperativeId`,`status`);