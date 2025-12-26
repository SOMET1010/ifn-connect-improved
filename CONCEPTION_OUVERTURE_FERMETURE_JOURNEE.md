# Conception : Système Ouverture/Fermeture de Journée

## Contexte et Problématique

### Implémentation Actuelle (Automatique)
- **Briefing matinal** : Déclenché automatiquement au premier login du jour
- **Bilan de journée** : Déclenché automatiquement à 19h00 via modal

### Problèmes Identifiés
1. **Rigidité temporelle** : Les marchands n'ouvrent pas tous à la même heure
2. **Manque de contrôle** : Le marchand ne choisit pas quand commencer/terminer sa journée
3. **Déconnexion avec la réalité** : Un marchand peut fermer à 15h ou travailler jusqu'à 21h
4. **Absence de rituel** : Pas d'action consciente pour "ouvrir" ou "fermer" sa journée

### Solution Proposée : Actions Explicites
Remplacer les déclenchements automatiques par des **boutons d'action explicites** :
- **"Ouvrir ma journée"** : Le marchand décide quand commencer
- **"Fermer ma journée"** : Le marchand décide quand terminer

---

## Architecture du Système

### 1. Modèle de Données

#### Table `merchant_daily_sessions`

```sql
CREATE TABLE merchant_daily_sessions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  merchantId INT NOT NULL,
  sessionDate DATE NOT NULL,
  openedAt TIMESTAMP NULL,
  closedAt TIMESTAMP NULL,
  openingNotes TEXT NULL,
  closingNotes TEXT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (merchantId) REFERENCES merchants(id) ON DELETE CASCADE,
  UNIQUE KEY unique_merchant_date (merchantId, sessionDate),
  INDEX idx_merchant_date (merchantId, sessionDate),
  INDEX idx_opened_at (openedAt),
  INDEX idx_closed_at (closedAt)
);
```

**Champs** :
- `merchantId` : ID du marchand
- `sessionDate` : Date de la session (YYYY-MM-DD)
- `openedAt` : Timestamp d'ouverture (NULL si pas encore ouverte)
- `closedAt` : Timestamp de fermeture (NULL si pas encore fermée)
- `openingNotes` : Notes/objectifs saisis à l'ouverture (optionnel)
- `closingNotes` : Réflexions/notes saisies à la fermeture (optionnel)

**Contraintes** :
- Une seule session par marchand par jour (UNIQUE KEY)
- `closedAt` doit être >= `openedAt`

### 2. États de la Journée

Une journée peut avoir 3 états :

| État | openedAt | closedAt | Description |
|------|----------|----------|-------------|
| **NON_OUVERTE** | NULL | NULL | Journée pas encore commencée |
| **OUVERTE** | NOT NULL | NULL | Journée en cours |
| **FERMÉE** | NOT NULL | NOT NULL | Journée terminée |

### 3. Flux Utilisateur

#### Flux A : Ouverture de Journée

```
1. Marchand arrive sur le dashboard
2. Badge "Journée fermée" visible dans le header
3. Gros bouton "🌅 Ouvrir ma journée" au centre du dashboard
4. Clic → Modal de briefing matinal s'affiche
5. Modal contient :
   - Salutation personnalisée
   - Comparaison ventes hier vs avant-hier
   - Météo du jour
   - Micro-objectifs suggérés
   - Champ optionnel "Mon objectif du jour" (texte libre)
6. Bouton "Commencer la journée"
7. → Enregistrement de openedAt + openingNotes
8. → Redirection vers dashboard normal
9. Badge devient "Journée ouverte" (vert)
```

#### Flux B : Fermeture de Journée

```
1. Marchand clique sur "🌙 Fermer ma journée" (bouton dans header ou dashboard)
2. Modal de bilan de journée s'affiche
3. Modal contient :
   - Statistiques du jour (ventes, nombre de transactions)
   - Comparaison avec hier
   - Score SUTA actuel
   - Badges débloqués aujourd'hui
   - Micro-objectifs atteints/non atteints
   - Champ optionnel "Ce que j'ai appris aujourd'hui" (texte libre)
4. Bouton "Terminer la journée"
5. → Enregistrement de closedAt + closingNotes
6. → Message de félicitations
7. Badge devient "Journée fermée" (gris)
```

#### Flux C : Réouverture (Edge Case)

Si un marchand ferme sa journée à 15h mais revient à 17h :
- Afficher un message : "Tu as déjà fermé ta journée. Veux-tu la rouvrir ?"
- Bouton "Rouvrir" → closedAt = NULL
- Bouton "Rester fermé" → Dashboard en mode lecture seule

---

## Spécifications Techniques

### Backend : Procédures tRPC

#### 1. `dailySession.getCurrent()`

**Objectif** : Récupérer la session du jour pour le marchand connecté

**Input** : Aucun (utilise ctx.user.id)

**Output** :
```typescript
{
  id: number | null;
  sessionDate: string; // YYYY-MM-DD
  openedAt: Date | null;
  closedAt: Date | null;
  status: 'NOT_OPENED' | 'OPENED' | 'CLOSED';
  openingNotes: string | null;
  closingNotes: string | null;
}
```

**Logique** :
1. Récupérer merchant via ctx.user.id
2. Chercher session avec sessionDate = TODAY et merchantId
3. Si pas trouvée → Créer une nouvelle session avec status = NOT_OPENED
4. Retourner la session avec le status calculé

#### 2. `dailySession.open({ notes?: string })`

**Objectif** : Ouvrir la journée du marchand

**Input** :
```typescript
{
  notes?: string; // Objectif du jour (optionnel)
}
```

**Output** :
```typescript
{
  success: boolean;
  session: {
    id: number;
    openedAt: Date;
    status: 'OPENED';
  }
}
```

**Logique** :
1. Récupérer la session du jour
2. Vérifier que status = NOT_OPENED (sinon erreur)
3. UPDATE openedAt = NOW(), openingNotes = notes
4. Retourner la session mise à jour

**Erreurs** :
- Session déjà ouverte → "Votre journée est déjà ouverte"
- Session déjà fermée → "Votre journée est déjà fermée. Voulez-vous la rouvrir ?"

#### 3. `dailySession.close({ notes?: string })`

**Objectif** : Fermer la journée du marchand

**Input** :
```typescript
{
  notes?: string; // Réflexions du jour (optionnel)
}
```

**Output** :
```typescript
{
  success: boolean;
  session: {
    id: number;
    closedAt: Date;
    status: 'CLOSED';
  };
  stats: {
    todaySales: number;
    todayTransactions: number;
    yesterdaySales: number;
    percentChange: number;
    trend: 'up' | 'down' | 'stable';
  }
}
```

**Logique** :
1. Récupérer la session du jour
2. Vérifier que status = OPENED (sinon erreur)
3. UPDATE closedAt = NOW(), closingNotes = notes
4. Calculer les statistiques du jour
5. Retourner la session + stats

**Erreurs** :
- Session pas encore ouverte → "Vous devez d'abord ouvrir votre journée"
- Session déjà fermée → "Votre journée est déjà fermée"

#### 4. `dailySession.reopen()`

**Objectif** : Rouvrir une journée déjà fermée

**Input** : Aucun

**Output** :
```typescript
{
  success: boolean;
  session: {
    id: number;
    closedAt: null;
    status: 'OPENED';
  }
}
```

**Logique** :
1. Récupérer la session du jour
2. Vérifier que status = CLOSED (sinon erreur)
3. UPDATE closedAt = NULL
4. Retourner la session mise à jour

#### 5. `dailySession.getHistory({ limit?: number })`

**Objectif** : Récupérer l'historique des sessions (calendrier)

**Input** :
```typescript
{
  limit?: number; // Nombre de jours à récupérer (défaut 30)
}
```

**Output** :
```typescript
{
  sessions: Array<{
    sessionDate: string;
    openedAt: Date | null;
    closedAt: Date | null;
    status: 'NOT_OPENED' | 'OPENED' | 'CLOSED';
    duration: number | null; // Durée en minutes
  }>;
  stats: {
    totalDaysWorked: number;
    averageDuration: number; // Durée moyenne en minutes
    longestDay: { date: string; duration: number };
  }
}
```

---

## Interface Utilisateur

### 1. Badge de Statut dans le Header

**Position** : À côté du nom du marchand dans le header

**Variantes** :

| Statut | Couleur | Icône | Texte |
|--------|---------|-------|-------|
| NOT_OPENED | Gris | 🌙 | Journée fermée |
| OPENED | Vert | 🌅 | Journée ouverte |
| CLOSED | Orange | 🌙 | Journée fermée |

**Comportement** :
- Clic sur le badge → Ouvre un menu dropdown
- Menu contient :
  - Si NOT_OPENED : "Ouvrir ma journée"
  - Si OPENED : "Fermer ma journée" + "Durée : X heures"
  - Si CLOSED : "Rouvrir ma journée"

### 2. Bouton Principal sur le Dashboard

**Condition d'affichage** : Uniquement si status = NOT_OPENED

**Design** :
- Taille : GÉANTE (h-32, occupant 60% de la largeur)
- Couleur : Gradient orange → jaune (sunrise)
- Icône : 🌅 Soleil levant
- Texte : "Ouvrir ma journée" (texte 4xl)
- Position : Au centre du dashboard, au-dessus des KPIs

**Comportement** :
- Clic → Ouvre le modal de briefing matinal

### 3. Modal de Briefing Matinal

**Déclencheur** : Clic sur "Ouvrir ma journée"

**Contenu** :
1. **Header** :
   - Icône 🌅 géante
   - Titre : "Bonjour [Prénom] ! 👋"
   - Sous-titre : "Prêt à commencer une belle journée ?"

2. **Section Comparaison** :
   - Carte avec statistiques hier vs avant-hier
   - Graphique de tendance (TrendingUp/Down/Minus)
   - Message de motivation contextuel

3. **Section Météo** (optionnel) :
   - Température et conditions
   - Conseil adapté ("Il va pleuvoir, protège tes marchandises")

4. **Section Objectifs** :
   - Micro-objectifs suggérés (basés sur historique)
   - Champ texte : "Mon objectif du jour" (optionnel)
   - Placeholder : "Ex: Vendre 50 000 FCFA aujourd'hui"

5. **Footer** :
   - Bouton "Commencer la journée" (vert, géant)
   - Toggle audio (Volume2/VolumeX)

**Synthèse vocale** :
- Lecture automatique du briefing
- Message personnalisé avec prénom et statistiques

### 4. Modal de Bilan de Journée

**Déclencheur** : Clic sur "Fermer ma journée"

**Contenu** :
1. **Header** :
   - Icône 🌙 géante
   - Titre : "Bravo [Prénom] ! 🎉"
   - Sous-titre : "Voici ton bilan de la journée"

2. **Section Statistiques** :
   - Ventes du jour (en TRÈS GRAND)
   - Nombre de transactions
   - Comparaison avec hier (graphique)
   - Message de félicitations si hausse

3. **Section Score SUTA** :
   - Jauge circulaire du score
   - Message d'éligibilité micro-crédit (si score ≥ 70)
   - Badges débloqués aujourd'hui (avec confetti)

4. **Section Objectifs** :
   - Micro-objectifs atteints ✅ / non atteints ❌
   - Objectif de demain (+10% par rapport à aujourd'hui)

5. **Section Réflexion** :
   - Champ texte : "Ce que j'ai appris aujourd'hui" (optionnel)
   - Placeholder : "Ex: Les tomates se vendent mieux le matin"

6. **Footer** :
   - Bouton "Terminer la journée" (bleu, géant)
   - Toggle audio (Volume2/VolumeX)

**Synthèse vocale** :
- Lecture automatique du bilan
- Félicitations personnalisées

### 5. Page Historique des Sessions

**Route** : `/merchant/sessions-history`

**Contenu** :
1. **Calendrier visuel** :
   - Vue mensuelle avec jours travaillés en vert
   - Jours non travaillés en gris
   - Clic sur un jour → Détails de la session

2. **Statistiques globales** :
   - Total de jours travaillés ce mois
   - Durée moyenne de travail
   - Jour le plus long

3. **Liste des sessions** :
   - Tableau avec colonnes : Date, Ouverture, Fermeture, Durée, Notes
   - Filtres : Mois, Année
   - Export CSV

---

## Avantages du Système Explicite

### 1. Contrôle et Autonomie
- Le marchand **choisit** quand commencer et terminer
- Pas de contrainte horaire rigide
- Adaptation aux rythmes individuels

### 2. Rituel Conscient
- Action intentionnelle qui marque le début/fin de journée
- Renforce l'engagement et la discipline
- Crée une **séparation mentale** entre travail et repos

### 3. Flexibilité
- Marchands qui ouvrent tôt (5h) ou tard (10h)
- Marchands qui ferment tôt (15h) ou tard (21h)
- Possibilité de rouvrir si besoin

### 4. Données Précises
- Durée réelle de travail (openedAt → closedAt)
- Statistiques fiables sur les habitudes
- Détection des marchands inactifs (pas d'ouverture depuis X jours)

### 5. Engagement Accru
- Bouton géant "Ouvrir ma journée" crée un **appel à l'action** fort
- Rituel d'ouverture/fermeture renforce l'habitude d'utilisation
- Notes personnelles créent un **journal de bord** valorisant

---

## Migration de l'Implémentation Actuelle

### Étapes de Migration

1. **Créer la table `merchant_daily_sessions`**
2. **Créer les procédures tRPC** (getCurrent, open, close, reopen, getHistory)
3. **Créer les composants UI** (Badge, Bouton, Modals)
4. **Désactiver le hook `useFirstLoginDetection`** (ou le rendre optionnel)
5. **Supprimer le déclenchement automatique du bilan à 19h00**
6. **Tester avec 10 marchands pilotes**
7. **Déployer progressivement** (50 marchands, puis 100, puis tous)

### Rétrocompatibilité

Pour les marchands habitués au système automatique, proposer un **mode hybride** dans les paramètres :
- **Mode Manuel** (par défaut) : Boutons explicites
- **Mode Automatique** : Briefing au premier login + bilan à 19h

---

## Tests et Validation

### Scénarios de Test

1. **Test 1 : Ouverture normale**
   - Marchand arrive à 8h
   - Clique sur "Ouvrir ma journée"
   - Voit le briefing matinal
   - Commence à vendre

2. **Test 2 : Fermeture normale**
   - Marchand clique sur "Fermer ma journée" à 18h
   - Voit le bilan de journée
   - Confirme la fermeture

3. **Test 3 : Réouverture**
   - Marchand ferme à 15h
   - Revient à 17h
   - Voit le message "Journée déjà fermée"
   - Clique sur "Rouvrir"
   - Peut continuer à vendre

4. **Test 4 : Oubli de fermeture**
   - Marchand ouvre à 8h mais oublie de fermer
   - Le lendemain à 8h, voit le message "Tu as oublié de fermer hier"
   - Option : "Fermer maintenant" ou "Ignorer"

5. **Test 5 : Historique**
   - Marchand consulte l'historique
   - Voit un calendrier avec jours travaillés
   - Clique sur un jour → Détails de la session

### Métriques de Succès

| Métrique | Objectif | Mesure |
|----------|----------|--------|
| Taux d'adoption | > 80% | % de marchands qui utilisent le bouton |
| Temps moyen d'ouverture | < 30 secondes | Temps entre clic et confirmation |
| Taux de fermeture | > 70% | % de journées ouvertes qui sont fermées |
| Satisfaction | > 4/5 | Enquête après 30 jours d'utilisation |

---

## Conclusion

Le système Ouverture/Fermeture de journée remplace les déclenchements automatiques rigides par des **actions explicites** qui donnent le contrôle au marchand. Cette approche est plus **respectueuse**, plus **flexible** et crée des **rituels conscients** qui renforcent l'engagement et l'autonomie.

**Prochaine étape** : Implémenter le backend (table + procédures tRPC)
