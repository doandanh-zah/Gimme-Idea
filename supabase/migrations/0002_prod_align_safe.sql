-- Safe in-place alignment for EXISTING production DB (keeps all data).
-- Run after backup. Does not DROP tables that still have rows.
-- Greenfield SSOT remains 0001_init.sql for new projects.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) Auth: allow agent provider (code registers agent users; prod only had wallet|google)
-- ---------------------------------------------------------------------------
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_auth_provider_check;
ALTER TABLE public.users
  ADD CONSTRAINT users_auth_provider_check
  CHECK (
    auth_provider IS NULL
    OR auth_provider = ANY (ARRAY['wallet'::text, 'google'::text, 'agent'::text])
  );

-- ---------------------------------------------------------------------------
-- 2) Projects: ensure verification + hackathon link columns (no-op if present)
-- ---------------------------------------------------------------------------
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS hackathon_id UUID,
  ADD COLUMN IF NOT EXISTS hackathon_track VARCHAR(100);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'projects_hackathon_id_fkey') THEN
    ALTER TABLE public.projects
      ADD CONSTRAINT projects_hackathon_id_fkey
      FOREIGN KEY (hackathon_id) REFERENCES public.hackathons(id) ON DELETE SET NULL;
  END IF;
EXCEPTION WHEN undefined_table THEN
  NULL; -- hackathons missing
END $$;

-- ---------------------------------------------------------------------------
-- 3) billing_payments — code uses it; missing on prod inventory
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.billing_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider VARCHAR(20) NOT NULL DEFAULT 'stripe',
  provider_session_id TEXT NOT NULL UNIQUE,
  plan VARCHAR(20) NOT NULL CHECK (plan IN ('pack', 'pro5', 'pro10')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
  payer_name TEXT,
  payer_email TEXT,
  payer_country TEXT,
  amount_usd NUMERIC(10, 2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_billing_payments_user
  ON public.billing_payments(user_id, created_at DESC);

ALTER TABLE public.billing_payments ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 4) user_daily_usage.searches_used (optional meter consolidation)
-- ---------------------------------------------------------------------------
ALTER TABLE public.user_daily_usage
  ADD COLUMN IF NOT EXISTS searches_used INTEGER NOT NULL DEFAULT 0;

-- ---------------------------------------------------------------------------
-- 5) Drop EMPTY twin tables only (exact count 0 at migration time)
--    Skip if any rows appear — re-check before running in prod.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  r bigint;
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'hackathon_ideas',
    'hackathon_feedback',
    'hackathon_round_results',
    'hackathon_participants'
  ]
  LOOP
    IF to_regclass('public.' || t) IS NULL THEN
      CONTINUE;
    END IF;
    EXECUTE format('SELECT count(*) FROM public.%I', t) INTO r;
    IF r = 0 THEN
      EXECUTE format('DROP TABLE public.%I CASCADE', t);
      RAISE NOTICE 'Dropped empty table %', t;
    ELSE
      RAISE NOTICE 'Kept % (has % rows)', t, r;
    END IF;
  END LOOP;
END $$;

COMMIT;
