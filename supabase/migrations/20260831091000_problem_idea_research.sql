create table public.problems (
  id uuid primary key default gen_random_uuid(), slug text unique not null, title text not null, summary text not null, description text not null,
  affected_groups text[] not null default '{}', evidence text[] not null default '{}', severity text not null default 'medium' check (severity in ('low','medium','high','critical')),
  status text not null default 'draft' check (status in ('draft','published','archived')), research_status text not null default 'unresearched' check (research_status in ('unresearched','queued','researching','verified','needs_review')),
  origin text not null default 'human' check (origin in ('human','ai_assisted','imported')), reviewed_by_human boolean not null default true,
  last_researched_at timestamptz, created_by uuid references public.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz
);
create index problems_status_idx on public.problems(status) where deleted_at is null;
create index problems_search_idx on public.problems using gin(to_tsvector('english', title || ' ' || summary || ' ' || description));
create table public.problem_sources (
  id uuid primary key default gen_random_uuid(), problem_id uuid not null references public.problems(id) on delete cascade,
  title text not null, url text not null, publisher text, published_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(problem_id,url)
);
create table public.ideas (
  id uuid primary key default gen_random_uuid(), slug text unique not null, title text not null, summary text not null, thesis text not null, solution text not null,
  target_users text[] not null default '{}', status text not null default 'draft' check (status in ('draft','published','archived')),
  research_status text not null default 'unresearched' check (research_status in ('unresearched','queued','researching','verified','needs_review')),
  origin text not null default 'human' check (origin in ('human','ai_assisted','imported')), reviewed_by_human boolean not null default true,
  last_researched_at timestamptz, created_by uuid references public.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz
);
create index ideas_status_idx on public.ideas(status) where deleted_at is null;
create index ideas_search_idx on public.ideas using gin(to_tsvector('english', title || ' ' || summary || ' ' || thesis || ' ' || solution));
create table public.idea_problem_links (
  idea_id uuid not null references public.ideas(id) on delete cascade, problem_id uuid not null references public.problems(id) on delete cascade,
  relationship_type text not null default 'secondary' check (relationship_type in ('primary','secondary')), created_at timestamptz not null default now(), primary key(idea_id,problem_id)
);
create unique index idea_one_primary_problem_uidx on public.idea_problem_links(idea_id) where relationship_type = 'primary';
create table public.previous_attempts (
  id uuid primary key default gen_random_uuid(), idea_id uuid not null references public.ideas(id) on delete cascade, name text not null,
  description text not null, outcome text not null default 'unknown' check (outcome in ('active','failed','acquired','sunset','unknown')),
  lesson text not null, source_url text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.previous_attempt_failure_factors (
  id uuid primary key default gen_random_uuid(), previous_attempt_id uuid not null references public.previous_attempts(id) on delete cascade, factor text not null, category text not null
);
create table public.previous_attempt_sources (
  id uuid primary key default gen_random_uuid(), previous_attempt_id uuid not null references public.previous_attempts(id) on delete cascade, title text not null, url text not null
);

create function public.check_idea_link_primary() returns trigger language plpgsql as $$
declare target_idea uuid;
begin
  if tg_op = 'DELETE' then target_idea := old.idea_id; else target_idea := new.idea_id; end if;
  if exists(select 1 from public.ideas where id=target_idea and status='published' and deleted_at is null)
     and (select count(*) from public.idea_problem_links where idea_id=target_idea and relationship_type='primary') <> 1 then
    raise exception 'Published idea % must have exactly one primary problem', target_idea;
  end if;
  if tg_op = 'DELETE' then return old; else return new; end if;
end $$;
create function public.check_idea_publish_primary() returns trigger language plpgsql as $$
begin
  if new.status='published' and new.deleted_at is null
     and (select count(*) from public.idea_problem_links where idea_id=new.id and relationship_type='primary') <> 1 then
    raise exception 'Published idea % must have exactly one primary problem', new.id;
  end if;
  return new;
end $$;
create constraint trigger idea_primary_link_guard after insert or update or delete on public.idea_problem_links deferrable initially deferred for each row execute function public.check_idea_link_primary();
create constraint trigger idea_publish_guard after insert or update of status on public.ideas deferrable initially deferred for each row execute function public.check_idea_publish_primary();
create trigger problems_updated_at before update on public.problems for each row execute function public.set_updated_at();
create trigger ideas_updated_at before update on public.ideas for each row execute function public.set_updated_at();
create trigger attempts_updated_at before update on public.previous_attempts for each row execute function public.set_updated_at();
