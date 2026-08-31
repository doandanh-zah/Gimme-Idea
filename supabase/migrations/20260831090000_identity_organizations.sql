create extension if not exists pgcrypto;

create function public.set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

create table public.users (
  id uuid primary key default gen_random_uuid(), auth_user_id uuid unique not null, username text unique, display_name text, bio text,
  avatar_url text, location text, website_url text, github_url text, linkedin_url text, x_url text,
  profile_visibility text not null default 'public' check (profile_visibility in ('public','private')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz
);
create table public.user_wallets (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id), chain text not null default 'solana',
  address text not null, is_primary boolean not null default false, verified_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(chain,address)
);
create unique index user_wallets_one_primary_uidx on public.user_wallets(user_id,chain) where is_primary;
create table public.organizations (
  id uuid primary key default gen_random_uuid(), slug text unique not null, name text not null, organization_type text not null,
  one_line_description text, description text, logo_url text, website_url text, location text, industry text,
  verification_status text not null default 'unverified', created_by uuid references public.users(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz
);
create table public.organization_members (
  organization_id uuid references public.organizations(id) on delete cascade, user_id uuid references public.users(id) on delete cascade,
  role text, permission_level text not null default 'member', joined_at timestamptz not null default now(), primary key(organization_id,user_id)
);
create trigger users_updated_at before update on public.users for each row execute function public.set_updated_at();
create trigger wallets_updated_at before update on public.user_wallets for each row execute function public.set_updated_at();
create trigger organizations_updated_at before update on public.organizations for each row execute function public.set_updated_at();
