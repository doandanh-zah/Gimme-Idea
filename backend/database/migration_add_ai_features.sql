-- Migration: Add AI Features
-- Description: Tables for AI feedback, interactions tracking, and user credits

-- 1. AI Interactions tracking table
CREATE TABLE IF NOT EXISTS ai_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    interaction_type VARCHAR(50) NOT NULL, -- 'feedback', 'reply'
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    tokens_used INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),

    -- Indexes for faster queries
    CONSTRAINT ai_interactions_user_id_idx FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT ai_interactions_project_id_idx FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE INDEX idx_ai_interactions_user_project ON ai_interactions(user_id, project_id);
CREATE INDEX idx_ai_interactions_created_at ON ai_interactions(created_at DESC);

-- 2. User AI Credits table
CREATE TABLE IF NOT EXISTS user_ai_credits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    free_interactions_remaining INTEGER DEFAULT 3, -- 1 comment + 2 replies per idea
    paid_credits INTEGER DEFAULT 0, -- Additional paid credits
    total_interactions_used INTEGER DEFAULT 0,
    last_reset_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_ai_credits_user_id ON user_ai_credits(user_id);

-- 3. AI Market Assessments cache table (to avoid re-generating same assessment)
CREATE TABLE IF NOT EXISTS ai_market_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
    assessment_score INTEGER CHECK (assessment_score >= 0 AND assessment_score <= 100),
    assessment_text TEXT,
    strengths TEXT[],
    weaknesses TEXT[],
    recommendations TEXT[],
    market_size VARCHAR(50), -- 'small', 'medium', 'large'
    competition_level VARCHAR(50), -- 'low', 'medium', 'high'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ai_assessments_project_id ON ai_market_assessments(project_id);
CREATE INDEX idx_ai_assessments_score ON ai_market_assessments(assessment_score DESC);

-- 4. Add is_ai_generated flag to comments table
ALTER TABLE comments
ADD COLUMN IF NOT EXISTS is_ai_generated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ai_model VARCHAR(100), -- e.g., 'gpt-4', 'gpt-3.5-turbo'
ADD COLUMN IF NOT EXISTS ai_tokens_used INTEGER DEFAULT 0;

-- 5. Function to initialize AI credits for new users (trigger)
CREATE OR REPLACE FUNCTION initialize_user_ai_credits()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_ai_credits (user_id, free_interactions_remaining, paid_credits)
    VALUES (NEW.id, 3, 0)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-initialize AI credits for new users
DROP TRIGGER IF EXISTS trigger_initialize_ai_credits ON users;
CREATE TRIGGER trigger_initialize_ai_credits
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION initialize_user_ai_credits();

-- 6. Function to track AI interaction
CREATE OR REPLACE FUNCTION track_ai_interaction(
    p_user_id UUID,
    p_project_id UUID,
    p_interaction_type VARCHAR,
    p_comment_id UUID DEFAULT NULL,
    p_tokens_used INTEGER DEFAULT 0
) RETURNS BOOLEAN AS $$
DECLARE
    v_credits_remaining INTEGER;
BEGIN
    -- Insert interaction record
    INSERT INTO ai_interactions (user_id, project_id, interaction_type, comment_id, tokens_used)
    VALUES (p_user_id, p_project_id, p_interaction_type, p_comment_id, p_tokens_used);

    -- Deduct from user credits (free first, then paid)
    UPDATE user_ai_credits
    SET
        free_interactions_remaining = GREATEST(0, free_interactions_remaining - 1),
        paid_credits = CASE
            WHEN free_interactions_remaining > 0 THEN paid_credits
            ELSE GREATEST(0, paid_credits - 1)
        END,
        total_interactions_used = total_interactions_used + 1,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 7. Function to check if user can use AI
CREATE OR REPLACE FUNCTION can_user_use_ai(
    p_user_id UUID,
    p_project_id UUID
) RETURNS JSON AS $$
DECLARE
    v_free_remaining INTEGER;
    v_paid_credits INTEGER;
    v_interaction_count INTEGER;
    v_result JSON;
BEGIN
    -- Get user credits
    SELECT free_interactions_remaining, paid_credits
    INTO v_free_remaining, v_paid_credits
    FROM user_ai_credits
    WHERE user_id = p_user_id;

    -- If no record, create one
    IF NOT FOUND THEN
        INSERT INTO user_ai_credits (user_id)
        VALUES (p_user_id)
        RETURNING free_interactions_remaining, paid_credits
        INTO v_free_remaining, v_paid_credits;
    END IF;

    -- Count interactions for this project
    SELECT COUNT(*)
    INTO v_interaction_count
    FROM ai_interactions
    WHERE user_id = p_user_id AND project_id = p_project_id;

    -- Build result
    v_result := json_build_object(
        'canUse', (v_free_remaining > 0 OR v_paid_credits > 0),
        'freeRemaining', v_free_remaining,
        'paidCredits', v_paid_credits,
        'interactionsUsed', v_interaction_count,
        'maxFreeInteractions', 3
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- 8. Comments
COMMENT ON TABLE ai_interactions IS 'Tracks all AI interactions (feedback, replies) per user per project';
COMMENT ON TABLE user_ai_credits IS 'User AI usage credits and limits';
COMMENT ON TABLE ai_market_assessments IS 'Cached AI market assessments for projects';
COMMENT ON COLUMN comments.is_ai_generated IS 'Flag indicating if comment was generated by AI';
