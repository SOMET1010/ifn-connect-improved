/*
  # Wallet System - Digital Wallet for P2P Transfers
  
  ## Overview
  This migration implements the complete wallet infrastructure for the Super App,
  enabling peer-to-peer transfers, payment requests, and beneficiary management
  for the informal sector merchants in Côte d'Ivoire.
  
  ## 1. New Tables
  
  ### `wallets`
  Digital wallet for each user/merchant to store their balance
  - `id` (serial, primary key) - Unique wallet identifier
  - `user_id` (integer, references users, unique) - One wallet per user
  - `merchant_id` (integer, references merchants, nullable) - Optional merchant link
  - `balance` (decimal 15,2) - Current wallet balance in XOF
  - `currency` (varchar 3) - Currency code (default XOF)
  - `is_active` (boolean) - Wallet status
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ### `wallet_transactions`
  Complete transaction history for all wallet operations
  - `id` (serial, primary key) - Unique transaction identifier
  - `from_wallet_id` (integer, references wallets) - Source wallet
  - `to_wallet_id` (integer, references wallets) - Destination wallet
  - `from_user_id` (integer, references users) - Sender user ID
  - `to_user_id` (integer, references users) - Receiver user ID
  - `amount` (decimal 15,2) - Transaction amount
  - `currency` (varchar 3) - Currency code
  - `type` (enum) - Transaction type (transfer_sent, transfer_received, payment_request_sent, etc.)
  - `status` (enum) - Transaction status (pending, completed, failed, cancelled)
  - `reference` (varchar 50, unique) - Unique transaction reference for tracking
  - `description` (text) - Human-readable description
  - `notes` (text) - Additional notes
  - `metadata` (text) - JSON metadata for extensibility
  - `completed_at` (timestamptz) - When transaction was completed
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ### `beneficiaries`
  Saved contacts for quick recurring transfers
  - `id` (serial, primary key) - Unique beneficiary identifier
  - `owner_id` (integer, references users) - User who saved this contact
  - `contact_id` (integer, references users) - Saved contact user
  - `nickname` (varchar 100) - Optional friendly name for the contact
  - `is_active` (boolean) - Whether beneficiary is active
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ## 2. Enums
  
  ### `wallet_transaction_type`
  - transfer_sent: Money sent to another user
  - transfer_received: Money received from another user
  - payment_request_sent: Request for payment sent
  - payment_request_received: Request for payment received
  - deposit: Money deposited into wallet
  - withdrawal: Money withdrawn from wallet
  
  ### `wallet_transaction_status`
  - pending: Transaction initiated but not yet completed
  - completed: Transaction successfully completed
  - failed: Transaction failed
  - cancelled: Transaction cancelled by user
  
  ## 3. Indexes
  All tables have comprehensive indexes for optimal query performance:
  - User/wallet lookups
  - Transaction history queries
  - Status filtering
  - Date range queries
  - Type-based filtering
  
  ## 4. Security
  Security is handled at the application level through tRPC middlewares.
  RLS is disabled to allow application-level access control which is consistent
  with the rest of the application architecture.
  
  ## 5. Important Notes
  - All monetary amounts use decimal(15,2) for precision
  - Default currency is XOF (West African CFA Franc)
  - Unique constraints prevent duplicate beneficiaries
  - Cascade deletes ensure data integrity
  - Transaction references are unique for tracking and reconciliation
*/

-- Create enums
DO $$ BEGIN
  CREATE TYPE wallet_transaction_type AS ENUM (
    'transfer_sent',
    'transfer_received',
    'payment_request_sent',
    'payment_request_received',
    'deposit',
    'withdrawal'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE wallet_transaction_status AS ENUM (
    'pending',
    'completed',
    'failed',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create wallets table
CREATE TABLE IF NOT EXISTS wallets (
  id serial PRIMARY KEY,
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  merchant_id integer REFERENCES merchants(id) ON DELETE CASCADE,
  balance decimal(15, 2) DEFAULT 0 NOT NULL,
  currency varchar(3) DEFAULT 'XOF' NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create wallet_transactions table
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id serial PRIMARY KEY,
  from_wallet_id integer REFERENCES wallets(id) ON DELETE SET NULL,
  to_wallet_id integer REFERENCES wallets(id) ON DELETE SET NULL,
  from_user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount decimal(15, 2) NOT NULL,
  currency varchar(3) DEFAULT 'XOF' NOT NULL,
  type wallet_transaction_type NOT NULL,
  status wallet_transaction_status DEFAULT 'pending' NOT NULL,
  reference varchar(50) NOT NULL UNIQUE,
  description text,
  notes text,
  metadata text,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create beneficiaries table
CREATE TABLE IF NOT EXISTS beneficiaries (
  id serial PRIMARY KEY,
  owner_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contact_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nickname varchar(100),
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(owner_id, contact_id)
);

-- Create indexes for wallets
CREATE INDEX IF NOT EXISTS wallet_user_id_idx ON wallets(user_id);
CREATE INDEX IF NOT EXISTS wallet_merchant_id_idx ON wallets(merchant_id);
CREATE INDEX IF NOT EXISTS wallet_is_active_idx ON wallets(is_active);

-- Create indexes for wallet_transactions
CREATE INDEX IF NOT EXISTS wt_from_wallet_id_idx ON wallet_transactions(from_wallet_id);
CREATE INDEX IF NOT EXISTS wt_to_wallet_id_idx ON wallet_transactions(to_wallet_id);
CREATE INDEX IF NOT EXISTS wt_from_user_id_idx ON wallet_transactions(from_user_id);
CREATE INDEX IF NOT EXISTS wt_to_user_id_idx ON wallet_transactions(to_user_id);
CREATE INDEX IF NOT EXISTS wt_status_idx ON wallet_transactions(status);
CREATE INDEX IF NOT EXISTS wt_reference_idx ON wallet_transactions(reference);
CREATE INDEX IF NOT EXISTS wt_created_at_idx ON wallet_transactions(created_at);
CREATE INDEX IF NOT EXISTS wt_type_status_idx ON wallet_transactions(type, status);

-- Create indexes for beneficiaries
CREATE INDEX IF NOT EXISTS beneficiary_owner_id_idx ON beneficiaries(owner_id);
CREATE INDEX IF NOT EXISTS beneficiary_contact_id_idx ON beneficiaries(contact_id);
CREATE INDEX IF NOT EXISTS beneficiary_owner_contact_idx ON beneficiaries(owner_id, contact_id);
CREATE INDEX IF NOT EXISTS beneficiary_is_active_idx ON beneficiaries(is_active);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_wallets_updated_at
  BEFORE UPDATE ON wallets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallet_transactions_updated_at
  BEFORE UPDATE ON wallet_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_beneficiaries_updated_at
  BEFORE UPDATE ON beneficiaries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();