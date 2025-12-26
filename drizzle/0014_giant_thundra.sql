CREATE TABLE `in_app_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('quiz_passed','badge_earned','challenge_received','challenge_won','renewal_reminder','stock_alert','order_status','system') NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`isRead` boolean NOT NULL DEFAULT false,
	`actionUrl` text,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `in_app_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `in_app_notifications` ADD CONSTRAINT `in_app_notifications_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `user_read_idx` ON `in_app_notifications` (`userId`,`isRead`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `in_app_notifications` (`createdAt`);