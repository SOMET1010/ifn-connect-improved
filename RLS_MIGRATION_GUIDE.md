# Guide de Migration RLS (Row Level Security)

## Vue d'ensemble

Ce guide explique comment migrer les procédures tRPC existantes pour utiliser le système de sécurité au niveau application (RLS).

---

## Principes de Sécurité

### 1. Isolation des Données par Marchand

Chaque marchand ne doit accéder qu'à ses propres données :
- Ventes
- Stock
- Commandes
- Épargne
- Score SUTA
- Badges
- Historique

### 2. Séparation des Rôles

- **Marchand** : Accès à ses propres données uniquement
- **Agent** : Accès aux marchands qu'il a enrôlés + fonctions d'enrôlement
- **Coopérative** : Accès aux données agrégées des membres
- **Admin** : Accès complet à toutes les données

### 3. Validation Systématique

Toutes les procédures doivent valider que l'utilisateur a le droit d'accéder aux ressources demandées.

---

## Migration des Procédures

### Avant (Non Sécurisé)

```typescript
import { protectedProcedure, router } from '../_core/trpc';

export const salesRouter = router({
  // ❌ PROBLÈME : Pas de vérification du merchantId
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const sale = await getSaleById(input.id);
      return sale; // N'importe qui peut accéder à n'importe quelle vente !
    }),
});
```

### Après (Sécurisé avec RLS)

```typescript
import { merchantProcedure, validateMerchantOwnership } from '../_core/rls-middleware';
import { router } from '../_core/trpc';

export const salesRouter = router({
  // ✅ SÉCURISÉ : Validation du merchantId
  getById: merchantProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const sale = await getSaleById(input.id);
      
      if (!sale) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Vente introuvable' });
      }
      
      // Valider que la vente appartient au marchand
      validateMerchantOwnership(sale.merchantId, ctx.merchantId, 'vente');
      
      return sale;
    }),
});
```

---

## Utilisation des Middlewares

### 1. merchantProcedure

Pour toutes les procédures qui manipulent des données marchands :

```typescript
import { merchantProcedure } from '../_core/rls-middleware';

export const myRouter = router({
  myProcedure: merchantProcedure
    .input(z.object({ ... }))
    .query(async ({ input, ctx }) => {
      // ctx.merchantId est automatiquement injecté
      // ctx.merchant contient l'objet marchand complet
      
      const data = await getMyData(ctx.merchantId);
      return data;
    }),
});
```

### 2. agentProcedure

Pour les procédures réservées aux agents terrain :

```typescript
import { agentProcedure } from '../_core/rls-middleware';

export const agentRouter = router({
  enrollMerchant: agentProcedure
    .input(z.object({ ... }))
    .mutation(async ({ input, ctx }) => {
      // Seuls les agents peuvent accéder ici
      const merchant = await createMerchant(input);
      return merchant;
    }),
});
```

### 3. adminProcedure

Pour les procédures réservées aux administrateurs :

```typescript
import { adminProcedure } from '../_core/rls-middleware';

export const adminRouter = router({
  getAllMerchants: adminProcedure
    .query(async () => {
      // Seuls les admins peuvent accéder ici
      const merchants = await getAllMerchants();
      return merchants;
    }),
});
```

### 4. cooperativeProcedure

Pour les procédures réservées aux coopératives :

```typescript
import { cooperativeProcedure } from '../_core/rls-middleware';

export const cooperativeRouter = router({
  getMembers: cooperativeProcedure
    .query(async ({ ctx }) => {
      // Seules les coopératives peuvent accéder ici
      const members = await getCooperativeMembers(ctx.user.id);
      return members;
    }),
});
```

---

## Helpers de Validation

### validateMerchantOwnership

Valide qu'une ressource appartient au marchand connecté :

```typescript
import { validateMerchantOwnership } from '../_core/rls-middleware';

// Dans une procédure
const sale = await getSaleById(input.id);
validateMerchantOwnership(sale.merchantId, ctx.merchantId, 'vente');
```

### filterByMerchant

Filtre un tableau de résultats par merchantId :

```typescript
import { filterByMerchant } from '../_core/rls-middleware';

const allSales = await getAllSales();
const mySales = filterByMerchant(allSales, ctx.merchantId);
```

---

## Checklist de Migration

Pour chaque router existant :

- [ ] Identifier les procédures qui manipulent des données marchands
- [ ] Remplacer `protectedProcedure` par `merchantProcedure`
- [ ] Ajouter `validateMerchantOwnership` pour les accès par ID
- [ ] Utiliser `ctx.merchantId` au lieu de `input.merchantId`
- [ ] Supprimer `merchantId` des inputs (il vient du contexte)
- [ ] Tester que les marchands ne peuvent pas accéder aux données des autres
- [ ] Vérifier que les agents/admins ont les bons accès

---

## Routers à Migrer (Priorité)

### Haute Priorité (Données Sensibles)

1. **salesRouter** - Ventes et transactions financières
2. **savingsRouter** - Épargne et cagnottes
3. **ordersRouter** - Commandes et paiements
4. **scoresRouter** - Score SUTA et éligibilité crédit
5. **stockRouter** - Inventaire et stock

### Moyenne Priorité

6. **badgesRouter** - Badges et achievements
7. **certificatesRouter** - Certificats e-learning
8. **challengesRouter** - Défis entre marchands
9. **coursesRouter** - Cours e-learning
10. **achievementsRouter** - Accomplissements

### Basse Priorité (Déjà Sécurisés ou Publics)

11. **marketsRouter** - Marchés (données publiques)
12. **productsRouter** - Produits (catalogue partagé)
13. **weatherRouter** - Météo (données publiques)
14. **eventsRouter** - Événements (données publiques)

---

## Exemple Complet : Migration du salesRouter

### Avant

```typescript
export const salesRouter = router({
  create: protectedProcedure
    .input(z.object({
      merchantId: z.number(),
      productId: z.number(),
      quantity: z.number(),
      totalAmount: z.number(),
    }))
    .mutation(async ({ input }) => {
      const sale = await createSale(input);
      return sale;
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const sale = await getSaleById(input.id);
      return sale;
    }),

  list: protectedProcedure
    .input(z.object({ merchantId: z.number() }))
    .query(async ({ input }) => {
      const sales = await getSalesByMerchant(input.merchantId);
      return sales;
    }),
});
```

### Après (Sécurisé)

```typescript
import { merchantProcedure, validateMerchantOwnership } from '../_core/rls-middleware';

export const salesRouter = router({
  create: merchantProcedure
    .input(z.object({
      // merchantId retiré de l'input (vient du contexte)
      productId: z.number(),
      quantity: z.number(),
      totalAmount: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      // ctx.merchantId est automatiquement injecté
      const sale = await createSale({
        ...input,
        merchantId: ctx.merchantId,
      });
      return sale;
    }),

  getById: merchantProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const sale = await getSaleById(input.id);
      
      if (!sale) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Vente introuvable' });
      }
      
      // Validation RLS
      validateMerchantOwnership(sale.merchantId, ctx.merchantId, 'vente');
      
      return sale;
    }),

  list: merchantProcedure
    .input(z.object({})) // Plus besoin de merchantId dans l'input
    .query(async ({ ctx }) => {
      // Utiliser ctx.merchantId au lieu de input.merchantId
      const sales = await getSalesByMerchant(ctx.merchantId);
      return sales;
    }),
});
```

---

## Tests de Sécurité

Après migration, tester :

1. **Isolation des données** : Un marchand ne peut pas accéder aux données d'un autre
2. **Validation des rôles** : Les agents/admins ont les bons accès
3. **Gestion des erreurs** : Les erreurs FORBIDDEN sont bien levées
4. **Performance** : Pas de régression de performance

### Exemple de Test

```typescript
// Test d'isolation des données
describe('salesRouter RLS', () => {
  it('should prevent access to other merchant sales', async () => {
    const merchant1 = await createTestMerchant();
    const merchant2 = await createTestMerchant();
    
    const sale = await createTestSale({ merchantId: merchant1.id });
    
    // Tenter d'accéder à la vente depuis merchant2
    await expect(
      caller(merchant2).sales.getById({ id: sale.id })
    ).rejects.toThrow('Vous n\'avez pas accès à cette ressource');
  });
});
```

---

## Bonnes Pratiques

1. **Toujours utiliser ctx.merchantId** au lieu de input.merchantId
2. **Valider systématiquement** l'ownership des ressources
3. **Lever des erreurs explicites** (FORBIDDEN, NOT_FOUND)
4. **Documenter les permissions** dans les commentaires
5. **Tester les cas limites** (accès croisés, rôles invalides)

---

## Prochaines Étapes

1. Migrer les routers haute priorité (sales, savings, orders, scores, stock)
2. Tester l'isolation des données en conditions réelles
3. Migrer les routers moyenne priorité
4. Documenter les permissions dans chaque router
5. Créer des tests de sécurité automatisés

---

**Date de création :** 26 décembre 2024  
**Statut :** En cours de déploiement
