-- Migration: Monetization limits (idea views + AI question packs + plan tiers)

-- 1) User plan fields
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS plan_tier VARCHAR(20) NOT NULL DEFAULT 'free'
    CHECK (plan_tier IN ('free', 'pro5', 'pro10')),
  ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_users_plan_tier ON users(plan_tier);
CREATE INDEX IF NOT EXISTS idx_users_plan_expires_at ON users(plan_expires_at);

-- 2) Daily usage tracker
CREATE TABLE IF NOT EXISTS user_daily_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL,
  idea_views INTEGER NOT NULL DEFAULT 0,
  ai_questions INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, usage_date)
);

CREATE INDEX IF NOT EXISTS idx_user_daily_usage_user_date ON user_daily_usage(user_id, usage_date DESC);

-- 3) Idea view limiter (free users: 5/day)
CREATE OR REPLACE FUNCTION consume_idea_view(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_plan_tier VARCHAR(20);
  v_plan_expires_at TIMESTAMP WITH TIME ZONE;
  v_effective_plan VARCHAR(20);
  v_row user_daily_usage%ROWTYPE;
  v_limit INTEGER := 5;
BEGIN
  SELECT plan_tier, plan_expires_at
  INTO v_plan_tier, v_plan_expires_at
  FROM users
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN json_build_object('allowed', false, 'reason', 'user_not_found');
  END IF;

  v_effective_plan := CASE
    WHEN v_plan_tier IN ('pro5', 'pro10')
      AND (v_plan_expires_at IS NULL OR v_plan_expires_at > NOW()) THEN v_plan_tier
    ELSE 'free'
  END;

  IF v_effective_plan IN ('pro5', 'pro10') THEN
    RETURN json_build_object(
      'allowed', true,
      'planTier', v_effective_plan,
      'dailyIdeaViewsUsed', 0,
      'dailyIdeaViewsLimit', -1,
      'remainingIdeaViews', -1
    );
  END IF;

  INSERT INTO user_daily_usage (user_id, usage_date, idea_views, ai_questions)
  VALUES (p_user_id, CURRENT_DATE, 1, 0)
  ON CONFLICT (user_id, usage_date)
  DO UPDATE SET
    idea_views = user_daily_usage.idea_views + 1,
    updated_at = NOW()
  RETURNING * INTO v_row;

  RETURN json_build_object(
    'allowed', (v_row.idea_views <= v_limit),
    'planTier', v_effective_plan,
    'dailyIdeaViewsUsed', v_row.idea_views,
    'dailyIdeaViewsLimit', v_limit,
    'remainingIdeaViews', GREATEST(0, v_limit - v_row.idea_views)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4) Override AI quota function for new pricing:
-- Free: first 2 AI questions/day free.
-- Paid packs: paid_credits where 1 credit = 1 question, sold in packs of 5.
-- pro10: unlimited AI questions.
CREATE OR REPLACE FUNCTION can_user_use_ai(
  p_user_id UUID,
  p_project_id UUID
) RETURNS JSON AS $$
DECLARE
  v_plan_tier VARCHAR(20);
  v_plan_expires_at TIMESTAMP WITH TIME ZONE;
  v_effective_plan VARCHAR(20);
  v_paid_credits INTEGER := 0;
  v_daily_questions INTEGER := 0;
  v_free_limit INTEGER := 2;
  v_free_remaining INTEGER := 0;
  v_interaction_count INTEGER := 0;
BEGIN
  SELECT plan_tier, plan_expires_at
  INTO v_plan_tier, v_plan_expires_at
  FROM users
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN json_build_object('canUse', false, 'error', 'user_not_found');
  END IF;

  v_effective_plan := CASE
    WHEN v_plan_tier IN ('pro5', 'pro10')
      AND (v_plan_expires_at IS NULL OR v_plan_expires_at > NOW()) THEN v_plan_tier
    ELSE 'free'
  END;

  INSERT INTO user_ai_credits (user_id, free_interactions_remaining, paid_credits, total_interactions_used)
  VALUES (p_user_id, 2, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT COALESCE(paid_credits, 0)
  INTO v_paid_credits
  FROM user_ai_credits
  WHERE user_id = p_user_id;

  INSERT INTO user_daily_usage (user_id, usage_date, idea_views, ai_questions)
  VALUES (p_user_id, CURRENT_DATE, 0, 0)
  ON CONFLICT (user_id, usage_date) DO NOTHING;

  SELECT COALESCE(ai_questions, 0)
  INTO v_daily_questions
  FROM user_daily_usage
  WHERE user_id = p_user_id
    AND usage_date = CURRENT_DATE;

  v_free_remaining := GREATEST(0, v_free_limit - v_daily_questions);

  SELECT COUNT(*)
  INTO v_interaction_count
  FROM ai_interactions
  WHERE user_id = p_user_id AND project_id = p_project_id;

  IF v_effective_plan = 'pro10' THEN
    RETURN json_build_object(
      'canUse', true,
      'planTier', v_effective_plan,
      'freeRemaining', -1,
      'paidCredits', -1,
      'interactionsUsed', v_interaction_count,
      'maxFreeInteractions', -1,
      'dailyQuestionsUsed', v_daily_questions,
      'dailyQuestionsLimit', -1
    );
  END IF;

  RETURN json_build_object(
    'canUse', (v_free_remaining > 0 OR v_paid_credits > 0),
    'planTier', v_effective_plan,
    'freeRemaining', v_free_remaining,
    'paidCredits', v_paid_credits,
    'interactionsUsed', v_interaction_count,
    'maxFreeInteractions', v_free_limit,
    'dailyQuestionsUsed', v_daily_questions,
    'dailyQuestionsLimit', v_free_limit
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION track_ai_interaction(
  p_user_id UUID,
  p_project_id UUID,
  p_interaction_type VARCHAR,
  p_comment_id UUID DEFAULT NULL,
  p_tokens_used INTEGER DEFAULT 0
) RETURNS BOOLEAN AS $$
DECLARE
  v_plan_tier VARCHAR(20);
  v_plan_expires_at TIMESTAMP WITH TIME ZONE;
  v_effective_plan VARCHAR(20);
  v_daily_questions INTEGER := 0;
  v_free_limit INTEGER := 2;
BEGIN
  INSERT INTO ai_interactions (user_id, project_id, interaction_type, comment_id, tokens_used)
  VALUES (p_user_id, p_project_id, p_interaction_type, p_comment_id, p_tokens_used);

  SELECT plan_tier, plan_expires_at INTO v_plan_tier, v_plan_expires_at
  FROM users WHERE id = p_user_id;

  v_effective_plan := CASE
    WHEN v_plan_tier IN ('pro5', 'pro10')
      AND (v_plan_expires_at IS NULL OR v_plan_expires_at > NOW()) THEN v_plan_tier
    ELSE 'free'
  END;

  INSERT INTO user_daily_usage (user_id, usage_date, idea_views, ai_questions)
  VALUES (p_user_id, CURRENT_DATE, 0, 1)
  ON CONFLICT (user_id, usage_date)
  DO UPDATE SET
    ai_questions = user_daily_usage.ai_questions + 1,
    updated_at = NOW();

  IF v_effective_plan = 'pro10' THEN
    UPDATE user_ai_credits
    SET total_interactions_used = total_interactions_used + 1,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    RETURN TRUE;
  END IF;

  SELECT COALESCE(ai_questions, 0)
  INTO v_daily_questions
  FROM user_daily_usage
  WHERE user_id = p_user_id AND usage_date = CURRENT_DATE;

  UPDATE user_ai_credits
  SET
    paid_credits = CASE
      WHEN v_daily_questions > v_free_limit THEN GREATEST(0, paid_credits - 1)
      ELSE paid_credits
    END,
    total_interactions_used = total_interactions_used + 1,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
