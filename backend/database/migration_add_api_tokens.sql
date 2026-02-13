-- Migration: Add API Tokens (Personal Access Tokens) + Audit Logs
-- Purpose: Allow trusted agents/users to call the backend as a real user with scoped permissions.
-- Run this in Supabase SQL Editor.

BEGIN;

-- =============================================
-- api_tokens
-- =============================================
CREATE TABLE IF NOT EXISTS api_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  token_hash TEXT NOT NULL, -- store sha256 hash only
  scopes TEXT[] NOT NULL DEFAULT '{}',

  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_tokens_user_id ON api_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_api_tokens_revoked ON api_tokens(revoked_at) WHERE revoked_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_api_tokens_expires ON api_tokens(expires_at) WHERE expires_at IS NOT NULL;

-- Ensure token_hash is unique (best-effort safety)
CREATE UNIQUE INDEX IF NOT EXISTS idx_api_tokens_token_hash_unique ON api_tokens(token_hash);

-- =============================================
-- audit_logs
-- =============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  token_id UUID REFERENCES api_tokens(id) ON DELETE SET NULL,

  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,

  ip TEXT,
  user_agent TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_user ON audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_token_id ON audit_logs(token_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- =============================================
-- RLS
-- =============================================
ALTER TABLE api_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Tokens: users can view/manage their own tokens (if you later expose via Supabase).
DROP POLICY IF EXISTS "Users can view their own api tokens" ON api_tokens;
CREATE POLICY "Users can view their own api tokens" ON api_tokens
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own api tokens" ON api_tokens;
CREATE POLICY "Users can manage their own api tokens" ON api_tokens
  FOR ALL USING (auth.uid() = user_id);

-- Audit logs: only service role can read/write (backend only)
DROP POLICY IF EXISTS "Service role can manage audit logs" ON audit_logs;
CREATE POLICY "Service role can manage audit logs" ON audit_logs
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

COMMIT;
