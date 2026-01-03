# 🔐 P0-1: Authentification OTP SMS + PIN - Progression

**Date de début**: 3 janvier 2026
**Priorité**: P0 (CRITIQUE)
**Effort estimé**: 3 jours
**Statut actuel**: Jour 1 - Migrations complétées

---

## ✅ Jour 1: Backend Core & Migrations (TERMINÉ)

### Conception ✅
- [x] Document de conception complet (`docs/AUTH_DESIGN.md`)
- [x] Flux d'authentification définis (nouveau user, user existant, PIN oublié)
- [x] Schéma de base de données conçu
- [x] API tRPC procedures spécifiées
- [x] Composants frontend spécifiés

### Migrations Base de Données ✅
- [x] Migration SQL créée (`drizzle/0025_auth_otp_system.sql`)
- [x] Table `otp_codes` (codes OTP temporaires)
- [x] Table `auth_logs` (logs d'audit)
- [x] Table `users` modifiée (ajout colonnes PIN)
  - `pinFailedAttempts` (compteur tentatives)
  - `pinLockedUntil` (verrouillage temporaire)
  - `phoneVerified` (téléphone vérifié)
  - `phoneVerifiedAt` (date de vérification)
  - `phone` rendu UNIQUE
- [x] Indexes optimisés
- [x] RLS activé sur toutes les tables
- [x] Fonction de nettoyage automatique OTP expirés

### Schémas TypeScript ✅
- [x] Fichier `drizzle/schema-auth.ts` créé
  - Types `OtpCode`, `InsertOtpCode`
  - Types `AuthLog`, `InsertAuthLog`
  - Constantes `AUTH_ACTIONS`
- [x] Table `users` mise à jour dans `schema.ts`
  - Nouveaux champs PIN ajoutés
  - Types TypeScript à jour

---

## 🔄 Jour 1 Suite: Service SMS & Procédures tRPC (EN COURS)

### Service SMS (À FAIRE)
- [ ] Choisir provider (InfoBip recommandé pour CI)
- [ ] Installer SDK npm (`npm install @infobip-api/sdk`)
- [ ] Créer `server/_core/sms.ts`
  - Fonction `sendOtp(phone, code)`
  - Configuration provider via .env
  - Template SMS localisé (FR/Dioula)
  - Gestion erreurs réseau
  - Logs d'envoi
- [ ] Variables environnement
  - `SMS_PROVIDER`
  - `SMS_API_KEY`
  - `SMS_API_SECRET`
  - `SMS_SENDER_ID`
  - `OTP_EXPIRY_MINUTES`
  - `OTP_MAX_ATTEMPTS`

### Utilitaires Crypto (À FAIRE)
- [ ] Créer `server/_core/crypto-utils.ts`
  - `hashOtp(code: string): string` (SHA-256)
  - `verifyOtp(code: string, hash: string): boolean`
  - `hashPin(pin: string): Promise<string>` (bcrypt)
  - `verifyPin(pin: string, hash: string): Promise<boolean>`
  - `generateOtpCode(): string` (6 chiffres random)
  - `validatePhoneCI(phone: string): boolean`

### Base de Données Helpers (À FAIRE)
- [ ] Créer `server/db-auth.ts`
  - `createOtpCode(phone, code, expiresAt)`
  - `getActiveOtp(phone)`
  - `incrementOtpAttempts(id)`
  - `markOtpVerified(id)`
  - `cleanupExpiredOtps()`
  - `logAuthAction(userId, phone, action, success, ...)`
  - `getUserByPhone(phone)`
  - `updateUserPin(userId, hashedPin)`
  - `incrementPinFailedAttempts(userId)`
  - `resetPinFailedAttempts(userId)`
  - `lockUserPin(userId, until)`

### Procédures tRPC (À FAIRE)
- [ ] Créer `server/routers/auth.ts` (complet avec 7 procédures)
  1. `auth.sendOtp`
     - Valider téléphone ivoirien
     - Vérifier rate limit (3 SMS/heure)
     - Générer code 6 chiffres
     - Hash + sauvegarder en DB
     - Envoyer SMS
     - Logger action
  2. `auth.verifyOtp`
     - Vérifier code non expiré
     - Vérifier < 3 tentatives
     - Comparer hash
     - Marquer vérifié
     - Retourner tempToken si nouveau user
  3. `auth.createAccount`
     - Valider tempToken
     - Créer user
     - Marquer phone_verified=true
     - Retourner userId
  4. `auth.setupPin`
     - Valider PIN (4 chiffres, pas 1234/0000)
     - Hash bcrypt
     - Sauvegarder users.pinCode
     - Créer session JWT
  5. `auth.loginWithPin`
     - Vérifier user existe
     - Vérifier PIN non verrouillé
     - Vérifier < 5 tentatives
     - Comparer hash
     - Si échec: incrémenter compteur
     - Si 5 échecs: verrouiller 30 min
     - Si succès: reset compteur + session
  6. `auth.resetPin`
     - Vérifier OTP d'abord
     - Valider nouveau PIN
     - Hash + update
     - Créer session
  7. `auth.me` (mise à jour)
     - Ajouter champs PIN dans réponse

### Rate Limiting (À FAIRE)
- [ ] Ajouter middleware rate limit dans `server/_core/rate-limit.ts`
  - OTP: Max 3 SMS par numéro/heure
  - Login: Max 10 tentatives par IP/heure
  - Global: Max 100 req/min par IP

---

## 📅 Jour 2: Frontend (PLANIFIÉ)

### Composants React
- [ ] `client/src/components/auth/LoginPhoneInput.tsx`
- [ ] `client/src/components/auth/OtpVerification.tsx`
- [ ] `client/src/components/auth/PinSetup.tsx`
- [ ] `client/src/components/auth/PinLogin.tsx`
- [ ] `client/src/components/auth/AccountSetup.tsx`

### Hooks
- [ ] `client/src/hooks/useOtpLogin.ts`
- [ ] `client/src/hooks/usePinAuth.ts`

### Page
- [ ] `client/src/pages/Login.tsx`
  - Router avec étapes
  - Gestion state multi-étapes
  - Redirection après login

### Utils
- [ ] `client/src/lib/phone-utils.ts`
  - Format téléphone CI
  - Validation
- [ ] `client/src/lib/pin-utils.ts`
  - Validation PIN
  - Détection séquences évidentes

---

## 📅 Jour 3: Tests & Documentation (PLANIFIÉ)

### Tests Unitaires Backend
- [ ] `server/crypto-utils.test.ts` (8 tests)
- [ ] `server/db-auth.test.ts` (10 tests)
- [ ] `server/routers/auth.test.ts` (15 tests)

### Tests E2E
- [ ] `e2e/auth-new-user.spec.ts`
- [ ] `e2e/auth-existing-user.spec.ts`
- [ ] `e2e/auth-pin-forgot.spec.ts`
- [ ] `e2e/auth-pin-locked.spec.ts`

### Documentation
- [ ] Guide utilisateur: Comment se connecter
- [ ] Guide admin: Configuration SMS provider
- [ ] README: Variables environnement
- [ ] Update `PLAN_RECUPERATION_COMPLETE.md`

---

## 🔍 Checklist de Validation

### Backend
- [ ] Migrations exécutées sans erreur
- [ ] SMS envoyés et reçus (test manuel)
- [ ] OTP valide accepté
- [ ] OTP expiré rejeté
- [ ] Max 3 tentatives OTP
- [ ] PIN hash stocké (jamais plain text)
- [ ] PIN valide accepté
- [ ] PIN invalide rejeté après 5 tentatives
- [ ] Verrouillage PIN 30 min fonctionne
- [ ] Rate limiting SMS fonctionne
- [ ] Logs d'audit créés pour toutes actions

### Frontend
- [ ] Champ téléphone avec format auto (+225)
- [ ] Validation téléphone en temps réel
- [ ] OTP input 6 chiffres
- [ ] Countdown expiration visible
- [ ] Bouton "Renvoyer" après 60 sec
- [ ] PIN input 4 chiffres
- [ ] PIN confirmation match
- [ ] Messages d'erreur clairs
- [ ] Loading states visibles
- [ ] Redirection après login

### Sécurité
- [ ] Tous les hash utilisent bcrypt/SHA-256
- [ ] Comparaisons timing-safe
- [ ] RLS activé
- [ ] Rate limiting actif
- [ ] CSRF protection
- [ ] Session tokens HttpOnly
- [ ] Logs d'audit complets
- [ ] Pas de secrets en logs

---

## 📊 Métriques

### Complexité
- **Fichiers créés**: 15+
- **Lignes de code**: ~2000
- **Tests**: 33+
- **Migrations**: 1

### Performance Attendue
- **Envoi SMS**: < 3 sec
- **Vérification OTP**: < 100 ms
- **Login PIN**: < 200 ms
- **Création compte**: < 500 ms

---

**Prochaine tâche immédiate**: Implémenter le service SMS (InfoBip)
