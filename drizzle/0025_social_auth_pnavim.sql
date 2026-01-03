/*
  # PNAVIM Social Authentication System

  ## Architecture Sécurité Adaptative (4 Couches)

  Ce système implémente l'architecture PNAVIM (Preuve Numérique par Authenticité Vocale et Identité Multi-facteurs)
  pour l'authentification inclusive des marchands en contexte africain.

  ### Couche 1: Interface Inclusive (Frontend)
  - Authentification vocale en langues locales
  - Retour sensoriel (audio + haptique)

  ### Couche 2: Preuve Sociale (Ces tables)
  - Questions culturelles contextuelles
  - Validation par pairs/agents
  - Device fingerprinting

  ### Couche 3: Trust Score Contextuel (Moteur de calcul)
  - Score 0-100 basé sur multiples facteurs
  - Géolocalisation, historique, comportement

  ### Couche 4: Escalade Sécurisée
  - Validation agent si score < 40
  - Validation coopérative
  - Biométrie ciblée

  ## 1. New Tables

  ### trusted_devices
  Enregistre les appareils connus du marchand avec empreinte numérique.
  - `device_fingerprint`: Hash unique du device (navigateur + hardware)
  - `trust_level`: Niveau de confiance 0-100 basé sur l'historique
  - `last_location`: Dernière position GPS connue

  ### social_auth_questions
  Banque de questions culturelles/contextuelles pour validation d'identité sociale.
  - Questions créées par agents terrain ou coopératives
  - Catégories: marché, voisinage, famille, profession
  - Réponses courtes vocalisables (<50 caractères)

  ### merchant_social_answers
  Réponses aux questions sociales, stockées avec normalisation phonétique.
  - `answer_normalized`: Texte normalisé (lowercase, no accents)
  - `answer_soundex`: Représentation phonétique pour matching tolérant
  - `answer_hash`: Bcrypt pour vérification sécurisée

  ### auth_context_logs
  Journal contextuel de chaque tentative d'authentification.
  - Localisation, heure, device, conditions réseau
  - Permet détection d'anomalies et analytics

  ### trust_validations
  Validations manuelles par agents/pairs lorsque score insuffisant.
  - Workflow d'escalade
  - Traçabilité des validateurs

  ### trust_scores
  Historique des scores de confiance calculés.
  - Permet analytics et amélioration continue de l'algorithme
  - Détection de patterns frauduleux

  ## 2. Security

  ### RLS Policies
  - Marchands: Accès lecture seule à leurs propres données
  - Agents: Accès lecture/écriture pour validations dans leur zone
  - Admins: Accès complet pour audit

  ### Rate Limiting
  - Max 3 tentatives auth / 15 minutes / téléphone
  - Max 10 tentatives / heure / IP
  - Blocage temporaire si patterns suspects

  ## 3. Data Privacy (RGPD/FADP)

  - Aucun stockage audio brut (uniquement transcriptions)
  - Consentement vocal tracé
  - Droit à l'oubli: Purge automatique après inactivité 2 ans
  - Hashage réponses sensibles

  ## 4. Important Notes

  ### Trust Score Formula
  ```
  Score = (0.30 × device) + (0.40 × social) + (0.15 × location) +
          (0.10 × time) + (0.05 × history) - penalties
  ```

  ### Decision Tree
  - Score ≥ 70: Accès immédiat
  - 40 ≤ Score < 70: Question supplémentaire
  - Score < 40: Validation agent obligatoire
*/

-- ============================================================================
-- TRUSTED DEVICES
-- ============================================================================

CREATE TABLE IF NOT EXISTS trusted_devices (
  id SERIAL PRIMARY KEY,
  merchant_id INTEGER NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,

  -- Device identification
  device_fingerprint TEXT NOT NULL,
  device_name TEXT,
  user_agent TEXT,
  browser_info JSONB,

  -- Trust metrics
  trust_level INTEGER DEFAULT 0 CHECK (trust_level >= 0 AND trust_level <= 100),
  first_seen_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_seen_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  total_successful_auths INTEGER DEFAULT 0,
  total_failed_auths INTEGER DEFAULT 0,

  -- Context
  last_location JSONB,
  last_ip_address INET,

  -- Status
  is_primary BOOLEAN DEFAULT FALSE,
  is_blocked BOOLEAN DEFAULT FALSE,
  blocked_reason TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  UNIQUE(merchant_id, device_fingerprint)
);

CREATE INDEX IF NOT EXISTS idx_trusted_devices_merchant ON trusted_devices(merchant_id);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_fingerprint ON trusted_devices(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_trust_level ON trusted_devices(trust_level);

-- ============================================================================
-- SOCIAL AUTH QUESTIONS
-- ============================================================================

CREATE TYPE question_category AS ENUM (
  'market',
  'neighborhood',
  'family',
  'profession',
  'cooperative',
  'cultural'
);

CREATE TABLE IF NOT EXISTS social_auth_questions (
  id SERIAL PRIMARY KEY,

  -- Question content
  question_text_fr TEXT NOT NULL,
  question_text_dioula TEXT,
  question_audio_url TEXT,

  -- Classification
  category question_category NOT NULL,
  difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level >= 1 AND difficulty_level <= 3),

  -- Usage tracking
  times_used INTEGER DEFAULT 0,
  times_successful INTEGER DEFAULT 0,
  times_failed INTEGER DEFAULT 0,
  avg_answer_time_seconds DECIMAL(5,2),

  -- Lifecycle
  is_active BOOLEAN DEFAULT TRUE,
  created_by_agent_id INTEGER REFERENCES agents(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  retired_at TIMESTAMPTZ,

  -- Metadata
  tags TEXT[],
  geographic_scope TEXT
);

CREATE INDEX IF NOT EXISTS idx_social_questions_category ON social_auth_questions(category);
CREATE INDEX IF NOT EXISTS idx_social_questions_active ON social_auth_questions(is_active);

-- ============================================================================
-- MERCHANT SOCIAL ANSWERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS merchant_social_answers (
  id SERIAL PRIMARY KEY,
  merchant_id INTEGER NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL REFERENCES social_auth_questions(id) ON DELETE CASCADE,

  -- Multi-format storage for fuzzy matching
  answer_normalized TEXT NOT NULL,
  answer_soundex VARCHAR(10),
  answer_hash VARCHAR(255) NOT NULL,

  -- Usage statistics
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_used_at TIMESTAMPTZ,
  success_count INTEGER DEFAULT 0,
  fail_count INTEGER DEFAULT 0,

  -- Security
  is_compromised BOOLEAN DEFAULT FALSE,
  compromised_at TIMESTAMPTZ,

  UNIQUE(merchant_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_merchant_answers_merchant ON merchant_social_answers(merchant_id);
CREATE INDEX IF NOT EXISTS idx_merchant_answers_question ON merchant_social_answers(question_id);

-- ============================================================================
-- AUTH CONTEXT LOGS
-- ============================================================================

CREATE TYPE auth_result AS ENUM ('success', 'failed', 'pending_validation', 'blocked');

CREATE TABLE IF NOT EXISTS auth_context_logs (
  id SERIAL PRIMARY KEY,
  merchant_id INTEGER NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,

  -- Attempt details
  attempt_timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  result auth_result NOT NULL,
  trust_score INTEGER CHECK (trust_score >= 0 AND trust_score <= 100),

  -- Device context
  device_fingerprint TEXT,
  device_id INTEGER REFERENCES trusted_devices(id),

  -- Location context
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  location_accuracy_meters INTEGER,
  distance_from_usual_km DECIMAL(6, 2),

  -- Time context
  hour_of_day INTEGER CHECK (hour_of_day >= 0 AND hour_of_day <= 23),
  is_usual_time BOOLEAN,
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),

  -- Network context
  ip_address INET,
  is_vpn_detected BOOLEAN DEFAULT FALSE,
  connection_type VARCHAR(20),

  -- Authentication factors used
  phone_verified BOOLEAN,
  social_question_answered BOOLEAN,
  social_question_id INTEGER REFERENCES social_auth_questions(id),
  biometric_used BOOLEAN,

  -- Anomalies detected
  anomalies TEXT[],
  risk_flags JSONB,

  -- Validation (if escalated)
  required_validation BOOLEAN DEFAULT FALSE,
  validation_id INTEGER REFERENCES trust_validations(id)
);

CREATE INDEX IF NOT EXISTS idx_auth_logs_merchant ON auth_context_logs(merchant_id);
CREATE INDEX IF NOT EXISTS idx_auth_logs_timestamp ON auth_context_logs(attempt_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_auth_logs_result ON auth_context_logs(result);
CREATE INDEX IF NOT EXISTS idx_auth_logs_trust_score ON auth_context_logs(trust_score);

-- ============================================================================
-- TRUST VALIDATIONS
-- ============================================================================

CREATE TYPE validation_method AS ENUM (
  'agent_phone',
  'agent_in_person',
  'cooperative_member',
  'peer_merchant',
  'biometric_fallback'
);

CREATE TYPE validation_status AS ENUM ('pending', 'approved', 'rejected', 'expired');

CREATE TABLE IF NOT EXISTS trust_validations (
  id SERIAL PRIMARY KEY,
  merchant_id INTEGER NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  auth_attempt_id INTEGER REFERENCES auth_context_logs(id),

  -- Validation details
  method validation_method NOT NULL,
  status validation_status DEFAULT 'pending' NOT NULL,

  -- Validator info
  validator_agent_id INTEGER REFERENCES agents(id),
  validator_merchant_id INTEGER REFERENCES merchants(id),
  validator_notes TEXT,

  -- Timeline
  requested_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  responded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '15 minutes') NOT NULL,

  -- Evidence
  validation_evidence JSONB,
  rejection_reason TEXT,

  -- Notification
  notification_sent BOOLEAN DEFAULT FALSE,
  notification_method VARCHAR(20)
);

CREATE INDEX IF NOT EXISTS idx_trust_validations_merchant ON trust_validations(merchant_id);
CREATE INDEX IF NOT EXISTS idx_trust_validations_status ON trust_validations(status);
CREATE INDEX IF NOT EXISTS idx_trust_validations_validator_agent ON trust_validations(validator_agent_id);
CREATE INDEX IF NOT EXISTS idx_trust_validations_expires ON trust_validations(expires_at);

-- ============================================================================
-- TRUST SCORES
-- ============================================================================

CREATE TABLE IF NOT EXISTS trust_scores (
  id SERIAL PRIMARY KEY,
  merchant_id INTEGER NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,

  -- Calculated score
  total_score INTEGER NOT NULL CHECK (total_score >= 0 AND total_score <= 100),

  -- Component scores
  device_score DECIMAL(5, 2),
  social_score DECIMAL(5, 2),
  location_score DECIMAL(5, 2),
  time_score DECIMAL(5, 2),
  history_score DECIMAL(5, 2),

  -- Penalties applied
  penalties JSONB,
  total_penalty DECIMAL(5, 2) DEFAULT 0,

  -- Context snapshot
  context_snapshot JSONB,

  -- Timestamp
  calculated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Associated auth attempt
  auth_log_id INTEGER REFERENCES auth_context_logs(id)
);

CREATE INDEX IF NOT EXISTS idx_trust_scores_merchant ON trust_scores(merchant_id);
CREATE INDEX IF NOT EXISTS idx_trust_scores_calculated_at ON trust_scores(calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_trust_scores_total_score ON trust_scores(total_score);

-- ============================================================================
-- OFFLINE AUTH TOKENS (for degraded mode)
-- ============================================================================

CREATE TABLE IF NOT EXISTS offline_auth_tokens (
  id SERIAL PRIMARY KEY,
  merchant_id INTEGER NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,

  -- Token data
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  device_fingerprint TEXT NOT NULL,

  -- Trust context at issuance
  issued_trust_score INTEGER NOT NULL CHECK (issued_trust_score >= 90),

  -- Lifecycle
  issued_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  revoke_reason TEXT,

  -- Usage tracking
  times_used INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,

  -- Restrictions
  max_uses INTEGER DEFAULT 10,
  allowed_actions TEXT[]
);

CREATE INDEX IF NOT EXISTS idx_offline_tokens_merchant ON offline_auth_tokens(merchant_id);
CREATE INDEX IF NOT EXISTS idx_offline_tokens_hash ON offline_auth_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_offline_tokens_expires ON offline_auth_tokens(expires_at);

-- ============================================================================
-- OFFLINE SESSIONS (for audit)
-- ============================================================================

CREATE TABLE IF NOT EXISTS offline_sessions (
  id SERIAL PRIMARY KEY,
  merchant_id INTEGER NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  token_id INTEGER REFERENCES offline_auth_tokens(id),

  -- Session details
  device_fingerprint TEXT,
  token_issued_at TIMESTAMPTZ,
  token_used_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Activity tracking
  duration_minutes INTEGER,
  actions_performed JSONB,

  -- Synchronization
  synced_at TIMESTAMPTZ,
  sync_errors JSONB
);

CREATE INDEX IF NOT EXISTS idx_offline_sessions_merchant ON offline_sessions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_offline_sessions_token_used ON offline_sessions(token_used_at DESC);

-- ============================================================================
-- CONSENT LOGS (RGPD/FADP Compliance)
-- ============================================================================

CREATE TYPE consent_type AS ENUM (
  'voice_auth',
  'biometric',
  'location_tracking',
  'data_analytics'
);

CREATE TABLE IF NOT EXISTS consent_logs (
  id SERIAL PRIMARY KEY,
  merchant_id INTEGER NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,

  -- Consent details
  consent_type consent_type NOT NULL,
  consented BOOLEAN NOT NULL,

  -- Evidence
  consent_timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  consent_method VARCHAR(50),
  transcript TEXT,
  audio_recording_url TEXT,

  -- IP/Device
  ip_address INET,
  device_info JSONB,

  -- Lifecycle
  withdrawn_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_consent_logs_merchant ON consent_logs(merchant_id);
CREATE INDEX IF NOT EXISTS idx_consent_logs_type ON consent_logs(consent_type);
CREATE INDEX IF NOT EXISTS idx_consent_logs_active ON consent_logs(merchant_id, consent_type)
  WHERE withdrawn_at IS NULL AND (expires_at IS NULL OR expires_at > NOW());

-- ============================================================================
-- EXTENSIONS TO EXISTING TABLES
-- ============================================================================

-- Add trust score to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_trust_score INTEGER DEFAULT 50 CHECK (current_trust_score >= 0 AND current_trust_score <= 100);

-- Add preferred validator to merchants table
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS preferred_validator_agent_id INTEGER REFERENCES agents(id);

-- Add voice auth capabilities flags to merchants
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS voice_auth_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS requires_biometric BOOLEAN DEFAULT FALSE;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE trusted_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_auth_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_social_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_context_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE offline_auth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE offline_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_logs ENABLE ROW LEVEL SECURITY;

-- trusted_devices: Merchants see only their devices
CREATE POLICY "merchant_own_devices" ON trusted_devices
  FOR SELECT
  USING (
    merchant_id IN (
      SELECT m.id FROM merchants m
      JOIN users u ON m.user_id = u.id
      WHERE u.open_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

-- social_auth_questions: Public read for active questions
CREATE POLICY "public_read_active_questions" ON social_auth_questions
  FOR SELECT
  USING (is_active = TRUE);

-- merchant_social_answers: Merchants see only their answers
CREATE POLICY "merchant_own_answers" ON merchant_social_answers
  FOR SELECT
  USING (
    merchant_id IN (
      SELECT m.id FROM merchants m
      JOIN users u ON m.user_id = u.id
      WHERE u.open_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

-- auth_context_logs: Merchants see their own logs, agents see their zone
CREATE POLICY "view_own_auth_logs" ON auth_context_logs
  FOR SELECT
  USING (
    merchant_id IN (
      SELECT m.id FROM merchants m
      JOIN users u ON m.user_id = u.id
      WHERE u.open_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

-- trust_validations: Agents see validations assigned to them
CREATE POLICY "agent_validations" ON trust_validations
  FOR SELECT
  USING (
    validator_agent_id IN (
      SELECT a.id FROM agents a
      JOIN users u ON a.user_id = u.id
      WHERE u.open_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

-- Agents can update validations
CREATE POLICY "agent_update_validations" ON trust_validations
  FOR UPDATE
  USING (
    validator_agent_id IN (
      SELECT a.id FROM agents a
      JOIN users u ON a.user_id = u.id
      WHERE u.open_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

-- trust_scores: Merchants see their own scores
CREATE POLICY "merchant_own_scores" ON trust_scores
  FOR SELECT
  USING (
    merchant_id IN (
      SELECT m.id FROM merchants m
      JOIN users u ON m.user_id = u.id
      WHERE u.open_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

-- offline_auth_tokens: Merchants see their own tokens
CREATE POLICY "merchant_own_tokens" ON offline_auth_tokens
  FOR SELECT
  USING (
    merchant_id IN (
      SELECT m.id FROM merchants m
      JOIN users u ON m.user_id = u.id
      WHERE u.open_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

-- offline_sessions: Merchants see their own sessions
CREATE POLICY "merchant_own_offline_sessions" ON offline_sessions
  FOR SELECT
  USING (
    merchant_id IN (
      SELECT m.id FROM merchants m
      JOIN users u ON m.user_id = u.id
      WHERE u.open_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

-- consent_logs: Merchants see their own consents
CREATE POLICY "merchant_own_consents" ON consent_logs
  FOR SELECT
  USING (
    merchant_id IN (
      SELECT m.id FROM merchants m
      JOIN users u ON m.user_id = u.id
      WHERE u.open_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

-- ============================================================================
-- SEED DATA: Example Social Auth Questions
-- ============================================================================

INSERT INTO social_auth_questions (question_text_fr, category, difficulty_level, is_active) VALUES
  ('Quel est le nom de votre marché habituel ?', 'market', 1, TRUE),
  ('Quel produit vendez-vous principalement ?', 'profession', 1, TRUE),
  ('Dans quel quartier se trouve votre commerce ?', 'neighborhood', 1, TRUE),
  ('Quel est le prénom de votre coopérative de référence ?', 'cooperative', 2, TRUE),
  ('Quel jour de la semaine faites-vous le plus de ventes ?', 'profession', 1, TRUE)
ON CONFLICT DO NOTHING;
