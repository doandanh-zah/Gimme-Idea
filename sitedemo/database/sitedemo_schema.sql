-- =============================================
-- GIMME IDEA - SITEDEMO DATABASE SCHEMA
-- Simplified schema for demo purposes
-- Run this SQL in Supabase SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. USERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet VARCHAR(255) UNIQUE,
  username VARCHAR(100) UNIQUE NOT NULL,
  bio TEXT,
  avatar TEXT,
  reputation_score INTEGER DEFAULT 0,
  balance NUMERIC(18, 9) DEFAULT 0,
  social_links JSONB DEFAULT '{}'::jsonb,
  last_login_at TIMESTAMP WITH TIME ZONE,
  login_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- =============================================
-- 2. PROJECTS/IDEAS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(20) NOT NULL DEFAULT 'idea' CHECK (type IN ('project', 'idea')),
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('DeFi', 'NFT', 'Gaming', 'Infrastructure', 'DAO', 'DePIN', 'Social', 'Mobile', 'Security')),
  stage VARCHAR(50) NOT NULL DEFAULT 'Idea' CHECK (stage IN ('Idea', 'Prototype', 'Devnet', 'Mainnet')),
  tags TEXT[] DEFAULT '{}',
  website TEXT,
  bounty NUMERIC(18, 9) DEFAULT 0,
  votes INTEGER DEFAULT 0,
  feedback_count INTEGER DEFAULT 0,
  image_url TEXT,
  -- Idea fields
  problem TEXT,
  solution TEXT,
  opportunity TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_type ON projects(type);
CREATE INDEX IF NOT EXISTS idx_projects_author ON projects(author_id);
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_votes ON projects(votes DESC);
CREATE INDEX IF NOT EXISTS idx_projects_created ON projects(created_at DESC);

-- =============================================
-- 3. COMMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  is_anonymous BOOLEAN DEFAULT false,
  likes INTEGER DEFAULT 0,
  tips_amount NUMERIC(18, 9) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_project ON comments(project_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created ON comments(created_at DESC);

-- =============================================
-- 4. TRANSACTIONS TABLE (For tips)
-- =============================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tx_hash VARCHAR(255) UNIQUE NOT NULL,
  from_wallet VARCHAR(255) NOT NULL,
  to_wallet VARCHAR(255) NOT NULL,
  amount NUMERIC(18, 9) NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'tip' CHECK (type IN ('tip', 'bounty', 'reward')),
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  comment_id UUID REFERENCES comments(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_hash ON transactions(tx_hash);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_project ON transactions(project_id);

-- =============================================
-- 5. PROJECT VOTES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS project_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_project_votes_project ON project_votes(project_id);
CREATE INDEX IF NOT EXISTS idx_project_votes_user ON project_votes(user_id);

-- =============================================
-- 6. COMMENT LIKES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS comment_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Increment login count
CREATE OR REPLACE FUNCTION increment_login_count(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE users 
  SET login_count = COALESCE(login_count, 0) + 1,
      last_login_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Update feedback count trigger
CREATE OR REPLACE FUNCTION update_feedback_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE projects SET feedback_count = feedback_count + 1 WHERE id = NEW.project_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE projects SET feedback_count = feedback_count - 1 WHERE id = OLD.project_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Add reputation points
CREATE OR REPLACE FUNCTION add_reputation_points(p_user_id UUID, points INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE users 
  SET reputation_score = COALESCE(reputation_score, 0) + points
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS
-- =============================================

-- Drop triggers if exist then create
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
DROP TRIGGER IF EXISTS update_feedback_count_on_comment ON comments;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feedback_count_on_comment
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_feedback_count();

-- =============================================
-- ROW LEVEL SECURITY (Disable for backend access)
-- If using service_role key, RLS is bypassed automatically
-- =============================================

-- Disable RLS for simpler backend access (service_role bypasses anyway)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_votes DISABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes DISABLE ROW LEVEL SECURITY;

-- =============================================
-- SAMPLE DATA (Demo purposes)
-- =============================================

-- Insert demo user
INSERT INTO users (id, wallet, username, bio, avatar, reputation_score)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'DemoWallet123456789abcdefghijk',
  'demo_user',
  'Demo user for testing GimmeIdea',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Demo',
  100
) ON CONFLICT (wallet) DO NOTHING;

-- Insert sample ideas
INSERT INTO projects (id, type, author_id, title, description, category, stage, tags, problem, solution, votes)
VALUES 
(
  'b0000000-0000-0000-0000-000000000001',
  'idea',
  'a0000000-0000-0000-0000-000000000001',
  'Solana Mobile Payments',
  'A mobile-first payment app that makes sending SOL as easy as Venmo. Instant payments with zero fees using Solana.',
  'DeFi',
  'Idea',
  ARRAY['mobile', 'payments', 'solana'],
  'Sending crypto is still too complicated for regular users. Current wallets require technical knowledge.',
  'Build a simple mobile app with QR code scanning, phone contacts integration, and instant SOL transfers.',
  15
),
(
  'b0000000-0000-0000-0000-000000000002',
  'idea',
  'a0000000-0000-0000-0000-000000000001',
  'NFT Ticketing Platform',
  'Replace traditional event tickets with NFTs. Prevent scalping, enable secondary markets, and provide collectible memories.',
  'NFT',
  'Idea',
  ARRAY['nft', 'events', 'tickets'],
  'Event ticket scalping is a $15B problem. Fans pay inflated prices while artists lose revenue.',
  'NFT tickets with built-in royalties for resales. Artists get a cut of every secondary sale.',
  23
),
(
  'b0000000-0000-0000-0000-000000000003',
  'idea',
  'a0000000-0000-0000-0000-000000000001',
  'DAO Governance Tool',
  'Simplified DAO voting and proposal management. Make decentralized governance accessible to everyone.',
  'DAO',
  'Prototype',
  ARRAY['dao', 'governance', 'voting'],
  'Current DAO tools are complex. Most token holders dont participate in governance due to UX friction.',
  'Mobile-friendly governance app with push notifications, simple voting UI, and delegation features.',
  42
),
(
  'b0000000-0000-0000-0000-000000000004',
  'idea',
  'a0000000-0000-0000-0000-000000000001',
  'DePIN Weather Network',
  'Crowdsourced weather data using IoT sensors. Earn tokens by contributing accurate local weather information.',
  'DePIN',
  'Idea',
  ARRAY['depin', 'weather', 'iot'],
  'Weather data is centralized and often inaccurate for local areas. Limited coverage in developing regions.',
  'Deploy affordable weather sensors, reward contributors with tokens, sell data to agriculture and logistics.',
  8
),
(
  'b0000000-0000-0000-0000-000000000005',
  'idea',
  'a0000000-0000-0000-0000-000000000001',
  'Social Token Launchpad',
  'Enable creators to launch their own social tokens. Fans can invest in their favorite creators early.',
  'Social',
  'Idea',
  ARRAY['social', 'creator', 'tokens'],
  'Creators rely on platform algorithms. No way for fans to directly invest in creator success.',
  'Bonding curve token launches for creators. Early supporters get rewarded as creator grows.',
  31
)
ON CONFLICT (id) DO NOTHING;

-- Insert sample comments
INSERT INTO comments (id, project_id, user_id, content)
VALUES 
(
  'c0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'Love this idea! Mobile payments on Solana would be game-changing. Have you considered integrating with existing payment apps?'
),
(
  'c0000000-0000-0000-0000-000000000002',
  'b0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000001',
  'The NFT ticketing space is heating up. What makes this different from existing solutions like GET Protocol?'
),
(
  'c0000000-0000-0000-0000-000000000003',
  'b0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000001',
  'Great progress on the prototype! Would love to see delegation features prioritized.'
)
ON CONFLICT (id) DO NOTHING;

-- Update feedback counts
UPDATE projects SET feedback_count = (SELECT COUNT(*) FROM comments WHERE comments.project_id = projects.id);

COMMIT;

-- =============================================
-- DONE! Your sitedemo database is ready.
-- =============================================
