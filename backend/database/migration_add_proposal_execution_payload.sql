alter table if exists public.proposals
  add column if not exists execution_payload jsonb;

create index if not exists idx_proposals_execution_payload on public.proposals using gin (execution_payload);
