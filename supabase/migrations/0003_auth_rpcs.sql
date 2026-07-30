-- Auth RPCs required by Nest backend after greenfield / schema reset.
-- Without these, Google login fails with:
--   POST /api/auth/login-email → 500
--   PostgREST PGRST202: Could not find function find_or_create_user_by_email
--
-- Wallet login does NOT need these (it uses direct table insert/select).

CREATE OR REPLACE FUNCTION public.find_or_create_user_by_email(
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
  v_base_username TEXT;
  v_attempt INT := 0;
BEGIN
  SELECT id, needs_wallet_connect INTO v_user_id, v_needs_wallet
  FROM public.users
  WHERE auth_id = p_auth_id;

  IF v_user_id IS NOT NULL THEN
    RETURN QUERY SELECT v_user_id, false, COALESCE(v_needs_wallet, false);
    RETURN;
  END IF;

  SELECT id, needs_wallet_connect INTO v_user_id, v_needs_wallet
  FROM public.users
  WHERE email = p_email;

  IF v_user_id IS NOT NULL THEN
    UPDATE public.users
    SET auth_id = p_auth_id,
        auth_provider = 'google',
        updated_at = NOW()
    WHERE id = v_user_id;

    RETURN QUERY SELECT v_user_id, false, COALESCE(v_needs_wallet, false);
    RETURN;
  END IF;

  v_is_new := true;
  v_needs_wallet := true;
  v_base_username := COALESCE(
    NULLIF(trim(p_username), ''),
    split_part(p_email, '@', 1)
  );
  v_base_username := regexp_replace(v_base_username, '[^a-zA-Z0-9_]', '_', 'g');
  IF length(v_base_username) < 2 THEN
    v_base_username := 'user';
  END IF;
  v_base_username := left(v_base_username, 80);

  LOOP
    v_attempt := v_attempt + 1;
    IF v_attempt = 1 THEN
      v_username := v_base_username;
    ELSE
      v_username := v_base_username || '_' || substr(md5(random()::text || clock_timestamp()::text), 1, 6);
    END IF;

    BEGIN
      INSERT INTO public.users (
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
        NULL,
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
      EXIT;
    EXCEPTION
      WHEN unique_violation THEN
        IF v_attempt >= 8 THEN
          RAISE;
        END IF;
    END;
  END LOOP;

  RETURN QUERY SELECT v_user_id, v_is_new, v_needs_wallet;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.link_wallet_to_user(
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
  SELECT wallet INTO v_current_wallet FROM public.users WHERE id = p_user_id;

  IF v_current_wallet IS NOT NULL AND v_current_wallet != '' THEN
    RETURN QUERY SELECT false, 'Wallet already connected'::TEXT, false;
    RETURN;
  END IF;

  SELECT id INTO v_existing_wallet_user_id
  FROM public.users
  WHERE wallet = p_wallet_address AND id != p_user_id;

  IF v_existing_wallet_user_id IS NOT NULL THEN
    RETURN QUERY SELECT false, 'This wallet is already connected to another account'::TEXT, false;
    RETURN;
  END IF;

  UPDATE public.users
  SET
    wallet = p_wallet_address,
    needs_wallet_connect = false,
    updated_at = NOW()
  WHERE id = p_user_id;

  RETURN QUERY SELECT true, 'Wallet connected successfully'::TEXT, false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.increment_login_count(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.users
  SET
    login_count = COALESCE(login_count, 0) + 1,
    last_login_at = NOW(),
    updated_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.find_or_create_user_by_email(TEXT, TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.link_wallet_to_user(UUID, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.increment_login_count(UUID) TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
