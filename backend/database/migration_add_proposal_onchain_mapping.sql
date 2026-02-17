alter table if exists public.proposals
  add column if not exists onchain_proposal_pubkey text,
  add column if not exists onchain_create_tx text,
  add column if not exists onchain_refs jsonb;

create unique index if not exists idx_proposals_onchain_proposal_pubkey_unique
  on public.proposals(onchain_proposal_pubkey)
  where onchain_proposal_pubkey is not null;

create index if not exists idx_proposals_onchain_create_tx
  on public.proposals(onchain_create_tx)
  where onchain_create_tx is not null;
