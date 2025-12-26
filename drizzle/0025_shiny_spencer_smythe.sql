ALTER TABLE `cmu_reimbursements` ADD `transactionId` varchar(100);--> statement-breakpoint
ALTER TABLE `cnps_payments` ADD `transactionId` varchar(100);--> statement-breakpoint
ALTER TABLE `cmu_reimbursements` ADD CONSTRAINT `cmu_reimbursements_transactionId_unique` UNIQUE(`transactionId`);--> statement-breakpoint
ALTER TABLE `cnps_payments` ADD CONSTRAINT `cnps_payments_transactionId_unique` UNIQUE(`transactionId`);