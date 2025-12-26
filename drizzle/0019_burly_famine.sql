CREATE TABLE `price_tiers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`groupedOrderId` int NOT NULL,
	`minQuantity` int NOT NULL,
	`discountPercent` decimal(5,2) NOT NULL,
	`pricePerUnit` decimal(10,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `price_tiers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `price_tiers` ADD CONSTRAINT `price_tiers_groupedOrderId_grouped_orders_id_fk` FOREIGN KEY (`groupedOrderId`) REFERENCES `grouped_orders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `grouped_order_idx` ON `price_tiers` (`groupedOrderId`);--> statement-breakpoint
CREATE INDEX `min_quantity_idx` ON `price_tiers` (`groupedOrderId`,`minQuantity`);