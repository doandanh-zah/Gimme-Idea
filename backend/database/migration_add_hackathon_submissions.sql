-- Migration: Add Hackathon Submissions Table
-- Description: Creates tables for managing idea submissions to hackathons

-- =============================================
-- DROP EXISTING OBJECTS (if any)
-- =============================================

-- Drop tables first (CASCADE will handle indexes, triggers, policies)
DROP TABLE IF EXISTS hackathon_submission_votes CASCADE;
DROP TABLE IF EXISTS hackathon_registrations CASCADE;
DROP TABLE IF EXISTS hackathon_submissions CASCADE;

-- Drop functions (safe to drop even if not exists)
DROP FUNCTION IF EXISTS get_submission_vote_count(UUID);
DROP FUNCTION IF EXISTS has_user_voted_submission(UUID, UUID);
DROP FUNCTION IF EXISTS update_hackathon_participants_count();

-- =============================================
-- HACKATHON SUBMISSIONS TABLE
-- =============================================
-- Links ideas/projects to hackathons (many-to-many relationship)
CREATE TABLE IF NOT EXISTS hackathon_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hackathon_id UUID NOT NULL REFERENCES hackathons(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Submission details
  pitch_video_url TEXT,
  pitch_deck_url TEXT,
  notes TEXT,
  
  -- Status tracking
  status VARCHAR(20) NOT NULL DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'under_review', 'shortlisted', 'winner', 'rejected')),
  
  -- Judging
  judge_score NUMERIC(5, 2), -- 0.00 to 100.00
  judge_notes TEXT,
  
  -- Timestamps
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique submission per project per hackathon
  UNIQUE(hackathon_id, project_id)
);

-- Indexes for performance
CREATE INDEX idx_hackathon_submissions_hackathon ON hackathon_submissions(hackathon_id);
CREATE INDEX idx_hackathon_submissions_project ON hackathon_submissions(project_id);
CREATE INDEX idx_hackathon_submissions_user ON hackathon_submissions(user_id);
CREATE INDEX idx_hackathon_submissions_status ON hackathon_submissions(status);
CREATE INDEX idx_hackathon_submissions_submitted ON hackathon_submissions(submitted_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_hackathon_submissions_updated_at BEFORE UPDATE ON hackathon_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- HACKATHON SUBMISSION VOTES TABLE
-- =============================================
-- Allows users to vote on hackathon submissions (community voting)
CREATE TABLE IF NOT EXISTS hackathon_submission_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID NOT NULL REFERENCES hackathon_submissions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(submission_id, user_id)
);

CREATE INDEX idx_hackathon_submission_votes_submission ON hackathon_submission_votes(submission_id);
CREATE INDEX idx_hackathon_submission_votes_user ON hackathon_submission_votes(user_id);

-- =============================================
-- HACKATHON REGISTRATIONS TABLE
-- =============================================
-- Track users who registered for hackathons
CREATE TABLE IF NOT EXISTS hackathon_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hackathon_id UUID NOT NULL REFERENCES hackathons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_name VARCHAR(100),
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(hackathon_id, user_id)
);

CREATE INDEX idx_hackathon_registrations_hackathon ON hackathon_registrations(hackathon_id);
CREATE INDEX idx_hackathon_registrations_user ON hackathon_registrations(user_id);

-- =============================================
-- RLS POLICIES
-- =============================================
ALTER TABLE hackathon_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hackathon_submission_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE hackathon_registrations ENABLE ROW LEVEL SECURITY;

-- Submissions: Everyone can read, users can manage their own
CREATE POLICY "Hackathon submissions are viewable by everyone" 
  ON hackathon_submissions FOR SELECT USING (true);

CREATE POLICY "Users can create their own submissions" 
  ON hackathon_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own submissions" 
  ON hackathon_submissions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own submissions" 
  ON hackathon_submissions FOR DELETE USING (auth.uid() = user_id);

-- Votes: Everyone can read, users can manage their own
CREATE POLICY "Hackathon submission votes are viewable by everyone" 
  ON hackathon_submission_votes FOR SELECT USING (true);

CREATE POLICY "Users can vote" 
  ON hackathon_submission_votes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their vote" 
  ON hackathon_submission_votes FOR DELETE USING (auth.uid() = user_id);

-- Registrations: Everyone can read, users can manage their own
CREATE POLICY "Hackathon registrations are viewable by everyone" 
  ON hackathon_registrations FOR SELECT USING (true);

CREATE POLICY "Users can register themselves" 
  ON hackathon_registrations FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unregister themselves" 
  ON hackathon_registrations FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to get submission vote count
CREATE OR REPLACE FUNCTION get_submission_vote_count(submission_uuid UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER FROM hackathon_submission_votes WHERE submission_id = submission_uuid;
$$ LANGUAGE SQL STABLE;

-- Function to check if user voted for a submission
CREATE OR REPLACE FUNCTION has_user_voted_submission(submission_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM hackathon_submission_votes 
    WHERE submission_id = submission_uuid AND user_id = user_uuid
  );
$$ LANGUAGE SQL STABLE;

-- Update hackathon participants count trigger
CREATE OR REPLACE FUNCTION update_hackathon_participants_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE hackathons SET participants_count = participants_count + 1 WHERE id = NEW.hackathon_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE hackathons SET participants_count = participants_count - 1 WHERE id = OLD.hackathon_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_hackathon_participants
  AFTER INSERT OR DELETE ON hackathon_registrations
  FOR EACH ROW EXECUTE FUNCTION update_hackathon_participants_count();
