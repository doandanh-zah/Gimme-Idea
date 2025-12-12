-- =============================================
-- GMIFEEDS V2 UPDATE MIGRATION
-- Changes:
-- 1. Remove members system
-- 2. Add slug field for friendly URLs
-- 3. Change privacy to 3 levels: private, unlisted, public
-- =============================================

-- =============================================
-- 1. ADD SLUG COLUMN
-- =============================================
ALTER TABLE feeds ADD COLUMN IF NOT EXISTS slug VARCHAR(120) UNIQUE;

-- Create function to generate slug from name
CREATE OR REPLACE FUNCTION generate_feed_slug(feed_name TEXT, creator_id UUID)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Convert name to slug: lowercase, replace spaces with hyphens, remove special chars
  base_slug := lower(regexp_replace(feed_name, '[^a-zA-Z0-9\s-]', '', 'g'));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  
  -- Limit to 100 chars
  base_slug := substring(base_slug from 1 for 100);
  
  -- If empty, use 'feed'
  IF base_slug = '' THEN
    base_slug := 'feed';
  END IF;
  
  final_slug := base_slug;
  
  -- Check for uniqueness, append number if needed
  WHILE EXISTS (SELECT 1 FROM feeds WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Update existing feeds to have slugs
DO $$
DECLARE
  feed_record RECORD;
BEGIN
  FOR feed_record IN SELECT id, name, creator_id FROM feeds WHERE slug IS NULL LOOP
    UPDATE feeds 
    SET slug = generate_feed_slug(feed_record.name, feed_record.creator_id)
    WHERE id = feed_record.id;
  END LOOP;
END $$;

-- Make slug NOT NULL after populating
ALTER TABLE feeds ALTER COLUMN slug SET NOT NULL;

-- Create index for slug lookups
CREATE INDEX IF NOT EXISTS idx_feeds_slug ON feeds(slug);

-- =============================================
-- 2. CHANGE PRIVACY SYSTEM
-- Add visibility column: 'private', 'unlisted', 'public'
-- =============================================
ALTER TABLE feeds ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) DEFAULT 'public' 
  CHECK (visibility IN ('private', 'unlisted', 'public'));

-- Migrate existing data: is_public=true -> 'public', is_public=false -> 'private'
UPDATE feeds SET visibility = CASE 
  WHEN is_public = true THEN 'public'
  ELSE 'private'
END WHERE visibility IS NULL OR visibility = 'public';

-- =============================================
-- 3. REMOVE MEMBERS SYSTEM
-- =============================================
-- First, drop RLS policies that depend on feed_members table
DROP POLICY IF EXISTS "Members can add items to feeds" ON feed_items;
DROP POLICY IF EXISTS "Members can view feed items" ON feed_items;

-- Drop members count column
ALTER TABLE feeds DROP COLUMN IF EXISTS members_count;

-- Drop triggers related to members
DROP TRIGGER IF EXISTS trigger_increment_feed_members ON feed_members;
DROP TRIGGER IF EXISTS trigger_decrement_feed_members ON feed_members;

-- Drop functions related to members
DROP FUNCTION IF EXISTS increment_feed_members_count();
DROP FUNCTION IF EXISTS decrement_feed_members_count();

-- Drop feed_members table (CASCADE to remove any remaining dependencies)
DROP TABLE IF EXISTS feed_members CASCADE;

-- =============================================
-- 4. UPDATE RLS POLICIES FOR NEW VISIBILITY
-- =============================================

-- Drop old policies
DROP POLICY IF EXISTS "Public feeds are viewable by everyone" ON feeds;
DROP POLICY IF EXISTS "Users can view their own private feeds" ON feeds;

-- Create new policies based on visibility
CREATE POLICY "Public and unlisted feeds are viewable by everyone" ON feeds
  FOR SELECT USING (visibility IN ('public', 'unlisted'));

CREATE POLICY "Users can view their own private feeds" ON feeds
  FOR SELECT USING (auth.uid()::text = creator_id::text);

-- Update feed_items policy
DROP POLICY IF EXISTS "Feed items are viewable if feed is public" ON feed_items;
DROP POLICY IF EXISTS "Members can add items to feeds" ON feed_items;

CREATE POLICY "Feed items are viewable if feed is accessible" ON feed_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM feeds 
      WHERE id = feed_id 
      AND (visibility IN ('public', 'unlisted') OR creator_id::text = auth.uid()::text)
    )
  );

CREATE POLICY "Owners can add items to feeds" ON feed_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM feeds 
      WHERE id = feed_items.feed_id 
      AND creator_id::text = auth.uid()::text
    )
  );

-- =============================================
-- 5. TRIGGER TO AUTO-GENERATE SLUG ON INSERT
-- =============================================
CREATE OR REPLACE FUNCTION auto_generate_feed_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_feed_slug(NEW.name, NEW.creator_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_generate_slug ON feeds;
CREATE TRIGGER trigger_auto_generate_slug
  BEFORE INSERT ON feeds
  FOR EACH ROW EXECUTE FUNCTION auto_generate_feed_slug();

-- Trigger to update slug when name changes (optional - keep old slug for stability)
-- We'll NOT auto-update slug on name change to preserve URLs

-- =============================================
-- DONE
-- =============================================
