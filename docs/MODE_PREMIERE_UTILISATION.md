# Mode Première Utilisation - Documentation

## Vue d'ensemble

Le **Mode Première Utilisation** est un système de guidage vocal interactif conçu pour accompagner les nouveaux marchands lors de leur première utilisation de la plateforme IFN Connect. Ce système détecte automatiquement les nouveaux utilisateurs et leur propose un tour guidé en **5 étapes** avec support **bilingue** (Français/Dioula).

## Objectifs

1. **Réduire la courbe d'apprentissage** pour les marchands ayant peu d'expérience avec les outils numériques
2. **Augmenter l'adoption** des fonctionnalités clés de la plateforme
3. **Améliorer l'accessibilité** grâce au guidage vocal en langues locales
4. **Renforcer la confiance** des utilisateurs dans l'utilisation de l'application

## Architecture technique

### Base de données

**Table : `first_time_user_progress`**

```sql
CREATE TABLE first_time_user_progress (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  currentStep INT DEFAULT 1 NOT NULL,
  totalSteps INT DEFAULT 5 NOT NULL,
  completed BOOLEAN DEFAULT FALSE NOT NULL,
  skipped BOOLEAN DEFAULT FALSE NOT NULL,
  startedAt TIMESTAMP DEFAULT NOW() NOT NULL,
  completedAt TIMESTAMP NULL,
  lastStepCompletedAt TIMESTAMP NULL,
  createdAt TIMESTAMP DEFAULT NOW() NOT NULL,
  updatedAt TIMESTAMP DEFAULT NOW() ON UPDATE NOW() NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
```

### Backend (tRPC Router)

**Fichier : `server/routers/first-time-user.ts`**

Le router expose 5 procédures :

1. **`getProgress`** (query) : Récupère la progression actuelle de l'utilisateur
2. **`startTour`** (mutation) : Démarre ou réinitialise le tour guidé
3. **`completeStep`** (mutation) : Marque une étape comme complétée
4. **`completeTour`** (mutation) : Termine le tour guidé
5. **`skipTour`** (mutation) : Permet d'ignorer le tour

### Frontend

#### Hook personnalisé : `useFirstTimeUser`

**Fichier : `client/src/hooks/useFirstTimeUser.ts`**

Ce hook gère toute la logique de détection et de progression du tour :

```typescript
const {
  isNewUser,        // Boolean : l'utilisateur est-il nouveau ?
  currentStep,      // Number : étape actuelle (1-5)
  totalSteps,       // Number : nombre total d'étapes (5)
  showTour,         // Boolean : afficher le tour ?
  isLoading,        // Boolean : chargement en cours ?
  nextStep,         // Function : passer à l'étape suivante
  skip,             // Function : ignorer le tour
  start,            // Function : démarrer le tour manuellement
  progress,         // Object : données de progression complètes
} = useFirstTimeUser();
```

#### Composant : `VoiceGuidedTour`

**Fichier : `client/src/components/VoiceGuidedTour.tsx`**

Composant React qui affiche le tour guidé en overlay modal avec :

- **Icône géante** représentant l'étape actuelle (📅, 💰, 🎤, 🛒, 🛡️)
- **Titre et description** en français et dioula
- **Barre de progression** visuelle
- **Boutons d'action** :
  - Changer de langue (FR ↔ Dioula)
  - Activer/Désactiver l'audio
  - Réécouter l'instruction
  - Passer le tour
  - Suivant / Terminer

## Les 5 étapes du tour guidé

### Étape 1 : Ouvrir/Fermer ma journée 📅

**Objectif** : Apprendre à ouvrir et fermer sa journée de travail

**Texte vocal (FR)** :
> "Bienvenue ! Première étape : Chaque jour, ouvrez votre journée en cliquant sur le bouton Ouvrir ma journée. Le soir, fermez-la pour suivre vos heures de travail."

**Texte vocal (Dioula)** :
> "I ni ce ! Fɔlɔ : Tile bɛɛ, i ka i ka baara daminɛ ni i ye butɔn digi. Su la, i ka a ban walasa ka i ka baara waatiw lajɛ."

### Étape 2 : Enregistrer une vente 💰

**Objectif** : Apprendre à utiliser la caisse pour enregistrer les ventes

**Texte vocal (FR)** :
> "Deuxième étape : Pour enregistrer une vente, allez dans Caisse. Tapez le montant ou utilisez la commande vocale en disant par exemple : Vendre 3 tas de tomates à 1000 francs."

**Texte vocal (Dioula)** :
> "Filanan : Walasa ka feereli sɛbɛn, i ka taga Caisse la. I ka wari hakɛ sɛbɛn walima ka baara kɛ ni kan ye ni i ye a fɔ ko : Feereli 3 tomati 1000 francs."

### Étape 3 : Utiliser les commandes vocales 🎤

**Objectif** : Découvrir la fonctionnalité de commande vocale

**Texte vocal (FR)** :
> "Troisième étape : Utilisez votre voix ! Cliquez sur le bouton microphone et dites ce que vous voulez faire. L'application comprend le français et le dioula."

**Texte vocal (Dioula)** :
> "Sabanan : I ka i ka kan baara kɛ ! I ye mikrofɔn butɔn digi ani ka fɔ i b'a fɛ ka kɛ. Application bɛ faransi ni dioula faamuy."

### Étape 4 : Commander des produits 🛒

**Objectif** : Apprendre à utiliser le marché virtuel

**Texte vocal (FR)** :
> "Quatrième étape : Pour commander des produits, allez dans Marché Virtuel. Choisissez vos produits et payez avec Mobile Money : Orange, MTN, Wave ou Moov."

**Texte vocal (Dioula)** :
> "Naanin : Walasa ka fɛnw daminɛ, i ka taga Marché Virtuel la. I ka i ka fɛnw sugandi ani ka sara kɛ ni Mobile Money ye : Orange, MTN, Wave walima Moov."

### Étape 5 : Vérifier ma protection sociale 🛡️

**Objectif** : Comprendre l'importance de la CNPS et CMU

**Texte vocal (FR)** :
> "Dernière étape : Vérifiez votre protection sociale. Allez dans Protection Sociale pour voir votre CNPS pour la retraite et votre CMU pour la santé. Renouvelez-les avant qu'elles n'expirent."

**Texte vocal (Dioula)** :
> "Laban : I ka i ka jama sabati lajɛ. I ka taga Protection Sociale la walasa ka i ka CNPS (kɔrɔbaga) ani i ka CMU (kɛnɛya) ye. I ka u yɛlɛma sani u ka ban."

## Intégration dans l'application

Le composant `VoiceGuidedTour` est intégré dans le dashboard marchand principal :

**Fichier : `client/src/pages/MerchantDashboardSimple.tsx`**

```tsx
import { VoiceGuidedTour } from '@/components/VoiceGuidedTour';

export default function MerchantDashboardSimple() {
  return (
    <div>
      {/* Contenu du dashboard */}
      
      {/* Tour guidé vocal pour les nouveaux utilisateurs */}
      <VoiceGuidedTour />
    </div>
  );
}
```

Le composant se charge automatiquement de :
1. Détecter si l'utilisateur est nouveau
2. Afficher le tour si nécessaire
3. Gérer la progression
4. Se masquer une fois terminé ou ignoré

## Comportement du système

### Détection des nouveaux utilisateurs

Un utilisateur est considéré comme "nouveau" si :
- Aucune entrée n'existe dans `first_time_user_progress` pour son `userId`
- OU son tour n'est ni `completed` ni `skipped`

### Affichage automatique

Le tour s'affiche automatiquement :
- Lors de la première connexion au dashboard marchand
- À chaque connexion tant que le tour n'est pas terminé ou ignoré

### Lecture vocale automatique

À chaque étape :
1. Le texte vocal correspondant est lu automatiquement (si l'audio est activé)
2. Un délai de 500ms est appliqué pour laisser le temps au composant de s'afficher
3. La lecture s'arrête automatiquement lors du changement d'étape

### Changement de langue

L'utilisateur peut basculer entre français et dioula à tout moment :
- Le texte affiché change instantanément
- La lecture vocale utilise la langue sélectionnée
- Le choix de langue est conservé pendant toute la session du tour

## Tests unitaires

**Fichier : `server/routers/first-time-user.test.ts`**

8 tests couvrent l'ensemble des fonctionnalités :

1. ✅ Retourne null pour un nouvel utilisateur sans progression
2. ✅ Démarre le tour guidé
3. ✅ Complète une étape du tour
4. ✅ Complète toutes les étapes du tour
5. ✅ Termine le tour guidé
6. ✅ Ignore le tour guidé
7. ✅ Réinitialise le tour si déjà démarré
8. ✅ Gère l'ignorance du tour après l'avoir démarré

**Exécution des tests** :
```bash
pnpm test server/routers/first-time-user.test.ts
```

## Améliorations futures

### 1. Désactivation automatique après 3 jours

Ajouter une logique pour désactiver automatiquement le tour après 3 jours d'utilisation :

```typescript
// Dans le hook useFirstTimeUser
useEffect(() => {
  if (progress && progress.startedAt) {
    const daysSinceStart = Math.floor(
      (Date.now() - new Date(progress.startedAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceStart >= 3 && !progress.completed && !progress.skipped) {
      // Auto-skip après 3 jours
      skipTour.mutateAsync();
    }
  }
}, [progress]);
```

### 2. Notification de rappel après 24h

Envoyer une notification si le tour n'est pas complété après 24h :

```typescript
// Ajouter dans le router firstTimeUser
checkAndNotify: protectedProcedure.mutation(async ({ ctx }) => {
  const progress = await getProgress(ctx.user.id);
  
  if (progress && !progress.completed && !progress.skipped) {
    const hoursSinceStart = Math.floor(
      (Date.now() - new Date(progress.startedAt).getTime()) / (1000 * 60 * 60)
    );
    
    if (hoursSinceStart >= 24) {
      // Envoyer notification
      await notifyUser(ctx.user.id, {
        title: "Terminez votre visite guidée",
        content: "Découvrez toutes les fonctionnalités de IFN Connect en 5 minutes !"
      });
    }
  }
});
```

### 3. Highlights interactifs

Ajouter des highlights visuels sur les éléments de l'interface mentionnés dans chaque étape :

```typescript
const TOUR_STEPS = [
  {
    id: 1,
    targetElement: "#btn-open-day", // Sélecteur CSS de l'élément à mettre en évidence
    // ...
  },
  // ...
];
```

### 4. Analytics et métriques

Tracker les métriques d'utilisation du tour :
- Taux de complétion
- Étapes les plus ignorées
- Temps moyen par étape
- Langue préférée

## Support et maintenance

### Dépendances

- **tRPC** : Communication client-serveur
- **React** : Framework frontend
- **Drizzle ORM** : Accès à la base de données
- **Web Speech API** : Synthèse vocale (hook `useSpeech`)

### Fichiers à maintenir

- `drizzle/schema-first-time-user.ts` : Schéma de base de données
- `server/routers/first-time-user.ts` : Router backend
- `server/routers/first-time-user.test.ts` : Tests unitaires
- `client/src/hooks/useFirstTimeUser.ts` : Hook React
- `client/src/components/VoiceGuidedTour.tsx` : Composant UI
- `client/src/pages/MerchantDashboardSimple.tsx` : Intégration

### Logs et debugging

Pour activer les logs de debug :

```typescript
// Dans useFirstTimeUser.ts
console.log('[FirstTimeUser] Progress:', progress);
console.log('[FirstTimeUser] Current step:', currentStep);
console.log('[FirstTimeUser] Show tour:', showTour);
```

## Conclusion

Le Mode Première Utilisation est un système complet et robuste qui facilite l'onboarding des nouveaux marchands sur la plateforme IFN Connect. Avec son support bilingue, son guidage vocal et son interface intuitive, il contribue significativement à l'objectif d'inclusion financière numérique en Côte d'Ivoire.
