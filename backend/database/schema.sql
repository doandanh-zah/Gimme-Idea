-- Gimme Idea Database Schema for Supabase
-- Run this SQL in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- USERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  bio TEXT,
  avatar TEXT,
  reputation_score INTEGER DEFAULT 0,
  social_links JSONB DEFAULT '{}'::jsonb,
  last_login_at TIMESTAMP WITH TIME ZONE,
  login_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_wallet ON users(wallet);
CREATE INDEX idx_users_username ON users(username);

-- =============================================
-- PROJECTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('DeFi', 'NFT', 'Gaming', 'Infrastructure', 'DAO')),
  stage VARCHAR(50) NOT NULL CHECK (stage IN ('Idea', 'Prototype', 'Devnet', 'Mainnet')),
  tags TEXT[] DEFAULT '{}',
  bounty NUMERIC(18, 9) DEFAULT 0,
  votes INTEGER DEFAULT 0,
  feedback_count INTEGER DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_projects_author ON projects(author_id);
CREATE INDEX idx_projects_category ON projects(category);
CREATE INDEX idx_projects_stage ON projects(stage);
CREATE INDEX idx_projects_votes ON projects(votes DESC);
CREATE INDEX idx_projects_created ON projects(created_at DESC);

-- =============================================
-- COMMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_comments_project ON comments(project_id);
CREATE INDEX idx_comments_user ON comments(user_id);
CREATE INDEX idx_comments_parent ON comments(parent_comment_id);
CREATE INDEX idx_comments_created ON comments(created_at DESC);

-- =============================================
-- TRANSACTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tx_hash VARCHAR(255) UNIQUE NOT NULL,
  from_wallet VARCHAR(255) NOT NULL,
  to_wallet VARCHAR(255) NOT NULL,
  amount NUMERIC(18, 9) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('tip', 'bounty', 'reward')),
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  comment_id UUID REFERENCES comments(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_transactions_hash ON transactions(tx_hash);
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_project ON transactions(project_id);
CREATE INDEX idx_transactions_created ON transactions(created_at DESC);

-- =============================================
-- PROJECT VOTES TABLE (Prevent duplicate votes)
-- =============================================
CREATE TABLE IF NOT EXISTS project_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

CREATE INDEX idx_project_votes_project ON project_votes(project_id);
CREATE INDEX idx_project_votes_user ON project_votes(user_id);

-- =============================================
-- COMMENT LIKES TABLE (Prevent duplicate likes)
-- =============================================
CREATE TABLE IF NOT EXISTS comment_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

CREATE INDEX idx_comment_likes_comment ON comment_likes(comment_id);
CREATE INDEX idx_comment_likes_user ON comment_likes(user_id);

-- =============================================
-- TRIGGERS (Auto-update timestamps)
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY (RLS) Policies
-- =============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

-- Users: Anyone can read, only authenticated users can update their own profile
CREATE POLICY "Users are viewable by everyone" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- Projects: Anyone can read, only authenticated users can create, only authors can update/delete
CREATE POLICY "Projects are viewable by everyone" ON projects FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create projects" ON projects FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authors can update their own projects" ON projects FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Authors can delete their own projects" ON projects FOR DELETE USING (auth.uid() = author_id);

-- Comments: Anyone can read, only authenticated users can create
CREATE POLICY "Comments are viewable by everyone" ON comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create comments" ON comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Transactions: Only authenticated users can view their own transactions
CREATE POLICY "Users can view their own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own transactions" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Project Votes: Anyone can read, authenticated users can vote
CREATE POLICY "Project votes are viewable by everyone" ON project_votes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can vote" ON project_votes FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Comment Likes: Anyone can read, authenticated users can like
CREATE POLICY "Comment likes are viewable by everyone" ON comment_likes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can like comments" ON comment_likes FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- =============================================
-- STORAGE BUCKETS (For images)
-- =============================================
-- Run this separately in Supabase Storage section:
-- 1. Create bucket "project-images" (public)
-- 2. Create bucket "avatars" (public)

-- =============================================
-- SAMPLE DATA (Optional - for testing)
-- =============================================
-- Uncomment if you want to insert sample data

-- INSERT INTO users (wallet, username, bio, avatar, reputation_score) VALUES
--   ('DemoWalletAddress123', 'alice_sol', 'Solana developer & DeFi enthusiast', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice', 150),
--   ('DemoWalletAddress456', 'bob_builder', 'Building the future on Solana', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob', 200);

-- INSERT INTO projects (author_id, title, description, category, stage, tags, bounty, votes) VALUES
--   ((SELECT id FROM users WHERE username = 'alice_sol'),
--    'DeFi Lending Protocol',
--    'A decentralized lending platform on Solana with instant liquidity',
--    'DeFi',
--    'Prototype',
--    ARRAY['lending', 'defi', 'liquidity'],
--    100,
--    42);

COMMIT;
