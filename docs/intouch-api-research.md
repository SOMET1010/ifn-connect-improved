# Recherche API InTouch - Documentation

## Sources
- Site officiel : https://www.intouchgroup.net/en
- Documentation développeur : https://developers.intouchgroup.net/documentation/TRANSFER/1

## Vue d'ensemble

InTouch est une plateforme de paiement pan-africaine présente dans **27 pays africains** avec :
- Plus de 60 000 points de contact (TouchPoint)
- 1 500 stations TotalEnergies
- Support de tous les opérateurs Mobile Money (Orange Money, MTN, Moov, Wave)
- Certifications : PCI DSS, PSP Tanzania

## API Transfer (Cash-In / Dépôt)

### Endpoint
```
POST https://apidist.gutouch.net/apidist/sec/{agency_code}/cashin
```

### Authentification
- Type : **Basic Authentication**
- Header : `Authorization: Basic <base64(username:password)>`
- Credentials fournis par InTouch (login_api, password_api)

### Paramètres de requête

**Path params :**
- `agency_code` (string, required) : Account ID fourni par InTouch

**Body params :**
- `service_id` (string, required) : Code du service provider (ex: "SN_Payment_OrangeMoney", "CI_Payment_OrangeMoney")
- `recipient_phone_number` (string, required) : Numéro de téléphone du client
- `amount` (number, required) : Montant de la transaction
- `partner_id` (string, required) : Merchant ID fourni par InTouch
- `partner_transaction_id` (string, required) : ID de transaction unique généré par votre système
- `login_api` (string, required) : Login API fourni par InTouch
- `password_api` (string, required) : Mot de passe API fourni par InTouch
- `call_back_url` (string, required) : URL de callback pour notification de résultat

### Exemple de requête
```json
{
  "service_id": "SN_Payment_OrangeMoney",
  "recipient_phone_number": "771234567",
  "amount": 100,
  "partner_id": "PWA3398",
  "partner_transaction_id": "15908685691625",
  "login_api": "781234567",
  "password_api": "0852",
  "call_back_url": "http://adresse_de_votre_url_callback"
}
```

### Codes de réponse

| Code | Statut | Description |
|------|--------|-------------|
| 200 | SUCCESSFUL | Transaction réussie et fermée au niveau InTouch |
| 201 | PENDING | Statut non encore confirmé par le fournisseur |
| 203 | FAILED | Transaction similaire envoyée récemment (<10 min) |
| 204 | FAILED | Erreur serveur interne, réessayer plus tard |
| 206 | FAILED | Erreur serveur interne, réessayer plus tard |
| 207 | FAILED | Limite de transaction quotidienne atteinte (DMA) |
| 300 | FAILED | Transaction échouée et fermée au niveau InTouch |
| 400 | FAILED | Mauvaise requête |
| 401 | UNAUTHORIZED | Accès non autorisé au service |
| 403 | FAILED | L'état du compte ne permet pas cette opération |
| 404 | NOT FOUND | Ressource non disponible |

### Réponses typiques

**Succès (200) :**
```json
{
  "status": "SUCCESSFUL",
  "message": "SUCCESSFUL"
}
```

**En attente (201) :**
```json
{
  "status": "PENDING",
  "message": "Operation being processed."
}
```

**Échec (400) :**
```json
{
  "status": "FAILED",
  "message": "Bad request. / Custom message."
}
```

### Callback

Après traitement de la transaction, un callback est envoyé à l'URL fournie pour notifier le résultat final.

## Autres endpoints disponibles

### PAYMENT
- **Direct API** (PUT) : Paiement direct
- **Checkout page** (SCRIPT) : Page de paiement hébergée
- **Payment Link** (POST) : Génération de liens de paiement

### PLATFORM SERVICES
- **Check Status** (POST) : Vérifier le statut d'une transaction
- **Get Balance** (POST) : Obtenir le solde du compte

### AIRTIME
- **Airtime** (POST) : Recharge de crédit téléphonique

### BILLERS
- Paiement de factures (électricité, eau, etc.)

## Service IDs pour Côte d'Ivoire (à confirmer)

Basé sur la convention observée, les service_id pour CI seraient probablement :
- `CI_Payment_OrangeMoney` : Orange Money Côte d'Ivoire
- `CI_Payment_MTN` : MTN Mobile Money Côte d'Ivoire
- `CI_Payment_Moov` : Moov Money Côte d'Ivoire
- `CI_Payment_Wave` : Wave Côte d'Ivoire

**⚠️ À CONFIRMER** avec InTouch lors de l'obtention des credentials.

## Prochaines étapes

1. **Contacter InTouch** pour obtenir :
   - `agency_code` (Account ID)
   - `partner_id` (Merchant ID)
   - `login_api` et `password_api`
   - Liste exacte des `service_id` pour Côte d'Ivoire
   - Accès à l'environnement sandbox pour tests

2. **Implémenter** :
   - Helper `/server/_core/intouch.ts` avec les fonctions d'API
   - Gestion des callbacks pour notifications asynchrones
   - Système de retry pour les transactions en attente
   - Logs et monitoring des transactions

3. **Tester** :
   - Environnement sandbox avec transactions de test
   - Tous les cas d'erreur (timeout, échec, limite atteinte)
   - Callbacks et webhooks

## Notes importantes

- **Authentification** : Basic Auth avec credentials fournis par InTouch
- **Callback obligatoire** : L'URL de callback doit être accessible publiquement
- **Idempotence** : Utiliser des `partner_transaction_id` uniques pour éviter les doublons
- **Limite de 10 minutes** : Ne pas renvoyer une transaction similaire avant 10 minutes
- **Statut asynchrone** : Les transactions peuvent être PENDING puis notifiées via callback


## API Direct Payment (Collecte de fonds)

### Endpoint
```
PUT https://apidist.gutouch.net/apidist/sec/touchpayapi/{agency_code}/transaction?loginAgent={XXX}&passwordAgent={XXX}
```

### Authentification
- Type : **Basic Authentication**
- Header : `Authorization: Basic <base64(username:password)>`
- Query params : `loginAgent` et `passwordAgent` fournis par InTouch

### Paramètres de requête

**Path params :**
- `agency_code` (string, required) : Account ID fourni par InTouch

**Query params :**
- `loginAgent` (string, required) : ID assigné au partenaire
- `passwordAgent` (string, required) : Mot de passe agent fourni par InTouch

**Body params :**
- `partner_id` (string, required) : Merchant ID fourni par InTouch
- `idFromClient` (string, required) : ID de transaction unique généré par votre système
- `additionnalInfos.recipientEmail` (string, required) : Email du client
- `additionnalInfos.recipientFirstName` (string, required) : Prénom du client
- `additionnalInfos.recipientLastName` (string, required) : Nom du client
- `amount` (string, required) : Montant de la transaction
- `callback` (string, required) : URL de callback pour notification
- `recipientNumber` (string, required) : Numéro de téléphone du client
- `additionnalInfos.otp` (string, required) : **Code OTP généré par l'opérateur Mobile Money** pour confirmer la transaction
- `serviceCode` (string, required) : ID du service fourni par InTouch (ex: "PAIEMENTMARCHANDOMPAYCIDIRECT")

### Exemple de requête
```json
{
  "partner_id": "MERCHANT123",
  "idFromClient": "47854111126445654654",
  "additionnalInfos": {
    "recipientEmail": "john.doe@gmail.com",
    "recipientFirstName": "John",
    "recipientLastName": "Doe",
    "destinataire": "0802243521",
    "otp": "5654"
  },
  "amount": "100",
  "callback": "https://your_callback_url",
  "recipientNumber": "0802243521",
  "serviceCode": "PAIEMENTMARCHANDOMPAYCIDIRECT"
}
```

### Codes de réponse

| Code | Statut | Description |
|------|--------|-------------|
| 200 | SUCCESSFUL | Transaction réussie et fermée au niveau InTouch |
| 300 | FAILED | Code OTP incorrect |
| 400 | FAILED | Mauvaise requête |
| 401 | UNAUTHORIZED | Non autorisé |
| 403 | FORBIDDEN | Interdit |
| 404 | NOT FOUND | Ressource non trouvée |

### ⚠️ Note importante sur l'OTP

L'API Direct Payment **nécessite un code OTP** que le client doit générer depuis :
- L'application Mobile Money de son opérateur (Orange Money, MTN, Moov, Wave)
- Le menu USSD de son opérateur

**Flow utilisateur :**
1. Client saisit son numéro de téléphone sur votre plateforme
2. Client génère un OTP depuis son app Mobile Money
3. Client saisit l'OTP sur votre plateforme
4. Votre backend envoie la requête avec l'OTP à InTouch
5. InTouch valide l'OTP et débite le compte

**Limitation :** Ce flow nécessite que le client quitte votre application pour générer l'OTP, ce qui peut créer de la friction.

## Comparaison Transfer vs Direct Payment

| Critère | Transfer (Cash-In) | Direct Payment |
|---------|-------------------|----------------|
| **Direction** | Dépôt vers un wallet | Collecte depuis un wallet |
| **OTP requis** | ❌ Non | ✅ Oui (généré par le client) |
| **Flow utilisateur** | Simple, transparent | Friction (client doit générer OTP) |
| **Use case** | Paiement de salaires, remboursements | Paiement marchand avec validation client |
| **Idéal pour CNPS/CMU** | ❌ Non (on collecte, pas on dépose) | ✅ Oui (mais friction OTP) |

## Recommandation pour PNAVIM-CI

Pour les paiements CNPS/CMU, nous avons **2 options** :

### Option 1 : Direct Payment (avec OTP) ✅ Recommandé
- **Avantages** : Flow de paiement standard, client valide explicitement
- **Inconvénients** : Client doit générer OTP manuellement (friction)
- **Implémentation** :
  1. Client saisit son numéro
  2. Instructions affichées : "Générez un code OTP depuis votre app Orange Money/MTN/Moov"
  3. Client saisit l'OTP
  4. Paiement traité

### Option 2 : Transfer inversé (sans OTP) ⚠️ À valider
- **Avantages** : Pas de friction OTP
- **Inconvénients** : Nécessite que le client initie le paiement depuis son wallet (push payment)
- **Implémentation** : À confirmer avec InTouch si possible

**Décision recommandée :** Utiliser **Direct Payment** avec un flow UX optimisé pour guider le client dans la génération de l'OTP.
