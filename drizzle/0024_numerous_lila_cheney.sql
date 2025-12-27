CREATE INDEX `created_at_idx` ON `marketplace_orders` (`created_at`);--> statement-breakpoint
CREATE INDEX `buyer_status_idx` ON `marketplace_orders` (`buyer_id`,`status`);--> statement-breakpoint
CREATE INDEX `payment_method_idx` ON `sales` (`paymentMethod`);--> statement-breakpoint
CREATE INDEX `merchant_payment_idx` ON `sales` (`merchantId`,`paymentMethod`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `transactions` (`created_at`);--> statement-breakpoint
CREATE INDEX `merchant_status_idx` ON `transactions` (`merchant_id`,`status`);