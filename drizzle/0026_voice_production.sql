/*
  # Voice Production Studio Schema

  1. New Tables
    - `voice_recordings`
      - `id` (uuid, primary key)
      - `admin_user_id` (integer, references users) - admin who created the recording
      - `original_text` (text) - script or text content
      - `audio_url` (text) - URL to original audio file in storage
      - `duration_seconds` (integer) - length of recording
      - `file_size_bytes` (integer) - file size
      - `status` (text) - draft, processing, completed, failed
      - `metadata` (jsonb) - additional metadata
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `voice_transformations`
      - `id` (uuid, primary key)
      - `recording_id` (uuid, references voice_recordings)
      - `source_voice_id` (text) - ElevenLabs voice ID used
      - `target_voice_id` (text) - ElevenLabs voice ID to transform to
      - `transformation_type` (text) - speech_to_speech, text_to_speech
      - `output_audio_url` (text) - URL to transformed audio
      - `status` (text) - pending, processing, completed, failed
      - `error_message` (text, nullable)
      - `processing_time_ms` (integer)
      - `created_at` (timestamptz)
      - `completed_at` (timestamptz, nullable)

    - `voice_personas_custom`
      - `id` (uuid, primary key)
      - `name` (text) - persona name
      - `description` (text)
      - `elevenlabs_voice_id` (text) - ElevenLabs voice ID
      - `sample_audio_url` (text, nullable) - sample audio URL
      - `is_active` (boolean) - whether available for use
      - `created_by` (integer, references users)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Admins only can create/read/update voice recordings
    - Admins only can manage voice transformations
    - Admins only can manage custom voice personas
*/

-- Create voice_recordings table
CREATE TABLE IF NOT EXISTS voice_recordings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  original_text text,
  audio_url text NOT NULL,
  duration_seconds integer,
  file_size_bytes integer,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'completed', 'failed')),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create voice_transformations table
CREATE TABLE IF NOT EXISTS voice_transformations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recording_id uuid NOT NULL REFERENCES voice_recordings(id) ON DELETE CASCADE,
  source_voice_id text,
  target_voice_id text NOT NULL,
  transformation_type text NOT NULL DEFAULT 'speech_to_speech' CHECK (transformation_type IN ('speech_to_speech', 'text_to_speech')),
  output_audio_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message text,
  processing_time_ms integer,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Create voice_personas_custom table
CREATE TABLE IF NOT EXISTS voice_personas_custom (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  elevenlabs_voice_id text NOT NULL UNIQUE,
  sample_audio_url text,
  is_active boolean DEFAULT true,
  created_by integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_voice_recordings_admin_user ON voice_recordings(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_voice_recordings_status ON voice_recordings(status);
CREATE INDEX IF NOT EXISTS idx_voice_transformations_recording ON voice_transformations(recording_id);
CREATE INDEX IF NOT EXISTS idx_voice_transformations_status ON voice_transformations(status);
CREATE INDEX IF NOT EXISTS idx_voice_personas_active ON voice_personas_custom(is_active);

-- Enable RLS
ALTER TABLE voice_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_transformations ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_personas_custom ENABLE ROW LEVEL SECURITY;

-- RLS Policies for voice_recordings
CREATE POLICY "Admins can view all voice recordings"
  ON voice_recordings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()::integer
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can create voice recordings"
  ON voice_recordings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()::integer
      AND users.role = 'admin'
    )
    AND admin_user_id = auth.uid()::integer
  );

CREATE POLICY "Admins can update own voice recordings"
  ON voice_recordings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()::integer
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()::integer
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete own voice recordings"
  ON voice_recordings FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()::integer
      AND users.role = 'admin'
    )
  );

-- RLS Policies for voice_transformations
CREATE POLICY "Admins can view all voice transformations"
  ON voice_transformations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()::integer
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can create voice transformations"
  ON voice_transformations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()::integer
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update voice transformations"
  ON voice_transformations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()::integer
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()::integer
      AND users.role = 'admin'
    )
  );

-- RLS Policies for voice_personas_custom
CREATE POLICY "Admins can view all custom voice personas"
  ON voice_personas_custom FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()::integer
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can create custom voice personas"
  ON voice_personas_custom FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()::integer
      AND users.role = 'admin'
    )
    AND created_by = auth.uid()::integer
  );

CREATE POLICY "Admins can update custom voice personas"
  ON voice_personas_custom FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()::integer
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()::integer
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete custom voice personas"
  ON voice_personas_custom FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()::integer
      AND users.role = 'admin'
    )
  );

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_voice_recordings_updated_at
  BEFORE UPDATE ON voice_recordings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_voice_personas_custom_updated_at
  BEFORE UPDATE ON voice_personas_custom
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
