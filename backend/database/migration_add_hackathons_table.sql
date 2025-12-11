-- Migration: Add Hackathons Table
-- Description: Creates a table for managing hackathon events.

CREATE TABLE IF NOT EXISTS hackathons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  prize_pool VARCHAR(100), -- Free text like "$50,000"
  status VARCHAR(20) NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'voting', 'completed')),
  image_url TEXT,
  tags TEXT[] DEFAULT '{}',
  
  -- Meta
  participants_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_hackathons_slug ON hackathons(slug);
CREATE INDEX idx_hackathons_status ON hackathons(status);
CREATE INDEX idx_hackathons_date ON hackathons(start_date);

-- Trigger for updated_at
CREATE TRIGGER update_hackathons_updated_at BEFORE UPDATE ON hackathons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE hackathons ENABLE ROW LEVEL SECURITY;

-- Everyone can read
CREATE POLICY "Hackathons are viewable by everyone" ON hackathons FOR SELECT USING (true);

-- Only admins can insert/update/delete
-- Note: Requires user role check
CREATE POLICY "Admins can manage hackathons" ON hackathons FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
