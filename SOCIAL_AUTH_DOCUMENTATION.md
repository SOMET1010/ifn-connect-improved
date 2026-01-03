# Système d'Authentification Sociale PNAVIM

## Vue d'ensemble

Le système d'authentification sociale PNAVIM est un mécanisme d'authentification innovant conçu spécifiquement pour les marchands ivoiriens du secteur informel. Il élimine les barrières traditionnelles (email/mot de passe) au profit d'une approche basée sur la confiance sociale et le contexte.

## Principes Fondamentaux

### 1. Règle d'Or (Prime Directive)
**L'authentification sociale est la SEULE méthode de connexion valide par défaut.**

Interdictions absolues :
- ❌ Demander un mot de passe complexe
- ❌ Demander une adresse email
- ❌ Envoyer un lien de connexion
- ❌ Utiliser un QR code

### 2. Architecture en Couches (Layers)

#### Layer 1: Identification Vocale
- **Input**: Numéro de téléphone
- **Message type**: "C'est qui est là ? Dis-moi ton numéro."
- **Langue**: Français ivoirien / Dioula

#### Layer 2: Trust Score (Score de Confiance)
Le système calcule automatiquement un score de confiance (0-100) basé sur :

| Facteur | Poids | Points Max |
|---------|-------|------------|
| Device Recognition | 30% | 30 |
| Social Proof | 40% | 40 |
| Location Context | 15% | 15 |
| Time Patterns | 10% | 10 |
| Historical Behavior | 5% | 5 |

**Décisions basées sur le score** :
- **70-100** : ✅ Accès immédiat ("Bonne arrivée [Nom]")
- **40-69** : ⚠️ Challenge social requis
- **0-39** : 🔒 Validation par agent terrain

#### Layer 3: Challenge Social (Si Score < 70)
Questions culturelles hashées en base de données :

**Catégories de questions** :
1. **Family** (Famille)
   - "Rappelle-moi le prénom de ta maman ?"
   - "Comment on t'appelle à la maison ?"

2. **Location** (Localisation)
   - "Tu vends dans quel marché d'habitude ?"
   - "C'est dans quelle commune que tu habites ?"

3. **Business** (Commerce)
   - "C'est quel jour que tu arrives au marché ?"

4. **Community** (Communauté)
   - "C'est quoi ton surnom au quartier ?"
   - "Tu vends à côté de qui au marché ?"
   - "Quel est le nom de ton chef de marché ?"

#### Layer 4: Fallback Humain
Si l'utilisateur échoue au challenge :
- **Message**: "Je ne te reconnais pas bien aujourd'hui. On va appeler un agent pour t'aider, ne quitte pas."
- **Action**: Transfert vers un agent terrain

## Personas (Adaptation du Ton)

### Persona "Tantie Sagesse" (Femmes âgées)
**Caractéristiques** :
- Ton maternel, lent, rassurant
- Vocabulaire : "Ma fille", "Doucement", "Y'a pas de problème"

**Exemples** :
```
"C'est qui est là ? Dis-moi ton numéro ma fille."
"Écris ton numéro doucement, y'a pas de problème."
"C'est bon ma fille! Entre, on va gérer ton commerce."
```

### Persona "Le Jeune / Gbairai" (Jeunes hommes)
**Caractéristiques** :
- Ton rapide, direct, dynamique
- Vocabulaire : "Mon vieux", "Chap-chap", "C'est validé", "Y'a pas drap"

**Exemples** :
```
"C'est qui est là ? Dis-moi ton numéro mon vieux."
"Tape ton numéro chap-chap."
"C'est validé! Y'a pas drap, entre."
```

**Détection automatique** :
- Basée sur le dernier chiffre du numéro de téléphone
- Pair → Tantie
- Impair → Jeune

## Architecture Technique

### Base de Données

#### Tables Principales

**social_challenges**
```sql
- id (serial)
- question_fr (text)
- question_dioula (text, nullable)
- category (enum: family, location, business, community)
- difficulty (1-3)
- is_active (boolean)
```

**merchant_challenges**
```sql
- id (serial)
- merchant_id (integer)
- challenge_id (integer)
- answer_hash (text) -- Hashed avec bcrypt
- is_primary (boolean)
```

**auth_attempts**
```sql
- id (serial)
- user_id (integer, nullable)
- phone (varchar 20)
- device_fingerprint (text)
- trust_score (integer 0-100)
- decision (enum: allow, challenge, validate)
- latitude/longitude (decimal, optional)
- challenge_passed (boolean, nullable)
- success (boolean)
```

**merchant_devices**
```sql
- id (serial)
- merchant_id (integer)
- device_fingerprint (text)
- device_name (varchar 100)
- times_used (integer)
- is_trusted (boolean)
```

### API Endpoints (tRPC)

#### 1. `socialAuth.initiateLogin`
**Input** :
```typescript
{
  phone: string
  deviceFingerprint: string
  latitude?: number
  longitude?: number
  ipAddress?: string
  userAgent?: string
}
```

**Output** :
```typescript
{
  status: 'APPROVED' | 'CHALLENGE_REQUIRED' | 'FALLBACK_AGENT'
  trustScore: number
  decision: 'allow' | 'challenge' | 'validate'
  message: string
  challenge?: {
    id: number
    questionFr: string
    questionDioula?: string
    category: string
  }
}
```

#### 2. `socialAuth.answerChallenge`
**Input** :
```typescript
{
  phone: string
  challengeId: number
  answer: string
  deviceFingerprint: string
}
```

**Output** :
```typescript
{
  success: boolean
  status: 'APPROVED' | 'FALLBACK_AGENT'
  message: string
  sessionToken?: string
}
```

#### 3. `socialAuth.setupChallenge`
**Input** :
```typescript
{
  phone: string
  category: 'family' | 'location' | 'business' | 'community'
  challengeId: number
  answer: string
}
```

**Output** :
```typescript
{
  success: boolean
  message: string
  challenge: object
}
```

### Composants Frontend

#### SocialLogin Component (`/login`)
**Étapes** :
1. **Phone Input** : Saisie du numéro de téléphone
2. **Trust Score Calculation** : Calcul automatique (invisible)
3. **Challenge** (si nécessaire) : Question de sécurité
4. **Approved** : Redirection vers le dashboard
5. **Agent Required** : Message d'attente pour agent

**Features** :
- Adaptation automatique du persona
- Messages en français ivoirien authentique
- Support GPS optionnel
- Device fingerprinting automatique
- Design responsive et accessible

### Sécurité

#### Hachage des Réponses
- Algorithme : **bcrypt** (10 rounds)
- Normalisation : lowercase + trim
- Stockage : Jamais en clair

#### Device Fingerprinting
- Canvas fingerprint
- WebGL fingerprint
- Audio context fingerprint
- Screen resolution, timezone, languages
- Hardware capabilities

#### Protection contre la Fraude
**Pénalités appliquées** :
- Nouvel appareil jamais vu : -20 points
- Localisation inhabituelle : -15 points
- Connexion de nuit : -10 points
- Échec récent : -10 points
- VPN/Proxy détecté : -25 points

## Configuration Initiale

### 1. Migration de la Base de Données
```bash
# La migration est déjà appliquée
# Fichier : supabase/migrations/0029_social_authentication_pnavim.sql
```

### 2. Questions par Défaut
8 questions pré-configurées dans 4 catégories :
- 3 questions Famille
- 2 questions Localisation
- 2 questions Commerce
- 1 question Communauté

### 3. Configuration Marchand
Chaque marchand doit :
1. Choisir une question de sécurité
2. Fournir la réponse (sera hashée)
3. Marquer comme question principale

## Utilisation

### Pour les Marchands

**Première connexion** :
1. Aller sur `/login`
2. Entrer le numéro de téléphone
3. Répondre à la question de sécurité (si demandé)
4. Accès autorisé

**Connexions suivantes** :
- Si appareil connu + contexte familier → Accès immédiat
- Sinon → Question de sécurité

### Pour les Agents

**Enrollment d'un nouveau marchand** :
1. Créer le compte marchand
2. Configurer la question de sécurité avec `setupChallenge`
3. Le marchand peut maintenant se connecter

## Tests

### Scénarios de Test

**Test 1: Connexion Réussie (High Trust)**
```
- Appareil connu (5+ connexions)
- Même localisation
- Horaires habituels
→ Résultat attendu: Accès immédiat
```

**Test 2: Challenge Requis (Medium Trust)**
```
- Nouvel appareil
- Localisation proche
- Horaires habituels
→ Résultat attendu: Question de sécurité
```

**Test 3: Validation Agent (Low Trust)**
```
- Nouvel appareil
- Localisation éloignée
- Connexion de nuit
→ Résultat attendu: Appel agent
```

## Logs et Monitoring

### Métriques à Surveiller
- Taux d'accès immédiat
- Taux de challenges réussis
- Taux d'escalade vers agents
- Score de confiance moyen
- Tentatives échouées par utilisateur

### Dashboard Admin
Statistiques disponibles via `getAuthStats(merchantId)` :
- Total tentatives (30 derniers jours)
- Taux de succès
- Score de confiance moyen
- Appareils connus

## Roadmap

### Phase 1 : ✅ Complété
- [x] Authentification par téléphone
- [x] Trust Score Engine
- [x] Challenges sociaux
- [x] Personas (Tantie/Jeune)
- [x] Device fingerprinting

### Phase 2 : 🚧 À venir
- [ ] Mode vocal complet (speech-to-text)
- [ ] Support Dioula natif
- [ ] Reconnaissance faciale optionnelle
- [ ] Intégration USSD pour feature phones
- [ ] Biométrie (empreinte digitale)

### Phase 3 : 💡 Idées
- [ ] Authentification par proximité Bluetooth
- [ ] QR code pour inscription rapide (agent uniquement)
- [ ] Challenge vocal (reconnaissance de voix)
- [ ] Gamification des questions de sécurité

## Support

Pour toute question ou problème :
1. Consulter cette documentation
2. Vérifier les logs dans `auth_attempts`
3. Contacter l'équipe technique PNAVIM

---

**Dernière mise à jour** : Janvier 2026
**Version** : 1.0.0
**Auteur** : Système d'IA - PNAVIM Architecture Layer 3
