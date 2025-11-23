-- Migration: Add login tracking to users table
-- Run this if you already created the database with the old schema

-- Add new columns for login tracking
ALTER TABLE users
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0;

-- Update existing users with default values
UPDATE users
SET login_count = 0
WHERE login_count IS NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login_at DESC);

COMMIT;
