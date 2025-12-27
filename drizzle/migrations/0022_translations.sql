-- Migration: Système de traduction automatique
-- Date: 2025-12-27
-- Description: Tables pour stocker les traductions multilingues et les préférences utilisateur

-- Table des traductions
CREATE TABLE IF NOT EXISTS `translations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `key` VARCHAR(255) NOT NULL UNIQUE COMMENT 'Clé unique de traduction (ex: button.save)',
  `fr` TEXT NOT NULL COMMENT 'Texte en français',
  `dioula` TEXT COMMENT 'Traduction en Dioula',
  `bambara` TEXT COMMENT 'Traduction en Bambara',
  `wolof` TEXT COMMENT 'Traduction en Wolof',
  `category` VARCHAR(100) NOT NULL COMMENT 'Catégorie (buttons, labels, messages, errors, etc.)',
  `context` TEXT COMMENT 'Contexte d&#39;utilisation pour aider la traduction',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_category` (`category`),
  INDEX `idx_key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des préférences linguistiques des utilisateurs
CREATE TABLE IF NOT EXISTS `user_language_preferences` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL COMMENT 'ID de l&#39;utilisateur',
  `preferred_language` VARCHAR(20) NOT NULL DEFAULT 'fr' COMMENT 'Langue préférée (fr, dioula, bambara, wolof)',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_user_language` (`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insérer quelques traductions de base pour tester le système
INSERT INTO `translations` (`key`, `fr`, `dioula`, `category`, `context`) VALUES
('welcome', 'Bienvenue sur la plateforme IFN Connect', 'Aw ni ce IFN Connect ka yɔrɔ la', 'messages', 'Message de bienvenue sur la page d&#39;accueil'),
('button.save', 'Enregistrer', 'Mara', 'buttons', 'Bouton pour sauvegarder des données'),
('button.cancel', 'Annuler', 'Dabɔ', 'buttons', 'Bouton pour annuler une action'),
('button.validate', 'Valider', 'Lajɛ', 'buttons', 'Bouton pour valider un formulaire'),
('button.back', 'Retour', 'Segin', 'buttons', 'Bouton pour revenir en arrière'),
('sales.record', 'Enregistrez vos ventes quotidiennes facilement', 'i ka loon o loon feereli sɛbɛ nɔgɔya la', 'messages', 'Message d&#39;encouragement pour enregistrer les ventes'),
('social.check', 'Vérifiez votre protection sociale', 'aw k&#39;aw ka sigiɲɔgɔnya latangacogo sɛgɛsɛgɛ', 'messages', 'Message pour vérifier la couverture sociale'),
('stock.low', 'Votre stock est faible, pensez à commander', 'Aw ka minanw ka dɔgɔ, aw k&#39;a lajɛ ka komandi kɛ', 'messages', 'Alerte de stock bas'),
('congratulations', 'Félicitations pour votre journée productive !', 'Ani kunnadiya aw ka loon nafaman na!', 'messages', 'Message de félicitations');
