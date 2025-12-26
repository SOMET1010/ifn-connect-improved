CREATE TABLE `cmu_reimbursements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`merchantId` int NOT NULL,
	`careType` enum('consultation','hospitalization','medication','surgery','dental','optical','maternity','emergency','other') NOT NULL,
	`careDate` timestamp NOT NULL,
	`totalAmount` decimal(10,2) NOT NULL,
	`reimbursedAmount` decimal(10,2) NOT NULL,
	`reimbursementRate` decimal(5,2) NOT NULL,
	`status` enum('pending','approved','rejected','paid') NOT NULL DEFAULT 'pending',
	`healthFacility` text,
	`reference` varchar(100) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cmu_reimbursements_id` PRIMARY KEY(`id`),
	CONSTRAINT `cmu_reimbursements_reference_unique` UNIQUE(`reference`)
);
--> statement-breakpoint
CREATE TABLE `cnps_payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`merchantId` int NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`paymentDate` timestamp NOT NULL,
	`paymentMethod` enum('mobile_money','bank_transfer','cash','card') NOT NULL,
	`reference` varchar(100) NOT NULL,
	`status` enum('pending','completed','failed','cancelled') NOT NULL DEFAULT 'pending',
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cnps_payments_id` PRIMARY KEY(`id`),
	CONSTRAINT `cnps_payments_reference_unique` UNIQUE(`reference`)
);
--> statement-breakpoint
CREATE TABLE `faq_articles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`question` text NOT NULL,
	`answer` text NOT NULL,
	`category` enum('enrollment','payments','technical','cnps_cmu','cooperatives','general') NOT NULL,
	`views` int NOT NULL DEFAULT 0,
	`upvotes` int NOT NULL DEFAULT 0,
	`downvotes` int NOT NULL DEFAULT 0,
	`isPublished` boolean NOT NULL DEFAULT true,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `faq_articles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `grp_order_payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`participantId` int NOT NULL,
	`groupedOrderId` int NOT NULL,
	`merchantId` int NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`status` enum('pending','completed','failed','refunded') NOT NULL DEFAULT 'pending',
	`paymentMethod` varchar(50),
	`transactionId` varchar(255),
	`paidAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `grp_order_payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `support_conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentId` int NOT NULL,
	`messages` text NOT NULL,
	`status` enum('active','resolved','escalated') NOT NULL DEFAULT 'active',
	`satisfaction` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `support_conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `support_tickets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentId` int NOT NULL,
	`conversationId` int,
	`subject` text NOT NULL,
	`description` text NOT NULL,
	`priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
	`status` enum('open','in_progress','resolved','closed') NOT NULL DEFAULT 'open',
	`assignedTo` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`resolvedAt` timestamp,
	CONSTRAINT `support_tickets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `cmu_reimbursements` ADD CONSTRAINT `cmu_reimbursements_merchantId_merchants_id_fk` FOREIGN KEY (`merchantId`) REFERENCES `merchants`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cnps_payments` ADD CONSTRAINT `cnps_payments_merchantId_merchants_id_fk` FOREIGN KEY (`merchantId`) REFERENCES `merchants`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `faq_articles` ADD CONSTRAINT `faq_articles_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `grp_order_payments` ADD CONSTRAINT `grp_order_payments_participantId_grouped_order_participants_id_fk` FOREIGN KEY (`participantId`) REFERENCES `grouped_order_participants`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `grp_order_payments` ADD CONSTRAINT `grp_order_payments_groupedOrderId_grouped_orders_id_fk` FOREIGN KEY (`groupedOrderId`) REFERENCES `grouped_orders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `grp_order_payments` ADD CONSTRAINT `grp_order_payments_merchantId_merchants_id_fk` FOREIGN KEY (`merchantId`) REFERENCES `merchants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `support_conversations` ADD CONSTRAINT `support_conversations_agentId_agents_id_fk` FOREIGN KEY (`agentId`) REFERENCES `agents`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `support_tickets` ADD CONSTRAINT `support_tickets_agentId_agents_id_fk` FOREIGN KEY (`agentId`) REFERENCES `agents`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `support_tickets` ADD CONSTRAINT `support_tickets_conversationId_support_conversations_id_fk` FOREIGN KEY (`conversationId`) REFERENCES `support_conversations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `support_tickets` ADD CONSTRAINT `support_tickets_assignedTo_users_id_fk` FOREIGN KEY (`assignedTo`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `cmu_reimbursements_merchant_idx` ON `cmu_reimbursements` (`merchantId`);--> statement-breakpoint
CREATE INDEX `cmu_reimbursements_care_date_idx` ON `cmu_reimbursements` (`careDate`);--> statement-breakpoint
CREATE INDEX `cmu_reimbursements_status_idx` ON `cmu_reimbursements` (`status`);--> statement-breakpoint
CREATE INDEX `cmu_reimbursements_care_type_idx` ON `cmu_reimbursements` (`careType`);--> statement-breakpoint
CREATE INDEX `cnps_payments_merchant_idx` ON `cnps_payments` (`merchantId`);--> statement-breakpoint
CREATE INDEX `cnps_payments_payment_date_idx` ON `cnps_payments` (`paymentDate`);--> statement-breakpoint
CREATE INDEX `cnps_payments_status_idx` ON `cnps_payments` (`status`);--> statement-breakpoint
CREATE INDEX `faq_articles_category_idx` ON `faq_articles` (`category`);--> statement-breakpoint
CREATE INDEX `faq_articles_views_idx` ON `faq_articles` (`views`);--> statement-breakpoint
CREATE INDEX `participant_idx` ON `grp_order_payments` (`participantId`);--> statement-breakpoint
CREATE INDEX `grouped_order_payment_idx` ON `grp_order_payments` (`groupedOrderId`);--> statement-breakpoint
CREATE INDEX `merchant_payment_idx` ON `grp_order_payments` (`merchantId`);--> statement-breakpoint
CREATE INDEX `payment_status_idx` ON `grp_order_payments` (`status`);--> statement-breakpoint
CREATE INDEX `support_conversations_agent_idx` ON `support_conversations` (`agentId`);--> statement-breakpoint
CREATE INDEX `support_conversations_status_idx` ON `support_conversations` (`status`);--> statement-breakpoint
CREATE INDEX `support_conversations_created_at_idx` ON `support_conversations` (`createdAt`);--> statement-breakpoint
CREATE INDEX `support_tickets_agent_idx` ON `support_tickets` (`agentId`);--> statement-breakpoint
CREATE INDEX `support_tickets_status_idx` ON `support_tickets` (`status`);--> statement-breakpoint
CREATE INDEX `support_tickets_priority_idx` ON `support_tickets` (`priority`);--> statement-breakpoint
CREATE INDEX `support_tickets_assigned_to_idx` ON `support_tickets` (`assignedTo`);