# Checklist Pré-Production - PNAVIM-CI
## 50 Points de Validation pour le Déploiement Pilote

**Date :** 27 décembre 2024  
**Responsable :** ANSUT (Agence Nationale du Service Universel des Télécommunications)  
**Autorité de tutelle :** Direction Générale de l'Économie (DGE)  
**Version :** 1.0

---

## Instructions d'Utilisation

Cette checklist doit être complétée et signée par les responsables techniques et fonctionnels avant le lancement du pilote auprès de 100-200 marchands. Chaque point doit être validé par au moins deux personnes (principe des quatre yeux).

**Légende :**  
✅ Validé | ⏳ En cours | ❌ Non conforme | N/A Non applicable

---

## 1. Sécurité et Conformité (15 points)

| # | Point de Contrôle | Statut | Validé par | Date | Commentaires |
|---|-------------------|--------|------------|------|--------------|
| 1.1 | Row Level Security (RLS) activé au niveau base de données | ⏳ | | | Script SQL à exécuter |
| 1.2 | 13 vues sécurisées créées (merchant_*, agent_*, cooperative_*) | ⏳ | | | Vérifier avec `SHOW FULL TABLES` |
| 1.3 | 4 triggers de protection IDOR actifs | ⏳ | | | Vérifier avec `SHOW TRIGGERS` |
| 1.4 | Rate-limit global activé (100 req/15min/IP) | ✅ | | | Intégré dans server/_core/index.ts |
| 1.5 | Rate-limit authentification (10 req/15min/IP) | ✅ | | | Testé avec script de charge |
| 1.6 | Rate-limit OTP (5 req/15min/IP) | ✅ | | | Testé avec script de charge |
| 1.7 | Rate-limit paiements (20 req/15min/IP) | ✅ | | | Testé avec script de charge |
| 1.8 | Middleware de validation des uploads actif | ✅ | | | file-upload-security.ts |
| 1.9 | Scan antivirus des fichiers uploadés | ⏳ | | | Phase 1 OK, ClamAV à installer |
| 1.10 | Sanitization automatique des logs activée | ✅ | | | log-sanitizer.ts intégré |
| 1.11 | Politique de données rédigée et validée juridiquement | ✅ | | | docs/POLITIQUE-DONNEES.md |
| 1.12 | Checkbox de consentement intégré dans l'enrôlement | ⏳ | | | À implémenter dans UI |
| 1.13 | Environnement STAGING créé et fonctionnel | ⏳ | | | Projet Manus à créer |
| 1.14 | Variables ENV séparées DEV/STAGING/PROD | ⏳ | | | Après création STAGING |
| 1.15 | Backups automatiques quotidiens configurés | ✅ | | | Script backup-db.sh + cron |

---

## 2. Authentification et Contrôle d'Accès (8 points)

| # | Point de Contrôle | Statut | Validé par | Date | Commentaires |
|---|-------------------|--------|------------|------|--------------|
| 2.1 | OAuth Manus fonctionnel pour admin/agents/coopératives | ✅ | | | Testé en production |
| 2.2 | Authentification téléphone + PIN pour marchands | ✅ | | | Testé avec 1278 marchands |
| 2.3 | Sessions JWT avec expiration 7 jours | ✅ | | | Renouvellement automatique |
| 2.4 | Blocage après 3 tentatives OTP échouées (15 min) | ✅ | | | Testé dans auth.logout.test.ts |
| 2.5 | Blocage après 5 tentatives PIN échouées (30 min) | ✅ | | | Testé dans auth.logout.test.ts |
| 2.6 | Logs d'audit pour toutes les authentifications | ✅ | | | Table auth_audit_logs |
| 2.7 | Middleware `merchantProcedure` actif | ✅ | | | 44+ procédures sécurisées |
| 2.8 | Middleware `adminProcedure` actif | ✅ | | | Vérifie role === 'admin' |

---

## 3. Protection des Données (10 points)

| # | Point de Contrôle | Statut | Validé par | Date | Commentaires |
|---|-------------------|--------|------------|------|--------------|
| 3.1 | Chiffrement HTTPS (TLS 1.3) activé | ✅ | | | Manus Platform |
| 3.2 | Données sensibles masquées dans les logs | ✅ | | | log-sanitizer.ts |
| 3.3 | Mots de passe jamais stockés en clair | ✅ | | | Bcrypt avec salt |
| 3.4 | Tokens JWT signés avec JWT_SECRET | ✅ | | | Variable ENV sécurisée |
| 3.5 | Numéros de téléphone stockés avec indicatif +225 | ✅ | | | Format normalisé |
| 3.6 | Photos CNI stockées sur S3 (pas en DB) | ✅ | | | storagePut() |
| 3.7 | URLs S3 non-énumérables (suffixes aléatoires) | ✅ | | | generateSecureS3Key() |
| 3.8 | Durée de conservation documentée | ✅ | | | POLITIQUE-DONNEES.md |
| 3.9 | Procédure de suppression de compte implémentée | ⏳ | | | À implémenter dans UI |
| 3.10 | Export des données utilisateur implémenté | ⏳ | | | À implémenter dans UI |

---

## 4. Paiements Mobile Money (7 points)

| # | Point de Contrôle | Statut | Validé par | Date | Commentaires |
|---|-------------------|--------|------------|------|--------------|
| 4.1 | Intégration InTouch API fonctionnelle | ✅ | | | Orange, MTN, Moov, Wave |
| 4.2 | Webhooks InTouch configurés et testés | ✅ | | | /api/webhooks/intouch |
| 4.3 | Gestion des timeouts (30s max) | ✅ | | | Retry automatique |
| 4.4 | Logs de toutes les transactions | ✅ | | | Table transactions |
| 4.5 | Réconciliation automatique des paiements | ✅ | | | Webhook → update status |
| 4.6 | Gestion des erreurs InTouch (codes 400-500) | ✅ | | | Testé dans payments.test.ts |
| 4.7 | Rate-limit paiements (20 req/15min/IP) | ✅ | | | Protection anti-fraude |

---

## 5. Base de Données (6 points)

| # | Point de Contrôle | Statut | Validé par | Date | Commentaires |
|---|-------------------|--------|------------|------|--------------|
| 5.1 | Schéma de base de données à jour (28 tables) | ✅ | | | drizzle/schema.ts |
| 5.2 | Index de performance créés (91 index) | ✅ | | | Optimisé pour requêtes |
| 5.3 | Migrations Drizzle appliquées | ✅ | | | 24 migrations |
| 5.4 | Backups quotidiens automatiques | ✅ | | | backup-db.sh + cron 2h00 |
| 5.5 | Script de restauration testé | ✅ | | | restore-db.sh |
| 5.6 | Connexion SSL activée | ⏳ | | | Vérifier dans DATABASE_URL |

---

## 6. Tests et Qualité (10 points)

| # | Point de Contrôle | Statut | Validé par | Date | Commentaires |
|---|-------------------|--------|------------|------|--------------|
| 6.1 | Tests unitaires (Vitest) : taux de passage > 90% | ✅ | | | 99/106 tests (93%) |
| 6.2 | Tests d'intégration (workflows complets) | ✅ | | | auth, ventes, paiements |
| 6.3 | Tests E2E (Playwright) : 3 scénarios | ✅ | | | journée marchand, épargne |
| 6.4 | Tests de charge (1000+ ventes) | ✅ | | | load-tests.test.ts |
| 6.5 | Tests de performance (< 500ms API) | ✅ | | | performance.test.ts |
| 6.6 | Tests de sécurité (IDOR, injection SQL) | ⏳ | | | À ajouter |
| 6.7 | Tests d'accessibilité (WCAG 2.1 AA) | ⏳ | | | À ajouter |
| 6.8 | Tests de compatibilité navigateurs | ✅ | | | Chrome, Firefox, Safari |
| 6.9 | Tests de compatibilité mobile | ✅ | | | iOS, Android |
| 6.10 | Tests de mode offline | ✅ | | | Service Worker + IndexedDB |

---

## 7. Monitoring et Alertes (5 points)

| # | Point de Contrôle | Statut | Validé par | Date | Commentaires |
|---|-------------------|--------|------------|------|--------------|
| 7.1 | Sentry configuré (erreurs + performance) | ✅ | | | Session replay activé |
| 7.2 | Alertes email en cas d'erreur critique | ⏳ | | | À configurer dans Sentry |
| 7.3 | Monitoring uptime (Manus Platform) | ✅ | | | Intégré |
| 7.4 | Logs d'audit accessibles et recherchables | ✅ | | | Table audit_logs |
| 7.5 | Dashboard de monitoring temps réel | ⏳ | | | À créer dans admin |

---

## 8. Documentation et Formation (5 points)

| # | Point de Contrôle | Statut | Validé par | Date | Commentaires |
|---|-------------------|--------|------------|------|--------------|
| 8.1 | Documentation technique à jour (README.md) | ✅ | | | Template README |
| 8.2 | Politique de données publiée sur site ANSUT | ⏳ | | | docs/POLITIQUE-DONNEES.md |
| 8.3 | Guide utilisateur marchands (PDF/vidéo) | ⏳ | | | À créer |
| 8.4 | Guide utilisateur agents terrain (PDF/vidéo) | ⏳ | | | À créer |
| 8.5 | Formation agents terrain complétée | ⏳ | | | Module e-learning + quiz |

---

## 9. Infrastructure et Déploiement (4 points)

| # | Point de Contrôle | Statut | Validé par | Date | Commentaires |
|---|-------------------|--------|------------|------|--------------|
| 9.1 | Hébergement Manus Platform configuré | ✅ | | | Auto-scaling activé |
| 9.2 | Domaine personnalisé configuré (optionnel) | ⏳ | | | pnavim-ci.ansut.ci |
| 9.3 | CDN activé pour assets statiques | ✅ | | | Manus Platform |
| 9.4 | Procédure de rollback documentée | ✅ | | | Checkpoints Manus |

---

## Synthèse et Validation Finale

### Statistiques de Complétion

| Catégorie | Points Validés | Points Totaux | Taux |
|-----------|----------------|---------------|------|
| Sécurité et Conformité | 7 | 15 | 47% |
| Authentification et Contrôle d'Accès | 8 | 8 | 100% |
| Protection des Données | 8 | 10 | 80% |
| Paiements Mobile Money | 7 | 7 | 100% |
| Base de Données | 5 | 6 | 83% |
| Tests et Qualité | 8 | 10 | 80% |
| Monitoring et Alertes | 3 | 5 | 60% |
| Documentation et Formation | 2 | 5 | 40% |
| Infrastructure et Déploiement | 3 | 4 | 75% |
| **TOTAL** | **51** | **70** | **73%** |

---

### Points Bloquants Restants

Les points suivants **DOIVENT** être complétés avant le lancement du pilote :

1. **[1.1]** Exécuter le script RLS sur la base de données (15 minutes)
2. **[1.13]** Créer l'environnement STAGING (7 jours)
3. **[3.9]** Implémenter la suppression de compte dans l'UI (2 jours)
4. **[5.6]** Vérifier que la connexion SSL est activée (5 minutes)

**Délai estimé :** 10 jours ouvrés

---

### Points Recommandés (Non-Bloquants)

Les points suivants sont **fortement recommandés** mais non-bloquants pour le pilote :

1. **[1.9]** Installer ClamAV pour scan antivirus réel (30 jours)
2. **[1.12]** Intégrer checkbox de consentement dans l'enrôlement (1 jour)
3. **[3.10]** Implémenter l'export des données utilisateur (2 jours)
4. **[6.6]** Ajouter tests de sécurité (IDOR, injection SQL) (3 jours)
5. **[7.2]** Configurer alertes email Sentry (1 heure)
6. **[8.2-8.5]** Créer documentation et formation utilisateurs (15 jours)

**Délai estimé :** 60 jours

---

### Signatures et Approbations

| Rôle | Nom | Signature | Date |
|------|-----|-----------|------|
| **Responsable Technique** | | | |
| **Responsable Sécurité** | | | |
| **Responsable Qualité** | | | |
| **Directeur ANSUT** | | | |
| **Représentant DGE** | | | |

---

### Décision Finale

☐ **GO PILOTE** - Tous les points bloquants sont validés  
☐ **GO CONDITIONNEL** - Pilote autorisé sous réserve de complétion des points bloquants dans les 10 jours  
☐ **NO-GO** - Points bloquants critiques non résolus, pilote reporté

**Date de décision :** _______________  
**Signature Directeur ANSUT :** _______________  
**Signature Représentant DGE :** _______________

---

## Annexes

### A. Procédure de Validation des Points Bloquants

Pour chaque point bloquant, suivre cette procédure :

1. **Exécution** : Réaliser l'action requise (script SQL, configuration, etc.)
2. **Test** : Vérifier que l'action fonctionne correctement (test unitaire, test manuel)
3. **Documentation** : Documenter la procédure dans un fichier CHANGELOG.md
4. **Validation** : Faire valider par deux personnes (principe des quatre yeux)
5. **Signature** : Signer la checklist avec date et nom

### B. Contacts Urgents

| Rôle | Nom | Email | Téléphone |
|------|-----|-------|-----------|
| Responsable Technique | | | |
| Responsable Sécurité | | | |
| Support Manus | support@manus.im | https://help.manus.im | |
| Support InTouch | | support@intouchgroup.net | |
| ARTCI (Autorité de Régulation) | | contact@artci.ci | |

### C. Références

- **Politique de Données** : `docs/POLITIQUE-DONNEES.md`
- **Plan d'Action Sécurité** : `docs/PLAN-ACTION-SECURITE.md`
- **Scripts RLS** : `server/security/rls-policies.sql`
- **Tests de Validation** : `server/security/test-rls.sql`
- **Backup/Restore** : `scripts/backup-db.sh`, `scripts/restore-db.sh`

---

**Document officiel - ANSUT / DGE**  
**Version :** 1.0  
**Date :** 27 décembre 2024  
**Contact :** dpo@ansut.ci
