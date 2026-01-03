# 🎯 PLAN DE RÉCUPÉRATION COMPLÈTE - IFN CONNECT
**Date**: 3 janvier 2026
**Status**: Migration PostgreSQL terminée - Récupération des fonctionnalités
**Objectif**: Rétablir 100% des fonctionnalités après migration Supabase

---

## ✅ ÉTAT ACTUEL (3 janvier 2026)

### Infrastructure
- ✅ Migration MySQL → PostgreSQL/Supabase TERMINÉE
- ✅ Schémas convertis (schema.ts, schema-payments.ts, schema-badges.ts, schema-daily-logins.ts)
- ✅ Build réussi sans erreurs
- ✅ Base de données Supabase avec 20 tables + RLS activé
- ✅ Driver postgres-js configuré

### Fonctionnalités Opérationnelles
- ✅ Authentification de base
- ✅ Modules marchands (dashboard, caisse, stock, marché virtuel)
- ✅ Module agent (enrôlement, dashboard, carte)
- ✅ Badges et gamification
- ✅ Certificats professionnels
- ✅ Couverture sociale CNPS/CMU
- ✅ Mode offline (IndexedDB + Service Worker)
- ✅ Support vocal (reconnaissance + synthèse)
- ✅ Multilingue (6 langues dont Dioula)

---

## 🔴 PRIORITÉ 0 : CRITIQUE (Sprint 1 - 2 semaines)

### P0-1: Système d'Authentification Complet ⚠️ BLOQUANT
**Impact**: 80% des utilisateurs ne peuvent pas se connecter de façon sécurisée
**Effort**: 3 jours

**Tâches:**
- [ ] Implémenter authentification multi-niveaux (numéro marchand, OTP SMS, PIN)
- [ ] Créer système OTP SMS avec intégration opérateur télécom
- [ ] Ajouter validation PIN à 4 chiffres
- [ ] Créer middleware RLS pour sécuriser toutes les routes
- [ ] Tester le flow complet d'authentification
- [ ] Gérer les erreurs et timeouts

**Tests:**
```typescript
// Test connexion avec numéro marchand + OTP
// Test création PIN
// Test validation PIN
// Test RLS policies
```

---

### P0-2: Row Level Security (RLS) ⚠️ CRITIQUE
**Impact**: Faille de sécurité majeure - données non protégées
**Effort**: 2 jours

**Tâches:**
- [ ] Activer RLS sur toutes les tables
- [ ] Créer policies pour marchands (accès seulement à leurs données)
- [ ] Créer policies pour agents (accès à leurs marchands enrôlés)
- [ ] Créer policies pour admins (accès complet)
- [ ] Créer policies pour coopératives (accès membres)
- [ ] Tests de sécurité pour vérifier isolation des données
- [ ] Documentation des policies

**Fichier**: `server/security/rls-policies.sql`

---

### P0-3: Tests Synchronisation Offline ⚠️ CRITIQUE
**Impact**: Risque de perte de données en mode hors ligne
**Effort**: 2 jours

**Tâches:**
- [ ] Créer tests E2E Playwright pour le mode offline
- [ ] Test: Créer vente offline → vérifier IndexedDB
- [ ] Test: Reconnexion → vérifier sync automatique
- [ ] Test: Vérifier données en base après sync
- [ ] Test: Conflit de synchronisation (résolution)
- [ ] Corriger bugs détectés

**Fichier**: `e2e/offline-sync.spec.ts` (déjà créé, à compléter)

---

### P0-4: Backup/Restore Base de Données ⚠️ CRITIQUE
**Impact**: Aucune sauvegarde en cas de panne = perte totale
**Effort**: 1 jour

**Tâches:**
- [ ] Configurer backup automatique Supabase (quotidien)
- [ ] Créer script de backup manuel local
- [ ] Créer script de restore avec tests
- [ ] Documenter la procédure de récupération
- [ ] Tester backup/restore complet
- [ ] Configurer alertes en cas d'échec

**Fichiers**: `scripts/backup/`

---

### P0-5: Intégration Paiements Mobile Money ⚠️ BLOQUANT
**Impact**: Marchands ne peuvent pas commander sur marché virtuel
**Effort**: 5 jours

**Tâches:**
- [ ] Intégration InTouch API (prioritaire - le plus simple)
- [ ] Intégration Orange Money API
- [ ] Intégration MTN Mobile Money API
- [ ] Intégration Wave Money API
- [ ] Intégration Moov Money API
- [ ] Créer système de webhooks pour confirmations
- [ ] Gérer les timeouts et erreurs réseau
- [ ] Créer page de statut paiement avec animations
- [ ] Tests end-to-end pour chaque opérateur

**Fichiers**:
- `server/routers/payments.ts` (déjà existant, à compléter)
- `client/src/components/payments/MobileMoneyPayment.tsx`

---

### P0-6: Formulaire Renouvellement CNPS/CMU ⚠️ BLOQUANT
**Impact**: Marchands voient alertes mais ne peuvent pas renouveler
**Effort**: 3 jours

**Tâches:**
- [ ] Créer formulaire de demande de renouvellement
- [ ] Upload justificatifs (photo carte + preuve paiement)
- [ ] Procédure tRPC `socialProtection.requestRenewal`
- [ ] Notification automatique aux agents DGE/ANSUT
- [ ] Workflow d'approbation admin
- [ ] Mise à jour automatique des dates après approbation
- [ ] Historique des demandes
- [ ] Tests end-to-end

**Fichiers**:
- `client/src/pages/merchant/SocialProtection.tsx` (à créer)
- `server/routers/social-protection.ts` (déjà existant)

---

## 🟡 PRIORITÉ 1 : ESSENTIEL (Sprint 2 - 3 semaines)

### P1-1: Dashboard Agent - Tâches du Jour
**Impact**: Agents ne savent pas quels marchands contacter
**Effort**: 2 jours

**Tâches:**
- [ ] Créer procédure `agent.getTasks` (marchands à relancer)
- [ ] Algorithme de priorisation (CNPS/CMU expirés > stock bas > inactifs)
- [ ] UI liste des tâches avec cartes colorées
- [ ] Filtres et tri (urgence, marché, date)
- [ ] Bouton "Marquer comme fait"
- [ ] Statistiques de performance agent

---

### P1-2: Graphiques Tendances Admin
**Impact**: Admins ne voient pas l'évolution dans le temps
**Effort**: 1 jour

**Tâches:**
- [ ] Graphique enrôlements 12 derniers mois (ligne)
- [ ] Graphique transactions 12 derniers mois (barres)
- [ ] Graphique couverture sociale (évolution CNPS/CMU)
- [ ] Intégration dans dashboard admin
- [ ] Export des graphiques en PNG

---

### P1-3: Export Excel Rapports
**Impact**: Admins ne peuvent pas faire reporting gouvernemental
**Effort**: 2 jours

**Tâches:**
- [ ] Installer bibliothèque xlsx
- [ ] Export liste marchands (tous champs)
- [ ] Export statistiques par marché
- [ ] Export transactions avec filtres dates
- [ ] Export ventes par produit
- [ ] Format professionnel avec en-têtes
- [ ] Boutons d'export dans dashboards

---

### P1-4: Notifications In-App
**Impact**: Marchands ratent les alertes importantes
**Effort**: 3 jours

**Tâches:**
- [ ] Table `in_app_notifications` (déjà créée)
- [ ] Procédures CRUD notifications
- [ ] Badge rouge sur icône avec compteur
- [ ] Panneau déroulant des notifications
- [ ] Page historique `/notifications`
- [ ] Marquer comme lu
- [ ] Supprimer notifications
- [ ] Types: badge_earned, cnps_expiring, stock_low, order_status

---

### P1-5: Cron Job Badges Automatique
**Impact**: Badges ne se débloquent pas automatiquement
**Effort**: 1 jour

**Tâches:**
- [ ] Créer tâche cron quotidienne (minuit)
- [ ] Vérification conditions pour tous marchands
- [ ] Déblocage automatique + notification
- [ ] Logs des badges débloqués
- [ ] Tests du cron

**Fichier**: `server/cron/badge-checker.ts` (déjà existant)

---

### P1-6: Gestion Rôles Admin
**Impact**: Impossible d'ajouter/retirer des admins
**Effort**: 2 jours

**Tâches:**
- [ ] Page `/admin/users` avec tableau
- [ ] CRUD utilisateurs (create, update, delete, activate/deactivate)
- [ ] Modification des rôles (merchant → agent → admin)
- [ ] Filtres et recherche
- [ ] Logs d'audit pour changements sensibles

---

### P1-7: Logs d'Audit Système
**Impact**: Aucune traçabilité des actions sensibles
**Effort**: 2 jours

**Tâches:**
- [ ] Middleware automatique pour logger actions
- [ ] Logs: user_id, action, entity, entityId, IP, userAgent
- [ ] Page consultation logs `/admin/audit-logs`
- [ ] Filtres par utilisateur, action, date
- [ ] Export logs en CSV
- [ ] Rétention 1 an minimum

**Table**: `audit_logs` (déjà créée)

---

### P1-8: Monitoring Système
**Impact**: Aucune alerte en cas de panne
**Effort**: 3 jours

**Tâches:**
- [ ] Intégration Sentry pour erreurs frontend/backend
- [ ] Monitoring uptime (Pingdom ou UptimeRobot)
- [ ] Alertes email/SMS si downtime > 5 min
- [ ] Dashboard métriques (CPU, mémoire, requêtes/sec)
- [ ] Logs centralisés (Winston + Cloudwatch)

---

### P1-9: Refactorisation Fichiers Géants
**Impact**: Code difficile à maintenir
**Effort**: 3 jours

**Fichiers à découper:**
- [ ] `EnrollmentWizard.tsx` (632 lignes) → 5 composants (1 par étape)
- [ ] `MerchantDashboard.tsx` (416 lignes) → 4 composants (KPIs, Graphiques, Actions, Stats)
- [ ] `AgentDashboard.tsx` (350+ lignes) → 3 composants
- [ ] `CashRegister.tsx` (300+ lignes) → 3 composants
- [ ] Tests unitaires après refactorisation

---

## 🟢 PRIORITÉ 2 : AMÉLIORATION (Sprint 3 - 2 semaines)

### P2-1: Page Paramètres Utilisateur
**Effort**: 1 jour

**Tâches:**
- [ ] Page `/settings` avec sections
- [ ] Paramètres audio (volume, activation)
- [ ] Paramètres langue (6 langues)
- [ ] Paramètres affichage (taille texte)
- [ ] Paramètres notifications (SMS, email, in-app)
- [ ] Sauvegarde dans localStorage + base

---

### P2-2: Aide Contextuelle
**Effort**: 2 jours

**Tâches:**
- [ ] Composant HelpDialog réutilisable
- [ ] Contenu d'aide par page (20 pages)
- [ ] Vidéos tutoriels courtes (< 2 min)
- [ ] Recherche dans l'aide
- [ ] Bouton "?" visible partout

---

### P2-3: Upload Photo Profil
**Effort**: 2 jours

**Tâches:**
- [ ] Intégration Supabase Storage
- [ ] Crop et preview image
- [ ] Upload avec barre de progression
- [ ] Validation taille/format
- [ ] Affichage photo dans profil + header

---

### P2-4: Historique Notifications
**Effort**: 1 jour

**Tâches:**
- [ ] Page `/notifications/history`
- [ ] Tableau notifications avec filtres
- [ ] Recherche par contenu
- [ ] Export en PDF

---

### P2-5: Documentation API
**Effort**: 2 jours

**Tâches:**
- [ ] Générer documentation Swagger/OpenAPI
- [ ] Documenter tous les endpoints tRPC
- [ ] Exemples de requêtes/réponses
- [ ] Guide d'intégration pour partenaires

---

## 📋 FONCTIONNALITÉS NON IMPLÉMENTÉES (Backlog Long Terme)

### Module Coopérative (5% utilisateurs)
- [ ] Dashboard coopérative avec KPIs
- [ ] Gestion stocks centralisés
- [ ] Traitement commandes groupées
- [ ] Agrégation automatique commandes
- [ ] Calcul prix groupés
- [ ] Planification livraisons
- [ ] Gestion membres
- [ ] Suivi paiements membres
- [ ] Rapports financiers PDF
- [ ] Historique transactions

### Cartographie SIG Avancée
- [ ] Clustering intelligent marqueurs
- [ ] Heatmap densité acteurs
- [ ] Filtres géographiques avancés
- [ ] Export données cartographiques
- [ ] Calcul itinéraires optimisés agents

### Notifications SMS/Email
- [ ] Intégration service SMS (Twilio/InfoBip)
- [ ] SMS OTP authentification
- [ ] SMS alertes stock bas
- [ ] SMS confirmations paiement
- [ ] Email rapports mensuels
- [ ] Email factures
- [ ] Personnalisation par rôle
- [ ] Historique notifications

### E-Learning & Parcours Formation
- [ ] Table learning_modules
- [ ] 10 modules formation (Stock, Finance, Santé, etc.)
- [ ] Contenu Français + Dioula
- [ ] Quiz fin de module
- [ ] Suivi progression
- [ ] Certificat complétion
- [ ] Vidéos tutoriels (< 2 min)
- [ ] Sous-titres multilingues

### Communauté & Mentorat
- [ ] Système mentorat pair-à-pair
- [ ] Matching mentor/mentoré
- [ ] Chat privé
- [ ] Forum communautaire par marché
- [ ] Partage bonnes pratiques
- [ ] Classement meilleurs marchands
- [ ] Récompenses top 10

### Analytics d'Impact Social
- [ ] Dashboard impact global
- [ ] Taux adoption par marché
- [ ] Taux couverture sociale
- [ ] Progression niveaux
- [ ] Engagement communautaire
- [ ] Rapports PDF pour DGE/ANSUT/DGI

---

## 📊 RÉSUMÉ DES EFFORTS

### Sprint 1 (P0) - 16 jours
- P0-1: Authentification complète (3j)
- P0-2: RLS (2j)
- P0-3: Tests offline (2j)
- P0-4: Backup/Restore (1j)
- P0-5: Paiements Mobile Money (5j)
- P0-6: Renouvellement CNPS/CMU (3j)

### Sprint 2 (P1) - 18 jours
- P1-1: Dashboard Agent Tâches (2j)
- P1-2: Graphiques Admin (1j)
- P1-3: Export Excel (2j)
- P1-4: Notifications In-App (3j)
- P1-5: Cron Badges (1j)
- P1-6: Gestion Rôles (2j)
- P1-7: Logs Audit (2j)
- P1-8: Monitoring (3j)
- P1-9: Refactorisation (3j)

### Sprint 3 (P2) - 8 jours
- P2-1: Page Paramètres (1j)
- P2-2: Aide Contextuelle (2j)
- P2-3: Upload Photo (2j)
- P2-4: Historique Notifications (1j)
- P2-5: Documentation API (2j)

**Total: 42 jours (8-9 semaines)**

---

## 🎯 CRITÈRES DE SUCCÈS

### Sprint 1
- ✅ Authentification sécurisée opérationnelle
- ✅ RLS activé sur toutes les tables
- ✅ Tests offline passent à 100%
- ✅ Backup automatique quotidien fonctionne
- ✅ Au moins 2 opérateurs Mobile Money intégrés
- ✅ Formulaire renouvellement CNPS/CMU complet

### Sprint 2
- ✅ Dashboard agent avec tâches prioritaires
- ✅ Graphiques d'évolution dans admin
- ✅ Export Excel opérationnel
- ✅ Notifications in-app fonctionnelles
- ✅ Badges se débloquent automatiquement
- ✅ Logs d'audit tracent toutes actions sensibles
- ✅ Monitoring alerte en cas de panne

### Sprint 3
- ✅ Page paramètres complète
- ✅ Aide contextuelle sur toutes pages
- ✅ Upload photo profil fonctionne
- ✅ Documentation API publiée

---

## 🚀 PROCHAINES ÉTAPES IMMÉDIATES

1. **Commencer Sprint 1 - P0**
2. **Prioriser P0-1 (Authentification)** - BLOQUANT
3. **Paralléliser P0-2 (RLS)** - CRITIQUE SÉCURITÉ
4. **Créer tests E2E P0-3** - CRITIQUE DONNÉES

**Question**: Voulez-vous que je commence par **P0-1 (Authentification)** ou **P0-2 (RLS)** en premier?
