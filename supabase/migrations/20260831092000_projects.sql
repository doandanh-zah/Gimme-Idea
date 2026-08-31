create table public.projects (
  id uuid primary key default gen_random_uuid(), idea_id uuid not null references public.ideas(id), slug text unique not null, name text not null,
  description text not null, stage text not null default 'prototype', repository_url text, website_url text, created_by uuid references public.users(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz
);
create index projects_idea_idx on public.projects(idea_id) where deleted_at is null;
create table public.project_members (project_id uuid references public.projects(id) on delete cascade, user_id uuid references public.users(id), role text not null, joined_at timestamptz not null default now(), primary key(project_id,user_id));
create table public.project_updates (id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id) on delete cascade, title text not null, body text not null, created_by uuid references public.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.project_outcomes (id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id) on delete cascade, outcome_type text not null, summary text not null, evidence_url text, recorded_at timestamptz not null default now());
create trigger projects_updated_at before update on public.projects for each row execute function public.set_updated_at();
