-- Idea decision-pool metadata for Gimme Idea + MetaDAO flow
-- projects.type='idea' represents "Idea"

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS proposal_pubkey TEXT,
  ADD COLUMN IF NOT EXISTS pass_pool_address TEXT,
  ADD COLUMN IF NOT EXISTS fail_pool_address TEXT,
  ADD COLUMN IF NOT EXISTS pool_create_tx TEXT,
  ADD COLUMN IF NOT EXISTS pool_finalize_tx TEXT,
  ADD COLUMN IF NOT EXISTS pool_refs JSONB,
  ADD COLUMN IF NOT EXISTS final_decision TEXT,
  ADD COLUMN IF NOT EXISTS finalized_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS total_pass_volume NUMERIC(18, 6),
  ADD COLUMN IF NOT EXISTS total_fail_volume NUMERIC(18, 6);

CREATE INDEX IF NOT EXISTS idx_projects_proposal_pubkey
  ON projects(proposal_pubkey)
  WHERE proposal_pubkey IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_projects_pool_status_decision
  ON projects(pool_status, final_decision);
