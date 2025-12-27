CREATE TABLE `first_time_user_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`currentStep` int NOT NULL DEFAULT 1,
	`totalSteps` int NOT NULL DEFAULT 5,
	`completed` boolean NOT NULL DEFAULT false,
	`skipped` boolean NOT NULL DEFAULT false,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`lastStepCompletedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `first_time_user_progress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `first_time_user_progress` ADD CONSTRAINT `first_time_user_progress_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `user_idx` ON `first_time_user_progress` (`userId`);--> statement-breakpoint
CREATE INDEX `completed_idx` ON `first_time_user_progress` (`completed`);