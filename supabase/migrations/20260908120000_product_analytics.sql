begin;

-- First-party product analytics. This table intentionally stores no titles,
-- content bodies, email addresses, wallet addresses, or OAuth identifiers.
create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null check (
    event_name in ('problem_created', 'idea_submitted', 'bounty_funded', 'project_published')
  ),
  actor_user_id uuid references public.users(id) on delete set null,
  entity_type text not null check (entity_type in ('problem', 'idea', 'bounty', 'project')),
  entity_id uuid not null,
  source text not null default 'database_trigger' check (
    source in ('database_trigger', 'server', 'migration_backfill')
  ),
  properties jsonb not null default '{}'::jsonb check (jsonb_typeof(properties) = 'object'),
  dedupe_key text not null unique,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index analytics_events_name_occurred_idx
  on public.analytics_events(event_name, occurred_at desc);
create index analytics_events_actor_occurred_idx
  on public.analytics_events(actor_user_id, occurred_at desc)
  where actor_user_id is not null;
create index analytics_events_entity_idx
  on public.analytics_events(entity_type, entity_id);

-- Browser clients must never read or forge canonical conversion events. The
-- application database role and Supabase service role retain server access.
alter table public.analytics_events enable row level security;
revoke all on table public.analytics_events from anon, authenticated;
grant all on table public.analytics_events to service_role;

create or replace function public.capture_product_analytics_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  configured_event text := tg_argv[0];
  should_capture boolean := false;
  event_actor uuid;
  event_entity_type text;
  event_properties jsonb := '{}'::jsonb;
begin
  if configured_event = 'problem_created' then
    should_capture := tg_op = 'INSERT';
    event_actor := new.created_by;
    event_entity_type := 'problem';
    event_properties := jsonb_build_object(
      'visibility', new.visibility,
      'organization_id', new.organization_id,
      'initial_status', new.status
    );
  elsif configured_event = 'idea_submitted' then
    should_capture := new.status = 'published'
      and (tg_op = 'INSERT' or old.status is distinct from 'published');
    event_actor := new.created_by;
    event_entity_type := 'idea';
    event_properties := jsonb_build_object(
      'visibility', new.visibility,
      'source_type', new.source_type
    );
  elsif configured_event = 'project_published' then
    should_capture := new.visibility = 'public'
      and (tg_op = 'INSERT' or old.visibility is distinct from 'public');
    event_actor := new.created_by;
    event_entity_type := 'project';
    event_properties := jsonb_build_object(
      'stage', new.stage,
      'origin_type', new.origin_type
    );
  elsif configured_event = 'bounty_funded' then
    should_capture := new.status in ('funded', 'open')
      and (
        tg_op = 'INSERT'
        or old.status is null
        or old.status not in ('funded', 'open')
      );
    select fi.created_by
      into event_actor
      from public.funding_intents fi
      where fi.bounty_id = new.id
        and fi.status in ('submitted', 'confirmed')
      order by fi.updated_at desc
      limit 1;
    event_actor := coalesce(event_actor, new.created_by);
    event_entity_type := 'bounty';
    event_properties := jsonb_build_object(
      'bounty_type', new.bounty_type,
      'currency', new.currency,
      'prize_amount_raw', new.prize_amount_raw::text,
      'fee_amount_raw', new.fee_amount_raw::text,
      'organization_id', new.organization_id
    );
  else
    raise exception 'Unsupported product analytics event: %', configured_event;
  end if;

  if should_capture then
    insert into public.analytics_events(
      event_name,
      actor_user_id,
      entity_type,
      entity_id,
      properties,
      dedupe_key,
      occurred_at
    ) values (
      configured_event,
      event_actor,
      event_entity_type,
      new.id,
      jsonb_strip_nulls(event_properties),
      configured_event || ':' || new.id::text,
      coalesce(new.updated_at, new.created_at, now())
    )
    on conflict (dedupe_key) do nothing;
  end if;

  return new;
end;
$$;

revoke all on function public.capture_product_analytics_event() from public, anon, authenticated;

create trigger analytics_problem_created
after insert on public.problems
for each row execute function public.capture_product_analytics_event('problem_created');

create trigger analytics_idea_submitted
after insert or update of status on public.ideas
for each row execute function public.capture_product_analytics_event('idea_submitted');

create trigger analytics_project_published
after insert or update of visibility on public.projects
for each row execute function public.capture_product_analytics_event('project_published');

create trigger analytics_bounty_funded
after insert or update of status on public.bounties
for each row execute function public.capture_product_analytics_event('bounty_funded');

commit;
