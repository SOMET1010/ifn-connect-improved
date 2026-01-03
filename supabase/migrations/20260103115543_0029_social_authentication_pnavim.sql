/*
  # Social Authentication PNAVIM System
  
  ## Overview
  This migration implements the social authentication system for PNAVIM,
  enabling phone-based authentication with cultural challenges and trust scoring.
  
  ## 1. New Tables
  
  ### `social_challenges`
  Cultural questions for authentication challenges
  - `id` (serial, primary key) - Unique challenge identifier
  - `question_fr` (text) - Question in French
  - `question_dioula` (text) - Question in Dioula (optional)
  - `category` (enum) - Type of question (family, location, business, community)
  - `difficulty` (integer 1-3) - Difficulty level
  - `is_active` (boolean) - Whether challenge is active
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ### `merchant_challenges`
  Links merchants to their specific security questions
  - `id` (serial, primary key)
  - `merchant_id` (integer, references merchants)
  - `challenge_id` (integer, references social_challenges)
  - `answer_hash` (text) - Hashed answer
  - `is_primary` (boolean) - Is this the primary challenge
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### `auth_attempts`
  Tracks all authentication attempts for trust scoring
  - `id` (serial, primary key)
  - `user_id` (integer, references users, nullable)
  - `phone` (varchar 20) - Phone number used
  - `device_fingerprint` (text) - Device identifier
  - `trust_score` (integer) - Calculated trust score (0-100)
  - `decision` (enum) - Result: allow, challenge, validate
  - `latitude` (decimal) - GPS latitude (optional)
  - `longitude` (decimal) - GPS longitude (optional)
  - `challenge_passed` (boolean, nullable) - If challenge was required, did it pass
  - `challenge_id` (integer, nullable) - Which challenge was used
  - `ip_address` (varchar 45) - IP address
  - `user_agent` (text) - Browser/device info
  - `success` (boolean) - Was login successful
  - `created_at` (timestamptz)
  
  ### `merchant_devices`
  Known devices for each merchant
  - `id` (serial, primary key)
  - `merchant_id` (integer, references merchants)
  - `device_fingerprint` (text) - Device identifier
  - `device_name` (varchar 100) - Friendly device name
  - `first_seen` (timestamptz) - First login from this device
  - `last_seen` (timestamptz) - Most recent login
  - `times_used` (integer) - Number of successful logins
  - `is_trusted` (boolean) - Is this device trusted
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ## 2. Enums
  
  ### `challenge_category`
  - family: Questions about family members
  - location: Questions about usual locations
  - business: Questions about business details
  - community: Questions about community/social ties
  
  ### `auth_decision`
  - allow: Immediate access granted
  - challenge: Additional verification needed
  - validate: Agent validation required
  
  ## 3. Security
  Security is handled at the application level through tRPC middlewares.
  
  ## 4. Important Notes
  - Answers are hashed using bcrypt for security
  - Trust scores are calculated using the TrustScoreEngine
  - Device fingerprints are used for recognition
  - GPS coordinates are optional but improve trust scores
*/

-- Create enums
DO $$ BEGIN
  CREATE TYPE challenge_category AS ENUM (
    'family',
    'location',
    'business',
    'community'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE auth_decision AS ENUM (
    'allow',
    'challenge',
    'validate'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create social_challenges table
CREATE TABLE IF NOT EXISTS social_challenges (
  id serial PRIMARY KEY,
  question_fr text NOT NULL,
  question_dioula text,
  category challenge_category NOT NULL,
  difficulty integer DEFAULT 1 NOT NULL CHECK (difficulty BETWEEN 1 AND 3),
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create merchant_challenges table
CREATE TABLE IF NOT EXISTS merchant_challenges (
  id serial PRIMARY KEY,
  merchant_id integer NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  challenge_id integer NOT NULL REFERENCES social_challenges(id) ON DELETE CASCADE,
  answer_hash text NOT NULL,
  is_primary boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(merchant_id, challenge_id)
);

-- Create auth_attempts table
CREATE TABLE IF NOT EXISTS auth_attempts (
  id serial PRIMARY KEY,
  user_id integer REFERENCES users(id) ON DELETE SET NULL,
  phone varchar(20) NOT NULL,
  device_fingerprint text NOT NULL,
  trust_score integer NOT NULL CHECK (trust_score BETWEEN 0 AND 100),
  decision auth_decision NOT NULL,
  latitude decimal(10, 8),
  longitude decimal(11, 8),
  challenge_passed boolean,
  challenge_id integer REFERENCES social_challenges(id) ON DELETE SET NULL,
  ip_address varchar(45),
  user_agent text,
  success boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create merchant_devices table
CREATE TABLE IF NOT EXISTS merchant_devices (
  id serial PRIMARY KEY,
  merchant_id integer NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  device_fingerprint text NOT NULL,
  device_name varchar(100),
  first_seen timestamptz DEFAULT now() NOT NULL,
  last_seen timestamptz DEFAULT now() NOT NULL,
  times_used integer DEFAULT 1 NOT NULL,
  is_trusted boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(merchant_id, device_fingerprint)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS social_challenges_category_idx ON social_challenges(category);
CREATE INDEX IF NOT EXISTS social_challenges_active_idx ON social_challenges(is_active);

CREATE INDEX IF NOT EXISTS merchant_challenges_merchant_idx ON merchant_challenges(merchant_id);
CREATE INDEX IF NOT EXISTS merchant_challenges_primary_idx ON merchant_challenges(is_primary);

CREATE INDEX IF NOT EXISTS auth_attempts_user_idx ON auth_attempts(user_id);
CREATE INDEX IF NOT EXISTS auth_attempts_phone_idx ON auth_attempts(phone);
CREATE INDEX IF NOT EXISTS auth_attempts_device_idx ON auth_attempts(device_fingerprint);
CREATE INDEX IF NOT EXISTS auth_attempts_created_idx ON auth_attempts(created_at);
CREATE INDEX IF NOT EXISTS auth_attempts_success_idx ON auth_attempts(success);

CREATE INDEX IF NOT EXISTS merchant_devices_merchant_idx ON merchant_devices(merchant_id);
CREATE INDEX IF NOT EXISTS merchant_devices_fingerprint_idx ON merchant_devices(device_fingerprint);
CREATE INDEX IF NOT EXISTS merchant_devices_trusted_idx ON merchant_devices(is_trusted);

-- Insert default social challenges (questions culturelles)
INSERT INTO social_challenges (question_fr, question_dioula, category, difficulty, is_active) VALUES
  ('Rappelle-moi le prénom de ta maman ?', NULL, 'family', 1, true),
  ('C''est quoi ton surnom au quartier ?', NULL, 'community', 1, true),
  ('Tu vends dans quel marché d''habitude ?', NULL, 'location', 1, true),
  ('Comment on t''appelle à la maison ?', NULL, 'family', 1, true),
  ('C''est quel jour que tu arrives au marché ?', NULL, 'business', 2, true),
  ('Tu vends à côté de qui au marché ?', NULL, 'community', 2, true),
  ('Quel est le nom de ton chef de marché ?', NULL, 'community', 3, true),
  ('C''est dans quelle commune que tu habites ?', NULL, 'location', 2, true)
ON CONFLICT DO NOTHING;

-- Create triggers for updated_at
CREATE TRIGGER update_social_challenges_updated_at
  BEFORE UPDATE ON social_challenges
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_merchant_challenges_updated_at
  BEFORE UPDATE ON merchant_challenges
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_merchant_devices_updated_at
  BEFORE UPDATE ON merchant_devices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();