-- Migration: Add user management fields
-- Date: 2024-12-19
-- Description: Add is_banned column to users table for admin user management

-- Add is_banned column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE;

-- Add last_login_at column if not exists
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;

-- Create index for quick filtering of banned users
CREATE INDEX IF NOT EXISTS idx_users_is_banned ON users(is_banned) WHERE is_banned = TRUE;

-- Create index for recent logins
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login_at DESC);

-- Comment
COMMENT ON COLUMN users.is_banned IS 'Whether the user is banned from the platform';
COMMENT ON COLUMN users.last_login_at IS 'Last time the user logged in';
