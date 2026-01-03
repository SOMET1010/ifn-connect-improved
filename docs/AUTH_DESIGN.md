# 🔐 Conception Système d'Authentification OTP SMS + PIN
**Date**: 3 janvier 2026
**Priorité**: P0-1 (CRITIQUE)
**Effort**: 3 jours

---

## 🎯 Objectif

Implémenter un système d'authentification multi-niveaux adapté au contexte ivoirien:
1. **Numéro de téléphone** comme identifiant principal
2. **OTP SMS** pour vérification du numéro
3. **PIN à 4 chiffres** pour accès rapide et sécurisé

---

## 🔄 Flux d'Authentification

### Flux Nouveau Utilisateur

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. SAISIE TÉLÉPHONE                                             │
│    - Input: +225 XX XX XX XX XX                                 │
│    - Validation: Format ivoirien                                │
│    - Bouton: "Continuer"                                        │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. GÉNÉRATION OTP                                               │
│    - Backend génère code 6 chiffres                             │
│    - Enregistre dans table otp_codes (expire 5 min)            │
│    - Envoi SMS via opérateur                                    │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. VÉRIFICATION OTP                                             │
│    - Input: 6 chiffres                                          │
│    - Max 3 tentatives                                           │
│    - Bouton "Renvoyer le code" (après 60 sec)                  │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. CRÉATION COMPTE (si nouveau)                                │
│    - Créer user dans DB                                         │
│    - phone = identifiant unique                                 │
│    - Demander nom + rôle                                        │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. CRÉATION PIN                                                 │
│    - Input: 4 chiffres                                          │
│    - Confirmation: 4 chiffres                                   │
│    - Hash + stockage dans users.pinCode                         │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. SESSION CRÉÉE                                                │
│    - Générer JWT token                                          │
│    - Cookie sécurisé (1 an)                                     │
│    - Redirection dashboard                                      │
└─────────────────────────────────────────────────────────────────┘
```

### Flux Utilisateur Existant (Connexion Rapide avec PIN)

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. SAISIE TÉLÉPHONE                                             │
│    - Input: +225 XX XX XX XX XX                                 │
│    - Backend vérifie existence user                             │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. SAISIE PIN                                                   │
│    - Input: 4 chiffres                                          │
│    - Vérification hash                                          │
│    - Max 5 tentatives (sinon → OTP obligatoire)                │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. SESSION CRÉÉE                                                │
│    - JWT token + cookie                                         │
│    - Redirection dashboard                                      │
└─────────────────────────────────────────────────────────────────┘
```

### Flux "J'ai oublié mon PIN"

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. CLIC "PIN oublié ?"                                          │
│    - Retour au flux OTP SMS complet                             │
│    - Génération OTP + envoi SMS                                 │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. VÉRIFICATION OTP                                             │
│    - Input 6 chiffres                                           │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. RÉINITIALISATION PIN                                         │
│    - Nouveau PIN 4 chiffres                                     │
│    - Confirmation                                               │
│    - Update users.pinCode                                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Schéma de Base de Données

### Table: otp_codes

```sql
CREATE TABLE otp_codes (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(20) NOT NULL,
  code VARCHAR(6) NOT NULL,
  attempts INTEGER DEFAULT 0 NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  INDEX idx_phone (phone),
  INDEX idx_expires_at (expires_at)
);
```

**Champs:**
- `phone`: Numéro de téléphone (+225XXXXXXXXXX)
- `code`: Code OTP 6 chiffres (hashé)
- `attempts`: Nombre de tentatives de vérification (max 3)
- `is_verified`: Flag de vérification réussie
- `expires_at`: Expiration après 5 minutes
- `created_at`: Date de création

### Table: users (modifications)

```sql
-- Colonnes existantes:
-- id, openId, name, email, phone, role, pinCode, ...

-- pinCode sera utilisé pour stocker le hash du PIN
-- phone sera l'identifiant unique principal
```

**Modifications nécessaires:**
- Rendre `phone` UNIQUE et NOT NULL
- `pinCode` stockera le hash bcrypt du PIN
- Ajouter `pin_failed_attempts` INTEGER DEFAULT 0
- Ajouter `pin_locked_until` TIMESTAMP (verrouillage temporaire après 5 échecs)

### Table: auth_logs (nouvelle - pour audit)

```sql
CREATE TABLE auth_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  phone VARCHAR(20) NOT NULL,
  action VARCHAR(50) NOT NULL, -- 'otp_sent', 'otp_verified', 'pin_success', 'pin_failed', 'login'
  ip_address VARCHAR(45),
  user_agent TEXT,
  success BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  INDEX idx_user_id (user_id),
  INDEX idx_phone (phone),
  INDEX idx_created_at (created_at)
);
```

---

## 🔌 Intégration SMS

### Opérateurs Recommandés (Côte d'Ivoire)

1. **InfoBip** (recommandé)
   - API REST simple
   - Couverture CI: 99%
   - Coût: ~25 FCFA/SMS
   - Documentation: https://www.infobip.com/docs

2. **Twilio**
   - API mature
   - Couverture CI: 95%
   - Coût: ~30 FCFA/SMS
   - Documentation: https://www.twilio.com/docs

3. **Africa's Talking**
   - Spécialisé Afrique
   - Coût: ~20 FCFA/SMS
   - Documentation: https://developers.africastalking.com

### Configuration (variables .env)

```bash
# SMS Provider
SMS_PROVIDER=infobip # ou 'twilio' ou 'africas_talking'
SMS_API_KEY=your_api_key_here
SMS_API_SECRET=your_api_secret_here
SMS_SENDER_ID=IFN_CONNECT # Nom affiché (10 char max)

# OTP Settings
OTP_EXPIRY_MINUTES=5
OTP_MAX_ATTEMPTS=3
OTP_RESEND_DELAY_SECONDS=60

# PIN Settings
PIN_MAX_ATTEMPTS=5
PIN_LOCKOUT_MINUTES=30
```

### Template SMS

```
Votre code IFN Connect est: {CODE}
Valide pendant 5 minutes.
Ne partagez jamais ce code.
```

---

## 🛡️ Sécurité

### Hashing

- **OTP**: Hash SHA-256 avant stockage en DB
- **PIN**: Hash bcrypt (rounds: 10) avant stockage
- **Comparaison**: Toujours utiliser timing-safe comparison

### Rate Limiting

- **Envoi OTP**: Max 3 SMS par numéro/heure (protection spam)
- **Vérification OTP**: Max 3 tentatives par code
- **Tentatives PIN**: Max 5 tentatives (puis verrouillage 30 min)
- **Général**: Max 10 requêtes/minute par IP

### Protection CSRF

- Utiliser des tokens CSRF pour toutes les requêtes POST
- Valider l'origin des requêtes

### Validation

- **Téléphone**: Format ivoirien strict (+225XXXXXXXXXX)
- **OTP**: Exactement 6 chiffres
- **PIN**: Exactement 4 chiffres, pas de séquences évidentes (1234, 0000, etc.)

---

## 📡 API tRPC Procedures

### auth.sendOtp

```typescript
input: {
  phone: string; // +225XXXXXXXXXX
}
output: {
  success: boolean;
  message: string;
  expiresAt: Date;
  resendAvailableAt: Date;
}
```

### auth.verifyOtp

```typescript
input: {
  phone: string;
  code: string; // 6 chiffres
}
output: {
  success: boolean;
  isNewUser: boolean;
  tempToken?: string; // Pour création compte/PIN
}
```

### auth.createAccount

```typescript
input: {
  tempToken: string;
  name: string;
  role: 'merchant' | 'agent';
}
output: {
  success: boolean;
  userId: number;
}
```

### auth.setupPin

```typescript
input: {
  tempToken: string; // ou userId si authentifié
  pin: string; // 4 chiffres
  pinConfirmation: string;
}
output: {
  success: boolean;
  sessionToken: string;
}
```

### auth.loginWithPin

```typescript
input: {
  phone: string;
  pin: string;
}
output: {
  success: boolean;
  sessionToken?: string;
  attemptsRemaining?: number;
  lockedUntil?: Date;
}
```

### auth.resetPin

```typescript
input: {
  phone: string;
  otpCode: string;
  newPin: string;
  newPinConfirmation: string;
}
output: {
  success: boolean;
  sessionToken: string;
}
```

---

## 🎨 Composants Frontend

### 1. LoginPhoneInput

```tsx
<LoginPhoneInput
  onSubmit={(phone) => sendOtp(phone)}
  loading={isSending}
/>
```

### 2. OtpVerification

```tsx
<OtpVerification
  phone={phone}
  onVerify={(code) => verifyOtp(code)}
  onResend={() => sendOtp(phone)}
  attemptsRemaining={3}
  expiresAt={expiresAt}
/>
```

### 3. PinSetup

```tsx
<PinSetup
  onSubmit={(pin) => setupPin(pin)}
  mode="create" // ou "reset"
/>
```

### 4. PinLogin

```tsx
<PinLogin
  phone={phone}
  onSubmit={(pin) => loginWithPin(pin)}
  onForgotPin={() => setStep('otp')}
  attemptsRemaining={5}
/>
```

### 5. AccountSetup (nouveau utilisateur)

```tsx
<AccountSetup
  phone={phone}
  onSubmit={(data) => createAccount(data)}
/>
```

---

## ✅ Tests à Implémenter

### Tests Unitaires

- ✅ Génération OTP (6 chiffres aléatoires)
- ✅ Hash OTP (SHA-256)
- ✅ Vérification OTP (timing-safe)
- ✅ Hash PIN (bcrypt)
- ✅ Validation téléphone ivoirien
- ✅ Rate limiting SMS
- ✅ Expiration OTP (5 minutes)
- ✅ Verrouillage PIN (5 tentatives)

### Tests d'Intégration

- ✅ Flux complet nouveau utilisateur
- ✅ Flux complet connexion PIN
- ✅ Flux réinitialisation PIN
- ✅ Gestion erreurs (OTP expiré, PIN invalide, etc.)
- ✅ Concurrent requests (race conditions)

### Tests E2E (Playwright)

- ✅ Enrôlement complet agent → marchand
- ✅ Connexion marchand avec PIN
- ✅ Oubli PIN → Réinitialisation
- ✅ Tentatives multiples échecs PIN
- ✅ SMS reçu et validé (avec mock)

---

## 📋 Checklist d'Implémentation

### Backend

- [ ] Migration: Créer table `otp_codes`
- [ ] Migration: Modifier table `users` (phone unique, pin_failed_attempts, pin_locked_until)
- [ ] Migration: Créer table `auth_logs`
- [ ] Service SMS: Configurer InfoBip (ou autre)
- [ ] Procédure: `auth.sendOtp`
- [ ] Procédure: `auth.verifyOtp`
- [ ] Procédure: `auth.createAccount`
- [ ] Procédure: `auth.setupPin`
- [ ] Procédure: `auth.loginWithPin`
- [ ] Procédure: `auth.resetPin`
- [ ] Middleware: Rate limiting
- [ ] Utils: Hash/verify OTP
- [ ] Utils: Hash/verify PIN
- [ ] Utils: Validation téléphone
- [ ] Logs: Audit trail

### Frontend

- [ ] Page: `/login` (routeur)
- [ ] Composant: `LoginPhoneInput`
- [ ] Composant: `OtpVerification`
- [ ] Composant: `PinSetup`
- [ ] Composant: `PinLogin`
- [ ] Composant: `AccountSetup`
- [ ] Hook: `useOtpLogin`
- [ ] Hook: `usePinAuth`
- [ ] Utils: Format téléphone
- [ ] Utils: Validation PIN
- [ ] Redirection après login

### Tests

- [ ] Tests unitaires backend (10 tests)
- [ ] Tests intégration (5 tests)
- [ ] Tests E2E (4 scénarios)

### Documentation

- [ ] Guide utilisateur: Comment se connecter
- [ ] Guide admin: Gestion SMS provider
- [ ] README: Variables d'environnement
- [ ] API docs: Endpoints auth

---

## 🚀 Plan d'Exécution (3 jours)

### Jour 1: Backend Core
- ✅ Migrations base de données
- ✅ Service SMS (InfoBip)
- ✅ Procédures auth.sendOtp + auth.verifyOtp
- ✅ Tests unitaires

### Jour 2: Backend Complet + Frontend Base
- ✅ Procédures auth restantes (PIN, compte)
- ✅ Middleware rate limiting
- ✅ Composants frontend (LoginPhoneInput, OtpVerification)
- ✅ Tests intégration

### Jour 3: Frontend Complet + Tests E2E
- ✅ Composants frontend restants (PIN)
- ✅ Hook useOtpLogin
- ✅ Page /login complète
- ✅ Tests E2E
- ✅ Documentation

---

**Prochaine Étape**: Créer les migrations de base de données
