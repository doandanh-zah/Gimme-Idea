-- Migration: Fix wallet unique constraint for email users
-- Problem: wallet column has unique constraint, but all email users have wallet = ''
-- Solution: Use NULL instead of empty string (unique allows multiple NULLs)
-- Run this in Supabase SQL Editor

-- =============================================
-- Step 1: Fix existing data
-- =============================================

-- Update all empty wallets to NULL
UPDATE users 
SET wallet = NULL 
WHERE wallet = '' OR wallet IS NULL;

-- =============================================
-- Step 2: Update the find_or_create_user_by_email function
-- =============================================

CREATE OR REPLACE FUNCTION find_or_create_user_by_email(
  p_email TEXT,
  p_auth_id TEXT,
  p_username TEXT DEFAULT NULL
)
RETURNS TABLE (
  user_id UUID,
  is_new_user BOOLEAN,
  needs_wallet BOOLEAN
) AS $$
DECLARE
  v_user_id UUID;
  v_is_new BOOLEAN := false;
  v_needs_wallet BOOLEAN := false;
  v_username TEXT;
BEGIN
  -- First, check if user exists by auth_id
  SELECT id, needs_wallet_connect INTO v_user_id, v_needs_wallet
  FROM users 
  WHERE auth_id = p_auth_id;
  
  IF v_user_id IS NOT NULL THEN
    -- User already exists with this auth_id
    RETURN QUERY SELECT v_user_id, false, v_needs_wallet;
    RETURN;
  END IF;
  
  -- Check if user exists by email
  SELECT id, needs_wallet_connect INTO v_user_id, v_needs_wallet
  FROM users 
  WHERE email = p_email;
  
  IF v_user_id IS NOT NULL THEN
    -- Link auth_id to existing email user
    UPDATE users 
    SET auth_id = p_auth_id, 
        auth_provider = 'google',
        updated_at = NOW()
    WHERE id = v_user_id;
    
    RETURN QUERY SELECT v_user_id, false, v_needs_wallet;
    RETURN;
  END IF;
  
  -- New user - create account
  v_is_new := true;
  v_needs_wallet := true;
  
  -- Generate username from email or use provided
  v_username := COALESCE(p_username, split_part(p_email, '@', 1) || '_' || substr(md5(random()::text), 1, 4));
  
  INSERT INTO users (
    wallet,
    username,
    email,
    auth_id,
    auth_provider,
    needs_wallet_connect,
    avatar,
    created_at,
    updated_at
  ) VALUES (
    NULL, -- NULL wallet (NOT empty string!) - allows unique constraint with multiple NULLs
    v_username,
    p_email,
    p_auth_id,
    'google',
    true,
    'https://api.dicebear.com/7.x/avataaars/svg?seed=' || v_username,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_user_id;
  
  RETURN QUERY SELECT v_user_id, v_is_new, v_needs_wallet;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Step 3: Update link_wallet_to_user function to handle NULL
-- =============================================

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
  v_current_wallet TEXT;
BEGIN
  -- Get current user's wallet
  SELECT wallet INTO v_current_wallet FROM users WHERE id = p_user_id;
  
  -- Check if user already has a wallet connected (not NULL, not empty)
  IF v_current_wallet IS NOT NULL AND v_current_wallet != '' THEN
    RETURN QUERY SELECT false, 'Wallet already connected'::TEXT, false;
    RETURN;
  END IF;
  
  -- Check if this wallet address is already used by another user
  SELECT id INTO v_existing_wallet_user_id 
  FROM users 
  WHERE wallet = p_wallet_address AND id != p_user_id;
  
  IF v_existing_wallet_user_id IS NOT NULL THEN
    -- Another user already has this wallet - could merge accounts
    -- For now, just reject
    RETURN QUERY SELECT false, 'This wallet is already connected to another account'::TEXT, false;
    RETURN;
  END IF;
  
  -- Link the wallet
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
-- Verify the fix
-- =============================================

-- Check if there are any remaining empty wallet strings
SELECT COUNT(*) as empty_wallets FROM users WHERE wallet = '';

-- Should return 0
