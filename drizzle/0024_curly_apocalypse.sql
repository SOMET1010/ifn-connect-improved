CREATE TABLE `user_tutorial_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tutorialId` int NOT NULL,
	`completed` boolean NOT NULL DEFAULT false,
	`watchedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_tutorial_progress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `video_tutorials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` text NOT NULL,
	`titleDioula` text,
	`description` text NOT NULL,
	`descriptionDioula` text,
	`videoUrl` text NOT NULL,
	`thumbnailUrl` text,
	`duration` int NOT NULL,
	`category` varchar(50) NOT NULL,
	`order` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `video_tutorials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `user_tutorial_progress` ADD CONSTRAINT `user_tutorial_progress_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_tutorial_progress` ADD CONSTRAINT `user_tutorial_progress_tutorialId_video_tutorials_id_fk` FOREIGN KEY (`tutorialId`) REFERENCES `video_tutorials`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `user_tutorial_idx` ON `user_tutorial_progress` (`userId`,`tutorialId`);--> statement-breakpoint
CREATE INDEX `completed_idx` ON `user_tutorial_progress` (`completed`);--> statement-breakpoint
CREATE INDEX `category_idx` ON `video_tutorials` (`category`);--> statement-breakpoint
CREATE INDEX `order_idx` ON `video_tutorials` (`order`);