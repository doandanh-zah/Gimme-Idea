begin;

create function public.canonical_jsonb(value jsonb) returns text language sql immutable strict as $$
  select case jsonb_typeof(value)
    when 'object' then coalesce((select '{'||string_agg(to_jsonb(key)::text||':'||public.canonical_jsonb(item),',' order by key)||'}' from jsonb_each(value) as entries(key,item)),'{}')
    when 'array' then coalesce((select '['||string_agg(public.canonical_jsonb(item),',' order by ordinal)||']' from jsonb_array_elements(value) with ordinality as entries(item,ordinal)),'[]')
    else value::text
  end
$$;
create function public.bounty_terms_hash(value jsonb) returns text language sql immutable strict as $$
  select encode(digest(convert_to(public.canonical_jsonb(value),'UTF8'),'sha256'),'hex')
$$;

-- Identity is provider/subject based. The legacy UUID is retained only for a
-- reversible migration from the foundation schema.
alter table public.users add column auth_provider text not null default 'legacy';
alter table public.users add column auth_subject text;
update public.users set auth_subject = auth_user_id::text where auth_subject is null;
alter table public.users alter column auth_subject set not null;
alter table public.users alter column auth_user_id drop not null;
alter table public.users add column profile_source text not null default 'user';
alter table public.users add constraint users_auth_provider_subject_key unique(auth_provider, auth_subject);
alter table public.users add constraint users_auth_provider_check check(auth_provider in ('legacy','privy','dev'));

alter table public.user_wallets add column wallet_kind text not null default 'linked';
alter table public.user_wallets add column provider text;
alter table public.user_wallets add column is_reward_wallet boolean not null default false;
alter table public.user_wallets add column verification_method text;
alter table public.user_wallets add constraint user_wallets_kind_check check(wallet_kind in ('embedded','linked','organization','development'));
create unique index user_wallets_one_reward_uidx on public.user_wallets(user_id,chain) where is_reward_wallet;

alter table public.organization_members add constraint organization_members_permission_check
  check(permission_level in ('owner','admin','judge','member'));
create table public.organization_wallets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  chain text not null default 'solana', address text not null,
  purpose text not null default 'funding' check(purpose in ('funding','treasury')),
  verified_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(chain,address), unique(organization_id,chain,purpose)
);
create table public.organization_invitations (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  email text not null, permission_level text not null check(permission_level in ('admin','judge','member')),
  token_hash text not null unique, expires_at timestamptz not null, accepted_at timestamptz,
  invited_by uuid not null references public.users(id), created_at timestamptz not null default now()
);

alter table public.problems add column organization_id uuid references public.organizations(id);
alter table public.problems add column industry text;
alter table public.problems add column region text;
alter table public.problems add column current_workaround text;
alter table public.problems add column existing_solutions text[] not null default '{}';
alter table public.problems add column desired_outcome text;
alter table public.problems add column constraints text[] not null default '{}';
alter table public.problems add column known_data text[] not null default '{}';
alter table public.problems add column success_metrics text[] not null default '{}';
alter table public.problems add column visibility text not null default 'public';
alter table public.problems add column content_version integer not null default 1 check(content_version > 0);
alter table public.problems add column archived_at timestamptz;
alter table public.problems add constraint problems_visibility_check check(visibility in ('public','organization','private'));
create index problems_org_idx on public.problems(organization_id) where deleted_at is null;

alter table public.ideas add column visibility text not null default 'public';
alter table public.ideas add column source_type text not null default 'direct';
alter table public.ideas add column source_submission_id uuid;
alter table public.ideas add column opportunity text;
alter table public.ideas add column why_now text;
alter table public.ideas add column differentiation text;
alter table public.ideas add column risks text[] not null default '{}';
alter table public.ideas add column validation_plan text;
alter table public.ideas add column content_version integer not null default 1 check(content_version > 0);
alter table public.ideas add column archived_at timestamptz;
alter table public.ideas add constraint ideas_visibility_check check(visibility in ('public','organization','private'));
alter table public.ideas add constraint ideas_source_type_check check(source_type in ('direct','submission_winner','imported','ai_assisted'));

alter table public.projects alter column idea_id drop not null;
alter table public.projects add column summary text;
update public.projects set summary = description where summary is null;
alter table public.projects alter column summary set not null;
alter table public.projects add column origin_type text not null default 'community';
alter table public.projects add column visibility text not null default 'public';
alter table public.projects add column demo_url text;
alter table public.projects add column originating_bounty_id uuid;
alter table public.projects add column source_submission_id uuid;
alter table public.projects add column content_version integer not null default 1 check(content_version > 0);
alter table public.projects add column owner_status text not null default 'active';
alter table public.projects add column archived_at timestamptz;
update public.projects set stage='testing' where stage in ('prototype','pilot');
alter table public.projects add constraint projects_stage_check check(stage in ('concept','building','testing','live','paused','archived'));
alter table public.projects add constraint projects_origin_check check(origin_type in ('community','idea_winner','build_winner','historical_import'));
alter table public.projects add constraint projects_visibility_check check(visibility in ('public','restricted','private'));
alter table public.projects add constraint projects_origin_reference_check check(idea_id is not null or originating_bounty_id is not null or origin_type='historical_import');

alter table public.bounties add column slug text;
update public.bounties set slug = 'legacy-' || id::text where slug is null;
alter table public.bounties alter column slug set not null;
alter table public.bounties add constraint bounties_slug_key unique(slug);
alter table public.bounties add column bounty_type text not null default 'idea';
alter table public.bounties add column parent_bounty_id uuid references public.bounties(id);
alter table public.bounties add column selected_idea_id uuid references public.ideas(id);
alter table public.bounties add column created_by uuid references public.users(id);
alter table public.bounties add column objective text;
alter table public.bounties add column requirements text[] not null default '{}';
alter table public.bounties add column constraints text[] not null default '{}';
alter table public.bounties add column eligibility text[] not null default '{}';
alter table public.bounties add column ip_terms text not null default 'Creator retains ownership unless the published bounty terms state otherwise.';
alter table public.bounties add column judging_deadline_at timestamptz;
alter table public.bounties add column submission_visibility text not null default 'private';
alter table public.bounties add column terms_version integer not null default 1;
alter table public.bounties add column terms_payload jsonb not null default '{}'::jsonb;
alter table public.bounties add column terms_hash text;
alter table public.bounties add column fee_amount_raw numeric(40,0) not null default 0 check(fee_amount_raw >= 0);
alter table public.bounties add column prize_amount_raw numeric(40,0) not null default 0 check(prize_amount_raw >= 0);
alter table public.bounties add column access_mode text not null default 'open';
alter table public.bounties drop constraint if exists bounties_status_check;
update public.bounties set prize_amount_raw=total_amount_raw, objective=description,
  status=case when status='funded' then 'open' when status in ('open','judging','completed','cancelled') then status else 'awaiting_funding' end,
  terms_payload=jsonb_build_object(
    'version', 1, 'bountyId', id::text, 'type', 'idea', 'currency', currency,
    'prizeAmountRaw', total_amount_raw::text, 'feeAmountRaw', '0',
    'deadlineAt', deadline_at, 'submissionVisibility', 'private'
  );
update public.bounties set terms_hash=public.bounty_terms_hash(terms_payload);
alter table public.bounties add constraint bounties_status_check check(status in ('draft','awaiting_funding','funding_pending','funded','open','closed','judging','winner_pending_chain','settlement_pending','completed','cancelled','refunded','resolution'));
alter table public.bounties add constraint bounties_type_check check(bounty_type in ('idea','build'));
alter table public.bounties add constraint bounties_two_stage_check check((bounty_type='idea' and parent_bounty_id is null) or (bounty_type='build' and parent_bounty_id is not null and selected_idea_id is not null));
alter table public.bounties add constraint bounties_amount_sum_check check(total_amount_raw = prize_amount_raw + fee_amount_raw);
alter table public.bounties add constraint bounties_terms_hash_check check(status='draft' or terms_hash is not null);
create index bounties_status_deadline_idx on public.bounties(status,deadline_at);
create unique index bounties_one_build_child_uidx on public.bounties(parent_bounty_id) where bounty_type='build';

alter table public.bounty_escrows add column cluster text not null default 'devnet';
alter table public.bounty_escrows add column program_id text;
alter table public.bounty_escrows add column escrow_version integer;
alter table public.bounty_escrows add column mint_address text;
alter table public.bounty_escrows add column authority_address text;
alter table public.bounty_escrows add column expected_amount_raw numeric(40,0) not null default 0;
alter table public.bounty_escrows add column last_observed_slot numeric(40,0);
alter table public.bounty_escrows add column last_reconciled_at timestamptz;
alter table public.bounty_escrows add column reconciliation_error text;
alter table public.bounty_escrows add column terms_hash text;
update public.bounty_escrows set status='chain_unverified', funded_amount_raw=0, confirmed_at=null where status like 'mock%';
alter table public.bounty_escrows add constraint bounty_escrows_status_check check(status in ('not_created','creating','awaiting_funding','funding_pending','funded','paying','paid','refunding','refunded','disputed','chain_unverified','error'));

create table public.bounty_participants (
  bounty_id uuid not null references public.bounties(id) on delete cascade, user_id uuid not null references public.users(id),
  role text not null check(role in ('creator','judge','builder','observer')), accepted_terms_hash text,
  joined_at timestamptz not null default now(), primary key(bounty_id,user_id,role)
);
create table public.funding_intents (
  id uuid primary key default gen_random_uuid(), bounty_id uuid not null references public.bounties(id),
  idempotency_key text not null, status text not null default 'created' check(status in ('created','submitted','confirmed','failed','expired')),
  expected_amount_raw numeric(40,0) not null check(expected_amount_raw > 0), mint_address text not null,
  funder_address text not null, transaction_signature text, last_error text, expires_at timestamptz,
  created_by uuid not null references public.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(created_by,idempotency_key), unique(transaction_signature)
);

alter table public.submissions drop constraint if exists submissions_check;
alter table public.submissions add column submission_kind text;
update public.submissions set submission_kind=case when project_id is null then 'idea' else 'project' end where submission_kind is null;
alter table public.submissions alter column submission_kind set not null;
alter table public.submissions add column visibility text not null default 'private_owner_judges';
alter table public.submissions add column idea_payload jsonb;
alter table public.submissions add column current_version integer not null default 1;
alter table public.submissions add column submitted_at timestamptz;
alter table public.submissions add column shortlisted_at timestamptz;
alter table public.submissions add column selected_at timestamptz;
alter table public.submissions add column withdrawn_at timestamptz;
alter table public.submissions add column payout_wallet_address text;
alter table public.submissions add column payout_wallet_verified_at timestamptz;
alter table public.submissions add column team_payout_acknowledged_at timestamptz;
update public.submissions set submitted_at=created_at where status='submitted';
alter table public.submissions add constraint submissions_kind_check check(submission_kind in ('idea','project'));
alter table public.submissions add constraint submissions_private_check check(visibility='private_owner_judges');
alter table public.submissions add constraint submissions_payload_check check(
  (submission_kind='idea' and (idea_payload is not null or idea_id is not null)) or
  (submission_kind='project' and project_id is not null)
);
alter table public.submissions add constraint submissions_status_check check(status in ('draft','submitted','shortlisted','selected','not_selected','withdrawn'));
create index submissions_private_access_idx on public.submissions(bounty_id,submitted_by,status);
create table public.submission_versions (
  id uuid primary key default gen_random_uuid(), submission_id uuid not null references public.submissions(id) on delete cascade,
  version integer not null check(version > 0), snapshot jsonb not null, content_hash text not null,
  created_by uuid not null references public.users(id), created_at timestamptz not null default now(),
  unique(submission_id,version)
);
create table public.submission_attachments (
  id uuid primary key default gen_random_uuid(), submission_id uuid not null references public.submissions(id) on delete cascade,
  media_asset_id uuid, label text, created_at timestamptz not null default now()
);

alter table public.bounty_reviews add column submission_id uuid references public.submissions(id);
update public.bounty_reviews r set submission_id=(select s.id from public.submissions s where s.bounty_id=r.bounty_id order by s.created_at limit 1) where submission_id is null;
do $$ begin
  if exists(select 1 from public.bounty_reviews where submission_id is null) then
    raise exception 'Cannot migrate bounty review without a target submission';
  end if;
end $$;
alter table public.bounty_reviews alter column submission_id set not null;
create unique index bounty_reviews_reviewer_submission_uidx on public.bounty_reviews(reviewer_id,submission_id) where reviewer_id is not null;
create unique index bounty_winners_one_per_bounty_uidx on public.bounty_winners(bounty_id);
alter table public.bounty_winners add column terms_hash text;
alter table public.bounty_winners add column selected_by uuid references public.users(id);
alter table public.bounty_winners add column selected_at timestamptz;
alter table public.payout_intents add column idempotency_key text;
update public.payout_intents set idempotency_key=id::text where idempotency_key is null;
alter table public.payout_intents alter column idempotency_key set not null;
alter table public.payout_intents add column last_error text;
alter table public.payout_intents add column submitted_at timestamptz;
alter table public.payout_intents add constraint payout_intents_idempotency_key_key unique(idempotency_key);
alter table public.payout_intents add constraint payout_intents_status_check check(status in ('pending','submitted','confirmed','failed','manual_review'));

alter table public.blockchain_events add column event_index integer not null default 0;
alter table public.blockchain_events add column program_id text;
alter table public.blockchain_events add column account_address text;
alter table public.blockchain_events add column commitment text;
alter table public.blockchain_events add column observed_at timestamptz not null default now();
alter table public.blockchain_events add column processed_at timestamptz;
alter table public.blockchain_events add column processing_error text;
alter table public.blockchain_events drop constraint if exists blockchain_events_signature_event_type_key;
alter table public.blockchain_events drop constraint if exists blockchain_events_signature_type_uidx;
create unique index blockchain_events_signature_index_uidx on public.blockchain_events(chain,signature,event_index);
create index blockchain_events_slot_idx on public.blockchain_events(chain,slot);
create table public.chain_cursors (
  consumer text not null, chain text not null default 'solana', program_id text not null,
  last_finalized_slot numeric(40,0) not null default 0, last_signature text, updated_at timestamptz not null default now(),
  primary key(consumer,chain,program_id)
);
create table public.escrow_reconciliations (
  id uuid primary key default gen_random_uuid(), bounty_escrow_id uuid not null references public.bounty_escrows(id) on delete cascade,
  observed_slot numeric(40,0), db_state jsonb not null, chain_state jsonb, result text not null check(result in ('match','corrected','missing','error')),
  error text, created_at timestamptz not null default now()
);
create table public.bounty_resolutions (
  id uuid primary key default gen_random_uuid(), bounty_id uuid not null references public.bounties(id),
  resolution_type text not null check(resolution_type in ('cancel','refund','dispute','manual_review')),
  status text not null check(status in ('requested','approved','submitted','confirmed','rejected')),
  reason text not null, requested_by uuid not null references public.users(id), transaction_signature text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.withdrawal_intents (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id),
  idempotency_key text not null, amount_raw numeric(40,0) not null check(amount_raw>0), mint_address text not null,
  source_address text not null, destination_address text not null,
  status text not null default 'created' check(status in ('created','submitted','confirmed','failed','manual_review')),
  transaction_signature text unique, last_error text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(user_id,idempotency_key)
);

-- Evolve, do not fork, the social model.
alter table public.discussions rename to posts;
alter table public.posts rename constraint discussions_pkey to posts_pkey;
alter index public.discussions_entity_idx rename to posts_entity_idx;
alter table public.posts add column post_type text not null default 'discussion';
alter table public.posts add column visibility text not null default 'public';
alter table public.posts add column quoted_post_id uuid references public.posts(id);
alter table public.posts add column quoted_entity_type text;
alter table public.posts add column quoted_entity_id uuid;
alter table public.posts add column quoted_snapshot jsonb;
alter table public.posts add constraint posts_type_check check(post_type in ('discussion','quote','update'));
alter table public.posts add constraint posts_visibility_check check(visibility in ('public','organization','private'));
alter table public.posts add constraint posts_quote_snapshot_check check(post_type <> 'quote' or quoted_snapshot is not null);
alter table public.discussion_replies rename to post_replies;
alter table public.post_replies rename column discussion_id to post_id;
alter table public.post_replies rename constraint discussion_replies_pkey to post_replies_pkey;
alter table public.post_replies rename constraint discussion_replies_discussion_id_fkey to post_replies_post_id_fkey;
alter table public.post_replies add column visibility text not null default 'public';

create table public.media_assets (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.users(id),
  bucket text not null, object_key text not null, visibility text not null check(visibility in ('public','private')),
  content_type text not null, size_bytes bigint not null check(size_bytes >= 0), sha256 text,
  status text not null default 'pending' check(status in ('pending','uploaded','quarantined','deleted')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(bucket,object_key)
);
create table public.upload_intents (
  id uuid primary key default gen_random_uuid(), media_asset_id uuid not null references public.media_assets(id),
  token_hash text not null unique, expires_at timestamptz not null, completed_at timestamptz, created_at timestamptz not null default now()
);
create table public.entity_media_assets (
  entity_type text not null check(entity_type in ('problem','idea','project','post','submission')),
  entity_id uuid not null, media_asset_id uuid not null references public.media_assets(id) on delete cascade,
  position integer not null default 0, created_at timestamptz not null default now(),
  primary key(entity_type,entity_id,media_asset_id)
);
do $$ begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
      ('public-media','public-media',true,5242880,array['image/png','image/jpeg','image/webp','image/gif']),
      ('private-submissions','private-submissions',false,26214400,array['image/png','image/jpeg','image/webp','application/pdf','video/mp4','video/webm'])
    on conflict(id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
  end if;
end $$;
alter table public.submission_attachments add constraint submission_attachments_media_asset_fkey foreign key(media_asset_id) references public.media_assets(id);

alter table public.research_runs add column entity_version integer not null default 1;
alter table public.research_runs add column pipeline_version text not null default 'v1';
alter table public.research_runs add column prompt_hash text;
alter table public.research_runs add column requested_by uuid references public.users(id);
alter table public.research_runs add column visibility_scope text not null default 'public';
alter table public.research_runs add column attempt integer not null default 1;
alter table public.research_runs add column error_code text;
create unique index research_runs_entity_version_pipeline_uidx on public.research_runs(entity_type,entity_id,entity_version,pipeline_version) where status in ('queued','running','completed');
alter table public.verification_results add column verifier_run_id uuid references public.research_runs(id);
alter table public.verification_results add column evidence_coverage numeric(4,3) check(evidence_coverage between 0 and 1);

alter table public.import_sources add column adapter_version text not null default 'v1';
alter table public.import_sources add column enabled boolean not null default false;
alter table public.import_sources add column cursor jsonb not null default '{}'::jsonb;
alter table public.import_sources add column last_synced_at timestamptz;
alter table public.import_sources add column last_error text;
create unique index import_sources_name_uidx on public.import_sources(name);
alter table public.imported_entities add column source_updated_at timestamptz;
alter table public.imported_entities add column payload_hash text;
alter table public.imported_entities add column normalized_payload jsonb;
alter table public.imported_entities add column import_status text not null default 'stored';
alter table public.imported_entities add column updated_at timestamptz not null default now();
create table public.problem_signals (
  id uuid primary key default gen_random_uuid(), problem_id uuid not null references public.problems(id) on delete cascade,
  signal_type text not null, strength numeric(4,3) check(strength between 0 and 1), statement text not null,
  source_url text, observed_at timestamptz, provenance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create table public.problem_project_links (
  problem_id uuid not null references public.problems(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  relationship_type text not null check(relationship_type in ('addresses','attempted','adjacent','contradicts')),
  confidence numeric(4,3) check(confidence between 0 and 1), evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), primary key(problem_id,project_id,relationship_type)
);

create table public.idempotency_keys (
  scope text not null, actor_id uuid not null references public.users(id), key text not null,
  request_hash text not null, response_status integer, response_body jsonb, locked_at timestamptz not null default now(), expires_at timestamptz not null,
  primary key(scope,actor_id,key)
);
create table public.wallet_link_nonces (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id), wallet_address text not null,
  nonce_hash text not null unique, expires_at timestamptz not null, consumed_at timestamptz, created_at timestamptz not null default now()
);
alter table public.notifications add column delivery_status text not null default 'pending';
alter table public.notifications add column dedupe_key text;
create unique index notifications_dedupe_uidx on public.notifications(user_id,dedupe_key) where dedupe_key is not null;
alter table public.audit_logs add column ip_hash text;
alter table public.audit_logs add column user_agent text;
alter table public.audit_logs add column correlation_id text;

alter table public.ideas add constraint ideas_source_submission_fkey foreign key(source_submission_id) references public.submissions(id);
alter table public.projects add constraint projects_originating_bounty_fkey foreign key(originating_bounty_id) references public.bounties(id);
alter table public.projects add constraint projects_source_submission_fkey foreign key(source_submission_id) references public.submissions(id);

-- Private tables have no anon policies. The API connects as the database owner/service
-- and applies the same access checks in every repository method.
alter table public.projects enable row level security;
alter table public.bounties enable row level security;
alter table public.bounty_participants enable row level security;
alter table public.submissions enable row level security;
alter table public.submission_versions enable row level security;
alter table public.submission_attachments enable row level security;
alter table public.bounty_reviews enable row level security;
alter table public.bounty_review_scores enable row level security;
alter table public.posts enable row level security;
alter table public.post_replies enable row level security;
alter table public.media_assets enable row level security;
alter table public.entity_media_assets enable row level security;
alter table public.research_runs enable row level security;
alter table public.research_claims enable row level security;
alter table public.research_sources enable row level security;
alter table public.notifications enable row level security;
alter table public.withdrawal_intents enable row level security;

create policy "public projects" on public.projects for select using(visibility='public' and deleted_at is null);
create policy "public active bounties" on public.bounties for select using(status not in ('draft','cancelled') and submission_visibility='private');
create policy "public posts" on public.posts for select using(visibility='public' and deleted_at is null);
create policy "public post replies" on public.post_replies for select using(visibility='public' and deleted_at is null);

create trigger organization_wallets_updated_at before update on public.organization_wallets for each row execute function public.set_updated_at();
create trigger funding_intents_updated_at before update on public.funding_intents for each row execute function public.set_updated_at();
create trigger media_assets_updated_at before update on public.media_assets for each row execute function public.set_updated_at();
create trigger resolutions_updated_at before update on public.bounty_resolutions for each row execute function public.set_updated_at();

commit;
