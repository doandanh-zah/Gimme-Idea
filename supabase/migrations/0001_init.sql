-- Gimme Idea — Greenfield schema (SSOT)
-- Aligned with production inventory 2026-07-30 + backend/src contracts.
-- Apply on empty Postgres/Supabase project. Do NOT layer old backend/database/*.sql on top.
-- Intentionally OMITTED (prod empty twins / unused):
--   hackathon_ideas, hackathon_feedback, hackathon_round_results, hackathon_participants
-- Present on greenfield but missing on prod (code needs): billing_payments
-- Present on prod with data: keep ai_*, idea_search_quota, hackathon_announcements, etc.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ===========================================================================
-- CORE
-- ===========================================================================

CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet VARCHAR(255) UNIQUE,
  username VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(255) UNIQUE,
  email TEXT UNIQUE,
  auth_provider TEXT DEFAULT 'wallet' CHECK (auth_provider IS NULL OR auth_provider IN ('wallet', 'google', 'agent')),
  auth_id TEXT UNIQUE,
  needs_wallet_connect BOOLEAN DEFAULT false,
  bio TEXT,
  avatar TEXT,
  cover_image TEXT,
  social_links JSONB DEFAULT '{}'::jsonb,
  reputation_score INTEGER DEFAULT 0,
  balance NUMERIC(18, 9) DEFAULT 0,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
  is_banned BOOLEAN DEFAULT false,
  plan_tier VARCHAR(20) NOT NULL DEFAULT 'free' CHECK (plan_tier IN ('free', 'pro5', 'pro10')),
  plan_expires_at TIMESTAMPTZ,
  ideas_count INTEGER NOT NULL DEFAULT 0,
  projects_count INTEGER NOT NULL DEFAULT 0,
  feedback_count INTEGER NOT NULL DEFAULT 0,
  tips_received_count INTEGER NOT NULL DEFAULT 0,
  likes_received_count INTEGER NOT NULL DEFAULT 0,
  votes_received_count INTEGER NOT NULL DEFAULT 0,
  followers_count INTEGER NOT NULL DEFAULT 0,
  following_count INTEGER NOT NULL DEFAULT 0,
  login_count INTEGER DEFAULT 0,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_wallet ON public.users(wallet);
CREATE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_auth_id ON public.users(auth_id);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_is_banned ON public.users(is_banned) WHERE is_banned = true;
CREATE INDEX idx_users_plan_tier ON public.users(plan_tier);

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(20) NOT NULL DEFAULT 'project' CHECK (type IN ('project', 'idea')),
  author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  stage VARCHAR(50) NOT NULL CHECK (stage IN ('Idea', 'Prototype', 'Devnet', 'Mainnet')),
  tags TEXT[] DEFAULT '{}',
  website TEXT,
  image_url TEXT,
  bounty NUMERIC(18, 9) DEFAULT 0,
  votes INTEGER DEFAULT 0,
  feedback_count INTEGER DEFAULT 0,
  ai_score INTEGER,
  problem TEXT,
  solution TEXT,
  opportunity TEXT,
  go_market TEXT,
  team_info TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  -- Admin verification
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  -- Optional hackathon association (nullable; not a twin of hackathon_submissions)
  hackathon_id UUID,
  hackathon_track VARCHAR(100),
  -- Commit-to-build / governance
  pool_status TEXT,
  governance_realm_address TEXT,
  governance_treasury_address TEXT,
  governance_receipt_mint TEXT,
  support_fee_bps INTEGER,
  support_fee_cap_usdc NUMERIC(18, 6),
  support_fee_recipient TEXT,
  pool_created_at TIMESTAMPTZ,
  pool_created_by TEXT,
  -- MetaDAO decision market
  proposal_pubkey TEXT,
  pass_pool_address TEXT,
  fail_pool_address TEXT,
  pool_create_tx TEXT,
  pool_finalize_tx TEXT,
  pool_refs JSONB,
  final_decision TEXT,
  finalized_at TIMESTAMPTZ,
  total_pass_volume NUMERIC(18, 6),
  total_fail_volume NUMERIC(18, 6),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.projects ADD CONSTRAINT projects_category_check CHECK (
  category IN (
    'DeFi','NFT','Gaming','Infrastructure','DAO','DePIN','Social','Mobile','Security',
    'Payment','Developer Tooling','ReFi','Content','Dapp','Blinks'
  )
);
CREATE INDEX idx_projects_type ON public.projects(type);
CREATE INDEX idx_projects_author ON public.projects(author_id);
CREATE INDEX idx_projects_category ON public.projects(category);
CREATE INDEX idx_projects_stage ON public.projects(stage);
CREATE INDEX idx_projects_votes ON public.projects(votes DESC);
CREATE INDEX idx_projects_created ON public.projects(created_at DESC);
CREATE INDEX idx_projects_slug ON public.projects(slug);
CREATE INDEX idx_projects_pool_status ON public.projects(pool_status);
CREATE INDEX idx_projects_proposal_pubkey ON public.projects(proposal_pubkey) WHERE proposal_pubkey IS NOT NULL;

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  is_anonymous BOOLEAN DEFAULT false,
  likes INTEGER DEFAULT 0,
  tips_amount NUMERIC(18, 9) DEFAULT 0,
  is_ai_generated BOOLEAN DEFAULT false,
  ai_model VARCHAR(100),
  ai_tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_comments_project ON public.comments(project_id);
CREATE INDEX idx_comments_user ON public.comments(user_id);
CREATE INDEX idx_comments_parent ON public.comments(parent_comment_id);
CREATE INDEX idx_comments_created ON public.comments(created_at DESC);

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.project_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, user_id)
);

CREATE INDEX idx_project_votes_project ON public.project_votes(project_id);
CREATE INDEX idx_project_votes_user ON public.project_votes(user_id);

CREATE TABLE public.comment_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (comment_id, user_id)
);

CREATE INDEX idx_comment_likes_comment ON public.comment_likes(comment_id);
CREATE INDEX idx_comment_likes_user ON public.comment_likes(user_id);

CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tx_hash VARCHAR(255) UNIQUE NOT NULL,
  from_wallet VARCHAR(255) NOT NULL,
  to_wallet VARCHAR(255) NOT NULL,
  amount NUMERIC(18, 9) NOT NULL,
  type VARCHAR(50) NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  comment_id UUID REFERENCES public.comments(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_hash ON public.transactions(tx_hash);
CREATE INDEX idx_transactions_user ON public.transactions(user_id);
CREATE INDEX idx_transactions_project ON public.transactions(project_id);
CREATE INDEX idx_transactions_created ON public.transactions(created_at DESC);

-- ===========================================================================
-- SOCIAL
-- ===========================================================================

CREATE TABLE public.follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (follower_id, following_id),
  CHECK (follower_id <> following_id)
);

CREATE INDEX idx_follows_follower ON public.follows(follower_id);
CREATE INDEX idx_follows_following ON public.follows(following_id);

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, read) WHERE read = false;
CREATE INDEX idx_notifications_created ON public.notifications(created_at DESC);

CREATE TABLE public.user_announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  reference_type VARCHAR(50),
  reference_id UUID,
  action_url TEXT,
  action_label VARCHAR(50),
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);

CREATE INDEX idx_user_announcements_user ON public.user_announcements(user_id);
CREATE INDEX idx_user_announcements_unread ON public.user_announcements(user_id, is_read) WHERE is_read = false;

CREATE TABLE public.feeds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(120) UNIQUE NOT NULL,
  description TEXT,
  cover_image TEXT,
  visibility VARCHAR(20) DEFAULT 'public' CHECK (visibility IN ('private', 'unlisted', 'public')),
  is_public BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  feed_type VARCHAR(50) DEFAULT 'custom' CHECK (feed_type IN ('custom', 'trending', 'ai_top', 'hidden_gems', 'staff_picks')),
  items_count INTEGER DEFAULT 0,
  followers_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_feeds_creator ON public.feeds(creator_id);
CREATE INDEX idx_feeds_slug ON public.feeds(slug);
CREATE INDEX idx_feeds_public ON public.feeds(is_public) WHERE is_public = true;
CREATE INDEX idx_feeds_featured ON public.feeds(is_featured) WHERE is_featured = true;

CREATE TRIGGER update_feeds_updated_at
  BEFORE UPDATE ON public.feeds
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.feed_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feed_id UUID NOT NULL REFERENCES public.feeds(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  added_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (feed_id, project_id)
);

CREATE INDEX idx_feed_items_feed ON public.feed_items(feed_id);
CREATE INDEX idx_feed_items_project ON public.feed_items(project_id);

CREATE TABLE public.feed_followers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feed_id UUID NOT NULL REFERENCES public.feeds(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (feed_id, user_id)
);

CREATE INDEX idx_feed_followers_feed ON public.feed_followers(feed_id);
CREATE INDEX idx_feed_followers_user ON public.feed_followers(user_id);

-- ===========================================================================
-- AUTH / AUTOMATION
-- ===========================================================================

CREATE TABLE public.agent_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'default',
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  last_used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_agent_keys_hash_unique ON public.agent_keys(key_hash);
CREATE INDEX idx_agent_keys_user ON public.agent_keys(user_id);
CREATE INDEX idx_agent_keys_prefix ON public.agent_keys(key_prefix);

CREATE TABLE public.api_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  scopes TEXT[] NOT NULL DEFAULT '{}',
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_api_tokens_token_hash_unique ON public.api_tokens(token_hash);
CREATE INDEX idx_api_tokens_user ON public.api_tokens(user_id);

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  token_id UUID REFERENCES public.api_tokens(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_actor ON public.audit_logs(actor_user_id);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- ===========================================================================
-- AI / DISCOVERY / USAGE
-- ===========================================================================

CREATE TABLE public.user_ai_credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  free_interactions_remaining INTEGER DEFAULT 3,
  paid_credits INTEGER DEFAULT 0,
  total_interactions_used INTEGER DEFAULT 0,
  last_reset_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.ai_market_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL UNIQUE REFERENCES public.projects(id) ON DELETE CASCADE,
  assessment_score INTEGER CHECK (assessment_score IS NULL OR (assessment_score >= 0 AND assessment_score <= 100)),
  assessment_text TEXT,
  strengths TEXT[],
  weaknesses TEXT[],
  recommendations TEXT[],
  market_size VARCHAR(50),
  competition_level VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.ai_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  interaction_type VARCHAR(50) NOT NULL,
  comment_id UUID REFERENCES public.comments(id) ON DELETE SET NULL,
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_interactions_user_project ON public.ai_interactions(user_id, project_id);

CREATE TABLE public.ai_question_pack_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tx_hash TEXT NOT NULL UNIQUE,
  amount_usd NUMERIC(10, 2) NOT NULL DEFAULT 1.00,
  questions_granted INTEGER NOT NULL DEFAULT 5,
  status VARCHAR(20) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_question_pack_user ON public.ai_question_pack_purchases(user_id, created_at DESC);

CREATE TABLE public.user_daily_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL,
  idea_views INTEGER NOT NULL DEFAULT 0,
  ai_questions INTEGER NOT NULL DEFAULT 0,
  searches_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, usage_date)
);

CREATE INDEX idx_user_daily_usage_user_date ON public.user_daily_usage(user_id, usage_date DESC);

-- Legacy name kept for RPC compatibility; maps to daily search meter.
-- Prefer user_daily_usage.searches_used for new code.
CREATE TABLE public.idea_search_quota (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  search_date DATE NOT NULL DEFAULT CURRENT_DATE,
  searches_used INTEGER DEFAULT 0,
  max_searches INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, search_date)
);

CREATE TABLE public.related_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  idea_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  snippet TEXT,
  source TEXT,
  score DECIMAL(5, 4),
  is_pinned BOOLEAN DEFAULT false,
  pinned_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  pinned_at TIMESTAMPTZ,
  search_query TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_related_projects_idea ON public.related_projects(idea_id);

CREATE TABLE public.user_pinned_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  idea_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  pinned_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  project_title TEXT NOT NULL,
  project_url TEXT NOT NULL,
  project_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (idea_id, pinned_by)
);

CREATE INDEX idx_user_pinned_projects_idea ON public.user_pinned_projects(idea_id);

-- ===========================================================================
-- PAYMENTS / GOVERNANCE
-- ===========================================================================

CREATE TABLE public.pool_supports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  supporter_wallet TEXT NOT NULL,
  supporter_user_id UUID REFERENCES public.users(id),
  tx_hash TEXT NOT NULL UNIQUE,
  amount_usdc NUMERIC(20, 6) NOT NULL,
  fee_usdc NUMERIC(20, 6) NOT NULL DEFAULT 0,
  treasury_wallet TEXT NOT NULL,
  confirmed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pool_supports_project ON public.pool_supports(project_id);

CREATE TABLE public.billing_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider VARCHAR(20) NOT NULL DEFAULT 'stripe',
  provider_session_id TEXT NOT NULL UNIQUE,
  plan VARCHAR(20) NOT NULL CHECK (plan IN ('pack', 'pro5', 'pro10')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
  payer_name TEXT,
  payer_email TEXT,
  payer_country TEXT,
  amount_usd NUMERIC(10, 2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_billing_payments_user ON public.billing_payments(user_id, created_at DESC);

CREATE TABLE public.proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  proposer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  onchain_tx TEXT,
  onchain_proposal_pubkey TEXT,
  onchain_create_tx TEXT,
  onchain_refs JSONB,
  execution_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_proposals_project ON public.proposals(project_id);
CREATE INDEX idx_proposals_status ON public.proposals(status);
CREATE UNIQUE INDEX idx_proposals_onchain_pubkey
  ON public.proposals(onchain_proposal_pubkey)
  WHERE onchain_proposal_pubkey IS NOT NULL;

CREATE TABLE public.dao_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tx_signature TEXT NOT NULL UNIQUE,
  from_wallet TEXT,
  to_wallet TEXT,
  amount_sol NUMERIC(20, 9) NOT NULL DEFAULT 0,
  amount_usd NUMERIC(20, 6) NOT NULL DEFAULT 0,
  required_usd NUMERIC(10, 2) NOT NULL DEFAULT 3,
  status TEXT NOT NULL DEFAULT 'pending',
  note TEXT,
  reviewed_by UUID REFERENCES public.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_dao_requests_project ON public.dao_requests(project_id);
CREATE INDEX idx_dao_requests_status ON public.dao_requests(status);

-- ===========================================================================
-- ADMIN
-- ===========================================================================

CREATE TABLE public.system_settings (
  key VARCHAR(50) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

CREATE TABLE public.admin_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  target_type VARCHAR(50) NOT NULL,
  target_id UUID NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_admin_activity_created ON public.admin_activity_log(created_at DESC);

-- ===========================================================================
-- HACKATHONS (single model — no v1/v2 twin tables)
-- ===========================================================================

CREATE TABLE public.hackathons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  title VARCHAR(200) NOT NULL,
  tagline VARCHAR(500),
  description TEXT,
  organizer_name VARCHAR(100),
  organizer_logo TEXT,
  organizer_website TEXT,
  banner_image TEXT,
  cover_image TEXT,
  theme_color VARCHAR(20) DEFAULT '#FFD700',
  prize_pool VARCHAR(50),
  participants_count INTEGER DEFAULT 0,
  max_participants INTEGER,
  status VARCHAR(20) DEFAULT 'upcoming'
    CHECK (status IN ('draft', 'upcoming', 'active', 'judging', 'completed', 'cancelled')),
  is_featured BOOLEAN DEFAULT false,
  format VARCHAR(40) DEFAULT 'gimme-standard',
  mode VARCHAR(20) DEFAULT 'online' CHECK (mode IN ('online', 'offline', 'hybrid')),
  currency VARCHAR(3) DEFAULT 'VND',
  current_round INTEGER DEFAULT 0,
  total_rounds INTEGER DEFAULT 3,
  judging_criteria JSONB DEFAULT '[]'::jsonb,
  registration_start TIMESTAMPTZ,
  registration_end TIMESTAMPTZ,
  submission_start TIMESTAMPTZ,
  submission_end TIMESTAMPTZ,
  judging_start TIMESTAMPTZ,
  judging_end TIMESTAMPTZ,
  allow_team_submissions BOOLEAN DEFAULT true,
  max_team_size INTEGER DEFAULT 5,
  require_video BOOLEAN DEFAULT false,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_hackathons_slug ON public.hackathons(slug);
CREATE INDEX idx_hackathons_status ON public.hackathons(status);
CREATE INDEX idx_hackathons_featured ON public.hackathons(is_featured) WHERE is_featured = true;

CREATE TRIGGER update_hackathons_updated_at
  BEFORE UPDATE ON public.hackathons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.hackathon_rounds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hackathon_id UUID NOT NULL REFERENCES public.hackathons(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL CHECK (round_number BETWEEN 1 AND 10),
  title VARCHAR(100) NOT NULL,
  description TEXT,
  round_type VARCHAR(20) NOT NULL CHECK (round_type IN ('idea', 'pitching', 'final', 'custom')),
  mode VARCHAR(20) DEFAULT 'online' CHECK (mode IN ('online', 'offline', 'hybrid')),
  teams_advancing INTEGER,
  bonus_teams INTEGER DEFAULT 0,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  results_date TIMESTAMPTZ,
  weight_quality INTEGER DEFAULT 50,
  weight_engagement INTEGER DEFAULT 30,
  weight_votes INTEGER DEFAULT 20,
  base_idea_limit INTEGER DEFAULT 3,
  unlocked_idea_limit INTEGER DEFAULT 5,
  engagement_threshold INTEGER DEFAULT 10,
  status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'judging', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (hackathon_id, round_number)
);

CREATE INDEX idx_hackathon_rounds_hackathon ON public.hackathon_rounds(hackathon_id);

CREATE TABLE public.hackathon_prizes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hackathon_id UUID NOT NULL REFERENCES public.hackathons(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  rank INTEGER NOT NULL,
  title VARCHAR(100) NOT NULL,
  prize_amount VARCHAR(50),
  description TEXT,
  winner_team_id UUID,
  announced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_hackathon_prizes_hackathon ON public.hackathon_prizes(hackathon_id, round_number);

CREATE TABLE public.hackathon_schedule (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hackathon_id UUID NOT NULL REFERENCES public.hackathons(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  event_date TIMESTAMPTZ,
  event_type VARCHAR(50) DEFAULT 'other',
  link TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_hackathon_schedule_hackathon ON public.hackathon_schedule(hackathon_id);

CREATE TABLE public.hackathon_partners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hackathon_id UUID NOT NULL REFERENCES public.hackathons(id) ON DELETE CASCADE,
  partner_name VARCHAR(200) NOT NULL,
  partner_link TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_hackathon_partners_hackathon ON public.hackathon_partners(hackathon_id);


CREATE TABLE public.hackathon_announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hackathon_id UUID REFERENCES public.hackathons(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'info',
  published_at TIMESTAMPTZ DEFAULT NOW(),
  effect VARCHAR(50),
  widget JSONB,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_hackathon_announcements_hackathon ON public.hackathon_announcements(hackathon_id);

CREATE TABLE public.hackathon_teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hackathon_id UUID NOT NULL REFERENCES public.hackathons(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  avatar_url TEXT,
  leader_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  max_members INTEGER DEFAULT 5,
  is_open BOOLEAN DEFAULT false,
  engagement_score INTEGER DEFAULT 0,
  feedbacks_given INTEGER DEFAULT 0,
  ideas_count INTEGER DEFAULT 0,
  max_ideas INTEGER DEFAULT 3,
  current_round INTEGER DEFAULT 1,
  is_eliminated BOOLEAN DEFAULT false,
  eliminated_at_round INTEGER,
  final_rank INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (hackathon_id, name)
);

CREATE INDEX idx_hackathon_teams_hackathon ON public.hackathon_teams(hackathon_id);
CREATE INDEX idx_hackathon_teams_leader ON public.hackathon_teams(leader_id);

CREATE TRIGGER update_hackathon_teams_updated_at
  BEFORE UPDATE ON public.hackathon_teams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- prizes.winner_team_id FK after teams exist
ALTER TABLE public.hackathon_prizes
  ADD CONSTRAINT hackathon_prizes_winner_team_id_fkey
  FOREIGN KEY (winner_team_id) REFERENCES public.hackathon_teams(id) ON DELETE SET NULL;

CREATE TABLE public.hackathon_team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES public.hackathon_teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('leader', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (team_id, user_id)
);

CREATE INDEX idx_hackathon_team_members_team ON public.hackathon_team_members(team_id);
CREATE INDEX idx_hackathon_team_members_user ON public.hackathon_team_members(user_id);

CREATE TABLE public.hackathon_team_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES public.hackathon_teams(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  invitee_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

CREATE INDEX idx_hackathon_team_invites_team ON public.hackathon_team_invites(team_id);
CREATE INDEX idx_hackathon_team_invites_invitee ON public.hackathon_team_invites(invitee_id);
CREATE INDEX idx_hackathon_team_invites_pending
  ON public.hackathon_team_invites(status) WHERE status = 'pending';

-- Canonical participant registry (replaces non-existent hackathon_participants)
CREATE TABLE public.hackathon_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hackathon_id UUID NOT NULL REFERENCES public.hackathons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  team_name VARCHAR(100),
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (hackathon_id, user_id)
);

CREATE INDEX idx_hackathon_registrations_hackathon ON public.hackathon_registrations(hackathon_id);
CREATE INDEX idx_hackathon_registrations_user ON public.hackathon_registrations(user_id);

CREATE TABLE public.hackathon_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hackathon_id UUID NOT NULL REFERENCES public.hackathons(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  pitch_video_url TEXT,
  pitch_deck_url TEXT,
  notes TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('draft', 'submitted', 'under_review', 'shortlisted', 'winner', 'rejected')),
  judge_score NUMERIC(5, 2),
  judge_notes TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (hackathon_id, project_id)
);

CREATE INDEX idx_hackathon_submissions_hackathon ON public.hackathon_submissions(hackathon_id);
CREATE INDEX idx_hackathon_submissions_project ON public.hackathon_submissions(project_id);
CREATE INDEX idx_hackathon_submissions_user ON public.hackathon_submissions(user_id);

CREATE TRIGGER update_hackathon_submissions_updated_at
  BEFORE UPDATE ON public.hackathon_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.hackathon_submission_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID NOT NULL REFERENCES public.hackathon_submissions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (submission_id, user_id)
);

CREATE INDEX idx_hackathon_submission_votes_submission ON public.hackathon_submission_votes(submission_id);

-- ===========================================================================
-- BOOTSTRAP TRIGGERS
-- ===========================================================================

CREATE OR REPLACE FUNCTION public.initialize_user_ai_credits()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.user_ai_credits (user_id, free_interactions_remaining, paid_credits)
  VALUES (NEW.id, 3, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_initialize_ai_credits ON public.users;
CREATE TRIGGER trigger_initialize_ai_credits
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.initialize_user_ai_credits();

CREATE OR REPLACE FUNCTION public.update_hackathon_participants_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.hackathons
    SET participants_count = participants_count + 1
    WHERE id = NEW.hackathon_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.hackathons
    SET participants_count = GREATEST(0, participants_count - 1)
    WHERE id = OLD.hackathon_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_hackathon_participants ON public.hackathon_registrations;
CREATE TRIGGER trigger_update_hackathon_participants
  AFTER INSERT OR DELETE ON public.hackathon_registrations
  FOR EACH ROW EXECUTE FUNCTION public.update_hackathon_participants_count();


-- Project optional link to hackathon (after hackathons table exists)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'projects_hackathon_id_fkey'
  ) THEN
    ALTER TABLE public.projects
      ADD CONSTRAINT projects_hackathon_id_fkey
      FOREIGN KEY (hackathon_id) REFERENCES public.hackathons(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ===========================================================================
-- RLS (backend uses service role; policies for direct client/realtime safety)
-- ===========================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ai_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_market_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_question_pack_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_daily_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_search_quota ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.related_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_pinned_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pool_supports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dao_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hackathons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hackathon_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hackathon_prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hackathon_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hackathon_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hackathon_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hackathon_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hackathon_team_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hackathon_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hackathon_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hackathon_submission_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hackathon_announcements ENABLE ROW LEVEL SECURITY;

-- Public-read surfaces (writes via service role / backend)
CREATE POLICY users_public_read ON public.users FOR SELECT USING (true);
CREATE POLICY projects_public_read ON public.projects FOR SELECT USING (true);
CREATE POLICY comments_public_read ON public.comments FOR SELECT USING (true);
CREATE POLICY project_votes_public_read ON public.project_votes FOR SELECT USING (true);
CREATE POLICY comment_likes_public_read ON public.comment_likes FOR SELECT USING (true);
CREATE POLICY follows_public_read ON public.follows FOR SELECT USING (true);
CREATE POLICY feeds_public_read ON public.feeds FOR SELECT USING (
  visibility = 'public' OR is_public = true
);
CREATE POLICY feed_items_public_read ON public.feed_items FOR SELECT USING (true);
CREATE POLICY related_projects_public_read ON public.related_projects FOR SELECT USING (true);
CREATE POLICY hackathons_public_read ON public.hackathons FOR SELECT USING (true);
CREATE POLICY hackathon_announcements_public_read ON public.hackathon_announcements FOR SELECT USING (true);
CREATE POLICY hackathon_rounds_public_read ON public.hackathon_rounds FOR SELECT USING (true);
CREATE POLICY hackathon_prizes_public_read ON public.hackathon_prizes FOR SELECT USING (true);
CREATE POLICY hackathon_schedule_public_read ON public.hackathon_schedule FOR SELECT USING (true);
CREATE POLICY hackathon_partners_public_read ON public.hackathon_partners FOR SELECT USING (true);
CREATE POLICY hackathon_teams_public_read ON public.hackathon_teams FOR SELECT USING (true);
CREATE POLICY hackathon_submissions_public_read ON public.hackathon_submissions FOR SELECT USING (true);
CREATE POLICY proposals_public_read ON public.proposals FOR SELECT USING (true);
CREATE POLICY system_settings_public_read ON public.system_settings FOR SELECT USING (true);
CREATE POLICY ai_market_assessments_public_read ON public.ai_market_assessments FOR SELECT USING (true);

-- Owner-scoped client reads
CREATE POLICY notifications_owner_read ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY announcements_owner_read ON public.user_announcements
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY api_tokens_owner_read ON public.api_tokens
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY agent_keys_owner_read ON public.agent_keys
  FOR SELECT USING (auth.uid() = user_id);

-- Seed default setting
INSERT INTO public.system_settings (key, value, description, is_active)
VALUES (
  'event_button_config',
  '{"label": "Hackathon", "url": "/hackathons", "style": "gradient-purple"}'::jsonb,
  'Navbar event button configuration',
  false
) ON CONFLICT (key) DO NOTHING;
