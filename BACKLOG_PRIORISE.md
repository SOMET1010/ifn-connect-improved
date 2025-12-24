# 📋 BACKLOG PRIORISÉ - IFN Connect
**Date** : 24 décembre 2025  
**Product Owner** : Lead Engineer  
**Objectif** : Plan de stabilisation et complétion en 3 sprints

---

## 🔴 P0 : BLOQUANT (Sprint 1)
**Critères** : Bloque l'usage / Perte de données / Sécurité / Crash

| ID | Fonctionnalité | Impact Utilisateur | Risque | Effort | Dépendances |
|----|----------------|-------------------|--------|--------|-------------|
| P0-1 | **Flux Paiement Mobile Money** | Marchands ne peuvent pas commander sur le marché virtuel | **CRITIQUE** - Bloque 80% des utilisateurs | L | Intégration InTouch/Orange/MTN |
| P0-2 | **Renouvellement CNPS/CMU** | Marchands voient les alertes mais ne peuvent pas renouveler | **CRITIQUE** - Perte de couverture sociale | L | API CNPS/CMU ou formulaire |
| P0-3 | **Tests Synchronisation Offline** | Ventes hors ligne peuvent ne pas se synchroniser | **CRITIQUE** - Perte de données | M | Tests E2E |
| P0-4 | **Backup/Restore Base de Données** | Aucune sauvegarde en cas de panne | **CRITIQUE** - Perte totale des données | L | Script backup automatique |
| P0-5 | **Refactorisation ComponentShowcase** | Fichier de 1437 lignes ralentit le build | **MOYEN** - Performance | S | Suppression fichier démo |

**Total P0 : 5 items** (Effort total : 3L + 1M + 1S = ~15 jours)

---

## 🟡 P1 : ESSENTIEL (Sprint 2)
**Critères** : Essentiel pour valeur métier

| ID | Fonctionnalité | Impact Utilisateur | Valeur Métier | Effort | Dépendances |
|----|----------------|-------------------|---------------|--------|-------------|
| P1-1 | **Dashboard Agent - Tâches du Jour** | Agents ne savent pas quels marchands contacter | **HAUTE** - Efficacité agents | M | Procédure `agent.getTasks` |
| P1-2 | **Graphiques Tendances Admin** | Admins ne voient pas l'évolution dans le temps | **HAUTE** - Pilotage stratégique | S | Recharts + 2 graphiques |
| P1-3 | **Export Excel Rapports** | Admins ne peuvent pas faire de reporting gouvernemental | **HAUTE** - Conformité | M | Bibliothèque xlsx |
| P1-4 | **Notifications In-App** | Marchands ratent les alertes importantes | **HAUTE** - Engagement | L | Système notifications |
| P1-5 | **Cron Job Badges** | Badges ne se débloquent pas automatiquement | **MOYENNE** - Gamification | S | Cron job quotidien |
| P1-6 | **Gestion Rôles Admin** | Impossible d'ajouter/retirer des admins | **MOYENNE** - Administration | M | UI gestion utilisateurs |
| P1-7 | **Logs d'Audit** | Aucune traçabilité des actions sensibles | **MOYENNE** - Sécurité | M | Table audit_logs |
| P1-8 | **Monitoring Système** | Aucune alerte en cas de panne | **MOYENNE** - Fiabilité | L | Service monitoring |
| P1-9 | **Refactorisation EnrollmentWizard** | Fichier de 632 lignes difficile à maintenir | **BASSE** - Maintenabilité | M | Découpage en 5 composants |
| P1-10 | **Refactorisation MerchantDashboard** | Fichier de 416 lignes difficile à maintenir | **BASSE** - Maintenabilité | M | Découpage en composants |

**Total P1 : 10 items** (Effort total : 2L + 6M + 2S = ~20 jours)

---

## 🟢 P2 : NICE-TO-HAVE (Sprint 3)
**Critères** : Amélioration / Confort / Polish

| ID | Fonctionnalité | Impact Utilisateur | Valeur Ajoutée | Effort | Dépendances |
|----|----------------|-------------------|----------------|--------|-------------|
| P2-1 | **Page Paramètres** | Utilisateurs cherchent les paramètres | **BASSE** - Confort | S | Route `/settings` |
| P2-2 | **Aide Contextuelle** | Utilisateurs cliquent sur "Aide" sans résultat | **BASSE** - UX | M | Contenu d'aide |
| P2-3 | **Upload Photo Profil** | Marchands veulent personnaliser leur profil | **BASSE** - Personnalisation | M | Procédure upload + S3 |
| P2-4 | **Historique Notifications** | Utilisateurs veulent revoir les alertes passées | **BASSE** - Traçabilité | M | Page historique |
| P2-5 | **Documentation API** | Développeurs futurs auront du mal à comprendre | **BASSE** - Maintenabilité | M | Swagger/OpenAPI |
| P2-6 | **Refactorisation 9 fichiers restants** | Fichiers > 250 lignes difficiles à maintenir | **BASSE** - Maintenabilité | L | Découpage composants |

**Total P2 : 6 items** (Effort total : 1L + 4M + 1S = ~10 jours)

---

## 🏗️ PLAN DE RELEASE - 3 SPRINTS

### 📅 SPRINT 1 : STABILISATION CRITIQUE (P0)
**Durée** : 15 jours  
**Objectif** : Éliminer les bloquants et sécuriser la plateforme

#### Semaine 1 (Jours 1-5)
- **P0-5** : Supprimer ComponentShowcase.tsx (1h)
- **P0-3** : Tests E2E synchronisation offline (3 jours)
  - Créer tests Playwright
  - Tester flux : vente offline → reconnexion → sync → vérification DB
  - Corriger bugs détectés
- **P0-4** : Backup/Restore base de données (2 jours)
  - Script backup quotidien automatique
  - Script restore avec tests
  - Documentation procédure

#### Semaine 2 (Jours 6-10)
- **P0-1** : Flux Paiement Mobile Money (5 jours)
  - Intégration API InTouch (prioritaire)
  - Intégration Orange Money
  - Intégration MTN Mobile Money
  - Tests end-to-end paiement
  - Gestion des erreurs et timeouts

#### Semaine 3 (Jours 11-15)
- **P0-2** : Renouvellement CNPS/CMU (5 jours)
  - Formulaire de demande de renouvellement
  - Notification aux agents DGE/ANSUT
  - Workflow d'approbation
  - Mise à jour automatique des dates
  - Tests end-to-end

**Livrables Sprint 1** :
- ✅ Plateforme sécurisée (backup automatique)
- ✅ Paiements fonctionnels (3 opérateurs)
- ✅ Renouvellements CNPS/CMU opérationnels
- ✅ Mode offline validé par tests E2E
- ✅ Code nettoyé (fichier démo supprimé)

---

### 📅 SPRINT 2 : VALEUR MÉTIER (P1)
**Durée** : 20 jours  
**Objectif** : Compléter les fonctionnalités essentielles

#### Semaine 1 (Jours 1-5)
- **P1-2** : Graphiques Tendances Admin (1 jour)
  - Graphique enrôlements (12 derniers mois)
  - Graphique transactions (12 derniers mois)
- **P1-5** : Cron Job Badges (1 jour)
  - Tâche quotidienne à minuit
  - Vérification conditions + déblocage
- **P1-1** : Dashboard Agent - Tâches du Jour (3 jours)
  - Procédure `agent.getTasks`
  - UI liste des tâches
  - Filtres et tri

#### Semaine 2 (Jours 6-10)
- **P1-3** : Export Excel Rapports (3 jours)
  - Export liste marchands
  - Export statistiques par marché
  - Export transactions
- **P1-7** : Logs d'Audit (2 jours)
  - Table audit_logs
  - Middleware logging
  - Page consultation logs

#### Semaine 3 (Jours 11-15)
- **P1-6** : Gestion Rôles Admin (3 jours)
  - Page `/admin/users`
  - CRUD utilisateurs
  - Modification des rôles
- **P1-9** : Refactorisation EnrollmentWizard (2 jours)
  - Découper en 5 composants (1 par étape)
  - Tests unitaires

#### Semaine 4 (Jours 16-20)
- **P1-10** : Refactorisation MerchantDashboard (2 jours)
  - Découper en composants (KPIs, Graphiques, Actions)
  - Tests unitaires
- **P1-4** : Notifications In-App (3 jours)
  - Système notifications
  - Badge rouge sur icône
  - Page historique notifications

**Livrables Sprint 2** :
- ✅ Agents ont leurs tâches quotidiennes
- ✅ Admins peuvent exporter des rapports Excel
- ✅ Graphiques d'évolution dans dashboard admin
- ✅ Badges se débloquent automatiquement
- ✅ Logs d'audit pour traçabilité
- ✅ Gestion des rôles admin
- ✅ Notifications in-app fonctionnelles
- ✅ 2 fichiers géants refactorisés

---

### 📅 SPRINT 3 : POLISH & QUALITÉ (P2)
**Durée** : 10 jours  
**Objectif** : Améliorer l'expérience et la maintenabilité

#### Semaine 1 (Jours 1-5)
- **P2-1** : Page Paramètres (1 jour)
  - Route `/settings`
  - UI paramètres utilisateur
- **P2-3** : Upload Photo Profil (2 jours)
  - Procédure upload S3
  - UI crop + preview
- **P2-2** : Aide Contextuelle (2 jours)
  - Contenu d'aide par page
  - Composant HelpDialog

#### Semaine 2 (Jours 6-10)
- **P2-4** : Historique Notifications (2 jours)
  - Page `/notifications/history`
  - Filtres et recherche
- **P2-6** : Refactorisation 9 fichiers restants (3 jours)
  - AgentDashboard, SocialCoverage, CashRegister, Profile, CashRegisterSimple, MapView, VirtualMarket, Stock, OrderHistory
  - Découpage en composants < 120 lignes

**Livrables Sprint 3** :
- ✅ Page paramètres complète
- ✅ Upload photo profil fonctionnel
- ✅ Aide contextuelle partout
- ✅ Historique notifications
- ✅ Tous les fichiers < 250 lignes
- ✅ Code maintenable et scalable

---

## 📊 RÉSUMÉ GLOBAL

### Effort Total
- **Sprint 1 (P0)** : 15 jours
- **Sprint 2 (P1)** : 20 jours
- **Sprint 3 (P2)** : 10 jours
- **Total** : 45 jours (~2 mois)

### Items par Priorité
- **P0** : 5 items (24%)
- **P1** : 10 items (48%)
- **P2** : 6 items (29%)
- **Total** : 21 items

### Risques Identifiés
| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Intégration Mobile Money complexe | **HAUTE** | **CRITIQUE** | Commencer par InTouch (le plus simple) |
| API CNPS/CMU indisponible | **MOYENNE** | **CRITIQUE** | Formulaire manuel en fallback |
| Tests E2E lents | **MOYENNE** | **MOYEN** | Paralléliser les tests |
| Refactorisation casse des fonctionnalités | **BASSE** | **MOYEN** | Tests de régression avant/après |

---

## 🎯 CRITÈRES DE SUCCÈS

### Sprint 1 (P0)
- ✅ Tous les tests E2E passent
- ✅ Backup automatique fonctionne
- ✅ Au moins 1 opérateur Mobile Money intégré
- ✅ Flux renouvellement CNPS/CMU complet

### Sprint 2 (P1)
- ✅ Dashboard agent opérationnel
- ✅ Export Excel fonctionne
- ✅ Graphiques affichés dans admin
- ✅ Notifications in-app fonctionnelles
- ✅ 2 fichiers géants refactorisés

### Sprint 3 (P2)
- ✅ Tous les fichiers < 250 lignes
- ✅ Page paramètres complète
- ✅ Upload photo fonctionne
- ✅ Aide contextuelle partout

---

**Prochaine Étape** : PHASE 3 - Sprint 1 (Implémentation P0)

**Question Finale** : **Quelle est la fonctionnalité la plus critique à rétablir en premier (P0) ?**
