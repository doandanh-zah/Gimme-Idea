-- DAO creation requests (idea owner -> admin approval)
create table if not exists public.dao_requests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  requester_id uuid not null references public.users(id) on delete cascade,
  tx_signature text not null unique,
  from_wallet text,
  to_wallet text,
  amount_sol numeric(20,9) not null default 0,
  amount_usd numeric(20,6) not null default 0,
  required_usd numeric(10,2) not null default 3,
  status text not null default 'pending', -- pending | approved | rejected
  note text,
  reviewed_by uuid references public.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_dao_requests_project_id on public.dao_requests(project_id);
create index if not exists idx_dao_requests_status on public.dao_requests(status);
create index if not exists idx_dao_requests_requester_id on public.dao_requests(requester_id);
