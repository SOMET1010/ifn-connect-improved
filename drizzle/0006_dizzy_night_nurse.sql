CREATE TABLE `marketplace_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`buyer_id` int NOT NULL,
	`seller_id` int NOT NULL,
	`product_id` int NOT NULL,
	`quantity` int NOT NULL,
	`total_amount` decimal(10,2) NOT NULL,
	`status` varchar(20) DEFAULT 'pending_payment',
	`delivery_address` text,
	`delivery_phone` varchar(20),
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `marketplace_orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`merchant_id` int NOT NULL,
	`order_id` int,
	`amount` decimal(10,2) NOT NULL,
	`currency` varchar(3) DEFAULT 'XOF',
	`provider` varchar(20) NOT NULL,
	`phone_number` varchar(20) NOT NULL,
	`status` varchar(20) DEFAULT 'pending',
	`transaction_id` varchar(255),
	`reference` varchar(255),
	`error_message` text,
	`webhook_data` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `marketplace_orders` ADD CONSTRAINT `marketplace_orders_buyer_id_merchants_id_fk` FOREIGN KEY (`buyer_id`) REFERENCES `merchants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `marketplace_orders` ADD CONSTRAINT `marketplace_orders_seller_id_merchants_id_fk` FOREIGN KEY (`seller_id`) REFERENCES `merchants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `marketplace_orders` ADD CONSTRAINT `marketplace_orders_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_merchant_id_merchants_id_fk` FOREIGN KEY (`merchant_id`) REFERENCES `merchants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_order_id_marketplace_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `marketplace_orders`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `buyer_id_idx` ON `marketplace_orders` (`buyer_id`);--> statement-breakpoint
CREATE INDEX `seller_id_idx` ON `marketplace_orders` (`seller_id`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `marketplace_orders` (`status`);--> statement-breakpoint
CREATE INDEX `transaction_id_idx` ON `transactions` (`transaction_id`);--> statement-breakpoint
CREATE INDEX `merchant_id_idx` ON `transactions` (`merchant_id`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `transactions` (`status`);