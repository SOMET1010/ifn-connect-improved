# Tests E2E - PNAVIM

Cette suite de tests E2E couvre les parcours critiques de l'application PNAVIM.

## Structure des tests

### Parcours Marchand
- **merchant-daily-flow.spec.ts**: Flux quotidien complet (ouverture, vente, fermeture de journée)
- **merchant-advanced.spec.ts**: Fonctionnalités avancées (épargne, badges, stock, protection sociale)
- **micro-goals.spec.ts**: Système de micro-objectifs
- **savings-system.spec.ts**: Système d'épargne
- **offline-sync.spec.ts**: Synchronisation hors-ligne

### Parcours Agent
- **agent-enrollment.spec.ts**: Enrôlement de nouveaux marchands
- **agent-tasks.spec.ts**: Gestion des tâches du jour (P1-1)

### Parcours Admin
- **admin-dashboard.spec.ts**: Dashboard admin avec statistiques et graphiques (P1-2)

## Exécution des tests

### Tous les tests
```bash
npm run test:e2e
```

### Mode UI interactif
```bash
npm run test:e2e:ui
```

### Tests spécifiques
```bash
# Parcours marchand uniquement
npx playwright test e2e/merchant-*.spec.ts

# Parcours agent uniquement
npx playwright test e2e/agent-*.spec.ts

# Parcours admin uniquement
npx playwright test e2e/admin-*.spec.ts
```

### Voir le rapport
```bash
npm run test:e2e:report
```

## Configuration

Les tests utilisent la configuration définie dans `playwright.config.ts`:
- URL de base: `http://localhost:3000`
- Mode E2E activé avec: `E2E_TEST_MODE=true`
- Navigateur: Chromium (Desktop Chrome)
- Screenshots: Uniquement en cas d'échec
- Traces: À la première retry

## Prérequis

Les tests supposent que:
1. Le serveur de développement est démarré (automatique avec webServer)
2. La base de données contient des données de test
3. L'authentification est configurée (Manus OAuth)

## Tests critiques P1

### P1-1: Dashboard Agent - Tâches du Jour
- ✅ `agent-tasks.spec.ts`: Tests du nouveau dashboard des tâches

### P1-2: Graphiques Tendances Admin
- ✅ `admin-dashboard.spec.ts`: Tests des graphiques d'enrôlement et transactions

## Notes

- Les tests sont conçus pour être résilients aux variations de données
- Utilisation de `catch(() => false)` pour gérer les éléments optionnels
- Les tests vérifient d'abord la visibilité des éléments avant d'interagir
- Timeout par défaut: 10s pour les éléments principaux, 5s pour les secondaires
