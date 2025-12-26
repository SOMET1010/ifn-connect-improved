CREATE TABLE `auth_audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`action` enum('login_attempt','login_success','login_failed','otp_sent','otp_verified','otp_failed','pin_verified','pin_failed','pin_changed','session_created','session_expired','logout') NOT NULL,
	`merchantNumber` varchar(50),
	`ipAddress` varchar(45),
	`userAgent` text,
	`details` text,
	`success` boolean NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auth_audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `auth_otp_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`phone` varchar(20) NOT NULL,
	`otpCode` varchar(6) NOT NULL,
	`status` enum('sent','verified','expired','failed') NOT NULL DEFAULT 'sent',
	`failedAttempts` int NOT NULL DEFAULT 0,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`verifiedAt` timestamp,
	`expiresAt` timestamp NOT NULL,
	`ipAddress` varchar(45),
	CONSTRAINT `auth_otp_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `auth_pins` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`pinHash` varchar(255) NOT NULL,
	`isTemporary` boolean NOT NULL DEFAULT true,
	`mustChange` boolean NOT NULL DEFAULT true,
	`failedAttempts` int NOT NULL DEFAULT 0,
	`lockedUntil` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `auth_pins_id` PRIMARY KEY(`id`),
	CONSTRAINT `auth_pins_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `auth_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(255) NOT NULL,
	`userId` int NOT NULL,
	`deviceInfo` text,
	`ipAddress` varchar(45),
	`lastActivity` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auth_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `auth_sessions_sessionId_unique` UNIQUE(`sessionId`)
);
--> statement-breakpoint
ALTER TABLE `auth_audit_logs` ADD CONSTRAINT `auth_audit_logs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `auth_otp_logs` ADD CONSTRAINT `auth_otp_logs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `auth_pins` ADD CONSTRAINT `auth_pins_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `auth_sessions` ADD CONSTRAINT `auth_sessions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `auth_audit_logs_user_idx` ON `auth_audit_logs` (`userId`);--> statement-breakpoint
CREATE INDEX `auth_audit_logs_action_idx` ON `auth_audit_logs` (`action`);--> statement-breakpoint
CREATE INDEX `auth_audit_logs_created_at_idx` ON `auth_audit_logs` (`createdAt`);--> statement-breakpoint
CREATE INDEX `auth_audit_logs_merchant_number_idx` ON `auth_audit_logs` (`merchantNumber`);--> statement-breakpoint
CREATE INDEX `auth_otp_logs_user_idx` ON `auth_otp_logs` (`userId`);--> statement-breakpoint
CREATE INDEX `auth_otp_logs_phone_idx` ON `auth_otp_logs` (`phone`);--> statement-breakpoint
CREATE INDEX `auth_otp_logs_status_idx` ON `auth_otp_logs` (`status`);--> statement-breakpoint
CREATE INDEX `auth_otp_logs_expires_at_idx` ON `auth_otp_logs` (`expiresAt`);--> statement-breakpoint
CREATE INDEX `auth_pins_user_idx` ON `auth_pins` (`userId`);--> statement-breakpoint
CREATE INDEX `auth_sessions_session_idx` ON `auth_sessions` (`sessionId`);--> statement-breakpoint
CREATE INDEX `auth_sessions_user_idx` ON `auth_sessions` (`userId`);--> statement-breakpoint
CREATE INDEX `auth_sessions_expires_at_idx` ON `auth_sessions` (`expiresAt`);