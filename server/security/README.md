# Row Level Security (RLS) Configuration

## Vue d'ensemble

Ce module implémente une **isolation des données au niveau base de données** pour empêcher les accès non autorisés, même en cas de faille applicative.

**Principe :** Chaque marchand ne peut accéder qu'à ses propres données (ventes, produits, documents, etc.).

---

## Architecture

### 1. **Vues sécurisées** (`rls-policies.sql`)

Remplacent les tables directes par des vues filtrées automatiquement :

```sql
-- Au lieu de :
SELECT * FROM sales WHERE merchantId = ?

-- Utiliser :
SELECT * FROM merchant_sales_view
-- (filtrage automatique basé sur CURRENT_USER_ID())
```

### 2. **Triggers de protection**

Empêchent les INSERT/UPDATE/DELETE non autorisés :

```sql
-- Si un marchand A tente d'insérer une vente pour le marchand B :
INSERT INTO sales (merchantId, ...) VALUES (merchant_B_id, ...);
-- Résultat : ERREUR "Accès refusé"
```

### 3. **Contexte de session**

Chaque requête authentifiée initialise le contexte :

```typescript
// Au début de chaque procedure protégée
await initSecurityContext(ctx.user.id);

// Ensuite, toutes les requêtes sont filtrées automatiquement
const sales = await db.select().from('merchant_sales_view');
```

---

## Installation

### Étape 1 : Exécuter le script SQL

```bash
# Depuis le terminal
mysql -u root -p < server/security/rls-policies.sql
```

Ou via l'interface Manus Database :

1. Ouvrir le panneau **Database** dans Management UI
2. Copier le contenu de `rls-policies.sql`
3. Exécuter dans l'éditeur SQL

### Étape 2 : Vérifier l'installation

```sql
-- Vérifier que les vues existent
SHOW FULL TABLES WHERE Table_type = 'VIEW';

-- Vérifier que les fonctions existent
SHOW FUNCTION STATUS WHERE Db = 'your_database_name';

-- Vérifier que les triggers existent
SHOW TRIGGERS;
```

---

## Utilisation dans le code

### Option 1 : Middleware tRPC (recommandé)

```typescript
import { initRLSMiddleware } from './security/rls-context';

export const protectedProcedure = publicProcedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  // Initialiser le contexte RLS
  await initRLSMiddleware(ctx.user.id);

  return next({ ctx: { ...ctx, user: ctx.user } });
});
```

### Option 2 : Wrapper withRLS

```typescript
import { withRLS } from './security/rls-context';

const sales = await withRLS(userId, async () => {
  return await db.select().from('merchant_sales_view');
});
```

### Option 3 : Manuel

```typescript
import { initSecurityContext } from './security/rls-context';

// Au début de la fonction
await initSecurityContext(userId);

// Ensuite, utiliser les vues sécurisées
const sales = await db.select().from('merchant_sales_view');
```

---

## Vues sécurisées disponibles

| Table originale | Vue sécurisée | Filtrage |
|----------------|---------------|----------|
| `sales` | `merchant_sales_view` | Par `merchantId` |
| `products` | `merchant_products_view` | Par `merchantId` |
| `enrollmentDocuments` | `merchant_documents_view` | Par `merchantId` |
| `cnps_contributions` | `merchant_cnps_view` | Par `merchantId` |
| `cmu_reimbursements` | `merchant_cmu_view` | Par `merchantId` |

---

## Tests de sécurité

### Test 1 : Isolation des données

```typescript
// Marchand A se connecte
await initSecurityContext(userA_id);
const salesA = await db.select().from('merchant_sales_view');
// Résultat : Uniquement les ventes du marchand A

// Marchand B se connecte
await initSecurityContext(userB_id);
const salesB = await db.select().from('merchant_sales_view');
// Résultat : Uniquement les ventes du marchand B
```

### Test 2 : Protection contre les INSERT non autorisés

```typescript
// Marchand A tente de créer une vente pour le marchand B
await initSecurityContext(userA_id);

try {
  await db.insert(sales).values({
    merchantId: merchantB_id, // ID d'un autre marchand
    amount: 1000,
    // ...
  });
} catch (error) {
  // Résultat attendu : Erreur "Accès refusé"
  console.log(error.message); // "Accès refusé : Vous ne pouvez pas créer de vente pour un autre marchand"
}
```

### Test 3 : Droits admin

```typescript
// Admin se connecte
await initSecurityContext(admin_user_id);

// Admin peut voir toutes les données (bypass RLS)
const allSales = await db.select().from('sales'); // Table directe
// Résultat : Toutes les ventes de tous les marchands
```

---

## Limitations

### MySQL/TiDB vs PostgreSQL

MySQL/TiDB ne supporte pas nativement RLS comme PostgreSQL. Cette implémentation utilise :

- **Vues** pour filtrer les SELECT
- **Triggers** pour bloquer les INSERT/UPDATE/DELETE non autorisés
- **Variables de session** pour stocker le contexte utilisateur

**Différences :**

| PostgreSQL RLS | MySQL/TiDB (cette implémentation) |
|----------------|-----------------------------------|
| Natif au niveau kernel | Simulé via vues + triggers |
| Performances optimales | Légère surcharge (triggers) |
| Transparent pour l'application | Nécessite d'utiliser les vues |

### Performance

- **Impact minimal** : Les vues sont optimisées par le query planner
- **Triggers** : Exécutés uniquement sur INSERT/UPDATE/DELETE
- **Recommandation** : Utiliser des index sur `merchantId` et `userId`

---

## Dépannage

### Erreur "CURRENT_USER_ID() returns NULL"

**Cause :** Le contexte de sécurité n'a pas été initialisé.

**Solution :**

```typescript
// Toujours appeler avant d'utiliser les vues
await initSecurityContext(userId);
```

### Erreur "Access denied" pour un admin

**Cause :** La fonction `IS_ADMIN()` n'est pas correctement implémentée dans les triggers.

**Solution :** Vérifier que les triggers incluent la vérification admin :

```sql
IF NOT IS_ADMIN() THEN
  -- Vérifications RLS
END IF;
```

### Performance dégradée

**Cause :** Manque d'index sur les colonnes de filtrage.

**Solution :**

```sql
-- Ajouter des index
CREATE INDEX idx_sales_merchant ON sales(merchantId);
CREATE INDEX idx_merchants_user ON merchants(userId);
```

---

## Roadmap

- [ ] Ajouter RLS pour les tables `agent_routes` et `route_waypoints`
- [ ] Implémenter des policies granulaires (lecture seule vs écriture)
- [ ] Ajouter des logs d'audit pour les tentatives d'accès refusées
- [ ] Migrer vers PostgreSQL pour RLS natif (si besoin)

---

## Références

- [MySQL Triggers Documentation](https://dev.mysql.com/doc/refman/8.0/en/triggers.html)
- [MySQL Views Documentation](https://dev.mysql.com/doc/refman/8.0/en/views.html)
- [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html) (pour comparaison)
