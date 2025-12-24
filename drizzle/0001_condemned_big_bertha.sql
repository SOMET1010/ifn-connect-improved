CREATE TABLE `agents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`agentNumber` varchar(50) NOT NULL,
	`zone` text,
	`totalEnrollments` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agents_id` PRIMARY KEY(`id`),
	CONSTRAINT `agents_agentNumber_unique` UNIQUE(`agentNumber`)
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`action` varchar(100) NOT NULL,
	`entity` varchar(100) NOT NULL,
	`entityId` int,
	`details` text,
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cooperative_stock` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cooperativeId` int NOT NULL,
	`productId` int NOT NULL,
	`quantity` decimal(10,2) NOT NULL,
	`minThreshold` decimal(10,2) DEFAULT '50',
	`lastRestocked` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cooperative_stock_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cooperatives` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`cooperativeName` text NOT NULL,
	`cooperativeNumber` varchar(50) NOT NULL,
	`location` text,
	`totalMembers` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cooperatives_id` PRIMARY KEY(`id`),
	CONSTRAINT `cooperatives_cooperativeNumber_unique` UNIQUE(`cooperativeNumber`)
);
--> statement-breakpoint
CREATE TABLE `enrollment_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`merchantId` int NOT NULL,
	`documentType` varchar(100) NOT NULL,
	`documentUrl` text NOT NULL,
	`uploadedBy` int NOT NULL,
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `enrollment_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `merchant_stock` (
	`id` int AUTO_INCREMENT NOT NULL,
	`merchantId` int NOT NULL,
	`productId` int NOT NULL,
	`quantity` decimal(10,2) NOT NULL,
	`minThreshold` decimal(10,2) DEFAULT '5',
	`lastRestocked` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `merchant_stock_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `merchants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`merchantNumber` varchar(50) NOT NULL,
	`businessName` text NOT NULL,
	`businessType` varchar(100),
	`location` text,
	`latitude` decimal(10,8),
	`longitude` decimal(11,8),
	`cnpsNumber` varchar(50),
	`cmuNumber` varchar(50),
	`cnpsStatus` enum('active','inactive','pending') DEFAULT 'pending',
	`cmuStatus` enum('active','inactive','pending') DEFAULT 'pending',
	`enrolledBy` int,
	`enrolledAt` timestamp,
	`isVerified` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `merchants_id` PRIMARY KEY(`id`),
	CONSTRAINT `merchants_merchantNumber_unique` UNIQUE(`merchantNumber`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('sms','email','push') NOT NULL,
	`category` varchar(50) NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`status` enum('pending','sent','failed') NOT NULL DEFAULT 'pending',
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`merchantId` int NOT NULL,
	`cooperativeId` int,
	`productId` int NOT NULL,
	`quantity` decimal(10,2) NOT NULL,
	`unitPrice` decimal(10,2) NOT NULL,
	`totalAmount` decimal(10,2) NOT NULL,
	`status` enum('pending','confirmed','delivered','cancelled') NOT NULL DEFAULT 'pending',
	`orderDate` timestamp NOT NULL DEFAULT (now()),
	`deliveryDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` text NOT NULL,
	`nameDioula` text,
	`category` varchar(100),
	`unit` varchar(50) NOT NULL,
	`basePrice` decimal(10,2),
	`imageUrl` text,
	`pictogramUrl` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sales` (
	`id` int AUTO_INCREMENT NOT NULL,
	`merchantId` int NOT NULL,
	`productId` int NOT NULL,
	`quantity` decimal(10,2) NOT NULL,
	`unitPrice` decimal(10,2) NOT NULL,
	`totalAmount` decimal(10,2) NOT NULL,
	`paymentMethod` enum('cash','mobile_money','credit') NOT NULL DEFAULT 'cash',
	`paymentProvider` varchar(50),
	`transactionId` varchar(100),
	`isVoiceRecorded` boolean DEFAULT false,
	`isSynced` boolean NOT NULL DEFAULT false,
	`saleDate` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sales_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `system_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(100) NOT NULL,
	`value` text NOT NULL,
	`description` text,
	`updatedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `system_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `system_settings_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `voice_commands` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`language` enum('fr','dioula') NOT NULL,
	`command` text NOT NULL,
	`transcription` text NOT NULL,
	`action` varchar(100),
	`isSuccessful` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `voice_commands_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('admin','merchant','agent','cooperative') NOT NULL DEFAULT 'merchant';--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `language` enum('fr','dioula') DEFAULT 'fr' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `pinCode` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `isActive` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `agents` ADD CONSTRAINT `agents_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cooperative_stock` ADD CONSTRAINT `cooperative_stock_cooperativeId_cooperatives_id_fk` FOREIGN KEY (`cooperativeId`) REFERENCES `cooperatives`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cooperative_stock` ADD CONSTRAINT `cooperative_stock_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cooperatives` ADD CONSTRAINT `cooperatives_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `enrollment_documents` ADD CONSTRAINT `enrollment_documents_merchantId_merchants_id_fk` FOREIGN KEY (`merchantId`) REFERENCES `merchants`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `enrollment_documents` ADD CONSTRAINT `enrollment_documents_uploadedBy_agents_id_fk` FOREIGN KEY (`uploadedBy`) REFERENCES `agents`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `merchant_stock` ADD CONSTRAINT `merchant_stock_merchantId_merchants_id_fk` FOREIGN KEY (`merchantId`) REFERENCES `merchants`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `merchant_stock` ADD CONSTRAINT `merchant_stock_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `merchants` ADD CONSTRAINT `merchants_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `merchants` ADD CONSTRAINT `merchants_enrolledBy_agents_id_fk` FOREIGN KEY (`enrolledBy`) REFERENCES `agents`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_merchantId_merchants_id_fk` FOREIGN KEY (`merchantId`) REFERENCES `merchants`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_cooperativeId_cooperatives_id_fk` FOREIGN KEY (`cooperativeId`) REFERENCES `cooperatives`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sales` ADD CONSTRAINT `sales_merchantId_merchants_id_fk` FOREIGN KEY (`merchantId`) REFERENCES `merchants`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sales` ADD CONSTRAINT `sales_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `system_settings` ADD CONSTRAINT `system_settings_updatedBy_users_id_fk` FOREIGN KEY (`updatedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `voice_commands` ADD CONSTRAINT `voice_commands_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `agent_number_idx` ON `agents` (`agentNumber`);--> statement-breakpoint
CREATE INDEX `user_action_idx` ON `audit_logs` (`userId`,`action`);--> statement-breakpoint
CREATE INDEX `entity_idx` ON `audit_logs` (`entity`,`entityId`);--> statement-breakpoint
CREATE INDEX `cooperative_product_idx` ON `cooperative_stock` (`cooperativeId`,`productId`);--> statement-breakpoint
CREATE INDEX `cooperative_number_idx` ON `cooperatives` (`cooperativeNumber`);--> statement-breakpoint
CREATE INDEX `merchant_idx` ON `enrollment_documents` (`merchantId`);--> statement-breakpoint
CREATE INDEX `merchant_product_idx` ON `merchant_stock` (`merchantId`,`productId`);--> statement-breakpoint
CREATE INDEX `merchant_number_idx` ON `merchants` (`merchantNumber`);--> statement-breakpoint
CREATE INDEX `location_idx` ON `merchants` (`latitude`,`longitude`);--> statement-breakpoint
CREATE INDEX `enrolled_by_idx` ON `merchants` (`enrolledBy`);--> statement-breakpoint
CREATE INDEX `user_status_idx` ON `notifications` (`userId`,`status`);--> statement-breakpoint
CREATE INDEX `merchant_status_idx` ON `orders` (`merchantId`,`status`);--> statement-breakpoint
CREATE INDEX `cooperative_status_idx` ON `orders` (`cooperativeId`,`status`);--> statement-breakpoint
CREATE INDEX `category_idx` ON `products` (`category`);--> statement-breakpoint
CREATE INDEX `merchant_date_idx` ON `sales` (`merchantId`,`saleDate`);--> statement-breakpoint
CREATE INDEX `sync_idx` ON `sales` (`isSynced`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `voice_commands` (`userId`);--> statement-breakpoint
CREATE INDEX `phone_idx` ON `users` (`phone`);--> statement-breakpoint
CREATE INDEX `role_idx` ON `users` (`role`);