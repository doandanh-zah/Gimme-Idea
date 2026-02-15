-- Migration: Commit-to-Build Marketplace (Phase 1) - SPL Governance integration metadata
-- NOTE: Zah will run this manually when ready.
-- Adds governance/pool fields onto the existing `projects` table (ideas are projects with type='idea').

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS pool_status TEXT,
  ADD COLUMN IF NOT EXISTS governance_realm_address TEXT,
  ADD COLUMN IF NOT EXISTS governance_treasury_address TEXT,
  ADD COLUMN IF NOT EXISTS governance_receipt_mint TEXT,
  ADD COLUMN IF NOT EXISTS support_fee_bps INTEGER,
  ADD COLUMN IF NOT EXISTS support_fee_cap_usdc NUMERIC(18, 6),
  ADD COLUMN IF NOT EXISTS support_fee_recipient TEXT,
  ADD COLUMN IF NOT EXISTS pool_created_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pool_created_by TEXT;

-- Optional index helpers
CREATE INDEX IF NOT EXISTS idx_projects_pool_status ON projects(pool_status);

COMMIT;
