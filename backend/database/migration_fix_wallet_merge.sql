-- Migration: Fix wallet linking to allow merge from wallet-only accounts
-- Problem: User with wallet (no email) cannot be merged when email user connects that wallet
-- Solution: Allow merge if existing wallet user has no email

CREATE OR REPLACE FUNCTION link_wallet_to_user(
  p_user_id UUID,
  p_wallet_address TEXT
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  merged_from_wallet BOOLEAN
) AS $$
DECLARE
  v_existing_wallet_user_id UUID;
  v_existing_wallet_user_email TEXT;
  v_current_wallet TEXT;
  v_old_reputation INTEGER;
  v_old_balance NUMERIC;
BEGIN
  -- Get current user's wallet
  SELECT wallet INTO v_current_wallet FROM users WHERE id = p_user_id;
  
  -- Check if user already has a wallet connected (not NULL, not empty)
  IF v_current_wallet IS NOT NULL AND v_current_wallet != '' THEN
    RETURN QUERY SELECT false, 'Wallet already connected'::TEXT, false;
    RETURN;
  END IF;
  
  -- Check if this wallet address is already used by another user
  SELECT id, email INTO v_existing_wallet_user_id, v_existing_wallet_user_email
  FROM users 
  WHERE wallet = p_wallet_address AND id != p_user_id;
  
  IF v_existing_wallet_user_id IS NOT NULL THEN
    -- Another user already has this wallet
    
    -- Check if that user has an email (meaning they have a Google account linked)
    IF v_existing_wallet_user_email IS NOT NULL AND v_existing_wallet_user_email != '' THEN
      -- User with email already exists with this wallet - cannot merge
      RETURN QUERY SELECT false, 'This wallet is already connected to another account with email. Please use that account.'::TEXT, false;
      RETURN;
    END IF;
    
    -- User has wallet but NO email - this is an old wallet-only account
    -- Merge the data into the current (email) user
    
    -- Get the old user's reputation and balance
    SELECT reputation_score, balance INTO v_old_reputation, v_old_balance
    FROM users WHERE id = v_existing_wallet_user_id;
    
    -- Transfer projects ownership
    UPDATE projects SET author_id = p_user_id WHERE author_id = v_existing_wallet_user_id;
    
    -- Transfer comments ownership
    UPDATE comments SET user_id = p_user_id WHERE user_id = v_existing_wallet_user_id;
    
    -- Transfer likes
    UPDATE project_likes SET user_id = p_user_id WHERE user_id = v_existing_wallet_user_id;
    UPDATE comment_likes SET user_id = p_user_id WHERE user_id = v_existing_wallet_user_id;
    
    -- Transfer follows (followers of old account now follow new account)
    UPDATE follows SET following_id = p_user_id WHERE following_id = v_existing_wallet_user_id;
    UPDATE follows SET follower_id = p_user_id WHERE follower_id = v_existing_wallet_user_id;
    
    -- Transfer notifications
    UPDATE notifications SET user_id = p_user_id WHERE user_id = v_existing_wallet_user_id;
    UPDATE notifications SET actor_id = p_user_id WHERE actor_id = v_existing_wallet_user_id;
    
    -- Transfer transactions
    UPDATE transactions SET user_id = p_user_id WHERE user_id = v_existing_wallet_user_id;
    
    -- Merge reputation and balance into current user
    UPDATE users 
    SET 
      wallet = p_wallet_address,
      needs_wallet_connect = false,
      reputation_score = COALESCE(reputation_score, 0) + COALESCE(v_old_reputation, 0),
      balance = COALESCE(balance, 0) + COALESCE(v_old_balance, 0),
      updated_at = NOW()
    WHERE id = p_user_id;
    
    -- Delete the old wallet-only user
    DELETE FROM users WHERE id = v_existing_wallet_user_id;
    
    RETURN QUERY SELECT true, 'Wallet connected and data merged from existing wallet account!'::TEXT, true;
    RETURN;
  END IF;
  
  -- No existing user with this wallet - just link it
  UPDATE users 
  SET 
    wallet = p_wallet_address,
    needs_wallet_connect = false,
    updated_at = NOW()
  WHERE id = p_user_id;
  
  RETURN QUERY SELECT true, 'Wallet connected successfully'::TEXT, false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- DONE!
-- =============================================
-- Logic:
-- 1. If wallet belongs to user WITH email → Reject (account exists)
-- 2. If wallet belongs to user WITHOUT email → Merge data into current user
-- 3. If wallet is new → Just link it
