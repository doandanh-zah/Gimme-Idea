-- Migration: Hackathon System V2
-- Date: 2024-12-19
-- Description: Redesign hackathon system for Gimme Idea's 3-round format
-- Round 1: Idea Phase (submit ideas, get feedback, unlock more ideas)
-- Round 2: Pitching Phase (top 15 teams pitch)
-- Round 3: Final Demo (top 10 teams show MVP)

-- =============================================
-- HACKATHON ROUNDS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS hackathon_rounds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hackathon_id UUID NOT NULL REFERENCES hackathons(id) ON DELETE CASCADE,
  
  -- Round Info
  round_number INTEGER NOT NULL CHECK (round_number IN (1, 2, 3)),
  title VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- Round Type
  round_type VARCHAR(20) NOT NULL CHECK (round_type IN ('idea', 'pitching', 'final')),
  mode VARCHAR(20) DEFAULT 'online' CHECK (mode IN ('online', 'offline', 'hybrid')),
  
  -- Teams Advancing
  teams_advancing INTEGER, -- Number of teams that advance to next round
  bonus_teams INTEGER DEFAULT 0, -- Extra teams from engagement (e.g., top 5 engagement)
  
  -- Dates
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  results_date TIMESTAMP WITH TIME ZONE, -- When winners are announced
  
  -- Scoring Weights (percentage, should sum to 100)
  weight_quality INTEGER DEFAULT 50, -- Idea/Project quality
  weight_engagement INTEGER DEFAULT 30, -- Feedback given, interactions
  weight_votes INTEGER DEFAULT 20, -- Community votes
  
  -- Idea Limits for Round 1
  base_idea_limit INTEGER DEFAULT 3, -- Starting idea limit per team
  unlocked_idea_limit INTEGER DEFAULT 5, -- After engagement threshold
  engagement_threshold INTEGER DEFAULT 10, -- Feedbacks needed to unlock
  
  -- Status
  status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'judging', 'completed')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_hackathon_rounds_hackathon ON hackathon_rounds(hackathon_id);
CREATE INDEX IF NOT EXISTS idx_hackathon_rounds_status ON hackathon_rounds(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_hackathon_rounds_unique ON hackathon_rounds(hackathon_id, round_number);

-- =============================================
-- HACKATHON PRIZES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS hackathon_prizes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hackathon_id UUID NOT NULL REFERENCES hackathons(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  
  -- Prize Info
  rank INTEGER NOT NULL, -- 1, 2, 3, etc.
  title VARCHAR(100) NOT NULL, -- "1st Place", "Best Innovation", etc.
  prize_amount VARCHAR(50), -- "$10,000", "5,000,000 VND"
  description TEXT,
  
  -- Winner (filled when announced)
  winner_team_id UUID REFERENCES hackathon_teams(id),
  announced_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hackathon_prizes_hackathon ON hackathon_prizes(hackathon_id, round_number);

-- =============================================
-- HACKATHON TEAMS TABLE (Update if exists)
-- =============================================
-- Add columns to existing hackathon_teams table
DO $$ 
BEGIN
  -- Add engagement score tracking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hackathon_teams' AND column_name = 'engagement_score') THEN
    ALTER TABLE hackathon_teams ADD COLUMN engagement_score INTEGER DEFAULT 0;
  END IF;
  
  -- Add feedbacks given count
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hackathon_teams' AND column_name = 'feedbacks_given') THEN
    ALTER TABLE hackathon_teams ADD COLUMN feedbacks_given INTEGER DEFAULT 0;
  END IF;
  
  -- Add ideas count
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hackathon_teams' AND column_name = 'ideas_count') THEN
    ALTER TABLE hackathon_teams ADD COLUMN ideas_count INTEGER DEFAULT 0;
  END IF;
  
  -- Add max ideas (unlockable)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hackathon_teams' AND column_name = 'max_ideas') THEN
    ALTER TABLE hackathon_teams ADD COLUMN max_ideas INTEGER DEFAULT 3;
  END IF;
  
  -- Add current round status
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hackathon_teams' AND column_name = 'current_round') THEN
    ALTER TABLE hackathon_teams ADD COLUMN current_round INTEGER DEFAULT 1;
  END IF;
  
  -- Add eliminated flag
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hackathon_teams' AND column_name = 'is_eliminated') THEN
    ALTER TABLE hackathon_teams ADD COLUMN is_eliminated BOOLEAN DEFAULT FALSE;
  END IF;
  
  -- Add eliminated at round
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hackathon_teams' AND column_name = 'eliminated_at_round') THEN
    ALTER TABLE hackathon_teams ADD COLUMN eliminated_at_round INTEGER;
  END IF;
  
  -- Add final rank
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hackathon_teams' AND column_name = 'final_rank') THEN
    ALTER TABLE hackathon_teams ADD COLUMN final_rank INTEGER;
  END IF;
END $$;

-- =============================================
-- HACKATHON IDEAS TABLE
-- Ideas submitted specifically for a hackathon
-- =============================================
CREATE TABLE IF NOT EXISTS hackathon_ideas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hackathon_id UUID NOT NULL REFERENCES hackathons(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES hackathon_teams(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Round Info
  submitted_round INTEGER DEFAULT 1,
  
  -- Scoring
  quality_score DECIMAL(5,2), -- AI-generated quality score
  engagement_score DECIMAL(5,2), -- Based on feedback received
  vote_score DECIMAL(5,2), -- Based on community votes
  total_score DECIMAL(5,2), -- Weighted total
  
  -- Status
  status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'finalist', 'winner', 'eliminated')),
  is_featured BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_edited_at TIMESTAMP WITH TIME ZONE,
  can_edit BOOLEAN DEFAULT TRUE, -- Locked after round ends
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hackathon_ideas_hackathon ON hackathon_ideas(hackathon_id);
CREATE INDEX IF NOT EXISTS idx_hackathon_ideas_team ON hackathon_ideas(team_id);
CREATE INDEX IF NOT EXISTS idx_hackathon_ideas_project ON hackathon_ideas(project_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_hackathon_ideas_unique ON hackathon_ideas(hackathon_id, project_id);

-- =============================================
-- HACKATHON FEEDBACK TABLE
-- Track feedback between teams
-- =============================================
CREATE TABLE IF NOT EXISTS hackathon_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hackathon_id UUID NOT NULL REFERENCES hackathons(id) ON DELETE CASCADE,
  
  -- Who gave feedback
  from_team_id UUID NOT NULL REFERENCES hackathon_teams(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- What received feedback
  to_idea_id UUID NOT NULL REFERENCES hackathon_ideas(id) ON DELETE CASCADE,
  
  -- Feedback content (references comments table)
  comment_id UUID REFERENCES comments(id) ON DELETE SET NULL,
  
  -- Quality rating by recipient
  is_valuable BOOLEAN, -- Recipient marks as valuable feedback
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hackathon_feedback_hackathon ON hackathon_feedback(hackathon_id);
CREATE INDEX IF NOT EXISTS idx_hackathon_feedback_from_team ON hackathon_feedback(from_team_id);
CREATE INDEX IF NOT EXISTS idx_hackathon_feedback_to_idea ON hackathon_feedback(to_idea_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_hackathon_feedback_unique ON hackathon_feedback(from_user_id, to_idea_id);

-- =============================================
-- ROUND RESULTS TABLE
-- Store results for each round
-- =============================================
CREATE TABLE IF NOT EXISTS hackathon_round_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hackathon_id UUID NOT NULL REFERENCES hackathons(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  team_id UUID NOT NULL REFERENCES hackathon_teams(id) ON DELETE CASCADE,
  
  -- Scores
  quality_score DECIMAL(5,2),
  engagement_score DECIMAL(5,2),
  vote_score DECIMAL(5,2),
  total_score DECIMAL(5,2),
  
  -- Rank in this round
  rank INTEGER,
  
  -- Advancement
  advanced BOOLEAN DEFAULT FALSE,
  advancement_type VARCHAR(20), -- 'quality', 'engagement', 'special'
  
  -- Prize won (if any)
  prize_id UUID REFERENCES hackathon_prizes(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_round_results_hackathon ON hackathon_round_results(hackathon_id, round_number);
CREATE UNIQUE INDEX IF NOT EXISTS idx_round_results_unique ON hackathon_round_results(hackathon_id, round_number, team_id);

-- =============================================
-- UPDATE HACKATHONS TABLE
-- =============================================
DO $$ 
BEGIN
  -- Add tagline
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hackathons' AND column_name = 'tagline') THEN
    ALTER TABLE hackathons ADD COLUMN tagline VARCHAR(300);
  END IF;

  -- Add max participants
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hackathons' AND column_name = 'max_participants') THEN
    ALTER TABLE hackathons ADD COLUMN max_participants INTEGER DEFAULT 100;
  END IF;

  -- Add registration start
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hackathons' AND column_name = 'registration_start') THEN
    ALTER TABLE hackathons ADD COLUMN registration_start TIMESTAMP WITH TIME ZONE;
  END IF;

  -- Add registration end
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hackathons' AND column_name = 'registration_end') THEN
    ALTER TABLE hackathons ADD COLUMN registration_end TIMESTAMP WITH TIME ZONE;
  END IF;

  -- Add current round tracking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hackathons' AND column_name = 'current_round') THEN
    ALTER TABLE hackathons ADD COLUMN current_round INTEGER DEFAULT 0;
  END IF;
  
  -- Add format info
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hackathons' AND column_name = 'format') THEN
    ALTER TABLE hackathons ADD COLUMN format VARCHAR(20) DEFAULT 'gimme-standard';
  END IF;
  
  -- Add total rounds
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hackathons' AND column_name = 'total_rounds') THEN
    ALTER TABLE hackathons ADD COLUMN total_rounds INTEGER DEFAULT 3;
  END IF;
  
  -- Add cover image (1x3 banner)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hackathons' AND column_name = 'cover_image') THEN
    ALTER TABLE hackathons ADD COLUMN cover_image TEXT;
  END IF;
  
  -- Add mode (online/offline/hybrid)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hackathons' AND column_name = 'mode') THEN
    ALTER TABLE hackathons ADD COLUMN mode VARCHAR(20) DEFAULT 'online';
  END IF;
  
  -- Add currency (VND/USD)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hackathons' AND column_name = 'currency') THEN
    ALTER TABLE hackathons ADD COLUMN currency VARCHAR(3) DEFAULT 'VND';
  END IF;
  
  -- Add judging criteria JSON
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hackathons' AND column_name = 'judging_criteria') THEN
    ALTER TABLE hackathons ADD COLUMN judging_criteria JSONB DEFAULT '[{"name": "Innovation", "weight": 30}, {"name": "Feasibility", "weight": 25}, {"name": "Impact", "weight": 25}, {"name": "Presentation", "weight": 20}]'::jsonb;
  END IF;
END $$;

-- =============================================
-- HACKATHON SCHEDULE/EVENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS hackathon_schedule (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hackathon_id UUID NOT NULL REFERENCES hackathons(id) ON DELETE CASCADE,
  
  title VARCHAR(200) NOT NULL,
  description TEXT,
  event_type VARCHAR(20) DEFAULT 'workshop' CHECK (event_type IN ('workshop', 'mentoring', 'ceremony', 'other')),
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  link TEXT, -- Luma/Meet/Zoom link
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hackathon_schedule_hackathon ON hackathon_schedule(hackathon_id);

-- =============================================
-- PARTNER HACKATHONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS hackathon_partners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hackathon_id UUID NOT NULL REFERENCES hackathons(id) ON DELETE CASCADE,
  
  partner_name VARCHAR(200) NOT NULL,
  partner_link TEXT NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hackathon_partners_hackathon ON hackathon_partners(hackathon_id);

-- =============================================
-- RLS POLICIES
-- =============================================

-- Drop existing policies first (to allow re-running migration)
DROP POLICY IF EXISTS "hackathon_rounds_view" ON hackathon_rounds;
DROP POLICY IF EXISTS "hackathon_prizes_view" ON hackathon_prizes;
DROP POLICY IF EXISTS "hackathon_ideas_view" ON hackathon_ideas;
DROP POLICY IF EXISTS "hackathon_feedback_view" ON hackathon_feedback;
DROP POLICY IF EXISTS "hackathon_round_results_view" ON hackathon_round_results;
DROP POLICY IF EXISTS "hackathon_schedule_view" ON hackathon_schedule;
DROP POLICY IF EXISTS "hackathon_partners_view" ON hackathon_partners;
DROP POLICY IF EXISTS "hackathon_ideas_insert" ON hackathon_ideas;
DROP POLICY IF EXISTS "hackathon_feedback_insert" ON hackathon_feedback;
DROP POLICY IF EXISTS "hackathon_prizes_admin" ON hackathon_prizes;
DROP POLICY IF EXISTS "hackathon_round_results_admin" ON hackathon_round_results;
DROP POLICY IF EXISTS "hackathon_rounds_admin" ON hackathon_rounds;
DROP POLICY IF EXISTS "hackathon_schedule_admin" ON hackathon_schedule;
DROP POLICY IF EXISTS "hackathon_partners_admin" ON hackathon_partners;

-- Enable RLS
ALTER TABLE hackathon_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE hackathon_prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE hackathon_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE hackathon_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE hackathon_round_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE hackathon_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE hackathon_partners ENABLE ROW LEVEL SECURITY;

-- Everyone can view
CREATE POLICY "hackathon_rounds_view" ON hackathon_rounds FOR SELECT USING (true);
CREATE POLICY "hackathon_prizes_view" ON hackathon_prizes FOR SELECT USING (true);
CREATE POLICY "hackathon_ideas_view" ON hackathon_ideas FOR SELECT USING (true);
CREATE POLICY "hackathon_feedback_view" ON hackathon_feedback FOR SELECT USING (true);
CREATE POLICY "hackathon_round_results_view" ON hackathon_round_results FOR SELECT USING (true);
CREATE POLICY "hackathon_schedule_view" ON hackathon_schedule FOR SELECT USING (true);
CREATE POLICY "hackathon_partners_view" ON hackathon_partners FOR SELECT USING (true);

-- Team members can insert their own ideas
CREATE POLICY "hackathon_ideas_insert" ON hackathon_ideas FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM hackathon_team_members 
    WHERE team_id = hackathon_ideas.team_id AND user_id = auth.uid()
  )
);

-- Users can give feedback
CREATE POLICY "hackathon_feedback_insert" ON hackathon_feedback FOR INSERT WITH CHECK (
  from_user_id = auth.uid()
);

-- Only admins can manage prizes and results
CREATE POLICY "hackathon_prizes_admin" ON hackathon_prizes FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "hackathon_round_results_admin" ON hackathon_round_results FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Admins can manage rounds, schedule and partners
CREATE POLICY "hackathon_rounds_admin" ON hackathon_rounds FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "hackathon_schedule_admin" ON hackathon_schedule FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "hackathon_partners_admin" ON hackathon_partners FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- =============================================
-- FUNCTION: Update team engagement score
-- =============================================
CREATE OR REPLACE FUNCTION update_team_engagement()
RETURNS TRIGGER AS $$
BEGIN
  -- Update feedbacks_given count for the team
  UPDATE hackathon_teams 
  SET feedbacks_given = feedbacks_given + 1,
      engagement_score = engagement_score + 1
  WHERE id = NEW.from_team_id;
  
  -- Check if team unlocks more ideas
  UPDATE hackathon_teams 
  SET max_ideas = 5
  WHERE id = NEW.from_team_id 
    AND feedbacks_given >= 10 
    AND max_ideas < 5;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for feedback
DROP TRIGGER IF EXISTS trigger_update_team_engagement ON hackathon_feedback;
CREATE TRIGGER trigger_update_team_engagement
  AFTER INSERT ON hackathon_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_team_engagement();

-- =============================================
-- FUNCTION: Update team ideas count
-- =============================================
CREATE OR REPLACE FUNCTION update_team_ideas_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE hackathon_teams 
    SET ideas_count = ideas_count + 1
    WHERE id = NEW.team_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE hackathon_teams 
    SET ideas_count = ideas_count - 1
    WHERE id = OLD.team_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for ideas count
DROP TRIGGER IF EXISTS trigger_update_team_ideas_count ON hackathon_ideas;
CREATE TRIGGER trigger_update_team_ideas_count
  AFTER INSERT OR DELETE ON hackathon_ideas
  FOR EACH ROW
  EXECUTE FUNCTION update_team_ideas_count();

-- Migration completed
DO $$ BEGIN RAISE NOTICE 'Migration hackathon_v2 completed successfully!'; END $$;
