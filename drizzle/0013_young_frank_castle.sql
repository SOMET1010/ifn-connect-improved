CREATE TABLE `challenges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`challengerId` int NOT NULL,
	`challengedId` int NOT NULL,
	`courseId` int NOT NULL,
	`challengerScore` int,
	`challengedScore` int,
	`status` enum('pending','accepted','completed','declined') NOT NULL DEFAULT 'pending',
	`winnerId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `challenges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_achievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`badgeName` varchar(100) NOT NULL,
	`badgeIcon` varchar(10),
	`courseId` int,
	`scoreObtained` int NOT NULL,
	`earnedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_achievements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `weekly_leaderboard` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`weekNumber` int NOT NULL,
	`year` int NOT NULL,
	`region` varchar(100),
	`totalPoints` int NOT NULL DEFAULT 0,
	`quizzesCompleted` int NOT NULL DEFAULT 0,
	`averageScore` int NOT NULL DEFAULT 0,
	`rank` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `weekly_leaderboard_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `challenges` ADD CONSTRAINT `challenges_challengerId_users_id_fk` FOREIGN KEY (`challengerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `challenges` ADD CONSTRAINT `challenges_challengedId_users_id_fk` FOREIGN KEY (`challengedId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `challenges` ADD CONSTRAINT `challenges_courseId_courses_id_fk` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `challenges` ADD CONSTRAINT `challenges_winnerId_users_id_fk` FOREIGN KEY (`winnerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_achievements` ADD CONSTRAINT `user_achievements_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_achievements` ADD CONSTRAINT `user_achievements_courseId_courses_id_fk` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `weekly_leaderboard` ADD CONSTRAINT `weekly_leaderboard_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `challenges_challenger_idx` ON `challenges` (`challengerId`);--> statement-breakpoint
CREATE INDEX `challenges_challenged_idx` ON `challenges` (`challengedId`);--> statement-breakpoint
CREATE INDEX `challenges_status_idx` ON `challenges` (`status`);--> statement-breakpoint
CREATE INDEX `user_achievements_user_idx` ON `user_achievements` (`userId`);--> statement-breakpoint
CREATE INDEX `user_achievements_badge_idx` ON `user_achievements` (`badgeName`);--> statement-breakpoint
CREATE INDEX `weekly_leaderboard_user_idx` ON `weekly_leaderboard` (`userId`);--> statement-breakpoint
CREATE INDEX `weekly_leaderboard_week_idx` ON `weekly_leaderboard` (`weekNumber`,`year`);--> statement-breakpoint
CREATE INDEX `weekly_leaderboard_region_idx` ON `weekly_leaderboard` (`region`);--> statement-breakpoint
CREATE INDEX `weekly_leaderboard_rank_idx` ON `weekly_leaderboard` (`rank`);