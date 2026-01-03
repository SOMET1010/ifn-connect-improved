/*
  # Add Profile Photo Support

  ## Overview
  This migration adds profile photo URL support to the users table,
  enabling users to upload and display custom profile photos.

  ## 1. Modifications to `users` Table

  ### New Columns
  - `profile_photo_url` (text) - URL to the user's profile photo

  ## 2. Features
  - Optional field (nullable) - users without photos will show default avatar
  - Stores full URL to photo (can be from storage bucket or CDN)
  - No size limit on URL length (text type)

  ## 3. Important Notes
  - Photos should be stored in a dedicated storage bucket
  - Frontend should handle image optimization and cropping
  - Default avatar will be generated from user initials if no photo
*/

-- Add profile_photo_url column to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'profile_photo_url'
  ) THEN
    ALTER TABLE users ADD COLUMN profile_photo_url text;
  END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS users_profile_photo_idx ON users(profile_photo_url) WHERE profile_photo_url IS NOT NULL;
