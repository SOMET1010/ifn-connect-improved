# Tests E2E InTouch - Guide Complet

## 📋 Vue d'ensemble

Ce document décrit les tests end-to-end (E2E) pour valider l'intégration complète des paiements Mobile Money via l'API InTouch pour les cotisations CNPS et les renouvellements CMU.

## 🎯 Objectifs des tests

1. Valider le flow complet de paiement CNPS/CMU
2. Tester les scénarios de succès et d'échec
3. Vérifier la mise à jour automatique des dates d'expiration
4. Valider les webhooks InTouch
5. Tester les simulateurs de pension et remboursement

## 🔧 Configuration

### Prérequis

```bash
# Installer Playwright si pas déjà fait
pnpm add -D @playwright/test

# Installer les navigateurs
pnpm exec playwright install
```

### Variables d'environnement

Les credentials InTouch sont déjà configurés dans les secrets :
- `INTOUCH_PARTNER_ID`: CI300373
- `INTOUCH_LOGIN_API`: 07084598370
- `INTOUCH_USERNAME`: Configuré
- `INTOUCH_PASSWORD`: Configuré
- `INTOUCH_PASSWORD_API`: SK7VHnkZvc
- `INTOUCH_BASE_URL`: https://apidist.gutouch.net
- `INTOUCH_SERVICE_CODE`: PAIEMENTMARCHANDOMPAYCIDIRECT

## 📱 Numéros de test InTouch

L'API InTouch utilise les **2 derniers chiffres** du numéro de téléphone pour simuler différents scénarios :

| Terminaison | Résultat | Exemple |
|-------------|----------|---------|
| **00** | ✅ Succès | 07084598300 |
| **99** | ❌ Échec | 07084598399 |
| Autres | 🔄 Aléatoire | 07084598312 |

## 🧪 Tests CNPS (e2e/intouch-cnps.spec.ts)

### P2-1: Paiement CNPS réussi
- **Scénario**: Paiement de 5000 FCFA avec Orange Money
- **Numéro**: 07084598300 (succès)
- **Résultat attendu**:
  - Message "Paiement réussi" affiché
  - Statut "Complété"
  - Date d'expiration CNPS mise à jour (+12 mois)
  - Statut CNPS passé à "Actif"

### P2-2: Paiement CNPS échoué
- **Scénario**: Paiement avec numéro invalide
- **Numéro**: 07084598399 (échec)
- **Résultat attendu**:
  - Message "Paiement échoué" affiché
  - Statut "Échoué"
  - Date d'expiration NON mise à jour
  - Statut CNPS inchangé

### P2-3: Historique des paiements CNPS
- **Scénario**: Consultation de l'historique
- **Résultat attendu**:
  - Tableau avec colonnes Date, Montant, Statut, Méthode
  - Au moins un paiement affiché

### P2-4: Simulateur de pension CNPS
- **Scénario**: Calcul de pension estimée
- **Données**: 10 000 FCFA/mois pendant 20 ans
- **Résultat attendu**:
  - Montant estimé affiché
  - Valeur > 0

### P2-5: Alerte expiration CNPS
- **Scénario**: Détection expiration < 30 jours
- **Résultat attendu**:
  - Alerte visible si expiration proche
  - Bouton "Renouveler" présent

## 🏥 Tests CMU (e2e/intouch-cmu.spec.ts)

### P2-6: Renouvellement CMU réussi
- **Scénario**: Renouvellement de 1000 FCFA avec MTN MoMo
- **Numéro**: 07084598300 (succès)
- **Résultat attendu**:
  - Message "Renouvellement réussi" affiché
  - Statut "Complété"
  - Date d'expiration CMU mise à jour (+12 mois)
  - Statut CMU passé à "Actif"

### P2-7: Renouvellement CMU échoué
- **Scénario**: Renouvellement avec numéro invalide
- **Numéro**: 07084598399 (échec)
- **Résultat attendu**:
  - Message "Renouvellement échoué" affiché
  - Statut "Échoué"
  - Date d'expiration NON mise à jour
  - Statut CMU inchangé

### P2-8: Historique des remboursements CMU
- **Scénario**: Consultation de l'historique
- **Résultat attendu**:
  - Tableau avec colonnes Date, Type de soin, Montant, Remboursé, Statut
  - Remboursements affichés si disponibles

### P2-9: Simulateur de remboursement CMU
- **Scénario**: Calcul de remboursement estimé
- **Données**: Consultation à 5000 FCFA
- **Résultat attendu**:
  - Montant remboursé affiché
  - Pourcentage de remboursement affiché
  - Valeur > 0

### P2-10: Alerte expiration CMU
- **Scénario**: Détection expiration < 30 jours
- **Résultat attendu**:
  - Alerte visible si expiration proche
  - Bouton "Renouveler" présent

### P2-11: Statistiques CMU sur 12 mois
- **Scénario**: Visualisation des statistiques
- **Résultat attendu**:
  - Graphique des 12 derniers mois affiché
  - Total remboursé affiché
  - Nombre de remboursements affiché

## 🚀 Exécution des tests

### Tous les tests

```bash
pnpm test:e2e
```

### Tests CNPS uniquement

```bash
pnpm exec playwright test e2e/intouch-cnps.spec.ts
```

### Tests CMU uniquement

```bash
pnpm exec playwright test e2e/intouch-cmu.spec.ts
```

### Mode UI (interface graphique)

```bash
pnpm test:e2e:ui
```

### Mode debug

```bash
pnpm exec playwright test --debug
```

## 📊 Rapport de tests

Après l'exécution, un rapport HTML est généré automatiquement :

```bash
pnpm test:e2e:report
```

Le rapport contient :
- Résumé des tests (passés/échoués)
- Captures d'écran des échecs
- Traces d'exécution
- Temps d'exécution

## 🔍 Debugging

### Voir les traces d'un test échoué

```bash
pnpm exec playwright show-trace trace.zip
```

### Capturer des screenshots

Les screenshots sont automatiquement capturés en cas d'échec et sauvegardés dans `test-results/`.

### Logs détaillés

```bash
DEBUG=pw:api pnpm exec playwright test
```

## ✅ Critères de succès

Un test est considéré comme réussi si :

1. **Paiements réussis** :
   - Transaction enregistrée avec statut "completed"
   - Date d'expiration mise à jour (+12 mois)
   - Statut protection sociale passé à "active"

2. **Paiements échoués** :
   - Transaction enregistrée avec statut "failed"
   - Date d'expiration NON mise à jour
   - Statut protection sociale inchangé

3. **Historiques** :
   - Données affichées correctement
   - Filtres fonctionnels
   - Pagination opérationnelle

4. **Simulateurs** :
   - Calculs corrects
   - Résultats affichés
   - Valeurs cohérentes

5. **Alertes** :
   - Détection automatique des expirations
   - Affichage conditionnel
   - Boutons d'action présents

## 🐛 Problèmes connus

### Rate limit Resend API
- **Impact**: 1 test email peut échouer sur 45
- **Solution**: Attendre 1 seconde entre les tests email
- **Statut**: Non-bloquant

### Cache TypeScript
- **Impact**: Erreur `merchantDailySessions` dans les logs
- **Solution**: Redémarrer le serveur TypeScript
- **Statut**: Non-bloquant (aucun impact runtime)

## 📝 Maintenance

### Ajouter un nouveau test

1. Créer un nouveau fichier dans `e2e/`
2. Suivre la structure des tests existants
3. Utiliser les numéros de test InTouch (00 = succès, 99 = échec)
4. Documenter le test dans ce fichier

### Mettre à jour les tests

Si l'API InTouch change :
1. Mettre à jour les numéros de test dans ce document
2. Adapter les tests dans `e2e/intouch-*.spec.ts`
3. Valider avec `pnpm test:e2e`

## 🔗 Ressources

- [Documentation InTouch](https://apidist.gutouch.net/docs)
- [Documentation Playwright](https://playwright.dev)
- [Guide de déploiement PNAVIM-CI](./GUIDE_DEPLOIEMENT_PRODUCTION.md)
- [Rapport de validation Phase 6](./RAPPORT_VALIDATION_FINALE_PHASE6.md)

## 📞 Support

En cas de problème avec les tests :
1. Vérifier que les credentials InTouch sont corrects
2. Consulter les logs du serveur
3. Vérifier la connexion réseau
4. Contacter le support InTouch si nécessaire

---

**Dernière mise à jour** : 27 décembre 2024  
**Version** : 1.0.0  
**Statut** : ✅ Prêt pour production
