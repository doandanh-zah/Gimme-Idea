-- Migration: Add Email to Gimme Sensei Admin Account
-- Description: Adds the official contact email to the AI bot admin account
-- Run this AFTER migration_setup_admin_gimme_sensei.sql

-- =================================================================
-- Add email column to users table if not exists
-- =================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- =================================================================
-- Update Gimme Sensei with email
-- =================================================================

-- Update by wallet (most reliable)
UPDATE users 
SET email = 'gimmeidea.contact@gmail.com'
WHERE wallet = 'FzcnaZMYcoAYpLgr7Wym2b8hrKYk3VXsRxWSLuvZKLJm';

-- Also ensure role is admin (in case it wasn't set)
UPDATE users 
SET 
  role = 'admin',
  email = 'gimmeidea.contact@gmail.com'
WHERE username = 'Gimme Sensei';

-- =================================================================
-- VERIFICATION: Check Gimme Sensei now has email
-- =================================================================

-- Run this to verify:
-- SELECT id, username, wallet, role, email FROM users WHERE wallet = 'FzcnaZMYcoAYpLgr7Wym2b8hrKYk3VXsRxWSLuvZKLJm';
