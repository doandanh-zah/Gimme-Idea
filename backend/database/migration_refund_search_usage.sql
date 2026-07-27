-- Refund one daily search after a failed paid attempt (provider/network errors).
-- Pair with reserve via increment_search_usage; call only when reserve succeeded
-- and the paid path did not complete successfully.
--
-- Also hardens increment_search_usage to upsert the daily row first so the first
-- search of the day does not fail when no idea_search_quota row exists yet.

-- Reserve one slot (insert-on-conflict then conditional increment).
CREATE OR REPLACE FUNCTION increment_search_usage(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  INSERT INTO idea_search_quota (user_id, search_date, searches_used)
  VALUES (p_user_id, CURRENT_DATE, 0)
  ON CONFLICT (user_id, search_date) DO NOTHING;

  UPDATE idea_search_quota
  SET
    searches_used = searches_used + 1,
    updated_at = NOW()
  WHERE user_id = p_user_id
    AND search_date = CURRENT_DATE
    AND searches_used < max_searches;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION refund_search_usage(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  UPDATE idea_search_quota
  SET
    searches_used = GREATEST(0, searches_used - 1),
    updated_at = NOW()
  WHERE user_id = p_user_id
    AND search_date = CURRENT_DATE
    AND searches_used > 0;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
