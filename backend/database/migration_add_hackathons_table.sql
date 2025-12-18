-- Migration: Add Hackathons Table
-- Description: Creates the main hackathons table

-- =============================================
-- DROP EXISTING (if any)
-- =============================================
DROP TABLE IF EXISTS hackathons CASCADE;

-- =============================================
-- HACKATHONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS hackathons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Basic Info
  slug VARCHAR(100) UNIQUE NOT NULL,
  title VARCHAR(200) NOT NULL,
  tagline VARCHAR(500),
  description TEXT,
  
  -- Organizer
  organizer_name VARCHAR(100),
  organizer_logo TEXT,
  organizer_website TEXT,
  
  -- Visuals
  banner_image TEXT,
  theme_color VARCHAR(20) DEFAULT '#FFD700',
  
  -- Prize & Participants
  prize_pool VARCHAR(50),
  participants_count INTEGER DEFAULT 0,
  max_participants INTEGER,
  
  -- Status
  status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('draft', 'upcoming', 'active', 'judging', 'completed', 'cancelled')),
  is_featured BOOLEAN DEFAULT false,
  
  -- Dates
  registration_start TIMESTAMP WITH TIME ZONE,
  registration_end TIMESTAMP WITH TIME ZONE,
  submission_start TIMESTAMP WITH TIME ZONE,
  submission_end TIMESTAMP WITH TIME ZONE,
  judging_start TIMESTAMP WITH TIME ZONE,
  judging_end TIMESTAMP WITH TIME ZONE,
  
  -- Settings
  allow_team_submissions BOOLEAN DEFAULT true,
  max_team_size INTEGER DEFAULT 5,
  require_video BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_hackathons_slug ON hackathons(slug);
CREATE INDEX idx_hackathons_status ON hackathons(status);
CREATE INDEX idx_hackathons_featured ON hackathons(is_featured) WHERE is_featured = true;
CREATE INDEX idx_hackathons_submission_end ON hackathons(submission_end DESC);

-- Trigger for updated_at
CREATE TRIGGER update_hackathons_updated_at BEFORE UPDATE ON hackathons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- RLS POLICIES
-- =============================================
ALTER TABLE hackathons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hackathons are viewable by everyone" 
  ON hackathons FOR SELECT USING (true);

CREATE POLICY "Only admins can create hackathons" 
  ON hackathons FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Only admins can update hackathons" 
  ON hackathons FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Only admins can delete hackathons" 
  ON hackathons FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- =============================================
-- INSERT SAMPLE HACKATHON FOR TESTING
-- =============================================
INSERT INTO hackathons (
  slug,
  title,
  tagline,
  description,
  organizer_name,
  prize_pool,
  status,
  is_featured,
  registration_start,
  registration_end,
  submission_start,
  submission_end,
  judging_start,
  judging_end
) VALUES (
  'solana-hackathon-2025',
  'Solana Global Hackathon 2025',
  'Build the future of decentralized applications',
  'Join the biggest Solana hackathon of the year! Build innovative dApps, DeFi protocols, NFT platforms, and more.',
  'Solana Foundation',
  '$1,000,000',
  'active',
  true,
  NOW() - INTERVAL '30 days',
  NOW() + INTERVAL '60 days',
  NOW() - INTERVAL '7 days',
  NOW() + INTERVAL '53 days',
  NOW() + INTERVAL '53 days',
  NOW() + INTERVAL '60 days'
) ON CONFLICT (slug) DO NOTHING;

-- Get the ID for reference
DO $$
DECLARE
  hackathon_uuid UUID;
BEGIN
  SELECT id INTO hackathon_uuid FROM hackathons WHERE slug = 'solana-hackathon-2025';
  RAISE NOTICE 'Hackathon UUID: %', hackathon_uuid;
END $$;
