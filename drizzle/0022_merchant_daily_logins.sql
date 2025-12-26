-- Migration: Créer la table merchant_daily_logins pour tracker les logins quotidiens
-- Date: 2024-12-26
-- Description: Cette table permet de détecter le premier login du jour pour déclencher le briefing matinal

CREATE TABLE IF NOT EXISTS `merchant_daily_logins` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `merchant_id` INT NOT NULL,
  `login_date` DATE NOT NULL,
  `first_login_time` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `briefing_shown` BOOLEAN DEFAULT FALSE,
  `briefing_skipped` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_merchant_date` (`merchant_id`, `login_date`),
  INDEX `merchant_id_idx` (`merchant_id`),
  INDEX `login_date_idx` (`login_date`),
  FOREIGN KEY (`merchant_id`) REFERENCES `merchants`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
