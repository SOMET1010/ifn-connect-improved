-- Script SQL pour peupler la table faq_articles avec 30 articles réels
-- Catégories : enrollment, payments, technical, cnps_cmu, cooperatives, general

-- ============================================
-- CATÉGORIE : ENRÔLEMENT (enrollment)
-- ============================================

INSERT INTO faq_articles (question, answer, category, views, upvotes, downvotes, createdAt, updatedAt) VALUES
(
  'Comment enrôler un nouveau marchand ?',
  'Pour enrôler un nouveau marchand, suivez ces étapes :
  
1. **Ouvrez l''application** et connectez-vous avec votre compte agent
2. **Accédez au menu "Enrôlement"** depuis le dashboard agent
3. **Cliquez sur "Nouvel enrôlement"** pour démarrer le wizard
4. **Remplissez les 5 étapes** :
   - Étape 1 : Informations personnelles (nom, téléphone, date de naissance)
   - Étape 2 : Informations professionnelles (marché, numéro CNPS/CMU)
   - Étape 3 : Photos (pièce d''identité + licence commerciale)
   - Étape 4 : Géolocalisation GPS automatique
   - Étape 5 : Récapitulatif et validation
5. **Validez l''enrôlement** : Un code MRC unique sera généré automatiquement

**Important** : Assurez-vous d''avoir une connexion internet stable ou activez le mode hors ligne pour enregistrer localement.',
  'enrollment',
  0, 0, 0,
  NOW(), NOW()
),
(
  'Quelles sont les pièces obligatoires pour l''enrôlement ?',
  'Pour enrôler un marchand, vous devez obligatoirement fournir :

**Documents d''identité** :
- Carte Nationale d''Identité (CNI) ou Passeport
- Photo claire et lisible de la pièce d''identité

**Documents professionnels** :
- Licence commerciale ou Attestation du marché
- Photo de la licence ou du document officiel

**Informations complémentaires** :
- Numéro de téléphone valide (Orange, MTN, Moov, ou Wave)
- Numéro CNPS (si disponible)
- Numéro CMU (si disponible)
- Géolocalisation GPS du point de vente

**Astuce** : Prenez les photos en bonne lumière et assurez-vous que tous les textes sont lisibles.',
  'enrollment',
  0, 0, 0,
  NOW(), NOW()
),
(
  'Comment géolocaliser un marchand ?',
  'La géolocalisation est automatique lors de l''enrôlement :

**Étape 4 du wizard d''enrôlement** :
1. L''application demande automatiquement l''accès à votre position GPS
2. **Autorisez l''accès** quand le navigateur vous le demande
3. La position GPS est **capturée automatiquement** (latitude/longitude)
4. Un marqueur s''affiche sur la carte pour confirmer la position

**En cas de problème** :
- Vérifiez que le GPS est activé sur votre appareil
- Assurez-vous d''être à l''extérieur ou près d''une fenêtre
- Si le GPS ne fonctionne pas, vous pouvez placer manuellement le marqueur sur la carte
- En mode hors ligne, la géolocalisation sera capturée lors de la synchronisation

**Important** : La géolocalisation précise est essentielle pour la cartographie et les statistiques.',
  'enrollment',
  0, 0, 0,
  NOW(), NOW()
),
(
  'Que faire si la photo ne se charge pas ?',
  'Si vous rencontrez des problèmes lors de la prise de photo :

**Solutions immédiates** :
1. **Vérifiez les autorisations** : L''application doit avoir accès à la caméra
2. **Rechargez la page** : Parfois un simple rafraîchissement résout le problème
3. **Essayez un autre navigateur** : Chrome et Firefox fonctionnent mieux
4. **Réduisez la qualité** : Si la photo est trop lourde (> 5 MB), elle peut échouer

**Mode hors ligne** :
- Les photos sont automatiquement compressées avant l''upload
- Si l''upload échoue, les photos sont sauvegardées localement
- Elles seront envoyées automatiquement lors de la prochaine synchronisation

**Assistance technique** :
- Si le problème persiste, contactez le support technique
- Vous pouvez aussi prendre la photo avec votre téléphone et l''envoyer par WhatsApp au superviseur',
  'enrollment',
  0, 0, 0,
  NOW(), NOW()
),
(
  'Comment générer un code MRC ?',
  'Le code MRC (Marchand) est généré **automatiquement** lors de l''enrôlement :

**Format du code** : MRC-XXXXX (exemple : MRC-00123)

**Génération automatique** :
1. Lors de la validation de l''enrôlement (Étape 5)
2. Le système attribue un numéro séquentiel unique
3. Le code MRC est affiché sur l''écran de confirmation
4. Il est également envoyé par SMS au marchand (si numéro fourni)

**Caractéristiques** :
- **Unique** : Chaque marchand a un code MRC différent
- **Permanent** : Le code ne change jamais
- **Traçable** : Permet d''identifier le marchand dans toute la plateforme

**Utilisation** :
- Le marchand utilise son code MRC pour se connecter
- Le code apparaît sur la carte d''identité numérique
- Il est utilisé pour toutes les transactions et rapports

**Important** : Notez bien le code MRC et communiquez-le au marchand.',
  'enrollment',
  0, 0, 0,
  NOW(), NOW()
);

-- ============================================
-- CATÉGORIE : PAIEMENTS (payments)
-- ============================================

INSERT INTO faq_articles (question, answer, category, views, upvotes, downvotes, createdAt, updatedAt) VALUES
(
  'Comment fonctionne Orange Money ?',
  'Orange Money est un service de paiement mobile intégré à la plateforme :

**Pour le marchand** :
1. Le marchand sélectionne **"Payer avec Mobile Money"** lors d''une vente
2. Il choisit **Orange Money** comme méthode de paiement
3. Il saisit son **numéro de téléphone Orange** (format : 07XXXXXXXX)
4. Il valide le paiement

**Pour le client** :
1. Le client reçoit une **notification USSD** sur son téléphone
2. Il compose son **code PIN Orange Money** pour confirmer
3. Le paiement est validé instantanément

**Avantages** :
- ✅ Paiement instantané (moins de 30 secondes)
- ✅ Pas besoin d''espèces
- ✅ Reçu électronique automatique
- ✅ Traçabilité complète des transactions

**Frais** : Les frais Orange Money standards s''appliquent (1-2% selon le montant)

**Important** : Le marchand doit avoir un compte Orange Money actif.',
  'payments',
  0, 0, 0,
  NOW(), NOW()
),
(
  'Que faire si un paiement échoue ?',
  'Si un paiement Mobile Money échoue, suivez ces étapes :

**Causes fréquentes** :
- ❌ Solde insuffisant sur le compte Mobile Money
- ❌ Code PIN incorrect (3 tentatives maximum)
- ❌ Problème de réseau (connexion internet instable)
- ❌ Compte Mobile Money bloqué ou suspendu

**Solutions immédiates** :
1. **Vérifiez le solde** : Demandez au client de vérifier son solde (#144#)
2. **Réessayez** : Cliquez sur "Réessayer" dans l''interface
3. **Changez de méthode** : Proposez un autre provider (MTN, Wave, Moov)
4. **Paiement en espèces** : En dernier recours, acceptez le paiement cash

**Mode hors ligne** :
- Si le paiement échoue en mode hors ligne, la vente est sauvegardée localement
- Vous pouvez finaliser le paiement plus tard lors de la synchronisation

**Assistance** :
- Si le problème persiste, contactez le service client Orange Money : 1111
- Notez le numéro de transaction pour le suivi',
  'payments',
  0, 0, 0,
  NOW(), NOW()
),
(
  'Comment vérifier le statut d''une transaction ?',
  'Pour vérifier le statut d''une transaction Mobile Money :

**Depuis l''application** :
1. Accédez à **"Historique des transactions"** dans le menu marchand
2. Recherchez la transaction par **date**, **montant** ou **numéro de transaction**
3. Le statut s''affiche avec un badge coloré :
   - 🟢 **Réussi** : Paiement validé et confirmé
   - 🟡 **En attente** : Paiement en cours de traitement
   - 🔴 **Échoué** : Paiement refusé ou annulé

**Vérification manuelle** :
- **Orange Money** : Composez #144# → Historique
- **MTN Mobile Money** : Composez *133# → Historique
- **Moov Money** : Composez #155# → Historique
- **Wave** : Ouvrez l''application Wave → Transactions

**Numéro de transaction** :
- Chaque paiement génère un numéro de transaction unique
- Notez ce numéro pour tout litige ou remboursement
- Il apparaît sur le reçu électronique envoyé au marchand

**Délai de traitement** : La plupart des transactions sont instantanées (< 30 secondes)',
  'payments',
  0, 0, 0,
  NOW(), NOW()
),
(
  'Quels sont les frais de transaction ?',
  'Les frais de transaction varient selon le provider Mobile Money :

**Orange Money** :
- 0 - 5 000 FCFA : 50 FCFA
- 5 001 - 15 000 FCFA : 100 FCFA
- 15 001 - 50 000 FCFA : 200 FCFA
- 50 001 - 150 000 FCFA : 500 FCFA
- Au-delà : 1% du montant

**MTN Mobile Money** :
- 0 - 5 000 FCFA : 50 FCFA
- 5 001 - 15 000 FCFA : 100 FCFA
- 15 001 - 50 000 FCFA : 250 FCFA
- 50 001 - 150 000 FCFA : 600 FCFA
- Au-delà : 1,2% du montant

**Moov Money** :
- 0 - 5 000 FCFA : 50 FCFA
- 5 001 - 15 000 FCFA : 100 FCFA
- 15 001 - 50 000 FCFA : 200 FCFA
- Au-delà : 0,8% du montant

**Wave** :
- ✅ **Gratuit** pour toutes les transactions (0 FCFA)

**Important** : Ces frais sont à la charge du client, pas du marchand.',
  'payments',
  0, 0, 0,
  NOW(), NOW()
),
(
  'Comment rembourser un client ?',
  'Pour rembourser un client après un paiement Mobile Money :

**Depuis l''application** :
1. Accédez à **"Historique des transactions"**
2. Trouvez la transaction à rembourser
3. Cliquez sur **"Rembourser"** (bouton rouge)
4. Confirmez le remboursement
5. Le client reçoit l''argent sur son compte Mobile Money

**Conditions de remboursement** :
- ✅ Transaction réussie (statut "Réussi")
- ✅ Moins de 30 jours après la transaction
- ✅ Solde suffisant sur votre compte marchand
- ❌ Impossible de rembourser une transaction échouée

**Délai** :
- Le remboursement est généralement instantané
- Dans certains cas, il peut prendre jusqu''à 24 heures

**Remboursement partiel** :
- Si vous voulez rembourser une partie seulement, contactez le support
- Vous pouvez aussi faire un nouveau transfert Mobile Money au client

**Important** : Le remboursement annule la vente dans vos statistiques.',
  'payments',
  0, 0, 0,
  NOW(), NOW()
);

-- ============================================
-- CATÉGORIE : TECHNIQUE (technical)
-- ============================================

INSERT INTO faq_articles (question, answer, category, views, upvotes, downvotes, createdAt, updatedAt) VALUES
(
  'Comment activer le mode hors ligne ?',
  'Le mode hors ligne est **automatique** sur la plateforme PNAVIM-CI :

**Fonctionnement automatique** :
- L''application détecte automatiquement quand vous perdez la connexion internet
- Un indicateur **"Mode Hors Ligne"** apparaît en haut à droite (badge rouge)
- Toutes vos actions sont sauvegardées localement dans le navigateur
- Dès que la connexion revient, les données sont synchronisées automatiquement

**Fonctionnalités disponibles hors ligne** :
- ✅ Enregistrer des ventes (caisse tactile)
- ✅ Enrôler de nouveaux marchands (wizard complet)
- ✅ Consulter le stock
- ✅ Voir l''historique des ventes
- ❌ Paiements Mobile Money (nécessite internet)
- ❌ Synchronisation en temps réel

**Synchronisation** :
- Quand la connexion revient, un badge **"Synchronisation en cours"** apparaît
- Les ventes et enrôlements en attente sont envoyés automatiquement au serveur
- Vous recevez une notification de confirmation après synchronisation

**Astuce** : Travaillez normalement même sans connexion, tout sera sauvegardé !',
  'technical',
  0, 0, 0,
  NOW(), NOW()
),
(
  'Que faire si l''application ne se synchronise pas ?',
  'Si la synchronisation ne fonctionne pas après le retour de la connexion :

**Vérifications de base** :
1. **Vérifiez votre connexion internet** : Ouvrez un autre site web pour confirmer
2. **Vérifiez le badge de synchronisation** : Il doit afficher le nombre d''éléments en attente
3. **Attendez quelques minutes** : La synchronisation peut prendre du temps si vous avez beaucoup de données

**Solutions** :
1. **Rafraîchissez la page** : Appuyez sur F5 ou Ctrl+R (Cmd+R sur Mac)
2. **Videz le cache** : Paramètres du navigateur → Effacer les données de navigation
3. **Réessayez manuellement** : Cliquez sur le badge de synchronisation

**Vérifier les données en attente** :
- Ouvrez les **Outils de développement** (F12)
- Allez dans l''onglet **Application** → **IndexedDB** → **ifn-connect-db**
- Vérifiez les object stores **pending-sales** et **pending-enrollments**

**Assistance** :
- Si le problème persiste après 1 heure, contactez le support technique
- Notez le nombre d''éléments en attente et la date/heure du problème
- **Ne videz pas le cache** tant que le support n''a pas récupéré vos données',
  'technical',
  0, 0, 0,
  NOW(), NOW()
),
(
  'Comment réinitialiser mon mot de passe ?',
  'Pour réinitialiser votre mot de passe PNAVIM-CI :

**Depuis la page de connexion** :
1. Cliquez sur **"Mot de passe oublié ?"** sous le formulaire de connexion
2. Saisissez votre **code MRC** ou votre **numéro de téléphone**
3. Vous recevrez un **code OTP par SMS** (6 chiffres)
4. Saisissez le code OTP reçu
5. Créez un **nouveau mot de passe** (minimum 8 caractères)
6. Confirmez le nouveau mot de passe
7. Connectez-vous avec vos nouveaux identifiants

**Critères du mot de passe** :
- ✅ Minimum 8 caractères
- ✅ Au moins 1 lettre majuscule
- ✅ Au moins 1 chiffre
- ✅ Au moins 1 caractère spécial (@, #, $, %, etc.)

**Si vous ne recevez pas le SMS** :
- Vérifiez que votre numéro de téléphone est correct
- Attendez 2-3 minutes (délai de réception)
- Cliquez sur **"Renvoyer le code"** après 2 minutes
- Contactez le support si le problème persiste

**Important** : Ne partagez jamais votre mot de passe avec qui que ce soit.',
  'technical',
  0, 0, 0,
  NOW(), NOW()
),
(
  'L''application est lente, que faire ?',
  'Si l''application PNAVIM-CI est lente, essayez ces solutions :

**Solutions immédiates** :
1. **Vérifiez votre connexion internet** :
   - Testez votre débit : https://fast.com
   - Passez de la 3G à la 4G si possible
   - Rapprochez-vous d''une fenêtre pour un meilleur signal

2. **Fermez les autres onglets** :
   - Gardez uniquement l''onglet PNAVIM-CI ouvert
   - Fermez les applications en arrière-plan sur votre téléphone

3. **Videz le cache du navigateur** :
   - Chrome : Paramètres → Confidentialité → Effacer les données
   - Firefox : Paramètres → Vie privée → Effacer les données
   - Safari : Paramètres → Safari → Effacer historique

4. **Redémarrez le navigateur** :
   - Fermez complètement le navigateur
   - Attendez 10 secondes
   - Rouvrez et reconnectez-vous

**Optimisations** :
- Utilisez **Chrome** ou **Firefox** (plus rapides que Safari/Edge)
- Désactivez les extensions de navigateur inutiles
- Mettez à jour votre navigateur vers la dernière version

**Si le problème persiste** :
- Contactez le support technique avec ces informations :
  - Votre navigateur et sa version
  - Votre opérateur mobile (Orange, MTN, Moov)
  - Les pages qui sont lentes',
  'technical',
  0, 0, 0,
  NOW(), NOW()
),
(
  'Comment mettre à jour l''application ?',
  'L''application PNAVIM-CI se met à jour **automatiquement** :

**Mise à jour automatique** :
- L''application est une **Progressive Web App (PWA)**
- Les mises à jour sont déployées automatiquement par l''équipe technique
- Vous n''avez **rien à faire** de votre côté

**Forcer une mise à jour** :
1. **Rafraîchissez la page** : Appuyez sur Ctrl+Shift+R (Cmd+Shift+R sur Mac)
2. **Videz le cache** : Paramètres du navigateur → Effacer les données
3. **Reconnectez-vous** : Déconnectez-vous puis reconnectez-vous

**Vérifier la version** :
- La version actuelle s''affiche en bas de page (ex: v1.2.3)
- Comparez avec la dernière version annoncée par le support

**Notifications de mise à jour** :
- Vous recevez une notification quand une nouvelle version est disponible
- Un message s''affiche : **"Nouvelle version disponible. Cliquez pour mettre à jour"**
- Cliquez sur le message pour recharger l''application

**Important** :
- Ne désinstallez jamais l''application manuellement
- Les mises à jour n''affectent pas vos données locales (mode hors ligne)
- En cas de problème après une mise à jour, contactez le support',
  'technical',
  0, 0, 0,
  NOW(), NOW()
);

-- ============================================
-- CATÉGORIE : CNPS/CMU (cnps_cmu)
-- ============================================

INSERT INTO faq_articles (question, answer, category, views, upvotes, downvotes, createdAt, updatedAt) VALUES
(
  'C''est quoi la CNPS ?',
  'La **CNPS** (Caisse Nationale de Prévoyance Sociale) est l''organisme ivoirien de sécurité sociale :

**Rôle de la CNPS** :
- Gère les **cotisations retraite** des travailleurs
- Verse les **pensions de retraite** aux personnes âgées
- Couvre les **accidents du travail** et maladies professionnelles
- Verse des **allocations familiales** aux travailleurs

**Pour les marchands du secteur informel** :
- Vous pouvez cotiser **volontairement** à la CNPS
- Cotisation mensuelle : **5 000 à 15 000 FCFA** (selon vos revenus)
- Vous accumulez des **trimestres de cotisation** pour votre retraite
- À 60 ans, vous recevez une **pension mensuelle** à vie

**Avantages** :
- ✅ Sécurité financière à la retraite
- ✅ Couverture accidents du travail
- ✅ Allocations familiales (si éligible)
- ✅ Capital décès pour vos proches

**Comment s''inscrire ?** :
1. Rendez-vous à l''agence CNPS la plus proche
2. Apportez votre CNI et une photo d''identité
3. Remplissez le formulaire d''adhésion
4. Choisissez votre montant de cotisation mensuelle
5. Recevez votre **numéro CNPS** (à conserver précieusement)

**Sur la plateforme** :
- Vous pouvez payer vos cotisations en ligne via Mobile Money
- Consultez votre solde et votre historique de paiements
- Simulez votre future pension de retraite',
  'cnps_cmu',
  0, 0, 0,
  NOW(), NOW()
),
(
  'Comment s''inscrire à la CMU ?',
  'La **CMU** (Couverture Maladie Universelle) est l''assurance santé pour tous les Ivoiriens :

**Qu''est-ce que la CMU ?** :
- Assurance santé **obligatoire** pour tous les Ivoiriens
- Rembourse **70% des frais médicaux** (consultations, médicaments, hospitalisations)
- Cotisation annuelle : **1 000 FCFA** par personne (très abordable !)
- Couvre toute la famille (conjoint + enfants)

**Comment s''inscrire ?** :

**Méthode 1 : En ligne (recommandé)** :
1. Allez sur le site **e-CNPS** : https://e-cnps.ci
2. Cliquez sur **"Inscription CMU"**
3. Remplissez le formulaire avec vos informations
4. Téléchargez votre CNI (photo)
5. Payez la cotisation annuelle (1 000 FCFA) par Mobile Money
6. Recevez votre **carte CMU digitale** par email

**Méthode 2 : En agence** :
1. Rendez-vous à l''agence CNPS ou CMU la plus proche
2. Apportez votre CNI et une photo d''identité
3. Remplissez le formulaire d''adhésion
4. Payez 1 000 FCFA en espèces
5. Recevez votre carte CMU physique (délai : 2 semaines)

**Documents nécessaires** :
- Carte Nationale d''Identité (CNI)
- Photo d''identité récente
- Justificatif de domicile (facture d''eau/électricité)
- Acte de naissance des enfants (si vous voulez les couvrir)

**Sur la plateforme PNAVIM-CI** :
- Vous pouvez renouveler votre CMU en ligne
- Consultez vos remboursements médicaux
- Simulez vos remboursements selon le type de soin',
  'cnps_cmu',
  0, 0, 0,
  NOW(), NOW()
),
(
  'Quand payer mes cotisations ?',
  'Le calendrier de paiement des cotisations sociales :

**CNPS (Retraite)** :
- **Fréquence** : Mensuelle
- **Date limite** : Le 15 de chaque mois
- **Montant** : 5 000 à 15 000 FCFA (selon votre choix)
- **Pénalités** : 10% de majoration après le 15 du mois

**CMU (Santé)** :
- **Fréquence** : Annuelle
- **Date limite** : Date anniversaire de votre inscription
- **Montant** : 1 000 FCFA par personne
- **Pénalités** : Suspension de la couverture après 30 jours de retard

**Calendrier recommandé** :
- **Début de mois** (1-5) : Payez votre CNPS dès que vous recevez vos revenus
- **Mi-mois** (10-15) : Dernier délai pour la CNPS
- **Fin de mois** (25-30) : Vérifiez que tout est à jour

**Rappels automatiques** :
- Vous recevez un **SMS 7 jours avant** la date limite
- Une **notification in-app** apparaît 3 jours avant
- Un **email de rappel** est envoyé la veille

**Sur la plateforme** :
- La page CNPS/CMU affiche un **countdown** avant expiration
- Un badge **rouge** apparaît si vous avez moins de 30 jours
- Vous pouvez payer directement en ligne via Mobile Money

**Astuce** : Activez les **prélèvements automatiques** pour ne jamais oublier !',
  'cnps_cmu',
  0, 0, 0,
  NOW(), NOW()
),
(
  'Comment renouveler ma couverture sociale ?',
  'Pour renouveler votre CNPS et CMU avant expiration :

**Depuis la plateforme PNAVIM-CI** :

**Renouveler la CNPS** :
1. Accédez à **"Ma CNPS"** dans le menu marchand
2. Vérifiez la date d''expiration (countdown en haut)
3. Cliquez sur **"Payer ma cotisation"** (bouton vert)
4. Choisissez le montant (5 000, 10 000 ou 15 000 FCFA)
5. Sélectionnez votre méthode de paiement (Orange Money, MTN, Wave, Moov)
6. Confirmez le paiement avec votre code PIN
7. Votre date d''expiration est **automatiquement prolongée d''1 mois**

**Renouveler la CMU** :
1. Accédez à **"Ma CMU"** dans le menu marchand
2. Vérifiez la date d''expiration (countdown en haut)
3. Cliquez sur **"Renouveler ma CMU"** (bouton bleu)
4. Le montant est fixe : **1 000 FCFA**
5. Sélectionnez votre méthode de paiement
6. Confirmez le paiement
7. Votre date d''expiration est **automatiquement prolongée d''1 an**

**Autres méthodes** :
- **Par SMS** : Envoyez CNPS ou CMU au 1234 (service payant)
- **En agence** : Rendez-vous à l''agence CNPS la plus proche
- **Par virement** : Virement bancaire sur le compte CNPS

**Important** :
- Renouvelez **avant l''expiration** pour éviter les pénalités
- Conservez vos reçus de paiement (envoyés par email)
- Vérifiez que la date d''expiration a bien été mise à jour',
  'cnps_cmu',
  0, 0, 0,
  NOW(), NOW()
),
(
  'Que faire si ma CNPS expire bientôt ?',
  'Si votre CNPS expire dans moins de 30 jours, agissez rapidement :

**Alertes automatiques** :
- **30 jours avant** : Notification in-app + SMS
- **7 jours avant** : Email de rappel + notification
- **1 jour avant** : Alerte rouge sur le dashboard

**Actions immédiates** :
1. **Vérifiez votre solde** : Assurez-vous d''avoir au moins 5 000 FCFA sur votre compte Mobile Money
2. **Payez en ligne** : Utilisez la plateforme PNAVIM-CI pour payer instantanément
3. **Confirmez le paiement** : Vérifiez que la date d''expiration a été prolongée

**Si vous ne pouvez pas payer** :
- **Contactez la CNPS** : Demandez un délai de paiement (possible 1 fois par an)
- **Payez un montant réduit** : Minimum 5 000 FCFA pour prolonger d''1 mois
- **Régularisez dès que possible** : Évitez l''accumulation de retards

**Conséquences de l''expiration** :
- ❌ Perte des trimestres de cotisation (si retard > 3 mois)
- ❌ Pénalités de 10% sur les cotisations en retard
- ❌ Suspension de la couverture accidents du travail
- ❌ Difficulté à obtenir des prêts bancaires

**Régularisation** :
- Vous pouvez régulariser jusqu''à **6 mois de retard**
- Au-delà, vous devez faire une nouvelle adhésion
- Les trimestres perdus ne sont pas récupérables

**Astuce** : Activez les **prélèvements automatiques** pour éviter les oublis !',
  'cnps_cmu',
  0, 0, 0,
  NOW(), NOW()
);

-- ============================================
-- CATÉGORIE : COOPÉRATIVES (cooperatives)
-- ============================================

INSERT INTO faq_articles (question, answer, category, views, upvotes, downvotes, createdAt, updatedAt) VALUES
(
  'Comment créer une commande groupée ?',
  'Pour créer une commande groupée depuis le dashboard coopérative :

**Étapes de création** :
1. Accédez à **"Commandes Groupées"** dans le menu coopérative
2. Cliquez sur **"Nouvelle commande groupée"** (bouton vert en haut à droite)
3. Remplissez le formulaire :
   - **Produit** : Sélectionnez le produit à commander (ex: Riz, Huile, Tomates)
   - **Quantité initiale** : Quantité que vous commandez (ex: 100 kg)
   - **Prix unitaire** : Prix par unité (ex: 500 FCFA/kg)
   - **Date limite** : Date de clôture de la commande (ex: dans 7 jours)
   - **Description** : Détails supplémentaires (optionnel)

4. **Définir les paliers de prix** (optionnel mais recommandé) :
   - Palier 1 : 50 kg → 500 FCFA/kg (prix de base)
   - Palier 2 : 100 kg → 450 FCFA/kg (-10%)
   - Palier 3 : 200 kg → 400 FCFA/kg (-20%)
   - Plus la quantité totale augmente, plus le prix baisse !

5. Cliquez sur **"Créer la commande"**

**Après création** :
- La commande apparaît avec le statut **"En cours"** (draft)
- Tous les membres de la coopérative reçoivent une **notification**
- Les membres peuvent **rejoindre la commande** en ajoutant leur quantité
- Le prix est recalculé automatiquement selon le palier atteint

**Important** : Définissez une date limite réaliste (7-14 jours) pour laisser le temps aux membres de participer.',
  'cooperatives',
  0, 0, 0,
  NOW(), NOW()
),
(
  'Comment inviter des membres à rejoindre ?',
  'Pour inviter des membres à rejoindre une commande groupée :

**Invitation automatique** :
- Dès la création de la commande, **tous les membres** de la coopérative reçoivent une notification
- La notification contient : nom du produit, prix, date limite, lien direct

**Partage sur les réseaux sociaux** :
1. Ouvrez la commande groupée
2. Cliquez sur **"Partager"** (bouton avec icône de partage)
3. Choisissez la plateforme :
   - **WhatsApp** : Message pré-rempli avec lien
   - **Facebook** : Post avec détails de la commande
   - **SMS** : Envoi par SMS (coût opérateur)
   - **Copier le lien** : Pour partager manuellement

**Message de partage** :
```
🎉 Nouvelle commande groupée !
🛒 Produit : Riz (50 kg)
💰 Prix : 500 FCFA/kg (450 FCFA si on atteint 100 kg)
📅 Date limite : 15 janvier 2025
👉 Rejoignez maintenant : [lien]
```

**Relances** :
- **7 jours avant** la date limite : Relance automatique par notification
- **3 jours avant** : Relance par SMS
- **1 jour avant** : Dernière relance

**Suivi des participants** :
- Vous voyez en temps réel qui a rejoint la commande
- Vous pouvez contacter individuellement les membres qui n''ont pas encore participé

**Astuce** : Créez des commandes attractives avec des paliers de prix avantageux pour motiver la participation !',
  'cooperatives',
  0, 0, 0,
  NOW(), NOW()
),
(
  'Comment confirmer une commande ?',
  'Pour confirmer une commande groupée et passer à la livraison :

**Conditions de confirmation** :
- ✅ La date limite est atteinte OU vous décidez de clôturer plus tôt
- ✅ Au moins 1 membre a rejoint la commande (en plus de vous)
- ✅ **Tous les participants ont payé** leur part (100% des paiements)
- ❌ Impossible de confirmer si des paiements sont en attente

**Étapes de confirmation** :
1. Accédez à la commande groupée
2. Vérifiez la **barre de progression des paiements** (doit être à 100%)
3. Vérifiez le **palier de prix atteint** et les économies réalisées
4. Cliquez sur **"Confirmer la commande"** (bouton vert)
5. Un dialogue de confirmation s''affiche avec le récapitulatif :
   - Nombre de participants
   - Quantité totale commandée
   - Prix final par unité
   - Montant total à payer au fournisseur
6. Confirmez en cliquant sur **"Oui, confirmer"**

**Après confirmation** :
- Le statut passe de **"En cours"** à **"Confirmée"**
- Tous les participants reçoivent une **notification de confirmation**
- Un **reçu PDF** est généré automatiquement pour chaque participant
- Le reçu est envoyé par **email** à chaque membre
- La commande passe automatiquement en **"Préparation"**

**Workflow complet** :
1. **Draft** → En cours de participation
2. **Confirmée** → Tous les paiements reçus
3. **Préparation** → Commande passée au fournisseur
4. **En transit** → Livraison en cours
5. **Livrée** → Produits distribués aux membres

**Important** : Une fois confirmée, la commande ne peut plus être annulée. Assurez-vous que tous les paiements sont bien reçus avant de confirmer.',
  'cooperatives',
  0, 0, 0,
  NOW(), NOW()
),
(
  'Comment générer un rapport PDF ?',
  'Pour générer un rapport financier PDF depuis le dashboard coopérative :

**Types de rapports disponibles** :

**1. Rapport mensuel** :
- Synthèse complète du mois écoulé
- Chiffre d''affaires total
- Nombre de commandes groupées
- Économies réalisées par les membres
- Top 5 des produits les plus commandés
- Graphiques d''évolution

**2. Rapport par produit** :
- Détails d''un produit spécifique (ex: Riz)
- Volumes commandés sur 12 mois
- Prix moyens et évolution
- Marges réalisées
- Tendances de consommation

**3. Rapport par membre** :
- Historique des participations d''un membre
- Total des économies réalisées
- Montants payés
- Taux de participation

**Comment générer** :
1. Accédez au **Dashboard Coopérative**
2. Descendez jusqu''à la section **"Rapports Financiers"**
3. Choisissez le type de rapport :
   - Cliquez sur **"Rapport Mensuel"** (bouton bleu)
   - OU **"Rapport par Produit"** (sélectionnez le produit)
   - OU **"Rapport par Membre"** (sélectionnez le membre)
4. Sélectionnez la **période** (mois/année)
5. Cliquez sur **"Générer le PDF"**
6. Le PDF est généré en quelques secondes
7. Il s''ouvre automatiquement dans un nouvel onglet
8. Vous pouvez le **télécharger** ou l''**imprimer**

**Contenu du PDF** :
- En-tête professionnel avec logo PNAVIM-CI
- Titre et période du rapport
- Graphiques intégrés (Chart.js → Canvas → PDF)
- Tableaux de données détaillés
- Statistiques clés
- Pied de page avec date de génération

**Utilisation** :
- Présentation aux membres lors des assemblées générales
- Justificatifs pour demandes de financement
- Archivage comptable
- Transparence financière

**Astuce** : Générez un rapport mensuel systématiquement pour suivre l''évolution de la coopérative !',
  'cooperatives',
  0, 0, 0,
  NOW(), NOW()
),
(
  'Comment gérer les stocks centralisés ?',
  'La gestion des stocks centralisés permet à la coopérative de voir les stocks de tous les membres :

**Vue consolidée** :
1. Accédez à **"Stocks Centralisés"** dans le menu coopérative
2. Vous voyez la liste de **tous les produits** avec :
   - **Stock total** : Somme des stocks de tous les membres
   - **Stock moyen** : Stock moyen par membre
   - **Stock minimum** : Membre avec le stock le plus bas
   - **Stock maximum** : Membre avec le stock le plus élevé
   - **Alertes** : Nombre de membres en stock bas (< 10 unités)

**Filtres et recherche** :
- Filtrer par **catégorie** de produit (Légumes, Céréales, Fruits, etc.)
- Rechercher un **produit spécifique** (ex: "Riz")
- Trier par **stock total** (croissant/décroissant)
- Afficher uniquement les **produits en alerte**

**Détails par produit** :
1. Cliquez sur un produit pour voir le détail
2. Tableau avec la liste de **tous les membres** et leur stock :
   - Nom du membre
   - Code MRC
   - Quantité en stock
   - Seuil d''alerte
   - Statut (OK / Stock bas / Rupture)
3. Graphique de **répartition du stock** entre les membres

**Alertes automatiques** :
- Si un membre a un stock bas (< 10 unités), il reçoit une **notification**
- La coopérative peut voir quels membres ont besoin de réapprovisionnement
- Possibilité de créer une **commande groupée** directement depuis la page

**Prévisions de réapprovisionnement** :
- Basées sur l''historique des ventes des 3 derniers mois
- Calcul automatique de la **quantité à commander**
- Suggestion de **date de commande** optimale

**Historique des mouvements** :
- Suivi des entrées/sorties de stock
- Traçabilité complète des mouvements
- Export Excel pour analyse

**Avantages** :
- ✅ Visibilité totale sur les stocks de la coopérative
- ✅ Anticipation des ruptures de stock
- ✅ Optimisation des commandes groupées
- ✅ Réduction des pertes (produits périssables)

**Astuce** : Consultez les stocks centralisés chaque semaine pour planifier les prochaines commandes groupées !',
  'cooperatives',
  0, 0, 0,
  NOW(), NOW()
);

-- ============================================
-- CATÉGORIE : GÉNÉRAL (general)
-- ============================================

INSERT INTO faq_articles (question, answer, category, views, upvotes, downvotes, createdAt, updatedAt) VALUES
(
  'Comment contacter le support ?',
  'Plusieurs moyens de contacter le support PNAVIM-CI :

**1. Support in-app (recommandé)** :
- Accédez à **"Support"** dans le menu
- Utilisez le **chatbot IA** pour des réponses instantanées
- Si le chatbot ne peut pas vous aider, cliquez sur **"Contacter un superviseur"**
- Remplissez le formulaire avec votre problème
- Vous recevrez une réponse sous **24-48 heures**

**2. Téléphone** :
- **Ligne directe** : +225 27 20 XX XX XX
- **Horaires** : Lundi-Vendredi, 8h-17h
- **Coût** : Gratuit depuis Orange/MTN/Moov

**3. WhatsApp** :
- **Numéro** : +225 07 XX XX XX XX
- **Disponible** : 7j/7, 8h-20h
- Envoyez un message avec votre code MRC et votre problème

**4. Email** :
- **Adresse** : support@pnavim-ci.org
- **Délai de réponse** : 48-72 heures
- Joignez des captures d''écran si possible

**5. Réseaux sociaux** :
- **Facebook** : @PNAVIMCI
- **Twitter** : @PNAVIM_CI
- **Instagram** : @pnavim.ci
- Envoyez un message privé

**6. En personne** :
- **Siège** : Abidjan, Plateau, Rue XX
- **Horaires** : Lundi-Vendredi, 8h-17h
- Prenez rendez-vous par téléphone avant de vous déplacer

**Informations à fournir** :
- Votre **code MRC** ou numéro de téléphone
- Une **description détaillée** du problème
- Des **captures d''écran** si possible
- La **date et l''heure** du problème

**Délais de réponse** :
- Chatbot IA : **Instantané**
- WhatsApp : **< 2 heures**
- Téléphone : **Immédiat**
- Email : **48-72 heures**
- Ticket support : **24-48 heures**

**Astuce** : Utilisez le chatbot IA en premier, il résout 80% des problèmes instantanément !',
  'general',
  0, 0, 0,
  NOW(), NOW()
),
(
  'Où trouver mon code MRC ?',
  'Votre code MRC (Marchand) est disponible à plusieurs endroits :

**1. Sur votre dashboard** :
- Connectez-vous à la plateforme
- Votre code MRC s''affiche en **haut du dashboard** (ex: MRC-00123)
- Il est affiché en **gros caractères orange**
- Vous pouvez le **copier** en cliquant dessus

**2. Sur votre profil** :
- Accédez à **"Mon Profil"** dans le menu
- Le code MRC est affiché sous votre photo de profil
- Il apparaît aussi sur votre **carte d''identité numérique**

**3. Sur votre certificat professionnel** :
- Téléchargez votre certificat PDF depuis le profil
- Le code MRC est imprimé en grand sur le certificat
- Le certificat contient aussi un **QR code** avec votre code MRC

**4. Sur votre carte d''identité numérique** :
- Accédez à **"Mon Profil"** → **"Ma Carte d''Identité"**
- Le code MRC est affiché au recto de la carte
- Vous pouvez **télécharger** la carte en haute résolution

**5. Dans l''email de bienvenue** :
- Vérifiez votre boîte mail (email fourni lors de l''enrôlement)
- Cherchez l''email **"Bienvenue sur PNAVIM-CI"**
- Votre code MRC est mentionné dans l''email

**6. Par SMS** :
- Envoyez **"MRC"** au **1234**
- Vous recevrez un SMS avec votre code MRC
- Service gratuit

**Si vous ne trouvez pas votre code MRC** :
- Contactez le support avec votre **numéro de téléphone**
- Ou rendez-vous à l''agence PNAVIM-CI la plus proche avec votre CNI

**Important** :
- Ne partagez **jamais** votre code MRC avec des inconnus
- Utilisez-le uniquement pour vous connecter ou identifier vos transactions
- Notez-le dans un endroit sûr (carnet, téléphone)',
  'general',
  0, 0, 0,
  NOW(), NOW()
),
(
  'Comment changer ma photo de profil ?',
  'Pour changer votre photo de profil sur PNAVIM-CI :

**Depuis votre profil** :
1. Connectez-vous à la plateforme
2. Accédez à **"Mon Profil"** dans le menu
3. Cliquez sur votre **photo de profil actuelle** (cercle en haut)
4. Un dialogue s''ouvre avec 2 options :
   - **"Prendre une photo"** : Utilisez la caméra de votre appareil
   - **"Choisir un fichier"** : Sélectionnez une photo existante
5. Sélectionnez ou prenez une nouvelle photo
6. **Recadrez** la photo si nécessaire (carré)
7. Cliquez sur **"Enregistrer"**
8. Votre photo est **automatiquement compressée** et uploadée
9. Elle apparaît immédiatement sur votre profil

**Critères de la photo** :
- ✅ Format : JPG, PNG, ou WEBP
- ✅ Taille max : 5 MB (compression automatique)
- ✅ Dimensions min : 200x200 pixels
- ✅ Photo de **visage** (pas de logo ou paysage)
- ✅ Fond clair de préférence
- ❌ Pas de photos floues ou sombres

**Conseils pour une bonne photo** :
- Prenez la photo en **pleine lumière** (extérieur ou près d''une fenêtre)
- Regardez **directement la caméra**
- Évitez les **lunettes de soleil** ou casquettes
- Souriez ! 😊
- Utilisez un **fond uni** (mur blanc ou clair)

**Où apparaît votre photo ?** :
- Sur votre **dashboard** (en haut à droite)
- Sur votre **profil**
- Sur votre **carte d''identité numérique**
- Dans les **commentaires** et interactions
- Dans la **liste des membres** (pour les coopératives)

**Suppression de photo** :
- Vous ne pouvez pas supprimer votre photo
- Mais vous pouvez la remplacer par une **initiale** (première lettre de votre nom)
- Cliquez sur **"Utiliser l''initiale"** dans le dialogue de changement de photo

**Important** : Utilisez une photo professionnelle et récente pour renforcer votre crédibilité auprès des clients et partenaires.',
  'general',
  0, 0, 0,
  NOW(), NOW()
),
(
  'Comment télécharger mon certificat ?',
  'Pour télécharger votre certificat professionnel PNAVIM-CI :

**Depuis votre profil** :
1. Connectez-vous à la plateforme
2. Accédez à **"Mon Profil"** dans le menu
3. Descendez jusqu''à la section **"Documents officiels"**
4. Cliquez sur **"Télécharger mon Certificat"** (bouton bleu avec icône de téléchargement)
5. Le certificat PDF est **généré automatiquement** (quelques secondes)
6. Il s''ouvre dans un nouvel onglet
7. Vous pouvez le **télécharger** ou l''**imprimer**

**Contenu du certificat** :
- **En-tête** avec logo PNAVIM-CI et bordure décorative orange
- **Titre** : "CERTIFICAT PROFESSIONNEL"
- **Votre nom** en très grand (28pt, couleur orange)
- **Votre code MRC** en grand (20pt, couleur verte)
- **Encadré détails professionnels** :
  - Marché d''affectation
  - Niveau (Débutant, Confirmé, Expert, Maître)
  - Nombre de badges débloqués
  - Date d''enrôlement
  - Ventes totales
  - Statut CNPS et CMU
- **QR code de vérification** (en bas à gauche)
- **Signature digitale** "Direction Générale de l''Économie"
- **Date d''émission**

**Utilisation du certificat** :
- 📄 Présenter aux **banques** pour demande de crédit
- 📄 Justificatif pour **appels d''offres**
- 📄 Preuve de statut professionnel pour **fournisseurs**
- 📄 Document officiel pour **autorités**
- 📄 Archivage personnel

**QR code de vérification** :
- Scannez le QR code pour vérifier l''authenticité du certificat
- Il redirige vers : `https://pnavim-ci.org/verify/{votre-code-MRC}`
- Permet de lutter contre la fraude

**Format** :
- **Format** : PDF (A4 portrait)
- **Nom du fichier** : `certificat-MRC-XXXXX.pdf`
- **Taille** : ~50-100 KB

**Impression** :
- Imprimez sur **papier blanc A4** de qualité
- Utilisez une **imprimante couleur** pour un meilleur rendu
- Conservez plusieurs copies (original + photocopies)

**Mise à jour** :
- Le certificat est **régénéré en temps réel** à chaque téléchargement
- Il contient vos **dernières statistiques** (ventes, badges, niveau)
- Téléchargez-le régulièrement pour avoir la version la plus récente

**Important** : Le certificat est un document officiel. Ne le falsifiez jamais et conservez-le précieusement.',
  'general',
  0, 0, 0,
  NOW(), NOW()
),
(
  'Comment voir mes badges ?',
  'Pour consulter vos badges et votre progression sur PNAVIM-CI :

**Depuis votre profil** :
1. Connectez-vous à la plateforme
2. Accédez à **"Mon Profil"** dans le menu
3. Cliquez sur **"Mes Badges"** (bouton avec icône d''étoile)
4. Vous arrivez sur la page **"Mes Badges"** avec :
   - **Statistiques globales** : Badges débloqués (X/10), Progression (%), Points totaux
   - **Liste de tous les badges** groupés par catégorie

**Les 10 badges disponibles** :

**Catégorie Ventes** :
- 🥇 **Premier Pas** (10 pts) : Enregistrer votre première vente
- 💰 **Vendeur d''Or** (25 pts) : Atteindre 100 000 FCFA de ventes
- 🚀 **Expert** (50 pts) : Atteindre 500 000 FCFA de ventes
- 👑 **Maître** (100 pts) : Atteindre 1 000 000 FCFA de ventes

**Catégorie Stock** :
- 📦 **Gestionnaire de Stock** (15 pts) : Avoir au moins 10 produits en stock

**Catégorie Protection Sociale** :
- 🛡️ **Protecteur Social** (30 pts) : Avoir CNPS + CMU actifs

**Catégorie Apprentissage** :
- 📚 **Apprenant Actif** (20 pts) : Compléter 5 formations e-learning

**Catégorie Communauté** :
- 🤝 **Mentor** (35 pts) : Parrainer 1 nouveau marchand

**Catégorie Accomplissements** :
- ⭐ **Régulier** (40 pts) : Vendre pendant 30 jours consécutifs
- 🌟 **Légende** (75 pts) : Débloquer 5 badges

**Affichage des badges** :
- **Badges débloqués** : Affichés en couleur avec gradient et icône géante
- **Badges verrouillés** : Affichés en gris avec icône de cadenas
- **Conditions** : Affichées sous chaque badge
- **Points** : Nombre de points gagnés pour chaque badge

**Partage sur les réseaux sociaux** :
1. Cliquez sur un badge débloqué
2. Cliquez sur **"Partager"** (bouton avec icône de partage)
3. Choisissez la plateforme (WhatsApp, Facebook, Twitter)
4. Un message pré-rempli s''affiche avec une **image PNG du badge**
5. Partagez avec vos amis et clients !

**Progression** :
- La barre de progression indique votre avancement vers le prochain badge
- Des **messages d''encouragement** s''affichent selon votre progression
- Vous recevez une **notification** à chaque nouveau badge débloqué

**Avantages des badges** :
- ✅ Reconnaissance de vos efforts
- ✅ Motivation pour progresser
- ✅ Crédibilité auprès des clients
- ✅ Fierté professionnelle
- ✅ Gamification de l''apprentissage

**Astuce** : Consultez régulièrement vos badges pour voir votre progression et fixer de nouveaux objectifs !',
  'general',
  0, 0, 0,
  NOW(), NOW()
);

-- Afficher le nombre d'articles insérés
SELECT 'Articles FAQ insérés avec succès !' AS message, COUNT(*) AS total FROM faq_articles;
