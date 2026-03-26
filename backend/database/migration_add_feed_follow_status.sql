-- Migration: Add single-query feed listing with follow status
-- Description: Reduces feed listing from 2 queries to 1 query by returning
--              feed data and per-user follow status in one RPC call.

CREATE OR REPLACE FUNCTION get_public_feeds_with_follow_status(
  p_user_id UUID DEFAULT NULL,
  p_featured BOOLEAN DEFAULT false,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  slug VARCHAR(120),
  creator_id UUID,
  name VARCHAR(100),
  description TEXT,
  cover_image TEXT,
  visibility VARCHAR(20),
  is_featured BOOLEAN,
  feed_type VARCHAR(50),
  items_count INTEGER,
  followers_count INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  creator_username VARCHAR(100),
  creator_wallet VARCHAR(255),
  creator_avatar TEXT,
  is_following BOOLEAN
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    f.id,
    f.slug,
    f.creator_id,
    f.name,
    f.description,
    f.cover_image,
    f.visibility,
    f.is_featured,
    f.feed_type,
    f.items_count,
    f.followers_count,
    f.created_at,
    f.updated_at,
    u.username AS creator_username,
    u.wallet AS creator_wallet,
    u.avatar AS creator_avatar,
    CASE
      WHEN p_user_id IS NULL THEN false
      ELSE EXISTS (
        SELECT 1
        FROM feed_followers ff
        WHERE ff.feed_id = f.id
          AND ff.user_id = p_user_id
      )
    END AS is_following
  FROM feeds f
  INNER JOIN users u ON u.id = f.creator_id
  WHERE f.visibility = 'public'
    AND (NOT p_featured OR f.is_featured = true)
  ORDER BY f.followers_count DESC
  LIMIT GREATEST(COALESCE(p_limit, 20), 1)
  OFFSET GREATEST(COALESCE(p_offset, 0), 0);
$$;
