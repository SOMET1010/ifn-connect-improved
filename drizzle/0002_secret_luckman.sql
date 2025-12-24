CREATE TABLE `actors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actorKey` varchar(50) NOT NULL,
	`marketId` int,
	`marketName` varchar(255) NOT NULL,
	`rowNo` int,
	`fullName` varchar(255) NOT NULL,
	`identifierCode` varchar(50),
	`phone` varchar(20),
	`sourceFile` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `actors_id` PRIMARY KEY(`id`),
	CONSTRAINT `actors_actorKey_unique` UNIQUE(`actorKey`)
);
--> statement-breakpoint
CREATE TABLE `markets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`sourceFile` text,
	`declaredEffectif` int,
	`declaredCmu` int,
	`declaredCnps` int,
	`declaredRsti` int,
	`rowsInFile` int,
	`uniqueIdentifierCodes` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `markets_id` PRIMARY KEY(`id`),
	CONSTRAINT `markets_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
ALTER TABLE `actors` ADD CONSTRAINT `actors_marketId_markets_id_fk` FOREIGN KEY (`marketId`) REFERENCES `markets`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `actor_key_idx` ON `actors` (`actorKey`);--> statement-breakpoint
CREATE INDEX `actor_market_name_idx` ON `actors` (`marketName`);--> statement-breakpoint
CREATE INDEX `actor_identifier_idx` ON `actors` (`identifierCode`);--> statement-breakpoint
CREATE INDEX `actor_phone_idx` ON `actors` (`phone`);--> statement-breakpoint
CREATE INDEX `market_name_idx` ON `markets` (`name`);