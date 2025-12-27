-- Seed de la bibliothèque audio avec traductions de base en Dioula
-- Ces traductions seront ensuite converties en audio via Lafricamobile

INSERT INTO `audio_library` (`key`, `category`, `text_fr`, `text_dioula`, `context`, `priority`) VALUES
-- Messages de bienvenue
('welcome.home', 'welcome', 'Bienvenue sur la plateforme IFN Connect', 'Aw ni ce IFN Connect ka yɔrɔ la', 'Message de bienvenue sur la page d''accueil', 1),
('welcome.morning', 'welcome', 'Bonjour ! Prêt à commencer votre journée ?', 'Ini sɔgɔma! Aw labɛnna ka aw ka loon daminɛ wa?', 'Salutation matinale', 1),
('welcome.back', 'welcome', 'Content de vous revoir !', 'An nisɔndiyara k''aw ye tugun!', 'Message de retour pour utilisateur connu', 0),

-- Boutons principaux
('button.open_day', 'buttons', 'Ouvrir ma journée', 'N ka loon dayɛlɛ', 'Bouton pour démarrer la journée de travail', 2),
('button.close_day', 'buttons', 'Fermer ma journée', 'N ka loon datugu', 'Bouton pour terminer la journée de travail', 2),
('button.sell', 'buttons', 'Vendre', 'Feere', 'Bouton pour enregistrer une vente', 2),
('button.stock', 'buttons', 'Mon stock', 'N ka minanw', 'Bouton pour voir le stock', 1),
('button.order', 'buttons', 'Commander', 'Komandi kɛ', 'Bouton pour passer une commande', 1),
('button.money', 'buttons', 'Mon argent', 'N ka wari', 'Bouton pour voir les finances', 1),
('button.save', 'buttons', 'Enregistrer', 'Mara', 'Bouton pour sauvegarder', 0),
('button.cancel', 'buttons', 'Annuler', 'Dabɔ', 'Bouton pour annuler', 0),
('button.validate', 'buttons', 'Valider', 'Lajɛ', 'Bouton pour valider', 1),
('button.back', 'buttons', 'Retour', 'Segin', 'Bouton pour revenir en arrière', 0),

-- Instructions
('instruction.cash_register', 'instructions', 'Tapez le montant de la vente avec les chiffres', 'Aw ye feereli hakɛ sɛbɛ ni jateminɛnw ye', 'Instruction pour utiliser la caisse', 1),
('instruction.voice_command', 'instructions', 'Appuyez sur le microphone et dites votre commande', 'Aw ye mikɔrɔfɔni digi ani k''aw ka kuma fɔ', 'Instruction pour utiliser les commandes vocales', 1),
('instruction.select_product', 'instructions', 'Choisissez le produit vendu', 'Aw ye fɛɛn min bɛ feere, o sugandi', 'Instruction pour sélectionner un produit', 1),
('instruction.enter_quantity', 'instructions', 'Entrez la quantité', 'Aw ye hakɛ don a kɔnɔ', 'Instruction pour saisir une quantité', 1),

-- Alertes
('alert.stock_low', 'alerts', 'Attention ! Votre stock est faible, pensez à commander', 'Kɔlɔsi! Aw ka minanw ka dɔgɔ, aw k''a lajɛ ka komandi kɛ', 'Alerte de stock bas', 2),
('alert.stock_critical', 'alerts', 'Urgent ! Vous n''avez presque plus de stock', 'Teliya! Aw ka minanw banna ka ban!', 'Alerte de stock critique', 2),
('alert.cnps_expiring', 'alerts', 'Votre CNPS expire bientôt, pensez à renouveler', 'Aw ka CNPS bɛna ban sisan, aw k''a lajɛ k''a yɛlɛma', 'Alerte d''expiration CNPS', 2),
('alert.cmu_expiring', 'alerts', 'Votre CMU expire bientôt, pensez à renouveler', 'Aw ka CMU bɛna ban sisan, aw k''a lajɛ k''a yɛlɛma', 'Alerte d''expiration CMU', 2),

-- Confirmations
('confirm.sale_recorded', 'confirmations', 'Vente enregistrée avec succès !', 'Feereli marabɔra ka ɲɛ!', 'Confirmation d''enregistrement de vente', 2),
('confirm.payment_success', 'confirmations', 'Paiement réussi !', 'Warisago ɲɛmɔgɔyara!', 'Confirmation de paiement réussi', 2),
('confirm.order_placed', 'confirmations', 'Votre commande a été envoyée', 'Aw ka komandi cirabɔra', 'Confirmation de commande passée', 1),
('confirm.day_opened', 'confirmations', 'Bonne journée de travail !', 'Baara loon ɲuman!', 'Confirmation d''ouverture de journée', 1),
('confirm.day_closed', 'confirmations', 'Bonne soirée ! À demain', 'Su ɲuman! Hali sini!', 'Confirmation de fermeture de journée', 1),

-- Erreurs
('error.generic', 'errors', 'Une erreur s''est produite, réessayez', 'Fili dɔ kɛra, aw k''a lajɛ tugun', 'Message d''erreur générique', 1),
('error.no_connection', 'errors', 'Pas de connexion internet, les données seront synchronisées plus tard', 'Ɛntɛrinɛti tɛ, kunnafoniw bɛna bɛn ɲɔgɔn ma kɔfɛ', 'Erreur de connexion', 1),
('error.invalid_amount', 'errors', 'Le montant n''est pas valide', 'Hakɛ tɛ ɲɛ', 'Erreur de montant invalide', 1),

-- Navigation
('nav.go_to_cash_register', 'navigation', 'Aller à la caisse', 'Taga warisagoyɔrɔ', 'Navigation vers la caisse', 0),
('nav.go_to_stock', 'navigation', 'Aller au stock', 'Taga minanw yɔrɔ', 'Navigation vers le stock', 0),
('nav.go_to_market', 'navigation', 'Aller au marché', 'Taga sugu', 'Navigation vers le marché virtuel', 0),
('nav.go_to_profile', 'navigation', 'Aller au profil', 'Taga aw yɛrɛ ka kunnafoni yɔrɔ', 'Navigation vers le profil', 0),

-- Succès
('success.congratulations', 'success', 'Félicitations pour votre journée productive !', 'Ani kunnadiya aw ka loon nafaman na!', 'Message de félicitations', 1),
('success.good_sales', 'success', 'Très bien ! Vous avez fait de bonnes ventes aujourd''hui', 'A ka ɲɛ kosɔbɛ! Aw ye feereli ɲumanw kɛ bi!', 'Encouragement pour bonnes ventes', 1),
('success.keep_going', 'success', 'Continuez comme ça !', 'Aw ka taa a fɛ o cogo la!', 'Encouragement général', 0)
ON DUPLICATE KEY UPDATE
  `text_dioula` = VALUES(`text_dioula`),
  `context` = VALUES(`context`),
  `priority` = VALUES(`priority`),
  `updated_at` = CURRENT_TIMESTAMP;
