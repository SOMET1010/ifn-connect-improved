-- Script SQL pour peupler les événements 2025-2026 et leurs recommandations de stock

-- Insérer les événements
INSERT INTO local_events (name, type, date, endDate, description, isRecurring, iconEmoji, color) VALUES
('Ramadan 2025', 'religious', '2025-03-01', '2025-03-30', 'Mois sacré du jeûne musulman', 1, '🌙', 'green'),
('Tabaski 2025 (Aïd el-Kebir)', 'religious', '2025-06-07', NULL, 'Fête du sacrifice', 1, '🐑', 'purple'),
('Fête de l''Indépendance', 'national', '2025-08-07', NULL, 'Indépendance de la Côte d''Ivoire', 1, '🇨🇮', 'orange'),
('Rentrée Scolaire 2025', 'cultural', '2025-09-15', NULL, 'Début de l''année scolaire', 1, '📚', 'blue'),
('Noël 2025', 'religious', '2025-12-25', NULL, 'Fête de la Nativité', 1, '🎄', 'red'),
('Nouvel An 2026', 'cultural', '2026-01-01', NULL, 'Nouvelle année', 1, '🎉', 'gold');

-- Recommandations de stock pour Ramadan 2025 (eventId = 1)
INSERT INTO event_stock_recommendations (eventId, productName, category, priority, estimatedDemandIncrease, notes) VALUES
(1, 'Sucre', 'Alimentaire', 'high', 200, 'Très forte demande pendant le Ramadan pour la rupture du jeûne'),
(1, 'Lait', 'Alimentaire', 'high', 150, 'Consommation importante pour les boissons chaudes'),
(1, 'Dattes', 'Alimentaire', 'high', 300, 'Produit traditionnel pour rompre le jeûne'),
(1, 'Farine', 'Alimentaire', 'medium', 120, 'Pour la préparation de pâtisseries'),
(1, 'Huile', 'Alimentaire', 'medium', 130, 'Cuisson des plats du soir'),
(1, 'Riz', 'Alimentaire', 'medium', 110, 'Base des repas du soir'),
(1, 'Café', 'Boissons', 'medium', 140, 'Consommation accrue pendant le Sahur (repas avant l''aube)'),
(1, 'Thé', 'Boissons', 'medium', 140, 'Boisson populaire pour la rupture du jeûne');

-- Recommandations de stock pour Tabaski 2025 (eventId = 2)
INSERT INTO event_stock_recommendations (eventId, productName, category, priority, estimatedDemandIncrease, notes) VALUES
(2, 'Mouton', 'Viande', 'high', 500, 'Produit central de la fête du sacrifice'),
(2, 'Riz', 'Alimentaire', 'high', 180, 'Accompagnement principal des plats de fête'),
(2, 'Huile', 'Alimentaire', 'high', 150, 'Cuisson des viandes et plats'),
(2, 'Condiments', 'Alimentaire', 'medium', 140, 'Épices et assaisonnements pour les plats'),
(2, 'Oignons', 'Légumes', 'medium', 160, 'Ingrédient essentiel des sauces'),
(2, 'Tomates', 'Légumes', 'medium', 150, 'Base des sauces'),
(2, 'Charbon', 'Combustible', 'medium', 200, 'Pour la cuisson des viandes grillées'),
(2, 'Boissons gazeuses', 'Boissons', 'low', 120, 'Rafraîchissements pour les invités');

-- Recommandations de stock pour Fête de l'Indépendance (eventId = 3)
INSERT INTO event_stock_recommendations (eventId, productName, category, priority, estimatedDemandIncrease, notes) VALUES
(3, 'Boissons', 'Boissons', 'high', 200, 'Forte consommation pendant les célébrations'),
(3, 'Snacks', 'Alimentaire', 'high', 180, 'Grignotages pour les festivités'),
(3, 'Drapeaux ivoiriens', 'Décoration', 'medium', 300, 'Symboles patriotiques très demandés'),
(3, 'Bière', 'Boissons', 'medium', 150, 'Consommation festive'),
(3, 'Poulet', 'Viande', 'medium', 130, 'Plats de fête'),
(3, 'Pain', 'Boulangerie', 'low', 110, 'Accompagnement des repas');

-- Recommandations de stock pour Rentrée Scolaire 2025 (eventId = 4)
INSERT INTO event_stock_recommendations (eventId, productName, category, priority, estimatedDemandIncrease, notes) VALUES
(4, 'Cahiers', 'Scolaire', 'high', 400, 'Fourniture essentielle pour tous les élèves'),
(4, 'Stylos', 'Scolaire', 'high', 350, 'Forte demande en début d''année'),
(4, 'Uniformes scolaires', 'Vêtements', 'high', 250, 'Obligatoires dans la plupart des écoles'),
(4, 'Sacs d''école', 'Scolaire', 'medium', 200, 'Renouvellement annuel'),
(4, 'Crayons', 'Scolaire', 'medium', 180, 'Matériel de base'),
(4, 'Règles', 'Scolaire', 'medium', 150, 'Géométrie et dessin'),
(4, 'Gommes', 'Scolaire', 'low', 140, 'Accessoire complémentaire'),
(4, 'Ardoises', 'Scolaire', 'low', 120, 'Pour les classes primaires');

-- Recommandations de stock pour Noël 2025 (eventId = 5)
INSERT INTO event_stock_recommendations (eventId, productName, category, priority, estimatedDemandIncrease, notes) VALUES
(5, 'Poulet', 'Viande', 'high', 250, 'Plat traditionnel de Noël'),
(5, 'Vin', 'Boissons', 'high', 200, 'Boisson festive'),
(5, 'Gâteaux', 'Pâtisserie', 'medium', 180, 'Desserts de fête'),
(5, 'Décorations de Noël', 'Décoration', 'medium', 220, 'Sapins, guirlandes, boules'),
(5, 'Champagne', 'Boissons', 'medium', 150, 'Célébrations'),
(5, 'Chocolats', 'Confiserie', 'medium', 160, 'Cadeaux et gourmandises'),
(5, 'Jouets', 'Cadeaux', 'low', 200, 'Cadeaux pour les enfants'),
(5, 'Bougies', 'Décoration', 'low', 130, 'Ambiance festive');

-- Recommandations de stock pour Nouvel An 2026 (eventId = 6)
INSERT INTO event_stock_recommendations (eventId, productName, category, priority, estimatedDemandIncrease, notes) VALUES
(6, 'Champagne', 'Boissons', 'high', 300, 'Incontournable pour le réveillon'),
(6, 'Feux d''artifice', 'Décoration', 'medium', 250, 'Célébrations de minuit'),
(6, 'Snacks', 'Alimentaire', 'medium', 150, 'Grignotages pour la soirée'),
(6, 'Boissons gazeuses', 'Boissons', 'medium', 140, 'Rafraîchissements'),
(6, 'Cotillons', 'Décoration', 'low', 200, 'Chapeaux, sifflets, confettis'),
(6, 'Gâteaux', 'Pâtisserie', 'low', 130, 'Desserts de fête');
