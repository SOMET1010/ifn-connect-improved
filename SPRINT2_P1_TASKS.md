# 🎯 SPRINT 2 - ITEMS P1 (BACKLOG PRIORISÉ)

**Date de début** : 26 décembre 2025  
**Objectif** : Compléter les fonctionnalités essentielles pour valeur métier

---

## ✅ SPRINT 1 (P0) - TERMINÉ À 100%

- [x] P0-5 : Supprimer ComponentShowcase.tsx
- [x] P0-4 : Backup/Restore Base de Données
- [x] P0-3 : Tests Synchronisation Offline (4 tests E2E Playwright)
- [x] P0-1 : Flux Paiement Mobile Money (mode simulation + UI)
- [x] P0-2 : Renouvellement CNPS/CMU (module complet + notifications email)

---

## 📋 SPRINT 2 (P1) - EN COURS

### Semaine 1 (Jours 1-5)

#### [ ] P1-2 : Graphiques Tendances Admin (1 jour)
**Statut** : Partiellement fait (graphique 7 jours existe)  
**À faire** :
- [ ] Ajouter graphique enrôlements sur 12 derniers mois
- [ ] Ajouter graphique transactions sur 12 derniers mois
- [ ] Intégrer dans `/admin/dashboard`
- [ ] Backend : procédures `admin.getEnrollmentTrend` et `admin.getTransactionTrend`
- [ ] Frontend : composants avec Recharts ou Chart.js

#### [ ] P1-5 : Cron Job Badges (1 jour)
**Statut** : Non fait  
**À faire** :
- [ ] Créer script `server/cron/check-badges.ts`
- [ ] Tâche quotidienne à minuit (fuseau Côte d'Ivoire)
- [ ] Vérifier conditions de tous les badges pour tous les marchands
- [ ] Débloquer automatiquement les badges atteints
- [ ] Logger les déblocages
- [ ] Initialiser le cron dans `server/index.ts`

#### [ ] P1-1 : Dashboard Agent - Tâches du Jour (3 jours)
**Statut** : Non fait  
**À faire** :
- [ ] Backend : procédure `agent.getTasks` avec logique métier
  * Marchands à contacter (inactifs > 7 jours)
  * Enrôlements à finaliser (photos manquantes, GPS manquant)
  * Renouvellements CNPS/CMU à suivre
  * Objectifs hebdomadaires (X enrôlements/semaine)
- [ ] Frontend : page `/agent/tasks` avec liste des tâches
- [ ] Filtres : par type, par priorité, par statut
- [ ] Tri : par urgence, par date
- [ ] Actions rapides : appeler, envoyer SMS, marquer comme fait
- [ ] Statistiques : tâches complétées aujourd'hui, cette semaine

### Semaine 2 (Jours 6-10)

#### [ ] P1-3 : Export Excel Rapports (3 jours)
**Statut** : Export CSV existe pour admin/merchants  
**À faire** :
- [ ] Installer bibliothèque xlsx (SheetJS)
- [ ] Backend : procédures d'export
  * `admin.exportMerchants` (tous les champs)
  * `admin.exportStatsByMarket` (agrégations)
  * `admin.exportTransactions` (historique complet)
- [ ] Frontend : boutons d'export dans pages admin
- [ ] Format Excel avec feuilles multiples
- [ ] Formatage professionnel (en-têtes, couleurs, largeurs colonnes)
- [ ] Nom de fichier avec date : `rapport-marchands-2025-12-26.xlsx`

#### [ ] P1-7 : Logs d'Audit (2 jours)
**Statut** : Non fait  
**À faire** :
- [ ] Table `audit_logs` dans schema.ts
  * id, userId, action, resource, resourceId, details (JSON), ipAddress, userAgent, createdAt
- [ ] Middleware tRPC pour logger automatiquement les actions sensibles
  * Création/modification/suppression marchands
  * Approbation/rejet renouvellements
  * Modification rôles utilisateurs
  * Exports de données
- [ ] Backend : procédure `admin.getAuditLogs` avec filtres
- [ ] Frontend : page `/admin/audit-logs`
- [ ] Filtres : par utilisateur, par action, par ressource, par date
- [ ] Recherche avancée
- [ ] Export CSV des logs

### Semaine 3 (Jours 11-15)

#### [ ] P1-6 : Gestion Rôles Admin (3 jours)
**Statut** : Non fait  
**À faire** :
- [ ] Backend : procédures admin
  * `admin.listUsers` (tous les utilisateurs)
  * `admin.updateUserRole` (changer rôle)
  * `admin.deactivateUser` (désactiver compte)
  * `admin.reactivateUser` (réactiver compte)
- [ ] Frontend : page `/admin/users`
- [ ] Tableau avec recherche et filtres (par rôle, par statut)
- [ ] Dialog de modification de rôle (admin, agent, merchant, cooperative)
- [ ] Confirmation avant actions sensibles
- [ ] Logs d'audit pour toutes les modifications

#### [ ] P1-9 : Refactorisation EnrollmentWizard (2 jours)
**Statut** : Non fait (optionnel)  
**À faire** :
- [ ] Découper `EnrollmentWizard.tsx` (632 lignes) en 5 composants
  * `PersonalInfoStep.tsx`
  * `ProfessionalInfoStep.tsx`
  * `PhotoCaptureStep.tsx`
  * `GeolocationStep.tsx`
  * `SummaryStep.tsx`
- [ ] Tests unitaires pour chaque composant

### Semaine 4 (Jours 16-20)

#### [ ] P1-10 : Refactorisation MerchantDashboard (2 jours)
**Statut** : Non fait (optionnel)  
**À faire** :
- [ ] Découper `MerchantDashboardSimple.tsx` (416 lignes) en composants
  * `DashboardKPIs.tsx`
  * `DashboardActions.tsx`
  * `DashboardSalesChart.tsx`
  * `DashboardScoreCard.tsx`
- [ ] Tests unitaires pour chaque composant

#### [ ] P1-4 : Notifications In-App (3 jours)
**Statut** : Non fait  
**À faire** :
- [ ] Table `notifications` dans schema.ts
  * id, userId, type, title, message, read, actionUrl, createdAt
- [ ] Backend : procédures notifications
  * `notifications.list` (liste des notifications)
  * `notifications.markAsRead` (marquer comme lu)
  * `notifications.markAllAsRead` (tout marquer)
  * `notifications.getUnreadCount` (compteur)
- [ ] Système de création automatique de notifications
  * Badge débloqué → notification
  * Renouvellement approuvé → notification
  * Stock bas → notification
  * Commande livrée → notification
- [ ] Frontend : composant `NotificationBell` dans header
- [ ] Badge rouge avec compteur de non-lus
- [ ] Dropdown avec liste des 5 dernières notifications
- [ ] Page `/notifications` avec historique complet
- [ ] Filtres : par type, par statut (lu/non lu)

---

## 🎁 FONCTIONNALITÉS BONUS (HORS BACKLOG)

Ces fonctionnalités ont été implémentées en plus du backlog priorisé :

- [x] Copilote SUTA avec messages contextuels et météo
- [x] Score SUTA / Pré-scoring crédit (5 critères, 4 tiers)
- [x] Tontine digitale / Épargne (5 cagnottes prédéfinies)
- [x] Calendrier événements locaux (6 événements 2025-2026)
- [x] Chat interactif avec LLM (assistant conversationnel)
- [x] Graphique des ventes 7 jours (correspond à P1-2 partiel)
- [x] Import automatique de 1431 marchands depuis PDFs
- [x] Page d'administration marchands complète avec filtres
- [x] Génération de documents officiels (fiche A4, carte physique)

**Ces fonctionnalités sont conservées et documentées comme valeur ajoutée.**

---

## 📊 PROGRESSION GLOBALE

### Sprint 1 (P0)
- ✅ 5/5 items terminés (100%)

### Sprint 2 (P1)
- ⏳ 0/10 items terminés (0%)
- 🎯 Prochaine tâche : P1-2 (Graphiques Tendances Admin)

### Sprint 3 (P2)
- ⏳ 0/6 items (non démarré)

---

**Règle STRICTE** : Suivre l'ordre exact du backlog sans dévier.
