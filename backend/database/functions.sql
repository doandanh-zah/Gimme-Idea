-- PostgreSQL Functions for atomic operations
-- Run this after schema.sql

-- Function to increment login count
CREATE OR REPLACE FUNCTION increment_login_count(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE users
  SET
    login_count = login_count + 1,
    last_login_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to increment project votes
CREATE OR REPLACE FUNCTION increment_project_votes(project_id UUID)
RETURNS INTEGER AS $$
DECLARE
  new_votes INTEGER;
BEGIN
  UPDATE projects
  SET votes = votes + 1
  WHERE id = project_id
  RETURNING votes INTO new_votes;

  RETURN new_votes;
END;
$$ LANGUAGE plpgsql;

-- Function to increment feedback count
CREATE OR REPLACE FUNCTION increment_feedback_count(project_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE projects
  SET feedback_count = feedback_count + 1
  WHERE id = project_id;
END;
$$ LANGUAGE plpgsql;

-- Function to increment comment likes
CREATE OR REPLACE FUNCTION increment_comment_likes(comment_id UUID)
RETURNS INTEGER AS $$
DECLARE
  new_likes INTEGER;
BEGIN
  UPDATE comments
  SET likes = likes + 1
  WHERE id = comment_id
  RETURNING likes INTO new_likes;

  RETURN new_likes;
END;
$$ LANGUAGE plpgsql;

-- Function to add reputation points
CREATE OR REPLACE FUNCTION add_reputation_points(user_id UUID, points INTEGER)
RETURNS INTEGER AS $$
DECLARE
  new_score INTEGER;
BEGIN
  UPDATE users
  SET reputation_score = reputation_score + points
  WHERE id = user_id
  RETURNING reputation_score INTO new_score;

  RETURN new_score;
END;
$$ LANGUAGE plpgsql;
