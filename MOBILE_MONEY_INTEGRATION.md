# Intégration Mobile Money - Orange Money & MTN MoMo

## 📋 Vue d'Ensemble

Ce document détaille l'intégration des paiements **Orange Money** et **MTN Mobile Money** dans la plateforme IFN Connect pour permettre les transactions entre marchands dans le marché virtuel.

## 🎯 Objectifs

- Permettre aux marchands d'acheter des produits sur le marché virtuel
- Accepter les paiements Orange Money et MTN Mobile Money
- Gérer les webhooks de confirmation de paiement
- Traiter les échecs et remboursements automatiques
- Assurer la sécurité et la conformité réglementaire

---

## 🟠 Orange Money Web Payment API

### Informations Générales

- **API** : Orange Money Web Payment / M Payment 1.0
- **Documentation** : https://developer.orange.com/apis/om-webpay
- **Disponibilité** : Mali, Cameroun, **Côte d'Ivoire**, Sénégal, Madagascar, Botswana, Guinée Conakry, Guinée Bissau, Sierra Leone, RD Congo, République Centrafricaine

### Processus d'Inscription

1. **Inscription obligatoire** : Le marchand doit s'inscrire dans un magasin Orange de son pays
2. **KYA complet** : Enregistrement officiel comme commerçant Orange Money (conformité réglementaire)
3. **Documents requis** : Registre du commerce et autres documents selon la législation locale
4. **Approbation** : Validation par la banque centrale

### Flux de Paiement

1. **Client choisit Orange Money** sur le site marchand
2. **Génération OTP** : Client demande un mot de passe temporaire via USSD (code secret Orange Money)
3. **Saisie OTP** : Client entre le mot de passe temporaire sur l'écran de paiement
4. **Validation** : Paiement validé et confirmé

### Intégration Technique

- **Facilité** : Quelques lignes de code seulement
- **Environnement de test** : Disponible pour les marchands et intégrateurs
- **Partenaires d'intégration** : 1-2 partenaires disponibles dans chaque pays

### Limitations

- **Écosystème restreint** : Exposition API limitée pour conformité réglementaire
- **Sécurité** : Règles strictes anti-fraude
- **Approbation bancaire** : Service soumis à l'approbation de la banque centrale

---

## 🟡 MTN Mobile Money (MoMo) API

### Informations Générales

- **API** : MTN MoMo Open API
- **Documentation** : https://momodeveloper.mtn.com/
- **Sandbox** : https://momodeveloper.mtn.com/api-documentation/getting-started

### Produits Disponibles

1. **Collections** : Recevoir des paiements des clients
2. **Disbursements** : Envoyer de l'argent aux utilisateurs
3. **Remittances** : Transferts internationaux

### Intégration Technique

1. **Inscription** : Créer un compte sur MoMo Developer Portal
2. **Sandbox** : Tester l'API dans l'environnement de test
3. **API Key** : Obtenir les clés d'API (Primary Key, Secondary Key)
4. **Webhooks** : Configurer les URLs de callback pour les notifications

### Documentation

- **Getting Started** : https://momodeveloper.mtn.com/api-documentation/getting-started
- **Postman Collection** : https://www.postman.com/momoapis/momo-open-apis/documentation/0qcufs3/momo-open-apis-sandbox

---

## 🔄 Agrégateurs de Paiement (Alternative)

Si l'intégration directe est trop complexe, nous pouvons utiliser un **agrégateur** qui unifie Orange Money + MTN MoMo + autres providers :

### Option 1 : Chipdeals
- **URL** : https://chipdeals.me/
- **Avantage** : API unique pour 20+ providers africains (Orange Money, MTN MoMo, Wave, etc.)
- **Intégration** : Rapide et simple

### Option 2 : pawaPay
- **URL** : https://pawapay.io/
- **Avantage** : Agrégateur leader en Afrique, 15+ pays
- **Intégration** : API unique temps réel

### Option 3 : Onafriq
- **URL** : https://onafriq.com/
- **Avantage** : Plus grand réseau de paiements digitaux en Afrique (1 milliard de wallets)
- **Intégration** : Gateway temps réel

---

## 🏗️ Architecture Proposée

### Base de Données

```sql
-- Table transactions
CREATE TABLE transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  merchant_id INT NOT NULL,
  order_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'XOF',
  provider ENUM('orange_money', 'mtn_momo') NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  status ENUM('pending', 'success', 'failed', 'refunded') DEFAULT 'pending',
  transaction_id VARCHAR(255) UNIQUE,
  otp_code VARCHAR(10),
  error_message TEXT,
  webhook_data JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (merchant_id) REFERENCES merchants(id),
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- Table orders (marché virtuel)
CREATE TABLE orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  buyer_id INT NOT NULL,
  seller_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status ENUM('pending_payment', 'paid', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending_payment',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (buyer_id) REFERENCES merchants(id),
  FOREIGN KEY (seller_id) REFERENCES merchants(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);
```

### Procédures tRPC

```typescript
// server/routers/payments.ts
export const paymentsRouter = router({
  // Initier un paiement
  initiatePayment: protectedProcedure
    .input(z.object({
      orderId: z.number(),
      provider: z.enum(['orange_money', 'mtn_momo']),
      phoneNumber: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      // 1. Créer la transaction en DB
      // 2. Appeler l'API du provider
      // 3. Retourner l'URL de paiement ou OTP
    }),

  // Vérifier le statut d'un paiement
  checkPaymentStatus: protectedProcedure
    .input(z.object({ transactionId: z.string() }))
    .query(async ({ input }) => {
      // Interroger l'API du provider
    }),

  // Webhook de confirmation (public)
  paymentWebhook: publicProcedure
    .input(z.object({
      transactionId: z.string(),
      status: z.string(),
      // ... autres champs selon provider
    }))
    .mutation(async ({ input }) => {
      // 1. Vérifier la signature du webhook
      // 2. Mettre à jour la transaction en DB
      // 3. Mettre à jour le statut de la commande
      // 4. Notifier le marchand
    }),

  // Rembourser un paiement
  refundPayment: protectedProcedure
    .input(z.object({ transactionId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Appeler l'API de remboursement
    }),
});
```

### Composant UI

```tsx
// client/src/components/PaymentModal.tsx
export function PaymentModal({ orderId, amount, onSuccess }) {
  const [provider, setProvider] = useState<'orange_money' | 'mtn_momo'>('orange_money');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<'select' | 'phone' | 'otp' | 'processing'>('select');

  const initiatePayment = trpc.payments.initiatePayment.useMutation();
  const checkStatus = trpc.payments.checkPaymentStatus.useQuery();

  // Logique de paiement
}
```

---

## 🚀 Plan d'Implémentation

### Phase 1 : Choix de la Solution (1 jour)
- [ ] Décider : Intégration directe OU agrégateur
- [ ] Si directe : S'inscrire sur Orange Developer + MTN MoMo Portal
- [ ] Si agrégateur : Choisir Chipdeals/pawaPay/Onafriq

### Phase 2 : Schéma de Base de Données (1 jour)
- [ ] Créer la table `transactions`
- [ ] Créer la table `orders`
- [ ] Ajouter les index nécessaires
- [ ] Migrer la base de données

### Phase 3 : Backend (2 jours)
- [ ] Créer le router `payments.ts`
- [ ] Implémenter `initiatePayment`
- [ ] Implémenter `checkPaymentStatus`
- [ ] Implémenter `paymentWebhook`
- [ ] Implémenter `refundPayment`
- [ ] Tester avec Postman

### Phase 4 : Frontend (1 jour)
- [ ] Créer le composant `PaymentModal`
- [ ] Intégrer dans le marché virtuel
- [ ] Ajouter les logos Orange Money / MTN MoMo
- [ ] Gérer les états de chargement

### Phase 5 : Tests (1 jour)
- [ ] Tester en sandbox Orange Money
- [ ] Tester en sandbox MTN MoMo
- [ ] Tester les webhooks avec ngrok
- [ ] Tester les remboursements
- [ ] Tester les cas d'erreur

### Phase 6 : Production (1 jour)
- [ ] Obtenir les clés de production
- [ ] Configurer les webhooks en production
- [ ] Déployer
- [ ] Monitorer les premières transactions

**Total : 7 jours**

---

## ⚠️ Points d'Attention

1. **Conformité réglementaire** : Orange Money nécessite une inscription officielle comme commerçant
2. **Sécurité** : Vérifier les signatures des webhooks pour éviter la fraude
3. **Gestion des erreurs** : Prévoir tous les cas d'échec (solde insuffisant, OTP incorrect, timeout)
4. **Monitoring** : Logger toutes les transactions pour audit
5. **Support client** : Prévoir un processus de support pour les paiements échoués

---

## 📞 Contacts

- **Orange Money** : Contacter l'opérateur Orange local en Côte d'Ivoire
- **MTN MoMo** : https://momodeveloper.mtn.com/
- **Chipdeals** : https://chipdeals.me/
- **pawaPay** : https://pawapay.io/

---

**Dernière mise à jour** : 2025-12-25  
**Auteur** : Lead Engineer IFN Connect  
**Version** : 1.0.0
