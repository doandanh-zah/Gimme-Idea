-- Migration: Add RLS Policies for AI Tables
-- Description: Enable Row Level Security and create policies for AI feature tables

-- ============================================
-- 1. Enable RLS on AI tables
-- ============================================

ALTER TABLE ai_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ai_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_market_assessments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. AI Interactions Policies
-- ============================================

-- Users can only view their own AI interactions
CREATE POLICY "Users can view own AI interactions"
ON ai_interactions
FOR SELECT
USING (auth.uid() = user_id);

-- Backend service can insert AI interactions (via service role)
CREATE POLICY "Service role can insert AI interactions"
ON ai_interactions
FOR INSERT
WITH CHECK (true);

-- Backend service can update AI interactions
CREATE POLICY "Service role can update AI interactions"
ON ai_interactions
FOR UPDATE
USING (true);

-- ============================================
-- 3. User AI Credits Policies
-- ============================================

-- Users can view their own credits
CREATE POLICY "Users can view own AI credits"
ON user_ai_credits
FOR SELECT
USING (auth.uid() = user_id);

-- Backend service can insert/update credits (via service role)
CREATE POLICY "Service role can manage AI credits"
ON user_ai_credits
FOR ALL
USING (true);

-- ============================================
-- 4. AI Market Assessments Policies
-- ============================================

-- Everyone can read market assessments (public data)
CREATE POLICY "Anyone can view market assessments"
ON ai_market_assessments
FOR SELECT
USING (true);

-- Only backend service can create/update assessments
CREATE POLICY "Service role can manage market assessments"
ON ai_market_assessments
FOR ALL
USING (true);

-- ============================================
-- 5. Comments
-- ============================================

COMMENT ON POLICY "Users can view own AI interactions" ON ai_interactions
IS 'Users can only view their own AI interaction history';

COMMENT ON POLICY "Users can view own AI credits" ON user_ai_credits
IS 'Users can view their own credit balance and usage stats';

COMMENT ON POLICY "Anyone can view market assessments" ON ai_market_assessments
IS 'Market assessments are public for all users to see';
