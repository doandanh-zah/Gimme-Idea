-- Refund one daily search after a failed paid attempt (provider/network errors).
-- Pair with reserve via increment_search_usage; call only when reserve succeeded
-- and the paid path did not complete successfully.

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
