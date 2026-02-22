-- Migration: Agent secret-key auth
-- Purpose: allow agent register/login without email/wallet.

BEGIN;

CREATE TABLE IF NOT EXISTS agent_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'default',
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  last_used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_keys_user_id ON agent_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_keys_prefix ON agent_keys(key_prefix);
CREATE INDEX IF NOT EXISTS idx_agent_keys_revoked ON agent_keys(revoked_at) WHERE revoked_at IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_keys_hash_unique ON agent_keys(key_hash);

-- Support auth provider value for agent mode
ALTER TABLE users
  ALTER COLUMN auth_provider DROP DEFAULT;

COMMIT;
