-- Simplification radicale des questions de quiz pour inclusion sociale
-- Phrases courtes (max 10 mots), vocabulaire simple, 3 réponses au lieu de 4

-- ============================================
-- COURS 1 : Gérer son stock de produits vivriers
-- ============================================

-- Supprimer les anciennes questions du cours 1
DELETE FROM quizzes WHERE courseId = 1;

-- Insérer les nouvelles questions simplifiées
INSERT INTO quizzes (courseId, question, optionA, optionB, optionC, correctAnswer, explanation) VALUES
(1, 'Pourquoi noter son stock ?', 'Pour savoir ce qui reste', 'Pour perdre du temps', 'Ce n''est pas utile', 'A', 'Noter votre stock vous aide à savoir ce que vous avez.'),
(1, 'Quand vérifier son stock ?', 'Tous les jours', 'Une fois par an', 'Jamais', 'A', 'Vérifiez votre stock tous les jours pour éviter les surprises.'),
(1, 'Que faire si un produit manque ?', 'Commander rapidement', 'Attendre', 'Fermer la boutique', 'A', 'Commandez vite pour ne pas perdre de clients.'),
(1, 'Comment savoir qu''un produit se vend bien ?', 'Il manque souvent', 'Il reste toujours', 'Il est cher', 'A', 'Si un produit manque souvent, c''est qu''il se vend bien.'),
(1, 'Où noter son stock ?', 'Dans un cahier', 'Dans sa tête', 'Nulle part', 'A', 'Notez dans un cahier ou sur votre téléphone.');

-- ============================================
-- COURS 2 : Réduire les ruptures de stock
-- ============================================

DELETE FROM quizzes WHERE courseId = 2;

INSERT INTO quizzes (courseId, question, optionA, optionB, optionC, correctAnswer, explanation) VALUES
(2, 'C''est quoi une rupture de stock ?', 'Quand un produit manque', 'Quand on a trop de stock', 'Quand on vend bien', 'A', 'Une rupture, c''est quand vous n''avez plus de produit à vendre.'),
(2, 'Que faire pour éviter les ruptures ?', 'Commander à l''avance', 'Attendre que tout soit fini', 'Augmenter les prix', 'A', 'Commandez avant que le stock soit vide.'),
(2, 'Combien de jours de stock garder ?', 'Au moins 7 jours', '1 jour seulement', '1 an', 'A', 'Gardez toujours au moins 7 jours de stock.'),
(2, 'Quand commander plus de riz ?', 'Quand il reste 10 sacs', 'Quand il reste 0 sac', 'Quand le prix monte', 'A', 'Commandez avant d''être à zéro.');

-- ============================================
-- COURS 3 : Réseaux sociaux pour le commerce
-- ============================================

DELETE FROM quizzes WHERE courseId = 3;

INSERT INTO quizzes (courseId, question, optionA, optionB, optionC, correctAnswer, explanation) VALUES
(3, 'Quel réseau social utiliser en Côte d''Ivoire ?', 'WhatsApp', 'Twitter', 'LinkedIn', 'A', 'WhatsApp est le plus utilisé en Côte d''Ivoire.'),
(3, 'Que publier sur Facebook ?', 'Photos de vos produits', 'Votre vie privée', 'Des insultes', 'A', 'Publiez des belles photos de vos produits avec les prix.'),
(3, 'Combien de fois publier par semaine ?', '3-4 fois', '20 fois par jour', 'Jamais', 'A', 'Publiez 3-4 fois par semaine, pas trop.'),
(3, 'Comment attirer des clients sur WhatsApp ?', 'Publier des photos avec prix', 'Envoyer des messages à tout le monde', 'Ne rien faire', 'A', 'Les photos avec prix attirent les clients.');

-- ============================================
-- COURS 4 : Bases du marketing
-- ============================================

DELETE FROM quizzes WHERE courseId = 4;

INSERT INTO quizzes (courseId, question, optionA, optionB, optionC, correctAnswer, explanation) VALUES
(4, 'C''est quoi le marketing ?', 'Attirer des clients', 'Vendre très cher', 'Copier les autres', 'A', 'Le marketing, c''est attirer et garder les clients.'),
(4, 'Comment fixer un bon prix ?', 'Coût + petit bénéfice', 'Le plus cher possible', 'Prix au hasard', 'A', 'Calculez votre coût et ajoutez un petit bénéfice.'),
(4, 'C''est quoi un client fidèle ?', 'Quelqu''un qui revient souvent', 'Quelqu''un qui achète une fois', 'Quelqu''un qui marchande', 'A', 'Un client fidèle revient acheter régulièrement.'),
(4, 'Comment garder les clients ?', 'Bon service et sourire', 'Prix très élevés', 'Être méchant', 'A', 'Un bon service et un sourire fidélisent les clients.');

-- ============================================
-- COURS 5 : Inventaire mensuel
-- ============================================

DELETE FROM quizzes WHERE courseId = 5;

INSERT INTO quizzes (courseId, question, optionA, optionB, optionC, correctAnswer, explanation) VALUES
(5, 'C''est quoi un inventaire ?', 'Compter tout son stock', 'Vendre tout', 'Jeter les produits', 'A', 'L''inventaire, c''est compter tout ce que vous avez.'),
(5, 'Quand faire l''inventaire ?', 'Tous les mois', 'Tous les 5 ans', 'Jamais', 'A', 'Faites l''inventaire tous les mois.'),
(5, 'Quel est le bon moment ?', 'Le soir après fermeture', 'Pendant les heures de vente', 'Le dimanche matin', 'A', 'Le soir, vous êtes tranquille pour compter.');

-- ============================================
-- COURS 30001 : CNPS (Protection Sociale)
-- ============================================

DELETE FROM quizzes WHERE courseId = 30001;

INSERT INTO quizzes (courseId, question, optionA, optionB, optionC, correctAnswer, explanation) VALUES
(30001, 'C''est quoi la CNPS ?', 'Caisse de retraite', 'Une banque', 'Un supermarché', 'A', 'La CNPS gère votre retraite.'),
(30001, 'Qui peut cotiser à la CNPS ?', 'Tous les travailleurs', 'Seulement les fonctionnaires', 'Personne', 'A', 'Même les marchands peuvent cotiser.'),
(30001, 'Pourquoi cotiser à la CNPS ?', 'Pour avoir une retraite', 'Pour voyager gratuit', 'Pour ne rien payer', 'A', 'Vous aurez de l''argent chaque mois quand vous serez vieux.'),
(30001, 'À quel âge prendre sa retraite ?', '60 ans', '40 ans', '80 ans', 'A', 'On prend la retraite à 60 ans en Côte d''Ivoire.');

-- ============================================
-- COURS 30002 : CMU (Couverture Maladie)
-- ============================================

DELETE FROM quizzes WHERE courseId = 30002;

INSERT INTO quizzes (courseId, question, optionA, optionB, optionC, correctAnswer, explanation) VALUES
(30002, 'C''est quoi la CMU ?', 'Assurance santé', 'Une banque', 'Un hôpital', 'A', 'La CMU paie vos frais de santé.'),
(30002, 'Combien la CMU rembourse ?', '70% des frais', '10% des frais', 'Tout', 'A', 'La CMU paie 70% de vos frais à l''hôpital.'),
(30002, 'Combien coûte la CMU par an ?', '7 000 FCFA', '100 000 FCFA', 'Gratuit', 'A', 'Seulement 7 000 FCFA par an pour vous protéger.');

-- ============================================
-- COURS 30003 : Ouvrir Orange Money
-- ============================================

DELETE FROM quizzes WHERE courseId = 30003;

INSERT INTO quizzes (courseId, question, optionA, optionB, optionC, correctAnswer, explanation) VALUES
(30003, 'C''est quoi Orange Money ?', 'Argent sur le téléphone', 'Une banque physique', 'Une carte bancaire', 'A', 'Orange Money, c''est de l''argent sur votre téléphone.'),
(30003, 'Faut-il un compte bancaire ?', 'Non, juste un téléphone', 'Oui, obligatoire', 'Oui, avec 1 million', 'A', 'Pas besoin de banque, juste votre téléphone.'),
(30003, 'Comment activer Orange Money ?', 'Composer #144#', 'Aller en France', 'Attendre 6 mois', 'A', 'Composez #144# et suivez les instructions.');

-- ============================================
-- COURS 30004 : Transfert Orange Money
-- ============================================

DELETE FROM quizzes WHERE courseId = 30004;

INSERT INTO quizzes (courseId, question, optionA, optionB, optionC, correctAnswer, explanation) VALUES
(30004, 'Comment envoyer de l''argent ?', 'Composer #144#1#', 'Aller à la banque', 'Envoyer un SMS', 'A', 'Composez #144#1# puis le numéro et le montant.'),
(30004, 'C''est rapide Orange Money ?', 'Oui, instantané', 'Non, 1 semaine', 'Non, 1 mois', 'A', 'L''argent arrive en quelques secondes.'),
(30004, 'Peut-on annuler un transfert ?', 'Non, c''est définitif', 'Oui, toujours', 'Oui, dans 24h', 'A', 'Vérifiez bien le numéro avant d''envoyer.');

-- ============================================
-- COURS 30005 : Mobile Money pour commerce
-- ============================================

DELETE FROM quizzes WHERE courseId = 30005;

INSERT INTO quizzes (courseId, question, optionA, optionB, optionC, correctAnswer, explanation) VALUES
(30005, 'Pourquoi accepter Mobile Money ?', 'Pour vendre plus', 'Pour compliquer', 'Pour perdre de l''argent', 'A', 'Les clients sans cash pourront quand même acheter.'),
(30005, 'Quels sont les opérateurs ?', 'Orange, MTN, Moov, Wave', 'Visa, Mastercard', 'Facebook, WhatsApp', 'A', 'Il y a 4 opérateurs principaux en Côte d''Ivoire.'),
(30005, 'Faut-il payer des frais ?', 'Non, c''est gratuit pour vous', 'Oui, 50% du montant', 'Oui, 10 000 FCFA', 'A', 'C''est le client qui paie les frais, pas vous.');
