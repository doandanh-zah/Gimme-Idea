-- Migration: Add support for Ideas and additional fields
-- Run this migration if you have an existing database

-- Add balance field to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS balance NUMERIC(18, 9) DEFAULT 0;

-- Add new fields to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS type VARCHAR(20) NOT NULL DEFAULT 'project';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS problem TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS solution TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS opportunity TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS go_market TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS team_info TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT false;

-- Add check constraint for type field
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_type_check;
ALTER TABLE projects ADD CONSTRAINT projects_type_check CHECK (type IN ('project', 'idea'));

-- Add index for type field
CREATE INDEX IF NOT EXISTS idx_projects_type ON projects(type);

-- Add new fields to comments table
ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT false;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS tips_amount NUMERIC(18, 9) DEFAULT 0;

-- Update existing data (all existing projects are 'project' type by default)
UPDATE projects SET type = 'project' WHERE type IS NULL;
UPDATE comments SET is_anonymous = false WHERE is_anonymous IS NULL;
UPDATE comments SET tips_amount = 0 WHERE tips_amount IS NULL;
UPDATE users SET balance = 0 WHERE balance IS NULL;

COMMIT;
