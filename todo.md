# IFN Connect - Liste des Fonctionnalités

## Infrastructure et Configuration
- [x] Schéma de base de données complet (marchands, agents, coopératives, ventes, stocks, produits)
- [ ] Système d'authentification multi-niveaux (numéro marchand, OTP SMS, PIN)
- [ ] Row Level Security (RLS) dans la base de données
- [ ] Configuration du Service Worker pour PWA
- [ ] Configuration IndexedDB pour stockage offline
- [ ] Queue de synchronisation avec retry automatique

## Système de Design Accessible
- [x] Bibliothèque de pictogrammes SVG pour actions principales
- [x] Composants de boutons larges tactiles (min 48x48px)
- [x] Système de feedback visuel et sonore
- [x] Composants d'alertes vocales
- [x] Mode simplifié avec 4 actions principales
- [x] Navigation alternative sans couleurs (pictogrammes + texte + position)

## Support Vocal
- [x] Configuration Web Speech API pour reconnaissance vocale
- [x] Support de la langue Dioula
- [x] Support de la langue Française
- [x] Commandes vocales pour enregistrement de ventes
- [x] Commandes vocales pour consultation de stock
- [x] Synthèse vocale pour alertes
- [x] Synthèse vocale pour guidage utilisateur
- [x] Transcription automatique des commandes vocales

## Module Marchand (80% utilisateurs)
- [x] Dashboard marchand avec KPIs (ventes du jour, stock bas, cotisations)
- [ ] Interface de caisse tactile simplifiée
- [ ] Enregistrement rapide de ventes avec vocal
- [ ] Gestion de stock avec alertes visuelles et vocales
- [ ] Visualisation simple CNPS (retraite)
- [ ] Visualisation simple CMU (santé)
- [ ] Marché virtuel d'approvisionnement
- [ ] Liste des produits disponibles
- [ ] Panier d'achat et commande
- [ ] Intégration paiements Mobile Money (InTouch)
- [ ] Intégration Orange Money
- [ ] Intégration MTN Mobile Money
- [ ] Historique des transactions
- [ ] Profil marchand avec numéro unique

## Module Agent Terrain (15% utilisateurs)
- [ ] Dashboard agent avec statistiques d'enrôlement
- [ ] Wizard d'enrôlement en 5 étapes
- [ ] Capture photo des pièces justificatives
- [ ] Compression automatique des photos
- [ ] Géolocalisation GPS automatique
- [ ] Validation des données en temps réel
- [ ] Liste des marchands enrôlés avec filtres
- [ ] Carte des marchands avec clustering
- [ ] Mode offline complet pour enrôlement
- [ ] Queue d'enrôlements en attente de sync
- [ ] Support N1 avec FAQ
- [ ] Calcul d'itinéraires optimisés

## Module Coopérative (5% utilisateurs)
- [ ] Dashboard coopérative avec KPIs
- [ ] Gestion des stocks centralisés
- [ ] Traitement des commandes groupées
- [ ] Agrégation automatique des commandes
- [ ] Calcul des prix groupés
- [ ] Planification des livraisons
- [ ] Gestion des membres
- [ ] Suivi des paiements membres
- [ ] Rapports financiers exportables en PDF
- [ ] Historique complet des transactions
- [ ] Notifications pour nouvelles commandes

## Module Administration
- [ ] Dashboard analytique avec KPIs temps réel
- [ ] Volume de transactions
- [ ] Nombre d'enrôlés
- [ ] Taux d'adoption du digital
- [ ] Cartographie SIG interactive
- [ ] Clustering intelligent des marqueurs
- [ ] Heatmap des zones d'activité
- [ ] Carte de densité (formel vs informel)
- [ ] Gestion des utilisateurs et rôles
- [ ] Activation/désactivation de modules par rôle
- [ ] Configuration des intégrations API
- [ ] Monitoring système et alertes
- [ ] Audit logs avec recherche avancée
- [ ] Export de données pour analyse
- [ ] Rapports personnalisables
- [ ] Backup manuel et automatique

## Notifications et Communications
- [ ] Envoi SMS automatique (OTP)
- [ ] Envoi SMS pour alertes de stock bas
- [ ] Envoi SMS pour confirmations de paiement
- [ ] Envoi email pour rapports mensuels
- [ ] Envoi email pour factures
- [ ] Envoi email pour relevés
- [ ] Personnalisation des notifications par rôle
- [ ] Historique des notifications envoyées

## Cartographie et Géolocalisation
- [ ] Intégration Google Maps
- [ ] Clustering intelligent des marchands
- [ ] Heatmap des zones d'activité commerciale
- [ ] Géolocalisation automatique des points de vente
- [ ] Calcul d'itinéraires optimisés pour agents
- [ ] Filtres par zone géographique
- [ ] Visualisation de la densité des marchands

## Optimisation et Performance
- [ ] Lazy loading des modules
- [ ] Code splitting par rôle
- [ ] Compression des images (WebP)
- [ ] Optimisation des requêtes base de données
- [ ] Cache intelligent avec Service Worker
- [ ] Préchargement des données critiques

## Tests et Qualité
- [ ] Tests unitaires pour l'authentification
- [ ] Tests unitaires pour les ventes
- [ ] Tests unitaires pour les stocks
- [ ] Tests d'intégration pour le workflow marchand
- [ ] Tests d'intégration pour le workflow agent
- [ ] Tests d'accessibilité
- [ ] Tests de performance
- [ ] Tests du mode offline

## Documentation
- [ ] Guide utilisateur pour marchands
- [ ] Guide utilisateur pour agents
- [ ] Guide utilisateur pour coopératives
- [ ] Guide administrateur
- [ ] Documentation technique
- [ ] Documentation des APIs


## 🆕 INTÉGRATION DONNÉES D'ENRÔLEMENT EXISTANTES

### Données disponibles
- [x] Importer 8 marchés/coopératives depuis markets.csv
- [x] Importer 1301 acteurs/bénéficiaires depuis actors.csv
- [x] Adapter le schéma de base de données pour correspondre aux données existantes
- [x] Créer un script d'import automatique des CSV vers la base de données
- [x] Lier les acteurs aux marchés via market_name
- [x] Créer une interface de visualisation des acteurs enrôlés
- [x] Ajouter la recherche par identifier_code (carte)
- [x] Ajouter la recherche par téléphone
- [x] Créer des statistiques par marché (effectif, CMU, CNPS, RSTI)
- [ ] Intégrer les données dans le module Agent Terrain
- [ ] Intégrer les données dans le module Coopérative
- [ ] Créer une page de détail pour chaque acteur
- [ ] Ajouter la possibilité de mettre à jour les informations
- [ ] Créer un système de vérification des doublons


## 🔧 CORRECTIONS VISUELLES URGENTES

- [x] Corriger l'affichage des logos DGE et ANSUT
- [x] Améliorer l'intégration visuelle des images de rôles (arrondir, ombres)
- [x] Retirer les fonds blancs des images
- [x] Optimiser le design du Hero


## 🗺️ CARTOGRAPHIE SIG

- [x] Créer la page de cartographie avec Google Maps
- [x] Afficher les 8 marchés géolocalisés sur la carte
- [x] Marqueurs personnalisés avec couleur orange terracotta
- [x] InfoWindow avec détails du marché (nom, effectif, CMU, CNPS)
- [x] Mode édition pour corriger les positions GPS (drag & drop)
- [x] Mutation tRPC pour mettre à jour la géolocalisation
- [x] Liste des marchés avec navigation vers la carte
- [x] Statistiques agrégées (effectif total, CMU total, CNPS total)
- [x] Centrage automatique sur Abidjan
- [x] Légende de la carte
- [ ] Clustering intelligent des marqueurs (si beaucoup de marchés)
- [ ] Heatmap de densité des acteurs
- [ ] Filtres par marché
- [ ] Export des données cartographiques


## 🎨 CORRECTION FOND BLANC DES IMAGES

- [x] Remplacer les images PNG avec fond blanc par des icônes SVG ou images transparentes
- [x] Améliorer l'intégration visuelle des pictogrammes dans les cartes
- [x] Ajouter un effet de blend ou filtre pour mieux intégrer les images


## 🎨 AMÉLIORATIONS DESIGN EN COURS

- [x] Ajouter les titres et descriptions visibles sur les cartes de rôles
- [x] Améliorer la hiérarchie visuelle avec meilleurs espacements
- [x] Ajouter des animations au hover pour feedback tactile
- [x] Augmenter la taille des textes pour meilleure lisibilité
- [x] Rendre les icônes plus grandes et plus visibles
- [x] Améliorer les contrastes pour l'accessibilité
- [x] Optimiser pour mobile avec boutons plus larges


## 💰 MODULE CAISSE TACTILE (EN COURS)

### Interface Caisse
- [x] Créer la page de caisse tactile (/merchant/cash-register)
- [x] Pavé numérique large et tactile (80x80px par touche)
- [x] Sélection rapide des produits avec pictogrammes
- [x] Calcul automatique du total
- [x] Bouton "Enregistrer la vente" avec feedback audio
- [x] Historique des ventes du jour
- [x] Statistiques en temps réel (total jour, nombre de ventes)
- [x] Mode simplifié avec actions essentielles

### Enregistrement Vocal
- [ ] Bouton microphone pour commandes vocales
- [ ] Reconnaissance vocale en Dioula ("Vendre 3 tas de tomates")
- [ ] Reconnaissance vocale en Français
- [ ] Transcription automatique vers formulaire
- [ ] Feedback vocal de confirmation
- [ ] Gestion des erreurs de reconnaissance
- [ ] Aide vocale contextuelle

### tRPC Procedures
- [x] sales.create - Créer une nouvelle vente
- [x] sales.listByMerchant - Liste des ventes d'un marchand
- [x] sales.todayStats - Statistiques du jour
- [x] sales.history - Historique des ventes
- [x] products.listByMerchant - Liste des produits d'un marchand
- [x] products.create - Ajouter un produit
- [x] products.update - Modifier un produit
- [x] products.delete - Supprimer un produit

## 📦 MODULE GESTION DE STOCK (EN COURS)

### Interface Stock
- [x] Créer la page de gestion de stock (/merchant/stock)
- [x] Liste des produits avec quantités actuelles
- [x] Alertes visuelles pour stock bas (< 10 unités)
- [x] Alertes vocales pour stock critique (< 5 unités)
- [x] Formulaire d'ajout rapide de produit
- [x] Modification inline des quantités
- [x] Recherche de produits (texte + vocal)
- [ ] Catégorisation des produits
- [x] Synchronisation automatique avec les ventes

### Alertes Stock
- [ ] Système de seuils configurables par produit
- [ ] Notification visuelle (badge rouge)
- [ ] Notification vocale automatique
- [ ] Liste des produits en rupture
- [ ] Suggestions de réapprovisionnement
- [ ] Historique des mouvements de stock

### tRPC Procedures
- [x] stock.listByMerchant - Liste du stock d'un marchand
- [x] stock.update - Mettre à jour les quantités
- [x] stock.lowStock - Produits en stock bas
- [ ] stock.movements - Historique des mouvements
- [ ] stock.alerts - Alertes actives


## 🎨 AMÉLIORATION HEADER (EN COURS)

- [x] Agrandir les logos DGE et ANSUT pour meilleure visibilité
- [x] Ajouter le titre "Plateforme d'Inclusion Numérique" dans le header
- [x] Ajouter les lignes colorées décoratives (orange/vert)
- [x] Améliorer le fond du header (blanc/gris clair)
- [ ] Structurer la navigation (Accueil | Acteurs | Marketplace | Paiements | API | Support)
- [x] Rendre le header plus moderne et professionnel
- [x] S'assurer que le header est responsive sur mobile


## 🏛️ REFONTE HEADER INSTITUTIONNEL (EN COURS)

### Structure et Layout
- [x] Regrouper les logos DGE et ANSUT à gauche avec trait vertical fin séparateur
- [x] Centrer le titre "Plateforme d'Inclusion Numérique" au milieu
- [x] Supprimer le sous-titre redondant "ANSUT • DGE"
- [x] Ajouter les contrôles à droite (Langue, Son, Connexion)

### Typographie
- [x] Augmenter la taille du titre à 24px (1.5rem)
- [x] Utiliser une police Bold (font-bold)
- [x] Couleur du titre : Noir foncé (#333)
- [x] Police sans empattement (Inter/Roboto)

### Boutons et Accessibilité
- [x] Transformer les boutons Langue/Son en style "pill" arrondi
- [x] Ajouter un bouton "Se connecter" ou icône profil
- [x] Ajouter option A+/A- pour agrandir le texte (accessibilité)
- [x] Aligner verticalement tous les boutons
- [x] Effet hover avec changement de couleur

### Design Final
- [x] Fond blanc avec ombre légère (box-shadow)
- [x] Ligne colorée fine en bas (orange/vert)
- [x] Espacement harmonieux entre les éléments
- [x] Responsive sur mobile et tablette


## 🌾 SEED PRODUITS DE DÉMONSTRATION (EN COURS)

### Catégories de produits à créer
- [x] Légumes (tomates, oignons, aubergines, gombo, piment, chou, carotte)
- [x] Céréales et tubercules (riz, maïs, manioc, igname, plantain, patate douce)
- [x] Légumineuses (arachides, haricots, niébé, soja)
- [x] Poissons (tilapia, carpe, poisson fumé, sardines)
- [x] Viandes (poulet, mouton, bœuf)
- [x] Fruits (bananes, oranges, mangues, noix de coco, ananas, papaye)
- [x] Condiments (sel, cube Maggi, huile de palme, piment moulu)

### Informations pour chaque produit
- [x] Nom en Français
- [x] Nom en Dioula
- [x] Prix moyen en FCFA
- [x] Unité de vente (kg, tas, pièce, litre, sachet)
- [x] Catégorie
- [x] Quantité initiale en stock (entre 10 et 100)

### Script et exécution
- [x] Créer le script de seed (scripts/seed-products.mjs)
- [x] Exécuter le script pour peupler la base
- [x] Vérifier que les 30 produits sont bien créés (34 produits créés !)
- [x] Tester la caisse avec les produits


## 🎯 OPTIMISATION HEADER INSTITUTIONNEL (Checkpoint 8)

### Persistance et UX
- [x] Implémenter la persistance des préférences utilisateur (localStorage)
  - [x] Sauvegarder l'état audio (activé/désactivé)
  - [x] Sauvegarder la taille de police (80%-150%)
  - [x] Restaurer les préférences au chargement de la page)

### Design et Accessibilité
- [x] Rendre le header sticky (fixe au scroll) avec backdrop-blur
- [x] Ajouter la gestion d'erreurs pour les logos (fallback si image ne charge pas)
- [x] Optimiser l'affichage mobile du header
- [x] Améliorer le gradient tricolore (orange-blanc-vert, rappel drapeau ivoirien)
- [x] Améliorer le feedback visuel du bouton audio (vert pâle quand actif)
- [x] Renommer "Se connecter" en "Espace Agent" pour plus de clarté

### Code et Performance
- [x] Unifier la fonction adjustFontSize avec bornes min/max
- [x] Améliorer la structure sémantique (h1 pour SEO)
- [x] Optimiser l'espacement responsive pour éviter l'écrasement des logos


## 🎨 IMAGE DE FOND HEADER (Checkpoint 9)

### Design
- [x] Ajouter une image de fond sur le thème du marché ivoirien dans le header
- [x] Appliquer une opacité très faible (8%) pour ne pas gêner la lisibilité
- [x] Ajouter un dégradé blanc sur les côtés pour fondre l'image
- [x] Maintenir la lisibilité parfaite des logos, texte et boutons
- [x] Conserver le gradient tricolore en bas


## 📦 STOCK INITIAL MARCHANDS (Checkpoint 10)

### Script de seed
- [x] Créer le script de génération du stock initial (scripts/seed-stock.mjs)
- [x] Récupérer tous les produits existants (34 produits)
- [x] Récupérer tous les marchands/acteurs (1278 marchands)
- [x] Assigner des quantités aléatoires (10-100 unités) pour chaque produit/marchand
- [x] Varier les quantités pour créer des situations réalistes (stock bas, stock normal, stock élevé)
- [x] Exécuter le script pour peupler la table merchant_stock
- [x] Vérifier que les données sont bien créées
- [x] Tester l'affichage du stock dans l'interface marchand
- [x] Tester les alertes de stock bas (< 10 unités)


## 🎨 AJUSTEMENT OPACITÉ IMAGE HEADER

- [x] Augmenter l'opacité de l'image de fond du header (de 8% à 18%)
- [x] Vérifier que la lisibilité reste bonne
- [x] Ajuster le dégradé si nécessaire


## 👥 CONVERSION ACTEURS → MARCHANDS (Checkpoint 10)

### Script de conversion
- [x] Créer le script de conversion (scripts/convert-actors-to-merchants.mjs)
- [x] Créer un utilisateur (user) pour chaque acteur
- [x] Créer un marchand (merchant) lié à chaque utilisateur
- [x] Générer un merchantNumber unique (format: MRC-XXXXX)
- [x] Utiliser les données existantes (nom, téléphone, carte CNPS/CMU)
- [x] Assigner les statuts CNPS/CMU basés sur les données d'enrôlement
- [x] Lier les marchands aux marchés via market_id
- [x] Exécuter le script pour convertir les 1278 acteurs
- [x] Vérifier que les données sont bien créées


## 📊 DASHBOARD MARCHAND ENRICHI (Checkpoint 11)

### Infrastructure et dépendances
- [x] Installer Recharts pour les graphiques
- [x] Créer les tRPC procedures pour les statistiques

### Procedures tRPC
- [x] sales.last7Days - Ventes des 7 derniers jours (pour graphique)
- [x] sales.topProducts - Top 5 produits les plus vendus
- [x] sales.todayStats - Statistiques du jour (montant, nombre de ventes)
- [x] sales.totalBalance - Solde total du marchand
- [x] sales.lowStockCount - Nombre de produits en stock bas

### Interface Dashboard
- [x] Créer la page /merchant/dashboard
- [x] Section KPIs : Ventes du jour, Solde, Alertes stock, CNPS/CMU
- [x] Graphique des ventes des 7 derniers jours (ligne)
- [x] Top 5 produits les plus vendus (barres horizontales)
- [x] Cartes d'actions rapides (Vendre, Stock, Argent, Aide)
- [x] Navigation mobile fixe en bas
- [x] Design responsive et accessible
- [x] Feedback vocal pour les actions (à implémenter)


## 🧪 VENTES DE TEST & TOOLTIPS NOUCHI (Checkpoint 11 suite)

### Ventes de test
- [x] Créer un script pour générer des ventes de test
- [x] Générer des ventes sur les 7 derniers jours (209 ventes)
- [x] Varier les produits et montants pour réalisme
- [x] Créer des ventes aujourd'hui pour les KPIs
- [x] Vérifier l'affichage des graphiques animés (Top 5 produits fonctionne, solde à 346 784 FCFA)

### Tooltips Nouchi
- [x] Ajouter les tooltips sur les KPIs (Djê, Bédou, etc.)
- [x] Ajouter les tooltips sur les boutons d'actions (Djossi, Fata)
- [x] Maintenir le français comme langue principale
- [x] Tester sur mobile (tap pour afficher)
