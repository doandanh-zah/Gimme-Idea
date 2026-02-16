create table if not exists public.proposals (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  proposer_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  description text not null,
  status text not null default 'pending', -- pending|voting|passed|rejected|executed
  onchain_tx text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_proposals_project_id on public.proposals(project_id);
create index if not exists idx_proposals_status on public.proposals(status);
