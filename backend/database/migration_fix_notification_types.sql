-- Migration: Fix notification function return types
-- Fix type mismatch between VARCHAR columns and TEXT return types

-- =====================
-- DROP OLD FUNCTIONS FIRST
-- =====================
DROP FUNCTION IF EXISTS get_user_notifications(UUID, INTEGER, INTEGER, BOOLEAN);
DROP FUNCTION IF EXISTS get_followers(UUID, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS get_following(UUID, INTEGER, INTEGER);

-- =====================
-- FIX: get_user_notifications function
-- Cast VARCHAR columns to TEXT explicitly
-- =====================

CREATE OR REPLACE FUNCTION get_user_notifications(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0,
  p_unread_only BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  id UUID,
  actor_id UUID,
  actor_username TEXT,
  actor_avatar TEXT,
  type TEXT,
  title TEXT,
  message TEXT,
  target_type TEXT,
  target_id UUID,
  read BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.actor_id,
    u.username::TEXT AS actor_username,
    u.avatar::TEXT AS actor_avatar,
    n.type::TEXT,
    n.title::TEXT,
    n.message::TEXT,
    n.target_type::TEXT,
    n.target_id,
    n.read,
    n.created_at
  FROM notifications n
  LEFT JOIN users u ON n.actor_id = u.id
  WHERE n.user_id = p_user_id
    AND (NOT p_unread_only OR n.read = FALSE)
  ORDER BY n.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================
-- FIX: get_followers function (if exists)
-- =====================

CREATE OR REPLACE FUNCTION get_followers(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  username TEXT,
  avatar TEXT,
  bio TEXT,
  followed_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.username::TEXT,
    u.avatar::TEXT,
    u.bio::TEXT,
    f.created_at AS followed_at
  FROM follows f
  JOIN users u ON f.follower_id = u.id
  WHERE f.following_id = p_user_id
  ORDER BY f.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================
-- FIX: get_following function (if exists)
-- =====================

CREATE OR REPLACE FUNCTION get_following(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  username TEXT,
  avatar TEXT,
  bio TEXT,
  followed_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.username::TEXT,
    u.avatar::TEXT,
    u.bio::TEXT,
    f.created_at AS followed_at
  FROM follows f
  JOIN users u ON f.following_id = u.id
  WHERE f.follower_id = p_user_id
  ORDER BY f.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================
-- DONE!
-- =====================
-- Fixed type casting for:
-- 1. get_user_notifications - cast username, avatar to TEXT
-- 2. get_followers - cast username, avatar, bio to TEXT
-- 3. get_following - cast username, avatar, bio to TEXT
