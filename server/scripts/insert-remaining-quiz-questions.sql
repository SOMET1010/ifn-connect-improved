-- Insertion des 50 questions de quiz manquantes pour les cours 3-10
-- Cours 3-5 : Marketing (2) + Gestion Stock (1)
-- Cours 30001-30005 : Protection Sociale (2) + Paiements Mobiles (3)

-- ============================================
-- COURS 3 : Faire connaître son commerce avec les réseaux sociaux (Marketing)
-- ============================================

INSERT INTO quizzes (courseId, question, optionA, optionB, optionC, optionD, correctAnswer, explanation) VALUES
(3, 'Quel réseau social est le plus utilisé en Côte d''Ivoire pour le commerce ?', 'WhatsApp', 'Instagram', 'Twitter', 'LinkedIn', 'A', 'WhatsApp est le réseau social le plus populaire en Côte d''Ivoire avec plus de 8 millions d''utilisateurs, idéal pour communiquer avec les clients.'),
(3, 'Quelle est la meilleure fréquence pour publier sur Facebook ?', '1 fois par jour', '1 fois par semaine', '3-4 fois par semaine', '10 fois par jour', 'C', 'Publier 3-4 fois par semaine maintient l''engagement sans saturer votre audience.'),
(3, 'Quel type de contenu fonctionne le mieux sur les réseaux sociaux ?', 'Texte uniquement', 'Photos de produits', 'Vidéos courtes', 'Liens externes', 'B', 'Les photos de produits attirent l''attention et montrent clairement ce que vous vendez.'),
(3, 'Comment créer un groupe WhatsApp Business efficace ?', 'Ajouter tout le monde', 'Limiter à 50 clients fidèles', 'Envoyer des messages toutes les heures', 'Ne jamais répondre aux questions', 'B', 'Un groupe de 50 clients fidèles permet une communication personnalisée et efficace.'),
(3, 'Quelle est la meilleure heure pour publier sur Facebook en Côte d''Ivoire ?', '6h-8h du matin', '12h-14h (pause déjeuner)', '22h-minuit', '3h du matin', 'B', 'La pause déjeuner (12h-14h) est le moment où les gens consultent le plus leur téléphone.'),
(3, 'Comment attirer plus de clients avec WhatsApp Status ?', 'Publier des photos de produits avec prix', 'Partager des mèmes', 'Ne rien publier', 'Copier les statuts des autres', 'A', 'Les photos de produits avec prix clair attirent les clients intéressés et génèrent des ventes.');

-- ============================================
-- COURS 4 : Les bases du marketing pour petit commerce (Marketing)
-- ============================================

INSERT INTO quizzes (courseId, question, optionA, optionB, optionC, optionD, correctAnswer, explanation) VALUES
(4, 'Qu''est-ce que le marketing pour un petit commerce ?', 'Vendre cher', 'Attirer et fidéliser les clients', 'Copier les concurrents', 'Avoir un grand magasin', 'B', 'Le marketing consiste à attirer de nouveaux clients et à les fidéliser pour qu''ils reviennent.'),
(4, 'Quelle est la règle des 4P du marketing ?', 'Produit, Prix, Place, Promotion', 'Profit, Perte, Patience, Persévérance', 'Pouvoir, Politique, Paix, Prospérité', 'Pain, Poisson, Patate, Plantain', 'A', 'Les 4P (Produit, Prix, Place, Promotion) sont les bases du marketing pour tout commerce.'),
(4, 'Comment fixer le bon prix pour vos produits ?', 'Le plus cher possible', 'Coût + marge bénéficiaire + prix marché', 'Même prix que le voisin', 'Prix aléatoire', 'B', 'Le prix doit couvrir vos coûts, vous donner un bénéfice, et rester compétitif sur le marché.'),
(4, 'Qu''est-ce qu''un client fidèle ?', 'Quelqu''un qui achète une seule fois', 'Quelqu''un qui revient régulièrement', 'Quelqu''un qui marchande toujours', 'Quelqu''un qui ne paie jamais', 'B', 'Un client fidèle revient régulièrement et recommande votre commerce à d''autres.'),
(4, 'Comment se différencier de la concurrence ?', 'Baisser tous les prix', 'Offrir un service exceptionnel', 'Critiquer les concurrents', 'Fermer le dimanche', 'B', 'Un service exceptionnel (accueil, conseils, qualité) vous différencie et fidélise les clients.'),
(4, 'Quelle est la meilleure promotion pour attirer de nouveaux clients ?', 'Offre de bienvenue (ex: -10% première visite)', 'Tout gratuit', 'Aucune promotion', 'Prix double', 'A', 'Une offre de bienvenue (ex: -10% ou cadeau) incite les nouveaux clients à essayer votre commerce.'),
(4, 'Comment mesurer le succès de votre marketing ?', 'Nombre de clients nouveaux et fidèles', 'Taille du magasin', 'Nombre d''employés', 'Couleur de l''enseigne', 'A', 'Le succès se mesure par l''augmentation du nombre de clients nouveaux et fidèles.');

-- ============================================
-- COURS 5 : Bien gérer son inventaire mensuel (Gestion Stock)
-- ============================================

INSERT INTO quizzes (courseId, question, optionA, optionB, optionC, optionD, correctAnswer, explanation) VALUES
(5, 'Pourquoi faire un inventaire mensuel ?', 'Pour perdre du temps', 'Pour connaître exactement son stock', 'Pour embêter les employés', 'Ce n''est pas nécessaire', 'B', 'L''inventaire mensuel permet de connaître exactement ce que vous avez en stock et d''éviter les pertes.'),
(5, 'Quel est le meilleur moment pour faire l''inventaire ?', 'Pendant les heures d''ouverture', 'Le soir après fermeture', 'Pendant les jours de marché', 'Jamais', 'B', 'Le soir après fermeture permet de compter calmement sans être dérangé par les clients.'),
(5, 'Comment organiser un inventaire efficace ?', 'Compter au hasard', 'Compter par catégorie de produits', 'Deviner les quantités', 'Ne rien noter', 'B', 'Compter par catégorie (légumes, fruits, céréales) rend l''inventaire plus rapide et précis.'),
(5, 'Que faire si vous trouvez des écarts entre stock réel et stock théorique ?', 'Ignorer les écarts', 'Chercher les causes (vol, casse, erreur)', 'Accuser quelqu''un', 'Fermer le commerce', 'B', 'Analyser les écarts permet d''identifier les problèmes (vol, casse, erreur de saisie) et de les corriger.'),
(5, 'Quel outil utiliser pour noter l''inventaire ?', 'Cahier ou application mobile', 'Rien, mémoriser', 'Écrire sur les murs', 'Attendre la fin du mois', 'A', 'Un cahier ou une application mobile permet de noter et de suivre facilement votre inventaire.'),
(5, 'À quelle fréquence faut-il faire l''inventaire ?', 'Une fois par an', 'Tous les mois', 'Jamais', 'Tous les 5 ans', 'B', 'Un inventaire mensuel permet de suivre régulièrement votre stock et d''éviter les mauvaises surprises.');

-- ============================================
-- COURS 30001 : Comprendre la CNPS et vos droits (Protection Sociale)
-- ============================================

INSERT INTO quizzes (courseId, question, optionA, optionB, optionC, optionD, correctAnswer, explanation) VALUES
(30001, 'Qu''est-ce que la CNPS ?', 'Caisse Nationale de Prévoyance Sociale', 'Caisse Nationale des Petits Salaires', 'Centre National de Protection Sanitaire', 'Conseil National des Produits Sains', 'A', 'La CNPS est la Caisse Nationale de Prévoyance Sociale qui gère la retraite et les prestations sociales.'),
(30001, 'Qui peut cotiser à la CNPS ?', 'Seulement les fonctionnaires', 'Tous les travailleurs (salariés et indépendants)', 'Seulement les riches', 'Personne', 'B', 'Tous les travailleurs, y compris les marchands indépendants, peuvent cotiser à la CNPS.'),
(30001, 'Quel est l''avantage principal de la CNPS ?', 'Recevoir une pension de retraite', 'Avoir un crédit gratuit', 'Ne plus payer d''impôts', 'Voyager gratuitement', 'A', 'La CNPS vous permet de recevoir une pension de retraite mensuelle quand vous arrêtez de travailler.'),
(30001, 'À quel âge peut-on prendre sa retraite CNPS ?', '40 ans', '50 ans', '60 ans', '70 ans', 'C', 'L''âge légal de départ à la retraite en Côte d''Ivoire est 60 ans.'),
(30001, 'Comment s''inscrire à la CNPS en ligne ?', 'Via le site e-CNPS', 'En envoyant un SMS', 'En allant à la mairie', 'Ce n''est pas possible', 'A', 'Le site e-CNPS (www.e-cnps.ci) permet de s''inscrire et de gérer son compte en ligne.'),
(30001, 'Combien faut-il cotiser par mois à la CNPS (minimum) ?', '1 000 FCFA', '5 000 FCFA', '10 000 FCFA', '50 000 FCFA', 'B', 'Le minimum de cotisation pour les travailleurs indépendants est environ 5 000 FCFA par mois.'),
(30001, 'Que se passe-t-il si on arrête de cotiser ?', 'On perd tous ses droits', 'Les droits sont suspendus mais récupérables', 'Rien', 'On va en prison', 'B', 'Si vous arrêtez de cotiser, vos droits sont suspendus mais vous pouvez les récupérer en reprenant les cotisations.');

-- ============================================
-- COURS 30002 : Comment s''inscrire à la CMU en ligne (Protection Sociale)
-- ============================================

INSERT INTO quizzes (courseId, question, optionA, optionB, optionC, optionD, correctAnswer, explanation) VALUES
(30002, 'Qu''est-ce que la CMU ?', 'Couverture Maladie Universelle', 'Caisse Médicale Unique', 'Centre Médical Urbain', 'Conseil Municipal Unifié', 'A', 'La CMU est la Couverture Maladie Universelle qui rembourse 70% de vos frais médicaux.'),
(30002, 'Quel pourcentage de vos frais médicaux la CMU rembourse-t-elle ?', '30%', '50%', '70%', '100%', 'C', 'La CMU rembourse 70% de vos frais médicaux dans les hôpitaux conventionnés.'),
(30002, 'Combien coûte l''adhésion annuelle à la CMU ?', '1 000 FCFA', '7 000 FCFA', '15 000 FCFA', '50 000 FCFA', 'B', 'L''adhésion à la CMU coûte 7 000 FCFA par an pour un adulte.'),
(30002, 'Comment s''inscrire à la CMU ?', 'En ligne sur www.cmu.ci', 'Par courrier postal', 'En allant à Paris', 'Ce n''est pas possible', 'A', 'Vous pouvez vous inscrire en ligne sur www.cmu.ci ou dans les centres d''enrôlement.'),
(30002, 'Quels documents faut-il pour s''inscrire à la CMU ?', 'Carte d''identité et photo', 'Passeport et visa', 'Permis de conduire', 'Rien', 'A', 'Il faut une carte d''identité nationale et une photo d''identité récente.'),
(30002, 'La CMU couvre-t-elle toute la famille ?', 'Non, seulement vous', 'Oui, conjoint et enfants (tarif famille)', 'Seulement les enfants', 'Seulement le conjoint', 'B', 'Vous pouvez souscrire une CMU famille qui couvre conjoint et enfants à charge.');

-- ============================================
-- COURS 30003 : Ouvrir un compte Orange Money (Paiements Mobiles)
-- ============================================

INSERT INTO quizzes (courseId, question, optionA, optionB, optionC, optionD, correctAnswer, explanation) VALUES
(30003, 'Qu''est-ce qu''Orange Money ?', 'Un service de transfert d''argent par téléphone', 'Une banque physique', 'Un supermarché', 'Une carte de crédit', 'A', 'Orange Money est un service de transfert d''argent et de paiement via votre téléphone mobile.'),
(30003, 'Faut-il avoir un compte bancaire pour utiliser Orange Money ?', 'Oui, obligatoire', 'Non, juste un téléphone et une pièce d''identité', 'Oui, dans 3 banques', 'Oui, avec 1 million FCFA minimum', 'B', 'Orange Money ne nécessite pas de compte bancaire, juste un téléphone et une pièce d''identité.'),
(30003, 'Comment activer son compte Orange Money ?', 'Composer #144# et suivre les instructions', 'Aller en France', 'Envoyer un email', 'Attendre 6 mois', 'A', 'Composez #144# sur votre téléphone Orange et suivez les instructions pour activer votre compte.'),
(30003, 'Quel est le montant minimum pour ouvrir un compte Orange Money ?', '0 FCFA (gratuit)', '10 000 FCFA', '50 000 FCFA', '100 000 FCFA', 'A', 'L''ouverture d''un compte Orange Money est gratuite, pas de montant minimum requis.'),
(30003, 'Où peut-on déposer de l''argent sur Orange Money ?', 'Chez les distributeurs agréés Orange', 'Seulement à la banque', 'Seulement à la poste', 'Nulle part', 'A', 'Vous pouvez déposer de l''argent chez n''importe quel distributeur agréé Orange (boutiques Orange, kiosques).'),
(30003, 'Quel est l''avantage principal d''Orange Money pour un marchand ?', 'Recevoir des paiements clients 24h/24', 'Avoir un magasin gratuit', 'Ne plus payer d''impôts', 'Voyager gratuitement', 'A', 'Orange Money permet de recevoir des paiements clients à tout moment, même la nuit ou le dimanche.');

-- ============================================
-- COURS 30004 : Faire un transfert d''argent avec Orange Money (Paiements Mobiles)
-- ============================================

INSERT INTO quizzes (courseId, question, optionA, optionB, optionC, optionD, correctAnswer, explanation) VALUES
(30004, 'Comment envoyer de l''argent avec Orange Money ?', 'Composer #144#1# puis suivre les instructions', 'Envoyer un SMS', 'Aller à la banque', 'Attendre que l''argent se transfère tout seul', 'A', 'Composez #144#1# puis entrez le numéro du destinataire et le montant à envoyer.'),
(30004, 'Quel est le délai de réception d''un transfert Orange Money ?', 'Instantané (quelques secondes)', '24 heures', '1 semaine', '1 mois', 'A', 'Les transferts Orange Money sont instantanés, le destinataire reçoit l''argent en quelques secondes.'),
(30004, 'Peut-on envoyer de l''argent à un numéro MTN ou Moov avec Orange Money ?', 'Non, seulement vers Orange', 'Oui, avec frais supplémentaires', 'Oui, gratuitement', 'Seulement le dimanche', 'B', 'Vous pouvez envoyer vers d''autres opérateurs (MTN, Moov) mais avec des frais supplémentaires.'),
(30004, 'Quels sont les frais pour envoyer 10 000 FCFA avec Orange Money ?', 'Environ 100-200 FCFA', '1 000 FCFA', '5 000 FCFA', 'Gratuit', 'A', 'Les frais pour un transfert de 10 000 FCFA sont d''environ 100-200 FCFA selon la destination.'),
(30004, 'Comment vérifier son solde Orange Money ?', 'Composer #144#6#', 'Appeler le 1064', 'Aller chez un distributeur', 'Envoyer un email', 'A', 'Composez #144#6# pour consulter votre solde Orange Money gratuitement.'),
(30004, 'Peut-on annuler un transfert Orange Money après envoi ?', 'Non, les transferts sont définitifs', 'Oui, dans les 24h', 'Oui, dans les 5 minutes', 'Oui, toujours', 'A', 'Les transferts Orange Money sont définitifs et ne peuvent pas être annulés, vérifiez bien le numéro avant d''envoyer.'),
(30004, 'Quel est le montant maximum qu''on peut envoyer par jour avec Orange Money ?', '500 000 FCFA', '1 000 000 FCFA', '5 000 000 FCFA', 'Illimité', 'B', 'Le plafond d''envoi quotidien est de 1 000 000 FCFA pour un compte Orange Money classique.');

-- ============================================
-- COURS 30005 : Les bases du Mobile Money pour votre commerce (Paiements Mobiles)
-- ============================================

INSERT INTO quizzes (courseId, question, optionA, optionB, optionC, optionD, correctAnswer, explanation) VALUES
(30005, 'Pourquoi accepter le Mobile Money dans votre commerce ?', 'Pour augmenter les ventes', 'Pour compliquer les choses', 'Pour perdre de l''argent', 'Ce n''est pas utile', 'A', 'Accepter le Mobile Money augmente vos ventes car les clients peuvent payer même sans argent liquide.'),
(30005, 'Quels sont les 4 principaux opérateurs Mobile Money en Côte d''Ivoire ?', 'Orange Money, MTN MoMo, Moov Money, Wave', 'Visa, Mastercard, PayPal, Bitcoin', 'Western Union, MoneyGram, Ria, WorldRemit', 'Facebook, WhatsApp, Instagram, TikTok', 'A', 'Les 4 principaux sont Orange Money, MTN Mobile Money, Moov Money et Wave.'),
(30005, 'Comment recevoir un paiement Mobile Money d''un client ?', 'Le client compose #144#1# et entre votre numéro', 'Le client vous donne sa carte bancaire', 'Le client vous envoie un chèque', 'Le client paie en ligne', 'A', 'Le client compose le code de transfert de son opérateur (#144#1# pour Orange) et entre votre numéro.'),
(30005, 'Quels sont les avantages du Mobile Money pour un marchand ?', 'Sécurité, rapidité, traçabilité', 'Compliquer les ventes', 'Perdre des clients', 'Payer plus d''impôts', 'A', 'Le Mobile Money offre sécurité (pas de faux billets), rapidité (instantané) et traçabilité (historique).'),
(30005, 'Faut-il payer des frais pour recevoir un paiement Mobile Money ?', 'Non, c''est gratuit pour le marchand', 'Oui, 10% du montant', 'Oui, 1000 FCFA par transaction', 'Oui, 50% du montant', 'A', 'C''est gratuit pour le marchand qui reçoit, seul l''envoyeur paie des frais (très faibles).'),
(30005, 'Comment retirer l''argent reçu sur Mobile Money ?', 'Chez un distributeur agréé ou au guichet', 'À la poste', 'À la mairie', 'Ce n''est pas possible', 'A', 'Vous pouvez retirer votre argent chez n''importe quel distributeur agréé de votre opérateur.'),
(30005, 'Quel est le principal risque du Mobile Money ?', 'Erreur de numéro lors du transfert', 'Vol de téléphone', 'Panne d''électricité', 'Tous les risques ci-dessus', 'D', 'Tous ces risques existent : vérifiez toujours le numéro, sécurisez votre téléphone et ayez un plan B en cas de panne.');
