-- Migration: Cache user profile stats on the users table
-- Purpose: Avoid recomputing profile stats from projects/comments/transactions on every request

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS ideas_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS projects_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS feedback_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tips_received_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS likes_received_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS votes_received_count INTEGER DEFAULT 0;

UPDATE users
SET
  ideas_count = COALESCE(ideas_count, 0),
  projects_count = COALESCE(projects_count, 0),
  feedback_count = COALESCE(feedback_count, 0),
  tips_received_count = COALESCE(tips_received_count, 0),
  likes_received_count = COALESCE(likes_received_count, 0),
  votes_received_count = COALESCE(votes_received_count, 0);

ALTER TABLE users
  ALTER COLUMN ideas_count SET DEFAULT 0,
  ALTER COLUMN ideas_count SET NOT NULL,
  ALTER COLUMN projects_count SET DEFAULT 0,
  ALTER COLUMN projects_count SET NOT NULL,
  ALTER COLUMN feedback_count SET DEFAULT 0,
  ALTER COLUMN feedback_count SET NOT NULL,
  ALTER COLUMN tips_received_count SET DEFAULT 0,
  ALTER COLUMN tips_received_count SET NOT NULL,
  ALTER COLUMN likes_received_count SET DEFAULT 0,
  ALTER COLUMN likes_received_count SET NOT NULL,
  ALTER COLUMN votes_received_count SET DEFAULT 0,
  ALTER COLUMN votes_received_count SET NOT NULL;

CREATE OR REPLACE FUNCTION adjust_user_stat_counters(
  p_user_id UUID,
  p_ideas_delta INTEGER DEFAULT 0,
  p_projects_delta INTEGER DEFAULT 0,
  p_feedback_delta INTEGER DEFAULT 0,
  p_tips_delta INTEGER DEFAULT 0,
  p_likes_delta INTEGER DEFAULT 0,
  p_votes_delta INTEGER DEFAULT 0
)
RETURNS VOID AS $$
BEGIN
  IF p_user_id IS NULL THEN
    RETURN;
  END IF;

  UPDATE users
  SET
    ideas_count = GREATEST(0, COALESCE(ideas_count, 0) + p_ideas_delta),
    projects_count = GREATEST(0, COALESCE(projects_count, 0) + p_projects_delta),
    feedback_count = GREATEST(0, COALESCE(feedback_count, 0) + p_feedback_delta),
    tips_received_count = GREATEST(0, COALESCE(tips_received_count, 0) + p_tips_delta),
    likes_received_count = GREATEST(0, COALESCE(likes_received_count, 0) + p_likes_delta),
    votes_received_count = GREATEST(0, COALESCE(votes_received_count, 0) + p_votes_delta)
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION sync_user_stats_from_projects()
RETURNS TRIGGER AS $$
DECLARE
  v_old_votes INTEGER;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.type = 'idea' THEN
      PERFORM adjust_user_stat_counters(NEW.author_id, 1, 0, 0, 0, 0, 0);
    ELSE
      PERFORM adjust_user_stat_counters(NEW.author_id, 0, 1, 0, 0, 0, 0);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.type = 'idea' THEN
      PERFORM adjust_user_stat_counters(OLD.author_id, -1, 0, 0, 0, 0, 0);
    ELSE
      PERFORM adjust_user_stat_counters(OLD.author_id, 0, -1, 0, 0, 0, 0);
    END IF;
    RETURN OLD;
  END IF;

  IF OLD.author_id IS DISTINCT FROM NEW.author_id OR OLD.type IS DISTINCT FROM NEW.type THEN
    IF OLD.type = 'idea' THEN
      PERFORM adjust_user_stat_counters(OLD.author_id, -1, 0, 0, 0, 0, 0);
    ELSE
      PERFORM adjust_user_stat_counters(OLD.author_id, 0, -1, 0, 0, 0, 0);
    END IF;

    IF NEW.type = 'idea' THEN
      PERFORM adjust_user_stat_counters(NEW.author_id, 1, 0, 0, 0, 0, 0);
    ELSE
      PERFORM adjust_user_stat_counters(NEW.author_id, 0, 1, 0, 0, 0, 0);
    END IF;
  END IF;

  IF OLD.author_id IS DISTINCT FROM NEW.author_id THEN
    v_old_votes := COALESCE(OLD.votes, 0);
    PERFORM adjust_user_stat_counters(OLD.author_id, 0, 0, 0, 0, 0, -v_old_votes);
    PERFORM adjust_user_stat_counters(NEW.author_id, 0, 0, 0, 0, 0, v_old_votes);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION sync_user_stats_from_comments()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM adjust_user_stat_counters(NEW.user_id, 0, 0, 1, 0, 0, 0);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM adjust_user_stat_counters(OLD.user_id, 0, 0, -1, 0, 0, 0);
    RETURN OLD;
  END IF;

  IF OLD.user_id IS DISTINCT FROM NEW.user_id THEN
    PERFORM adjust_user_stat_counters(OLD.user_id, 0, 0, -1, 0, 0, 0);
    PERFORM adjust_user_stat_counters(NEW.user_id, 0, 0, 1, 0, 0, 0);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION sync_user_stats_from_comment_likes()
RETURNS TRIGGER AS $$
DECLARE
  v_comment_user_id UUID;
BEGIN
  IF TG_OP IN ('DELETE', 'UPDATE') THEN
    SELECT user_id INTO v_comment_user_id
    FROM comments
    WHERE id = OLD.comment_id;

    PERFORM adjust_user_stat_counters(v_comment_user_id, 0, 0, 0, 0, -1, 0);
  END IF;

  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    SELECT user_id INTO v_comment_user_id
    FROM comments
    WHERE id = NEW.comment_id;

    PERFORM adjust_user_stat_counters(v_comment_user_id, 0, 0, 0, 0, 1, 0);
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION sync_user_stats_from_project_votes()
RETURNS TRIGGER AS $$
DECLARE
  v_project_user_id UUID;
BEGIN
  IF TG_OP IN ('DELETE', 'UPDATE') THEN
    SELECT author_id INTO v_project_user_id
    FROM projects
    WHERE id = OLD.project_id;

    PERFORM adjust_user_stat_counters(v_project_user_id, 0, 0, 0, 0, 0, -1);
  END IF;

  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    SELECT author_id INTO v_project_user_id
    FROM projects
    WHERE id = NEW.project_id;

    PERFORM adjust_user_stat_counters(v_project_user_id, 0, 0, 0, 0, 0, 1);
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION sync_user_stats_from_transactions()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
BEGIN
  IF TG_OP IN ('DELETE', 'UPDATE') THEN
    IF OLD.type = 'tip' AND OLD.status = 'confirmed' THEN
      SELECT id INTO v_user_id
      FROM users
      WHERE wallet = OLD.to_wallet
      LIMIT 1;

      PERFORM adjust_user_stat_counters(v_user_id, 0, 0, 0, -1, 0, 0);
    END IF;
  END IF;

  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    IF NEW.type = 'tip' AND NEW.status = 'confirmed' THEN
      SELECT id INTO v_user_id
      FROM users
      WHERE wallet = NEW.to_wallet
      LIMIT 1;

      PERFORM adjust_user_stat_counters(v_user_id, 0, 0, 0, 1, 0, 0);
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_user_stats_projects ON projects;
CREATE TRIGGER trigger_sync_user_stats_projects
  AFTER INSERT OR UPDATE OF author_id, type OR DELETE ON projects
  FOR EACH ROW EXECUTE FUNCTION sync_user_stats_from_projects();

DROP TRIGGER IF EXISTS trigger_sync_user_stats_comments ON comments;
CREATE TRIGGER trigger_sync_user_stats_comments
  AFTER INSERT OR UPDATE OF user_id OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION sync_user_stats_from_comments();

DROP TRIGGER IF EXISTS trigger_sync_user_stats_comment_likes ON comment_likes;
CREATE TRIGGER trigger_sync_user_stats_comment_likes
  AFTER INSERT OR UPDATE OF comment_id OR DELETE ON comment_likes
  FOR EACH ROW EXECUTE FUNCTION sync_user_stats_from_comment_likes();

DROP TRIGGER IF EXISTS trigger_sync_user_stats_project_votes ON project_votes;
CREATE TRIGGER trigger_sync_user_stats_project_votes
  AFTER INSERT OR UPDATE OF project_id OR DELETE ON project_votes
  FOR EACH ROW EXECUTE FUNCTION sync_user_stats_from_project_votes();

DROP TRIGGER IF EXISTS trigger_sync_user_stats_transactions ON transactions;
CREATE TRIGGER trigger_sync_user_stats_transactions
  AFTER INSERT OR UPDATE OF status, type, to_wallet OR DELETE ON transactions
  FOR EACH ROW EXECUTE FUNCTION sync_user_stats_from_transactions();

-- Backfill from existing data
UPDATE users u
SET ideas_count = COALESCE(s.count, 0)
FROM (
  SELECT author_id, COUNT(*) AS count
  FROM projects
  WHERE type = 'idea'
  GROUP BY author_id
) s
WHERE u.id = s.author_id;

UPDATE users u
SET projects_count = COALESCE(s.count, 0)
FROM (
  SELECT author_id, COUNT(*) AS count
  FROM projects
  WHERE type = 'project'
  GROUP BY author_id
) s
WHERE u.id = s.author_id;

UPDATE users u
SET feedback_count = COALESCE(s.count, 0)
FROM (
  SELECT user_id, COUNT(*) AS count
  FROM comments
  GROUP BY user_id
) s
WHERE u.id = s.user_id;

UPDATE users u
SET likes_received_count = COALESCE(s.count, 0)
FROM (
  SELECT c.user_id, COUNT(*) AS count
  FROM comment_likes cl
  JOIN comments c ON c.id = cl.comment_id
  GROUP BY c.user_id
) s
WHERE u.id = s.user_id;

UPDATE users u
SET votes_received_count = COALESCE(s.count, 0)
FROM (
  SELECT p.author_id, COUNT(*) AS count
  FROM project_votes pv
  JOIN projects p ON p.id = pv.project_id
  GROUP BY p.author_id
) s
WHERE u.id = s.author_id;

UPDATE users u
SET tips_received_count = COALESCE(s.count, 0)
FROM (
  SELECT u2.id AS user_id, COUNT(*) AS count
  FROM transactions t
  JOIN users u2 ON u2.wallet = t.to_wallet
  WHERE t.type = 'tip'
    AND t.status = 'confirmed'
  GROUP BY u2.id
) s
WHERE u.id = s.user_id;
