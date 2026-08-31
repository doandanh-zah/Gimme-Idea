create table public.bounties (
  id uuid primary key default gen_random_uuid(), problem_id uuid not null references public.problems(id), organization_id uuid references public.organizations(id),
  title text not null, description text not null, status text not null default 'unfunded' check (status in ('unfunded','mock_funded','funded','open','judging','completed','cancelled')),
  currency text not null default 'USDC', total_amount_raw numeric(40,0) not null default 0 check(total_amount_raw >= 0), deadline_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index bounties_problem_idx on public.bounties(problem_id);
create table public.bounty_prizes (id uuid primary key default gen_random_uuid(), bounty_id uuid not null references public.bounties(id) on delete cascade, rank text not null, amount_raw numeric(40,0) not null check(amount_raw >= 0));
create table public.bounty_escrows (
  id uuid primary key default gen_random_uuid(), bounty_id uuid unique not null references public.bounties(id), status text not null default 'not_created',
  escrow_address text, funding_signature text, funded_amount_raw numeric(40,0) not null default 0 check(funded_amount_raw >= 0), confirmed_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.submissions (
  id uuid primary key default gen_random_uuid(), bounty_id uuid not null references public.bounties(id), idea_id uuid references public.ideas(id),
  project_id uuid references public.projects(id), submitted_by uuid references public.users(id), title text not null, description text not null,
  status text not null default 'submitted', created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check(idea_id is not null or project_id is not null)
);
create table public.submission_results (id uuid primary key default gen_random_uuid(), submission_id uuid unique not null references public.submissions(id), decision text not null, rationale text, decided_at timestamptz not null default now());
create table public.external_opportunities (id uuid primary key default gen_random_uuid(), source_name text not null, external_id text, title text not null, url text not null, payload jsonb not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.external_submissions (id uuid primary key default gen_random_uuid(), external_opportunity_id uuid not null references public.external_opportunities(id), project_id uuid references public.projects(id), status text not null, external_url text, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.bounty_reviews (id uuid primary key default gen_random_uuid(), bounty_id uuid not null references public.bounties(id), reviewer_id uuid references public.users(id), status text not null default 'assigned', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.bounty_judging_criteria (id uuid primary key default gen_random_uuid(), bounty_id uuid not null references public.bounties(id), name text not null, weight numeric(5,2) not null check(weight > 0));
create table public.bounty_review_scores (review_id uuid references public.bounty_reviews(id), criterion_id uuid references public.bounty_judging_criteria(id), score numeric(5,2) not null, note text, primary key(review_id,criterion_id));
create table public.bounty_winners (id uuid primary key default gen_random_uuid(), bounty_id uuid not null references public.bounties(id), submission_id uuid not null references public.submissions(id), rank text not null, amount_raw numeric(40,0) not null check(amount_raw >= 0), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.payout_intents (id uuid primary key default gen_random_uuid(), bounty_winner_id uuid unique not null references public.bounty_winners(id), status text not null default 'pending', amount_raw numeric(40,0) not null check(amount_raw >= 0), recipient_address text, transaction_signature text, confirmed_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.blockchain_events (id uuid primary key default gen_random_uuid(), chain text not null default 'solana', signature text not null, event_type text not null, slot numeric(40,0), payload jsonb not null, confirmed_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(signature,event_type));
create trigger bounties_updated_at before update on public.bounties for each row execute function public.set_updated_at();
