/*
  # Complete Social Authentication - Users Table

  ## Overview
  This migration completes the social authentication system by adding
  critical security fields to the users table that were missing.

  ## 1. Modifications to `users` Table
  
  ### New Columns
  - `phone_verified` (boolean) - Whether phone number is verified
  - `pin_failed_attempts` (integer) - Count of consecutive failed PIN attempts
  - `pin_locked_until` (timestamptz) - When the account will be unlocked after too many failures
  
  ### Modified Columns
  - `phone` - Add UNIQUE constraint to enable phone-based login
  
  ## 2. Security Features
  
  ### PIN Protection
  - After 3 failed attempts, account locks for 15 minutes
  - `pin_failed_attempts` tracks consecutive failures
  - `pin_locked_until` stores unlock timestamp
  - Successful login resets counter to 0
  
  ### Phone Verification
  - `phone_verified` ensures only verified phones can authenticate
  - Set to false on registration, true after SMS verification
  
  ## 3. Important Notes
  - Existing users without phone will be unaffected (nullable)
  - UNIQUE constraint on phone allows NULL values (multiple NULLs permitted)
  - PIN lockout prevents brute-force attacks
  - Application-level security via tRPC middlewares
*/

-- Add new security columns to users table
DO $$ 
BEGIN
  -- Add phone_verified column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'phone_verified'
  ) THEN
    ALTER TABLE users ADD COLUMN phone_verified boolean DEFAULT false NOT NULL;
  END IF;
  
  -- Add pin_failed_attempts column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'pin_failed_attempts'
  ) THEN
    ALTER TABLE users ADD COLUMN pin_failed_attempts integer DEFAULT 0 NOT NULL;
  END IF;
  
  -- Add pin_locked_until column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'pin_locked_until'
  ) THEN
    ALTER TABLE users ADD COLUMN pin_locked_until timestamptz;
  END IF;
END $$;

-- Add UNIQUE constraint on phone (allows multiple NULLs)
DO $$
BEGIN
  -- Check if constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'users_phone_unique'
  ) THEN
    -- Create UNIQUE constraint (PostgreSQL allows multiple NULLs)
    ALTER TABLE users ADD CONSTRAINT users_phone_unique UNIQUE (phone);
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS users_phone_idx ON users(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS users_locked_idx ON users(pin_locked_until) WHERE pin_locked_until IS NOT NULL;
CREATE INDEX IF NOT EXISTS users_phone_verified_idx ON users(phone_verified);

-- Add check constraint for failed attempts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'users_pin_failed_attempts_check'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_pin_failed_attempts_check 
      CHECK (pin_failed_attempts >= 0 AND pin_failed_attempts <= 10);
  END IF;
END $$;