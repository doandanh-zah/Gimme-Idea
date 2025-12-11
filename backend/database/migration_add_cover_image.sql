-- Migration: Add cover_image to users table and comment functions
-- Date: 2024-12-11

-- Add cover_image column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS cover_image TEXT;

-- Add updated_at column to comments table
ALTER TABLE comments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- Comment for documentation
COMMENT ON COLUMN users.cover_image IS 'URL to user profile cover/banner image';

-- Function to decrement feedback count
CREATE OR REPLACE FUNCTION decrement_feedback_count(project_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE projects 
  SET feedback_count = GREATEST(0, COALESCE(feedback_count, 0) - 1)
  WHERE id = project_id;
END;
$$ LANGUAGE plpgsql;
