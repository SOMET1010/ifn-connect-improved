CREATE TABLE `merchant_scores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`merchantId` int NOT NULL,
	`totalScore` int NOT NULL DEFAULT 0,
	`regularityScore` int NOT NULL DEFAULT 0,
	`volumeScore` int NOT NULL DEFAULT 0,
	`savingsScore` int NOT NULL DEFAULT 0,
	`usageScore` int NOT NULL DEFAULT 0,
	`seniorityScore` int NOT NULL DEFAULT 0,
	`consecutiveSalesDays` int NOT NULL DEFAULT 0,
	`totalSalesAmount` decimal(15,2) NOT NULL DEFAULT '0',
	`totalSavingsAmount` decimal(15,2) NOT NULL DEFAULT '0',
	`appUsageDays` int NOT NULL DEFAULT 0,
	`accountAgeDays` int NOT NULL DEFAULT 0,
	`isEligibleForCredit` boolean NOT NULL DEFAULT false,
	`maxCreditAmount` decimal(15,2) NOT NULL DEFAULT '0',
	`creditTier` enum('none','bronze','silver','gold','platinum') NOT NULL DEFAULT 'none',
	`lastCalculatedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `merchant_scores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `savings_goals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`merchantId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`targetAmount` decimal(15,2) NOT NULL,
	`currentAmount` decimal(15,2) NOT NULL DEFAULT '0',
	`deadline` date,
	`isCompleted` boolean NOT NULL DEFAULT false,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `savings_goals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `savings_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`savingsGoalId` int NOT NULL,
	`merchantId` int NOT NULL,
	`amount` decimal(15,2) NOT NULL,
	`type` enum('deposit','withdrawal') NOT NULL,
	`source` varchar(50),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `savings_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `score_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`merchantId` int NOT NULL,
	`totalScore` int NOT NULL,
	`creditTier` enum('none','bronze','silver','gold','platinum') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `score_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `merchant_scores` ADD CONSTRAINT `merchant_scores_merchantId_merchants_id_fk` FOREIGN KEY (`merchantId`) REFERENCES `merchants`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `savings_goals` ADD CONSTRAINT `savings_goals_merchantId_merchants_id_fk` FOREIGN KEY (`merchantId`) REFERENCES `merchants`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `savings_transactions` ADD CONSTRAINT `savings_transactions_savingsGoalId_savings_goals_id_fk` FOREIGN KEY (`savingsGoalId`) REFERENCES `savings_goals`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `savings_transactions` ADD CONSTRAINT `savings_transactions_merchantId_merchants_id_fk` FOREIGN KEY (`merchantId`) REFERENCES `merchants`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `score_history` ADD CONSTRAINT `score_history_merchantId_merchants_id_fk` FOREIGN KEY (`merchantId`) REFERENCES `merchants`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `merchant_score_idx` ON `merchant_scores` (`merchantId`);--> statement-breakpoint
CREATE INDEX `total_score_idx` ON `merchant_scores` (`totalScore`);--> statement-breakpoint
CREATE INDEX `credit_eligibility_idx` ON `merchant_scores` (`isEligibleForCredit`);--> statement-breakpoint
CREATE INDEX `savings_merchant_idx` ON `savings_goals` (`merchantId`);--> statement-breakpoint
CREATE INDEX `savings_status_idx` ON `savings_goals` (`isCompleted`);--> statement-breakpoint
CREATE INDEX `savings_tx_goal_idx` ON `savings_transactions` (`savingsGoalId`);--> statement-breakpoint
CREATE INDEX `savings_tx_merchant_idx` ON `savings_transactions` (`merchantId`);--> statement-breakpoint
CREATE INDEX `savings_tx_date_idx` ON `savings_transactions` (`createdAt`);--> statement-breakpoint
CREATE INDEX `score_history_merchant_idx` ON `score_history` (`merchantId`);--> statement-breakpoint
CREATE INDEX `score_history_date_idx` ON `score_history` (`createdAt`);