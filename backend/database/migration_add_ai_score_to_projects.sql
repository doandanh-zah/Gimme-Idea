-- Add AI score column to projects table for recommendation sorting
ALTER TABLE projects ADD COLUMN IF NOT EXISTS ai_score INTEGER DEFAULT NULL;

-- Add index for faster sorting
CREATE INDEX IF NOT EXISTS idx_projects_ai_score ON projects(ai_score DESC NULLS LAST);

-- Comment
COMMENT ON COLUMN projects.ai_score IS 'AI-generated quality score (0-100) used for recommendations';
