-- Migration: Increase AI Free Credits from 3 to 10
-- Description: Allow users to have 10 free AI interactions before requiring donation

-- 1. Update default value for new users
ALTER TABLE user_ai_credits
ALTER COLUMN free_interactions_remaining SET DEFAULT 10;

-- 2. Update existing users who have used less than 10 interactions
-- Give them remaining credits up to 10 (so they get more free uses)
UPDATE user_ai_credits
SET free_interactions_remaining = GREATEST(free_interactions_remaining, 10 - total_interactions_used)
WHERE free_interactions_remaining < 10 AND total_interactions_used < 10;

-- 3. Update the can_user_use_ai function to return 10 as maxFreeInteractions
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

    -- If no record, create one with 10 free credits
    IF NOT FOUND THEN
        INSERT INTO user_ai_credits (user_id, free_interactions_remaining)
        VALUES (p_user_id, 10)
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
        'maxFreeInteractions', 10
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- 4. Update the initialize_user_ai_credits trigger function
CREATE OR REPLACE FUNCTION initialize_user_ai_credits()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_ai_credits (user_id, free_interactions_remaining)
    VALUES (NEW.id, 10)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Done!
-- After running this migration:
-- - New users will get 10 free AI interactions
-- - Existing users with less than 10 total uses will get credits back up to 10
-- - The maxFreeInteractions value returned to frontend will be 10
