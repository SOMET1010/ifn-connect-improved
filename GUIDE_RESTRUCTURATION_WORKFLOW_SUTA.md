# 🎯 Guide de Restructuration - Workflow "Une journée avec SUTA"

## 📋 Vue d'ensemble

Ce document détaille la restructuration complète de la plateforme IFN Connect pour respecter les 3 workflows officiels :

1. **"Une journée avec SUTA"** - Workflow vocal proactif (4 scènes)
2. **Parcours Marchand** - 5 étapes de digitalisation
3. **Parcours Coopérative** - 5 axes de transformation

---

## 🎬 Workflow "Une journée avec SUTA" (4 Scènes)

### Scène 1 : 07h30 - Briefing Matinal SUTA

#### 📍 État actuel
- ✅ Page `/merchant/morning-briefing` créée
- ✅ WeatherWidget intégré
- ✅ Avatar SUTA avec café
- ⚠️ Manque : Détection automatique du premier login
- ⚠️ Manque : Flux de prix en temps réel
- ⚠️ Manque : Système de rappels vocaux

#### 🎯 Objectif
Afficher automatiquement un briefing personnalisé au premier login du jour avec :
- Salutation contextuelle (Bonjour/Bon après-midi)
- Alerte météo proactive ("Couvre tes sacs de riz si pluie")
- Info prix en temps réel ("Le riz a baissé, c'est le moment !")
- Rappels programmés de la journée

#### 🔧 Implémentation

**1. Détection du premier login**
```typescript
// Dans MerchantDashboard.tsx
useEffect(() => {
  const lastLogin = localStorage.getItem('lastLoginDate');
  const today = new Date().toDateString();
  
  if (lastLogin !== today) {
    // Rediriger vers /merchant/morning-briefing
    setLocation('/merchant/morning-briefing');
    localStorage.setItem('lastLoginDate', today);
  }
}, []);
```

**2. Flux de prix en temps réel**
```typescript
// Créer server/routers/prices.ts
export const pricesRouter = router({
  dailyUpdates: protectedProcedure.query(async () => {
    // Récupérer les variations de prix du jour
    // Peut être alimenté manuellement ou via API externe
    return [
      { product: 'Riz 25kg', oldPrice: 12000, newPrice: 11500, change: -500 },
      { product: 'Huile rouge 5L', oldPrice: 4500, newPrice: 4800, change: 300 },
    ];
  }),
});
```

**3. Système de rappels vocaux**
```typescript
// Créer server/routers/reminders.ts
export const remindersRouter = router({
  create: protectedProcedure
    .input(z.object({
      time: z.string(), // "10:00"
      text: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Sauvegarder le rappel dans la DB
      // Programmer une notification push à l'heure indiquée
    }),
    
  getTodayReminders: protectedProcedure.query(async ({ ctx }) => {
    // Récupérer les rappels du jour
  }),
});
```

---

### Scène 2 : 11h15 - Vente Vocale Mains-Libres

#### 📍 État actuel
- ✅ Composant `VoiceSaleButton` créé
- ✅ Son "Tching !" implémenté
- ⚠️ Manque : **Proposition automatique d'épargne** après grosse vente
- ⚠️ Manque : Animation de pièces dans tirelire
- ⚠️ Manque : Validation vocale de l'épargne

#### 🎯 Objectif
Workflow fluide :
1. Marchand : "SUTA ! Vente !"
2. SUTA : "Je t'écoute !"
3. Marchand : "2 sacs de riz, 3 bidons d'huile, 35.000 FCFA, Cash"
4. SUTA : "Tching ! **Grosse vente ! Veux-tu mettre 500 FCFA dans ta cagnotte Tabaski ?**"
5. Marchand : "Vas-y SUTA, valide"
6. SUTA : Animation de pièces + "C'est fait ! Ta cagnotte avance bien !"

#### 🔧 Implémentation

**1. Proposition automatique d'épargne**
```typescript
// Dans VoiceSaleButton.tsx ou CashRegister.tsx
const createSale = trpc.sales.create.useMutation({
  onSuccess: async (data, variables) => {
    // Son "Tching !"
    playRegisterSound();
    speak("Vente enregistrée !");
    
    // Si vente > 20.000 FCFA → proposition d'épargne
    if (variables.totalAmount > 20000) {
      const suggestedAmount = Math.floor(variables.totalAmount * 0.02); // 2%
      
      speak(`Grosse vente ! Veux-tu mettre ${suggestedAmount} FCFA dans ta cagnotte ?`);
      
      // Afficher modal de confirmation
      setSavingsProposal({
        amount: suggestedAmount,
        saleAmount: variables.totalAmount,
      });
    }
  },
});
```

**2. Modal de proposition d'épargne**
```typescript
// Créer SavingsProposalModal.tsx
export function SavingsProposalModal({ amount, saleAmount, onConfirm, onCancel }) {
  return (
    <Dialog open={true}>
      <DialogContent>
        <div className="text-center">
          <div className="w-24 h-24 bg-green-500 rounded-full mx-auto mb-4 flex items-center justify-center">
            <PiggyBank className="w-12 h-12 text-white" />
          </div>
          
          <h2 className="text-2xl font-bold mb-2">💡 Conseil Malin</h2>
          <p className="text-lg mb-4">
            C'est une grosse vente ! Veux-tu mettre <strong>{amount} FCFA</strong> de côté 
            dans ta cagnotte virtuelle "Épargne Tabaski" ?
          </p>
          
          <div className="flex gap-4">
            <Button onClick={onCancel} variant="outline">
              Non merci
            </Button>
            <Button onClick={onConfirm} className="bg-green-500">
              ✅ Vas-y SUTA, valide !
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

**3. Animation de pièces dans tirelire**
```typescript
// Utiliser framer-motion ou CSS animations
const CoinAnimation = () => {
  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="text-6xl"
    >
      💰
    </motion.div>
  );
};
```

---

### Scène 3 : 15h00 - Intelligence Collective (Achats Groupés)

#### 📍 État actuel
- ✅ Système de commandes groupées existe (`grouped_orders`)
- ✅ Paliers de prix dégressifs implémentés
- ⚠️ Manque : **Notifications proactives** pour rejoindre des commandes en cours
- ⚠️ Manque : Calcul automatique d'économies de transport
- ⚠️ Manque : Interface vocale pour rejoindre

#### 🎯 Objectif
SUTA détecte une opportunité et propose :
- "Moussa et Dame Cissé commandent un camion demain"
- "Si tu commandes maintenant, transport = 2.000 FCFA au lieu de 5.000 FCFA"
- "On lance la commande groupée ?"

#### 🔧 Implémentation

**1. Notifications proactives**
```typescript
// Créer server/routers/grouped-orders-notifications.ts
export const groupedOrdersNotificationsRouter = router({
  checkOpportunities: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    const db = await getDb();
    
    // Trouver les commandes groupées actives dans la même zone
    const activeOrders = await db
      .select()
      .from(groupedOrders)
      .where(
        and(
          eq(groupedOrders.status, 'active'),
          // Même marché ou zone géographique
        )
      );
    
    // Calculer les économies potentielles
    const opportunities = activeOrders.map(order => ({
      orderId: order.id,
      participants: order.participantCount,
      transportSavings: calculateTransportSavings(order),
      priceSavings: calculatePriceSavings(order),
      deadline: order.deadline,
    }));
    
    return opportunities;
  }),
});
```

**2. Calcul d'économies de transport**
```typescript
function calculateTransportSavings(order: GroupedOrder) {
  const baseTransportCost = 5000; // Transport individuel
  const sharedTransportCost = baseTransportCost / (order.participantCount + 1);
  
  return {
    individual: baseTransportCost,
    shared: Math.round(sharedTransportCost),
    savings: baseTransportCost - Math.round(sharedTransportCost),
  };
}
```

**3. Widget de notification dans le dashboard**
```typescript
// Ajouter dans MerchantDashboard.tsx
export function GroupedOrderOpportunityWidget() {
  const { data: opportunities } = trpc.groupedOrders.checkOpportunities.useQuery();
  
  if (!opportunities || opportunities.length === 0) return null;
  
  return (
    <Card className="border-l-4 border-orange-500 bg-orange-50">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <TruckIcon className="h-8 w-8 text-orange-600" />
          <div>
            <h3 className="font-bold text-orange-800">💡 Opportunité d'économie !</h3>
            <p className="text-sm text-orange-700">
              {opportunities[0].participants} commerçants commandent ensemble. 
              Rejoins-les et économise <strong>{opportunities[0].transportSavings.savings} FCFA</strong> sur le transport !
            </p>
            <Button className="mt-2 bg-orange-500">
              Rejoindre la commande groupée
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

### Scène 4 : 19h00 - Bilan de Journée Gamifié

#### 📍 État actuel
- ✅ Composant `DailyReportModal` créé
- ✅ Comparaison avec hier implémentée
- ✅ Score SUTA affiché
- ✅ Message d'éligibilité au crédit
- ⚠️ Manque : Déclenchement automatique à 19h00
- ⚠️ Manque : Animations festives

#### 🎯 Objectif
Modal automatique qui s'affiche à 19h00 (ou à la déconnexion) avec :
- Avatar SUTA qui applaudit
- Total vendu + comparaison avec hier
- Score SUTA avec jauge colorée
- Message d'éligibilité au crédit si score ≥ 70%
- Salutation : "Bon repos Awa. À demain !"

#### 🔧 Implémentation

**1. Déclenchement automatique**
```typescript
// Dans MerchantDashboard.tsx ou App.tsx
useEffect(() => {
  const checkDailyReport = () => {
    const now = new Date();
    const hour = now.getHours();
    
    // Vérifier si déjà affiché aujourd'hui
    const lastShown = localStorage.getItem('lastDailyReport');
    const today = new Date().toDateString();
    
    if (lastShown !== today && hour >= 19) {
      // Afficher le modal après 2 secondes
      setTimeout(() => {
        setShowDailyReport(true);
        localStorage.setItem('lastDailyReport', today);
      }, 2000);
    }
  };
  
  // Vérifier toutes les minutes
  const interval = setInterval(checkDailyReport, 60000);
  checkDailyReport(); // Vérifier immédiatement
  
  return () => clearInterval(interval);
}, []);
```

**2. Animations festives**
```typescript
// Utiliser confetti ou animations CSS
import confetti from 'canvas-confetti';

const celebrateGoodDay = () => {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 }
  });
};
```

---

## 📊 Parcours Marchand (5 Étapes)

### Restructuration du Dashboard Marchand

#### État actuel
Le dashboard actuel affiche des KPIs génériques. Il faut le restructurer selon les **5 étapes officielles** du parcours de digitalisation.

#### Objectif
Créer 5 sections claires dans le dashboard :

### 1️⃣ Approvisionnement & Paiement
**Fonctionnalités :**
- Marché virtuel (lien vers `/merchant/market`)
- Commandes en cours
- Paiements Mobile Money (InTouch, Orange, MTN, Wave)
- Traçabilité des commandes

**Composant :**
```typescript
<Card>
  <CardHeader>
    <CardTitle>1️⃣ Approvisionnement & Paiement</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="grid grid-cols-2 gap-4">
      <Link to="/merchant/market">
        <Button className="w-full h-20">
          🛒 Marché Virtuel
        </Button>
      </Link>
      <Link to="/merchant/orders">
        <Button className="w-full h-20">
          📦 Mes Commandes
        </Button>
      </Link>
    </div>
    <div className="mt-4">
      <p className="text-sm text-gray-600">
        Commandez en ligne, payez via Mobile Money, suivez vos livraisons en temps réel.
      </p>
    </div>
  </CardContent>
</Card>
```

### 2️⃣ Vente au Client Final
**Fonctionnalités :**
- Caisse tactile (lien vers `/merchant/cash-register`)
- Bouton "🎤 SUTA ! Vente !" (vente vocale)
- QR Code pour paiements clients
- Reçus électroniques

**Composant :**
```typescript
<Card>
  <CardHeader>
    <CardTitle>2️⃣ Vente au Client Final</CardTitle>
  </CardHeader>
  <CardContent>
    <VoiceSaleButton />
    <div className="mt-4 grid grid-cols-2 gap-4">
      <Link to="/merchant/cash-register">
        <Button className="w-full">💰 Caisse Tactile</Button>
      </Link>
      <Button className="w-full">📱 QR Code Paiement</Button>
    </div>
  </CardContent>
</Card>
```

### 3️⃣ Stockage & Gestion
**Fonctionnalités :**
- Tableau de bord stock en temps réel
- Alertes de réapprovisionnement
- Historique des mouvements

**Composant :**
```typescript
<Card>
  <CardHeader>
    <CardTitle>3️⃣ Stockage & Gestion</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="flex items-center justify-between mb-4">
      <div>
        <p className="text-sm text-gray-600">Produits en stock bas</p>
        <p className="text-3xl font-bold text-red-600">{lowStockCount}</p>
      </div>
      <AlertTriangle className="h-12 w-12 text-red-600" />
    </div>
    <Link to="/merchant/stock">
      <Button className="w-full">📦 Gérer mon Stock</Button>
    </Link>
  </CardContent>
</Card>
```

### 4️⃣ Protection Sociale
**Fonctionnalités :**
- Paiement cotisations CNPS en ligne
- Renouvellement CMU en ligne
- Statut des cotisations

**Composant :**
```typescript
<Card>
  <CardHeader>
    <CardTitle>4️⃣ Protection Sociale</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="space-y-3">
      <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
        <div>
          <p className="font-medium">CNPS (Retraite)</p>
          <p className="text-sm text-gray-600">Expire le {cnpsExpiryDate}</p>
        </div>
        <Badge variant={cnpsStatus === 'active' ? 'success' : 'destructive'}>
          {cnpsStatus}
        </Badge>
      </div>
      <div className="flex items-center justify-between p-3 bg-green-50 rounded">
        <div>
          <p className="font-medium">CMU (Santé)</p>
          <p className="text-sm text-gray-600">Expire le {cmuExpiryDate}</p>
        </div>
        <Badge variant={cmuStatus === 'active' ? 'success' : 'destructive'}>
          {cmuStatus}
        </Badge>
      </div>
      <Button className="w-full">💳 Payer mes Cotisations</Button>
    </div>
  </CardContent>
</Card>
```

### 5️⃣ Renforcement des Capacités
**Fonctionnalités :**
- Modules e-learning accessibles 24/7
- Tutoriels vidéo
- Suivi de progression

**Composant :**
```typescript
<Card>
  <CardHeader>
    <CardTitle>5️⃣ Renforcement des Capacités</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="space-y-3">
      <div className="flex items-center gap-3 p-3 bg-purple-50 rounded">
        <GraduationCap className="h-8 w-8 text-purple-600" />
        <div>
          <p className="font-medium">Formation en cours</p>
          <p className="text-sm text-gray-600">Gestion de stock avancée</p>
          <div className="mt-2 h-2 bg-gray-200 rounded-full">
            <div className="h-2 bg-purple-600 rounded-full" style={{ width: '60%' }} />
          </div>
        </div>
      </div>
      <Link to="/learning">
        <Button className="w-full">📚 Accéder aux Formations</Button>
      </Link>
    </div>
  </CardContent>
</Card>
```

---

## 🏢 Parcours Coopérative (5 Axes)

### Restructuration du Dashboard Coopérative

#### Objectif
Créer 5 sections claires dans le dashboard coopérative :

### 1️⃣ Approvisionnement & Paiements
- App marchands pour expression des besoins
- Marché virtuel pour commandes
- Paiements mobiles sécurisés
- Tableau de suivi coopératif

### 2️⃣ Stockage Intelligent
- Suivi digitalisé du stock (temps réel)
- Notifications automatiques (niveaux critiques)
- Optimisation des coûts de conservation

### 3️⃣ Vente & Reporting
- App coopérative pour enregistrement des ventes
- Outil pour versements
- Bilan financier automatisé

### 4️⃣ Protection Sociale Intégrée
- Plateforme unique CNPS/CNAM
- Paiement des cotisations en ligne
- Inclusion sociale pour tous les membres

### 5️⃣ Renforcement des Capacités
- Modules e-learning accessibles sur mobile
- Notifications et suivi de participation
- Mesure de l'impact

---

## 📝 Plan d'Implémentation Prioritaire

### Phase 1 : Finaliser le Workflow SUTA (Priorité Haute)
1. ✅ Briefing Matinal (80% fait)
   - [ ] Ajouter détection automatique du premier login
   - [ ] Créer le router `prices` pour flux de prix
   - [ ] Créer le router `reminders` pour rappels vocaux

2. ⚠️ Vente Vocale + Épargne (50% fait)
   - [ ] Implémenter proposition automatique d'épargne
   - [ ] Créer `SavingsProposalModal`
   - [ ] Ajouter animations de pièces

3. ⚠️ Intelligence Collective (30% fait)
   - [ ] Créer `GroupedOrderOpportunityWidget`
   - [ ] Implémenter calcul d'économies de transport
   - [ ] Ajouter notifications proactives

4. ✅ Bilan de Journée (90% fait)
   - [ ] Ajouter déclenchement automatique à 19h00
   - [ ] Intégrer animations festives (confetti)

### Phase 2 : Restructurer les Dashboards (Priorité Moyenne)
1. Dashboard Marchand
   - [ ] Réorganiser en 5 sections
   - [ ] Créer les composants pour chaque étape
   - [ ] Tester la navigation

2. Dashboard Coopérative
   - [ ] Réorganiser en 5 axes
   - [ ] Créer les composants pour chaque axe
   - [ ] Tester la navigation

### Phase 3 : Tests et Validation (Priorité Haute)
- [ ] Tester le workflow complet "Une journée avec SUTA"
- [ ] Tester le parcours marchand (5 étapes)
- [ ] Tester le parcours coopérative (5 axes)
- [ ] Valider la cohérence entre les 3 workflows

---

## 🎨 Principes de Design

### Cohérence Visuelle
- Utiliser les couleurs du thème : Orange (#F97316) et Vert (#22C55E)
- Avatar SUTA : Rond, gradient orange, icônes expressives
- Animations : Subtiles mais présentes (bounce, fade, slide)

### Accessibilité
- Boutons larges (min 48x48px)
- Textes lisibles (min 16px)
- Contrastes élevés
- Support vocal complet

### Performance
- Lazy loading des composants lourds
- Optimisation des requêtes tRPC
- Cache intelligent

---

## 🚀 Commandes Utiles

### Développement
```bash
# Démarrer le serveur de développement
pnpm dev

# Vérifier les erreurs TypeScript
pnpm typecheck

# Pousser les changements de schéma vers la DB
pnpm db:push
```

### Tests
```bash
# Lancer les tests
pnpm test

# Tests en mode watch
pnpm test:watch
```

### Déploiement
```bash
# Créer un checkpoint
# Via l'interface Manus ou webdev_save_checkpoint

# Publier
# Cliquer sur le bouton "Publish" dans l'UI Manus
```

---

## 📚 Ressources

- **Documents de référence :**
  - `pasted_content.txt` - Scénario "Une journée avec SUTA"
  - `Synthèse_Parcours_Marchand.docx` - Parcours marchand (5 étapes)
  - `Synthèseduparcourscoopérative.docx` - Parcours coopérative (5 axes)

- **Fichiers clés du projet :**
  - `server/routers.ts` - Tous les routers tRPC
  - `client/src/App.tsx` - Routes et navigation
  - `drizzle/schema.ts` - Schéma de base de données

---

## ✅ Checklist de Livraison

### Workflow SUTA
- [ ] Briefing Matinal fonctionnel
- [ ] Vente Vocale avec épargne automatique
- [ ] Intelligence Collective avec notifications
- [ ] Bilan de Journée automatique à 19h00

### Dashboards
- [ ] Dashboard Marchand restructuré (5 sections)
- [ ] Dashboard Coopérative restructuré (5 axes)

### Tests
- [ ] Workflow complet testé de bout en bout
- [ ] Tests unitaires pour les nouvelles fonctionnalités
- [ ] Tests d'accessibilité

### Documentation
- [ ] README mis à jour
- [ ] Guide utilisateur créé
- [ ] Commentaires dans le code

---

**Date de création :** 26 décembre 2024  
**Dernière mise à jour :** 26 décembre 2024  
**Version :** 1.0
