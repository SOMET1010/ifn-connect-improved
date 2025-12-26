CREATE TABLE `course_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`courseId` int NOT NULL,
	`progress` int NOT NULL DEFAULT 0,
	`completed` boolean NOT NULL DEFAULT false,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `course_progress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `courses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`category` varchar(100) NOT NULL,
	`duration` int NOT NULL,
	`videoUrl` text,
	`thumbnailUrl` text,
	`level` varchar(50) NOT NULL DEFAULT 'beginner',
	`isPublished` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `courses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `course_progress` ADD CONSTRAINT `course_progress_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `course_progress` ADD CONSTRAINT `course_progress_courseId_courses_id_fk` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `course_progress_user_idx` ON `course_progress` (`userId`);--> statement-breakpoint
CREATE INDEX `course_progress_course_idx` ON `course_progress` (`courseId`);--> statement-breakpoint
CREATE INDEX `course_progress_completed_idx` ON `course_progress` (`completed`);--> statement-breakpoint
CREATE INDEX `course_progress_unique_user_course` ON `course_progress` (`userId`,`courseId`);--> statement-breakpoint
CREATE INDEX `courses_category_idx` ON `courses` (`category`);--> statement-breakpoint
CREATE INDEX `courses_level_idx` ON `courses` (`level`);--> statement-breakpoint
CREATE INDEX `courses_published_idx` ON `courses` (`isPublished`);