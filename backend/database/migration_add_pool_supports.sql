-- Canonical support ledger for pool donations (USDC supports)
create table if not exists public.pool_supports (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  supporter_wallet text not null,
  supporter_user_id uuid references public.users(id),
  tx_hash text not null unique,
  amount_usdc numeric(20,6) not null,
  fee_usdc numeric(20,6) not null default 0,
  treasury_wallet text not null,
  confirmed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_pool_supports_project on public.pool_supports(project_id);
create index if not exists idx_pool_supports_supporter on public.pool_supports(supporter_wallet);
create index if not exists idx_pool_supports_confirmed_at on public.pool_supports(confirmed_at desc);
