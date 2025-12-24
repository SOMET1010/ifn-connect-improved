ALTER TABLE `markets` ADD `latitude` decimal(10,8);--> statement-breakpoint
ALTER TABLE `markets` ADD `longitude` decimal(11,8);--> statement-breakpoint
ALTER TABLE `markets` ADD `address` text;--> statement-breakpoint
ALTER TABLE `markets` ADD `isGeolocated` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `markets` ADD `geolocatedAt` timestamp;