-- Migration: Setup Gimme Sensei as Admin
-- Description: Promotes the AI bot account to admin role with full management capabilities

-- =================================================================
-- STEP 1: Promote Gimme Sensei to Admin
-- =================================================================

-- Update Gimme Sensei account to admin role by wallet
UPDATE users 
SET role = 'admin' 
WHERE wallet = 'FzcnaZMYcoAYpLgr7Wym2b8hrKYk3VXsRxWSLuvZKLJm';

-- Also try by username in case wallet changed
UPDATE users 
SET role = 'admin' 
WHERE username = 'Gimme Sensei' AND role != 'admin';

-- =================================================================
-- STEP 2: Create Hackathon Submissions Table
-- =================================================================

CREATE TABLE IF NOT EXISTS hackathon_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hackathon_id UUID NOT NULL REFERENCES hackathons(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Admin scoring (by Gimme Sensei or other admins)
  score INTEGER DEFAULT NULL CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
  score_breakdown JSONB DEFAULT NULL, -- { "innovation": 25, "execution": 25, "impact": 25, "presentation": 25 }
  scored_by UUID REFERENCES users(id) ON DELETE SET NULL,
  scored_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'winner', 'finalist')),
  
  -- Meta
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(hackathon_id, project_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_hackathon_submissions_hackathon ON hackathon_submissions(hackathon_id);
CREATE INDEX IF NOT EXISTS idx_hackathon_submissions_project ON hackathon_submissions(project_id);
CREATE INDEX IF NOT EXISTS idx_hackathon_submissions_user ON hackathon_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_hackathon_submissions_status ON hackathon_submissions(status);
CREATE INDEX IF NOT EXISTS idx_hackathon_submissions_score ON hackathon_submissions(score DESC NULLS LAST);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_hackathon_submissions_updated_at ON hackathon_submissions;
CREATE TRIGGER update_hackathon_submissions_updated_at 
  BEFORE UPDATE ON hackathon_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE hackathon_submissions ENABLE ROW LEVEL SECURITY;

-- Everyone can read submissions (for leaderboard)
DROP POLICY IF EXISTS "Submissions are viewable by everyone" ON hackathon_submissions;
CREATE POLICY "Submissions are viewable by everyone" ON hackathon_submissions FOR SELECT USING (true);

-- Users can submit their own projects
DROP POLICY IF EXISTS "Users can submit their projects" ON hackathon_submissions;
CREATE POLICY "Users can submit their projects" ON hackathon_submissions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Admins can manage all submissions (score, approve, reject)
DROP POLICY IF EXISTS "Admins can manage submissions" ON hackathon_submissions;
CREATE POLICY "Admins can manage submissions" ON hackathon_submissions FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- =================================================================
-- STEP 3: Add Admin RLS Policies for Projects (Allow admin to delete any project)
-- =================================================================

-- Allow admins to delete any project
DROP POLICY IF EXISTS "Admins can delete any project" ON projects;
CREATE POLICY "Admins can delete any project" ON projects FOR DELETE USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- =================================================================
-- STEP 4: Add admin verification column if not exists
-- =================================================================

-- Add is_verified column for admin-verified content
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;

-- =================================================================
-- STEP 5: Create admin activity log
-- =================================================================

CREATE TABLE IF NOT EXISTS admin_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL, -- 'delete_project', 'score_submission', 'verify_project', etc.
  target_type VARCHAR(50) NOT NULL, -- 'project', 'comment', 'user', 'hackathon', 'submission'
  target_id UUID NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_activity_admin ON admin_activity_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_action ON admin_activity_log(action);
CREATE INDEX IF NOT EXISTS idx_admin_activity_created ON admin_activity_log(created_at DESC);

-- RLS
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view/insert activity logs
DROP POLICY IF EXISTS "Admins can view activity log" ON admin_activity_log;
CREATE POLICY "Admins can view activity log" ON admin_activity_log FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Admins can insert activity log" ON admin_activity_log;
CREATE POLICY "Admins can insert activity log" ON admin_activity_log FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- =================================================================
-- VERIFICATION: Check Gimme Sensei is now admin
-- =================================================================

-- SELECT id, username, wallet, role FROM users WHERE wallet = 'FzcnaZMYcoAYpLgr7Wym2b8hrKYk3VXsRxWSLuvZKLJm';

