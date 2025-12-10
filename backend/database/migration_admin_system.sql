-- Migration: Add Admin Role and System Settings
-- Description: Adds RBAC (Role-Based Access Control) and a dynamic settings table for administrative events.
-- IMPORTANT: Run this migration in 2 steps if you encounter errors.

-- =================================================================
-- STEP 1: Add role column (RUN THIS FIRST, SEPARATELY)
-- =================================================================

-- Add 'role' column to 'users' table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';

-- Add check constraint separately (more compatible)
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage 
        WHERE table_name = 'users' AND constraint_name = 'users_role_check'
    ) THEN 
        ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'admin', 'moderator'));
    END IF; 
END $$;

-- =================================================================
-- STEP 2: Create system_settings table and policies (RUN AFTER STEP 1)
-- =================================================================

-- Create 'system_settings' table for dynamic configuration
CREATE TABLE IF NOT EXISTS system_settings (
  key VARCHAR(50) PRIMARY KEY, 
  value JSONB NOT NULL,        
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Enable RLS (Row Level Security)
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Public can view active settings (needed for Navbar to show event buttons)
DROP POLICY IF EXISTS "Public can view settings" ON system_settings;
CREATE POLICY "Public can view settings" ON system_settings FOR SELECT USING (true);

-- Policy: Only Admins can insert/update/delete settings
-- This policy checks if the current user has role = 'admin'
DROP POLICY IF EXISTS "Admins can manage settings" ON system_settings;
CREATE POLICY "Admins can manage settings" ON system_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Insert Default Settings (Example: An inactive Event Button)
INSERT INTO system_settings (key, value, description, is_active)
VALUES (
  'event_button_config', 
  '{"label": "Hackathon 2025", "url": "/hackathon", "style": "gradient-purple"}'::jsonb, 
  'Configuration for the special event button in the Navbar',
  false
) ON CONFLICT (key) DO NOTHING;

-- =================================================================
-- INSTRUCTION FOR DBA:
-- To promote a user to Admin, execute the following manually:
-- UPDATE users SET role = 'admin' WHERE wallet = 'TARGET_WALLET_ADDRESS';
-- =================================================================
