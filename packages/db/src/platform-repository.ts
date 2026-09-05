/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-base-to-string -- pg returns dynamic rows at this repository boundary; API serializers and Zod contracts constrain outward data. */
import pg from 'pg';
import type { AuthIdentity } from '@gimme-idea/auth';
import type {
  CreateBountyInput,
  CreateIdeaInput,
  CreateProblemInput,
  CreateSubmissionInput,
} from '@gimme-idea/contracts';

export type PlatformActor = {
  id: string;
  provider: 'privy' | 'dev';
  subject: string;
  username: string | null;
  displayName: string | null;
};

function slugBase(title: string) {
  return (
    title
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 72) || 'entry'
  );
}

async function transaction<T>(
  pool: pg.Pool,
  run: (client: pg.PoolClient) => Promise<T>,
  isolation = 'read committed',
) {
  const client = await pool.connect();
  try {
    await client.query(`begin isolation level ${isolation}`);
    const result = await run(client);
    await client.query('commit');
    return result;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

export interface PlatformRepository {
  syncActor(
    identity: AuthIdentity,
    profile?: {
      username?: string;
      displayName?: string;
      avatarUrl?: string | null;
      rewardWalletAddress?: string;
    },
  ): Promise<PlatformActor>;
  listCatalog(
    kind: 'problems' | 'ideas' | 'projects' | 'bounties' | 'organizations',
    limit: number,
    offset: number,
  ): Promise<unknown[]>;
  searchPublic(query: string, limit: number): Promise<unknown[]>;
  home(): Promise<unknown[]>;
  findProject(slug: string, actorId?: string): Promise<unknown | null>;
  findBounty(slug: string, actorId?: string): Promise<unknown | null>;
  findOrganization(slug: string): Promise<unknown | null>;
  createProblem(actorId: string, input: CreateProblemInput): Promise<unknown>;
  createIdea(actorId: string, input: CreateIdeaInput): Promise<unknown>;
  publishEntity(actorId: string, kind: 'problems' | 'ideas', id: string): Promise<void>;
  createBounty(
    actorId: string,
    bountyId: string,
    input: CreateBountyInput,
    terms: Record<string, unknown>,
    termsHash: string,
  ): Promise<unknown>;
  createFundingIntent(
    actorId: string,
    bountyId: string,
    funderAddress: string,
    idempotencyKey: string,
    escrowAddress: string,
  ): Promise<unknown>;
  submitFundingIntent(
    actorId: string,
    intentId: string,
    signature: string,
  ): Promise<{ bountyId: string }>;
  acceptBountyTerms(actorId: string, bountyId: string, termsHash: string): Promise<void>;
  createPrivateBountyProject(
    actorId: string,
    bountyId: string,
    input: { name: string; summary: string; description: string },
  ): Promise<unknown>;
  createSubmission(
    actorId: string,
    bountyId: string,
    input: CreateSubmissionInput,
  ): Promise<unknown>;
  listSubmissions(actorId: string, bountyId: string): Promise<unknown[]>;
  findSubmission(actorId: string, submissionId: string): Promise<unknown | null>;
  scoreSubmission(
    actorId: string,
    submissionId: string,
    scores: Array<{ criterionId: string; score: number; note?: string }>,
  ): Promise<void>;
  selectWinner(
    actorId: string,
    bountyId: string,
    submissionId: string,
    recipientAddress: string,
    idempotencyKey: string,
  ): Promise<unknown>;
  createPost(
    actorId: string,
    input: {
      entityType: string;
      entityId: string;
      title: string;
      body: string;
      quotedPostId?: string | null;
    },
  ): Promise<unknown>;
  listPosts(entityType: string, entityId: string): Promise<unknown[]>;
  findPost(postId: string): Promise<unknown | null>;
  createReply(
    actorId: string,
    postId: string,
    input: { body: string; parentReplyId?: string | null },
  ): Promise<unknown>;
  createMediaAsset(
    actorId: string,
    input: {
      filename: string;
      contentType: string;
      sizeBytes: number;
      visibility: 'public' | 'private';
    },
  ): Promise<{ id: string; bucket: string; objectKey: string }>;
  getMediaAsset(
    actorId: string,
    id: string,
  ): Promise<{ id: string; bucket: string; objectKey: string; status: string } | null>;
  getMediaAssetForView(
    actorId: string,
    id: string,
  ): Promise<{
    id: string;
    bucket: string;
    objectKey: string;
    status: string;
    visibility: string;
  } | null>;
  completeMediaAsset(actorId: string, id: string): Promise<void>;
  attachMediaAsset(
    actorId: string,
    id: string,
    entityType: 'problem' | 'idea' | 'project' | 'post' | 'submission',
    entityId: string,
    position: number,
  ): Promise<void>;
  queueResearch(
    actorId: string,
    entityType: string,
    entityId: string,
    entityVersion: number,
  ): Promise<{ id: string; created: boolean }>;
  listNotifications(actorId: string, limit: number): Promise<unknown[]>;
  markNotificationRead(actorId: string, notificationId: string): Promise<boolean>;
  createModerationFlag(
    actorId: string,
    input: { entityType: string; entityId: string; reason: string },
  ): Promise<unknown>;
  createResolution(
    actorId: string,
    bountyId: string,
    input: { type: 'cancel' | 'refund' | 'dispute' | 'manual_review'; reason: string },
  ): Promise<unknown>;
  createWithdrawal(
    actorId: string,
    input: {
      amountRaw: string;
      mintAddress: string;
      sourceAddress: string;
      destinationAddress: string;
      idempotencyKey: string;
    },
  ): Promise<unknown>;
  createWalletLinkIntent(
    actorId: string,
    walletAddress: string,
    nonceHash: string,
  ): Promise<string>;
  consumeWalletLinkIntent(actorId: string, walletAddress: string, nonceHash: string): Promise<void>;
  recordChainEvent(input: {
    signature: string;
    eventIndex: number;
    eventType: string;
    slot: string | null;
    programId: string;
    accountAddress?: string;
    commitment: string;
    payload: unknown;
  }): Promise<boolean>;
  reconcileEscrow(
    bountyId: string,
    observed: {
      slot: string;
      address: string;
      bountyIdHex: string;
      state: string;
      termsHash: string;
      mint: string;
      prizeAmountRaw: string;
      feeAmountRaw: string;
      totalDepositedRaw: string;
      winner: string | null;
    },
  ): Promise<'match' | 'corrected' | 'mismatch'>;
  close(): Promise<void>;
}

export function createPlatformRepository(connectionString: string): PlatformRepository {
  const pool = new pg.Pool({
    connectionString,
    max: 12,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });
  const visibleProject = `(p.visibility='public' or p.created_by=$2 or exists(select 1 from public.bounty_participants bp where bp.bounty_id=p.originating_bounty_id and bp.user_id=$2))`;
  return {
    async syncActor(identity, profile = {}) {
      return transaction(pool, async (client) => {
        const user = await client.query<PlatformActor>(
          `insert into public.users(auth_provider,auth_subject,username,display_name,avatar_url,profile_source)
           values($1,$2,$3,$4,$5,'provider_sync')
           on conflict(auth_provider,auth_subject) do update set
             username=coalesce(excluded.username,users.username), display_name=coalesce(excluded.display_name,users.display_name),
             avatar_url=coalesce(excluded.avatar_url,users.avatar_url), updated_at=now()
           returning id,auth_provider provider,auth_subject subject,username,display_name "displayName"`,
          [
            identity.provider,
            identity.subject,
            profile.username ?? null,
            profile.displayName ?? null,
            profile.avatarUrl ?? null,
          ],
        );
        const actor = user.rows[0]!;
        if (profile.rewardWalletAddress) {
          await client.query(
            `insert into public.user_wallets(user_id,chain,address,wallet_kind,provider,is_primary,is_reward_wallet,verified_at,verification_method)
             values($1,'solana',$2,'embedded',$3,true,true,now(),'provider_attested')
             on conflict(chain,address) do update set user_id=excluded.user_id,provider=excluded.provider,is_primary=true,is_reward_wallet=true,verified_at=now(),updated_at=now()`,
            [actor.id, profile.rewardWalletAddress, identity.provider],
          );
        }
        return actor;
      });
    },
    async listCatalog(kind, limit, offset) {
      const queries = {
        problems: `select id,slug,title,summary,industry,region,severity,research_status "researchStatus",origin,created_at "createdAt" from public.problems where status='published' and visibility='public' and deleted_at is null order by created_at desc limit $1 offset $2`,
        ideas: `select id,slug,title,summary,research_status "researchStatus",origin,created_at "createdAt" from public.ideas where status='published' and visibility='public' and deleted_at is null order by created_at desc limit $1 offset $2`,
        projects: `select p.id,p.slug,p.name,p.summary,p.stage,p.origin_type "originType",p.visibility,p.repository_url "repositoryUrl",p.demo_url "demoUrl",p.created_at "createdAt", jsonb_build_object('slug',pr.slug,'title',pr.title,'summary',pr.summary,'industry',pr.industry,'region',pr.region) problem from public.projects p left join public.idea_problem_links l on l.idea_id=p.idea_id and l.relationship_type='primary' left join public.problems pr on pr.id=l.problem_id where p.visibility='public' and p.deleted_at is null order by p.created_at desc limit $1 offset $2`,
        bounties: `select b.id,b.slug,b.bounty_type "type",b.title,b.description,b.objective,b.status,b.total_amount_raw::text "totalAmountRaw",b.prize_amount_raw::text "prizeAmountRaw",b.fee_amount_raw::text "feeAmountRaw",b.deadline_at "deadlineAt",b.judging_deadline_at "judgingDeadlineAt",b.terms_hash "termsHash",e.status "escrowStatus",e.escrow_address "escrowAddress",o.slug "organizationSlug",o.name "organizationName",p.slug "problemSlug",p.title "problemTitle" from public.bounties b join public.problems p on p.id=b.problem_id join public.organizations o on o.id=b.organization_id left join public.bounty_escrows e on e.bounty_id=b.id where b.status not in ('draft','cancelled') order by b.created_at desc limit $1 offset $2`,
        organizations: `select id,slug,name,coalesce(one_line_description,description,'') description,organization_type "organizationType",verification_status "verificationStatus" from public.organizations where deleted_at is null order by created_at desc limit $1 offset $2`,
      } as const;
      return (await pool.query(queries[kind], [limit, offset])).rows;
    },
    async searchPublic(query, limit) {
      const result = await pool.query(
        `select * from (
          select 'problem' type,slug,title,summary,created_at from public.problems where status='published' and visibility='public' and deleted_at is null
          union all select 'idea',slug,title,summary,created_at from public.ideas where status='published' and visibility='public' and deleted_at is null
          union all select 'project',slug,name,summary,created_at from public.projects where visibility='public' and deleted_at is null
          union all select 'bounty',slug,title,description,created_at from public.bounties where status not in ('draft','cancelled')
          union all select 'organization',slug,name,coalesce(one_line_description,description,''),created_at from public.organizations where deleted_at is null
        ) catalog where ($1='' or to_tsvector('simple',title||' '||summary) @@ websearch_to_tsquery('simple',$1))
        order by created_at desc limit $2`,
        [query, limit],
      );
      return result.rows;
    },
    async home() {
      return (
        await pool.query(`with feed as (
        select 'bounty' type,b.id,b.slug,b.title,b.description summary,b.created_at,100 priority from public.bounties b where b.status='open'
        union all select 'problem',p.id,p.slug,p.title,p.summary,p.created_at,70 from public.problems p where p.status='published' and p.visibility='public' and p.deleted_at is null
        union all select 'update',x.id,x.id::text,x.title,x.body,x.created_at,60 from public.posts x where x.visibility='public' and x.deleted_at is null
        union all select 'project',j.id,j.slug,j.name,j.summary,j.created_at,50 from public.projects j where j.visibility='public' and j.deleted_at is null
      ), ranked as (
        select feed.*,row_number() over(partition by type order by created_at desc) type_rank from feed
      ) select type,id,slug,title,summary,created_at,priority from ranked where type_rank<=10 order by priority desc,created_at desc limit 30`)
      ).rows;
    },
    async findProject(slug, actorId) {
      const result = await pool.query(
        `select p.* from public.projects p where p.slug=$1 and p.deleted_at is null and ${visibleProject} limit 1`,
        [slug, actorId ?? null],
      );
      return result.rows[0] ?? null;
    },
    async findBounty(slug, actorId) {
      const result = await pool.query(
        `select b.*,b.total_amount_raw::text,b.prize_amount_raw::text,b.fee_amount_raw::text,
         jsonb_build_object('slug',p.slug,'title',p.title,'summary',p.summary,'industry',p.industry,'region',p.region) problem,
         jsonb_build_object('slug',o.slug,'name',o.name,'description',coalesce(o.one_line_description,o.description,'')) organization,
         case when b.selected_idea_id is null then null when exists(select 1 from public.bounty_participants bp where bp.bounty_id=b.id and bp.user_id=$2) or exists(select 1 from public.organization_members om where om.organization_id=b.organization_id and om.user_id=$2) then (select to_jsonb(i) - 'created_by' from public.ideas i where i.id=b.selected_idea_id) else jsonb_build_object('id',b.selected_idea_id,'visibility','restricted_summary') end selected_idea,
         (select count(*)::int from public.submissions s where s.bounty_id=b.id and s.status<>'draft') submission_count,
         (select jsonb_build_object('status',e.status,'address',e.escrow_address,'cluster',e.cluster,'lastObservedSlot',e.last_observed_slot::text,'lastReconciledAt',e.last_reconciled_at,'error',e.reconciliation_error) from public.bounty_escrows e where e.bounty_id=b.id) escrow
         from public.bounties b join public.problems p on p.id=b.problem_id join public.organizations o on o.id=b.organization_id where b.slug=$1 limit 1`,
        [slug, actorId ?? null],
      );
      return result.rows[0] ?? null;
    },
    async findOrganization(slug) {
      return (
        (
          await pool.query(
            `select id,slug,name,organization_type "organizationType",one_line_description "oneLineDescription",description,logo_url "logoUrl",website_url "websiteUrl",location,industry,verification_status "verificationStatus" from public.organizations where slug=$1 and deleted_at is null`,
            [slug],
          )
        ).rows[0] ?? null
      );
    },
    async createProblem(actorId, input) {
      const slug = `${slugBase(input.title)}-${crypto.randomUUID().slice(0, 8)}`;
      return (
        await pool.query(
          `insert into public.problems(slug,title,summary,description,industry,region,affected_groups,evidence,desired_outcome,constraints,success_metrics,visibility,organization_id,created_by,status,research_status,origin,reviewed_by_human) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'draft','unresearched','human',true) returning *`,
          [
            slug,
            input.title,
            input.summary,
            input.description,
            input.industry ?? null,
            input.region ?? null,
            input.affectedGroups,
            input.evidence,
            input.desiredOutcome ?? null,
            input.constraints,
            input.successMetrics,
            input.visibility,
            input.organizationId ?? null,
            actorId,
          ],
        )
      ).rows[0];
    },
    async createIdea(actorId, input) {
      return transaction(pool, async (client) => {
        const slug = `${slugBase(input.title)}-${crypto.randomUUID().slice(0, 8)}`;
        const idea = (
          await client.query(
            `insert into public.ideas(slug,title,summary,thesis,solution,opportunity,why_now,target_users,risks,validation_plan,visibility,created_by,status,research_status,origin,reviewed_by_human) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'draft','unresearched','human',true) returning *`,
            [
              slug,
              input.title,
              input.summary,
              input.thesis,
              input.solution,
              input.opportunity ?? null,
              input.whyNow ?? null,
              input.targetUsers,
              input.risks,
              input.validationPlan ?? null,
              input.visibility,
              actorId,
            ],
          )
        ).rows[0];
        await client.query(
          `insert into public.idea_problem_links(idea_id,problem_id,relationship_type) values($1,$2,'primary')`,
          [idea.id, input.problemId],
        );
        return idea;
      });
    },
    async publishEntity(actorId, kind, id) {
      const result = await pool.query(
        `update public.${kind} set status='published',content_version=content_version+1,updated_at=now() where id=$1 and created_by=$2 and deleted_at is null`,
        [id, actorId],
      );
      if (!result.rowCount)
        throw Object.assign(new Error('Entity not found or not owned by actor.'), {
          statusCode: 404,
          code: 'NOT_FOUND',
        });
    },
    async createBounty(actorId, bountyId, input, terms, termsHash) {
      return transaction(pool, async (client) => {
        const member = await client.query(
          `select 1 from public.organization_members where organization_id=$1 and user_id=$2 and permission_level in ('owner','admin')`,
          [input.organizationId, actorId],
        );
        if (!member.rowCount)
          throw Object.assign(new Error('Organization owner or admin role is required.'), {
            statusCode: 403,
            code: 'FORBIDDEN',
          });
        const problem = await client.query(
          `select id from public.problems where id=$1 and deleted_at is null and (organization_id is null or organization_id=$2)`,
          [input.problemId, input.organizationId],
        );
        if (!problem.rowCount)
          throw Object.assign(new Error('The Problem is unavailable for this Organization.'), {
            statusCode: 409,
            code: 'BOUNTY_REQUIRES_PROBLEM',
          });
        if (
          BigInt(input.prizeAmountRaw) <= 0n ||
          new Date(input.deadlineAt) <= new Date() ||
          new Date(input.judgingDeadlineAt) <= new Date(input.deadlineAt)
        )
          throw Object.assign(new Error('Bounty prize and deadline sequence are invalid.'), {
            statusCode: 400,
            code: 'INVALID_BOUNTY_TERMS',
          });
        if (input.type === 'build') {
          const parent = await client.query(
            `select b.problem_id,b.selected_idea_id,e.status escrow_status from public.bounties b join public.bounty_escrows e on e.bounty_id=b.id where b.id=$1 and b.bounty_type='idea' and b.status='completed' and e.status='paid'`,
            [input.parentBountyId],
          );
          if (
            !parent.rowCount ||
            parent.rows[0].problem_id !== input.problemId ||
            parent.rows[0].selected_idea_id !== input.selectedIdeaId
          )
            throw Object.assign(
              new Error(
                'Build Bounty requires a settled parent Idea Bounty and its selected Idea.',
              ),
              { statusCode: 409, code: 'IDEA_BOUNTY_NOT_SETTLED' },
            );
        }
        const total = (BigInt(input.prizeAmountRaw) + BigInt(input.feeAmountRaw)).toString();
        const bounty = (
          await client.query(
            `insert into public.bounties(id,slug,bounty_type,problem_id,organization_id,parent_bounty_id,selected_idea_id,title,description,objective,status,currency,total_amount_raw,prize_amount_raw,fee_amount_raw,deadline_at,judging_deadline_at,requirements,constraints,eligibility,ip_terms,submission_visibility,terms_payload,terms_hash,created_by) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'awaiting_funding','USDC',$11,$12,$13,$14,$15,$16,$17,$18,$19,'private',$20,$21,$22) returning *`,
            [
              bountyId,
              input.slug,
              input.type,
              input.problemId,
              input.organizationId,
              input.parentBountyId,
              input.selectedIdeaId,
              input.title,
              input.description,
              input.objective,
              total,
              input.prizeAmountRaw,
              input.feeAmountRaw,
              input.deadlineAt,
              input.judgingDeadlineAt,
              input.requirements,
              input.constraints,
              input.eligibility,
              input.ipTerms,
              terms,
              termsHash,
              actorId,
            ],
          )
        ).rows[0];
        await client.query(
          `insert into public.bounty_escrows(bounty_id,status,expected_amount_raw,mint_address,terms_hash) values($1,'not_created',$2,$3,$4)`,
          [bounty.id, total, input.mintAddress, termsHash],
        );
        await client.query(
          `insert into public.bounty_participants(bounty_id,user_id,role,accepted_terms_hash) values($1,$2,'creator',$3) on conflict do nothing`,
          [bounty.id, actorId, termsHash],
        );
        await client.query(
          `insert into public.audit_logs(actor_type,actor_id,action,entity_type,entity_id,after) values('user',$1,'bounty.created','bounty',$2,$3)`,
          [actorId, bounty.id, { termsHash, totalAmountRaw: total, status: 'awaiting_funding' }],
        );
        return bounty;
      });
    },
    async createFundingIntent(actorId, bountyId, funderAddress, idempotencyKey, escrowAddress) {
      return transaction(pool, async (client) => {
        const bounty = (
          await client.query(
            `select b.total_amount_raw::text,b.bounty_type,b.parent_bounty_id,e.mint_address from public.bounties b join public.bounty_escrows e on e.bounty_id=b.id where b.id=$1 and b.status in ('awaiting_funding','funding_pending') for update`,
            [bountyId],
          )
        ).rows[0];
        if (!bounty)
          throw Object.assign(new Error('Bounty cannot be funded in its current state.'), {
            statusCode: 409,
            code: 'INVALID_STATE',
          });
        if (bounty.bounty_type === 'build') {
          const parent = await client.query(
            `select 1 from public.bounties b join public.bounty_escrows e on e.bounty_id=b.id where b.id=$1 and b.status='completed' and e.status='paid'`,
            [bounty.parent_bounty_id],
          );
          if (!parent.rowCount)
            throw Object.assign(
              new Error('The parent Idea Bounty payout is not chain-confirmed.'),
              { statusCode: 409, code: 'IDEA_BOUNTY_NOT_SETTLED' },
            );
        }
        const result = await client.query(
          `insert into public.funding_intents(bounty_id,idempotency_key,expected_amount_raw,mint_address,funder_address,created_by,expires_at) values($1,$2,$3,$4,$5,$6,now()+interval '30 minutes') on conflict(created_by,idempotency_key) do update set updated_at=now() returning id,bounty_id "bountyId",status,expected_amount_raw::text "expectedAmountRaw",mint_address "mintAddress",funder_address "funderAddress",transaction_signature "transactionSignature",expires_at "expiresAt"`,
          [
            bountyId,
            idempotencyKey,
            bounty.total_amount_raw,
            bounty.mint_address,
            funderAddress,
            actorId,
          ],
        );
        await client.query(
          `update public.bounties set status='funding_pending',updated_at=now() where id=$1 and status='awaiting_funding'`,
          [bountyId],
        );
        await client.query(
          `update public.bounty_escrows set status='awaiting_funding',escrow_address=$2,updated_at=now() where bounty_id=$1 and status in ('not_created','awaiting_funding')`,
          [bountyId, escrowAddress],
        );
        await client.query(
          `insert into public.audit_logs(actor_type,actor_id,action,entity_type,entity_id,after) values('user',$1,'funding.intent_created','bounty',$2,$3)`,
          [actorId, bountyId, { idempotencyKey, escrowAddress }],
        );
        return result.rows[0];
      });
    },
    async submitFundingIntent(actorId, intentId, signature) {
      return transaction(pool, async (client) => {
        const intent = (
          await client.query(
            `update public.funding_intents set status='submitted',transaction_signature=$3,submitted_at=now(),updated_at=now() where id=$1 and created_by=$2 and status in ('created','submitted') and (transaction_signature is null or transaction_signature=$3) returning bounty_id "bountyId"`,
            [intentId, actorId, signature],
          )
        ).rows[0];
        if (!intent)
          throw Object.assign(
            new Error('Funding intent is unavailable or already used with another signature.'),
            { statusCode: 409, code: 'INVALID_STATE' },
          );
        await client.query(
          `update public.bounty_escrows set status='funding_pending',updated_at=now() where bounty_id=$1`,
          [intent.bountyId],
        );
        return intent;
      });
    },
    async acceptBountyTerms(actorId, bountyId, termsHash) {
      await transaction(pool, async (client) => {
        const bounty = (
          await client.query(
            `select bounty_type,status,terms_hash from public.bounties where id=$1 for share`,
            [bountyId],
          )
        ).rows[0];
        if (!bounty || bounty.bounty_type !== 'build' || bounty.status !== 'open')
          throw Object.assign(new Error('Build Bounty is not open for participation.'), {
            statusCode: 409,
            code: 'BOUNTY_NOT_OPEN',
          });
        if (bounty.terms_hash !== termsHash)
          throw Object.assign(new Error('Accepted terms do not match the current Bounty terms.'), {
            statusCode: 409,
            code: 'TERMS_HASH_MISMATCH',
          });
        await client.query(
          `insert into public.bounty_participants(bounty_id,user_id,role,accepted_terms_hash) values($1,$2,'builder',$3) on conflict(bounty_id,user_id,role) do update set accepted_terms_hash=excluded.accepted_terms_hash,joined_at=now()`,
          [bountyId, actorId, termsHash],
        );
        await client.query(
          `insert into public.audit_logs(actor_type,actor_id,action,entity_type,entity_id,after) values('user',$1,'bounty.terms_accepted','bounty',$2,$3)`,
          [actorId, bountyId, { termsHash }],
        );
      });
    },
    async createPrivateBountyProject(actorId, bountyId, input) {
      return transaction(pool, async (client) => {
        const bounty = (
          await client.query(
            `select selected_idea_id,terms_hash from public.bounties where id=$1 and bounty_type='build' and status='open'`,
            [bountyId],
          )
        ).rows[0];
        if (!bounty)
          throw Object.assign(new Error('Build Bounty is not open.'), {
            statusCode: 409,
            code: 'BOUNTY_NOT_OPEN',
          });
        const participant = await client.query(
          `select 1 from public.bounty_participants where bounty_id=$1 and user_id=$2 and role='builder' and accepted_terms_hash=$3`,
          [bountyId, actorId, bounty.terms_hash],
        );
        if (!participant.rowCount)
          throw Object.assign(
            new Error('Accept the exact current terms before creating a private Project.'),
            { statusCode: 403, code: 'TERMS_ACCEPTANCE_REQUIRED' },
          );
        const slug = `${slugBase(input.name)}-${crypto.randomUUID().slice(0, 8)}`;
        const project = (
          await client.query(
            `insert into public.projects(idea_id,slug,name,summary,description,stage,created_by,origin_type,visibility,originating_bounty_id) values($1,$2,$3,$4,$5,'building',$6,'community','private',$7) returning id,slug,name,summary,stage,visibility,originating_bounty_id "bountyId"`,
            [
              bounty.selected_idea_id,
              slug,
              input.name,
              input.summary,
              input.description,
              actorId,
              bountyId,
            ],
          )
        ).rows[0];
        await client.query(
          `insert into public.project_members(project_id,user_id,role) values($1,$2,'owner')`,
          [project.id, actorId],
        );
        return project;
      });
    },
    async createSubmission(actorId, bountyId, input) {
      return transaction(pool, async (client) => {
        const bounty = (
          await client.query(
            `select bounty_type,terms_hash from public.bounties where id=$1 and status='open' and deadline_at>now() for share`,
            [bountyId],
          )
        ).rows[0];
        if (!bounty || bounty.bounty_type !== input.kind)
          throw Object.assign(
            new Error('Bounty is closed or expects a different submission kind.'),
            { statusCode: 409, code: 'INVALID_STATE' },
          );
        const rewardWallet = (
          await client.query(
            `select address,verified_at from public.user_wallets where user_id=$1 and chain='solana' and is_reward_wallet and verified_at is not null`,
            [actorId],
          )
        ).rows[0];
        if (!rewardWallet)
          throw Object.assign(
            new Error('A verified reward wallet is required before submission.'),
            { statusCode: 409, code: 'PAYOUT_WALLET_REQUIRED' },
          );
        if (input.kind === 'project') {
          if (input.snapshot.payoutAcknowledged !== true)
            throw Object.assign(
              new Error('The project owner must acknowledge the single-recipient V1 payout.'),
              { statusCode: 400, code: 'TEAM_PAYOUT_ACK_REQUIRED' },
            );
          const project = await client.query(
            `select 1 from public.projects where id=$1 and created_by=$2 and originating_bounty_id=$3 and visibility in ('private','restricted') and deleted_at is null`,
            [input.projectId, actorId, bountyId],
          );
          if (!project.rowCount)
            throw Object.assign(
              new Error('Project does not belong to this builder and Build Bounty.'),
              { statusCode: 403, code: 'PRIVATE_PROJECT_INVALID' },
            );
        }
        const title =
          input.kind === 'idea'
            ? input.payload.title
            : String(input.snapshot.title ?? 'Project snapshot');
        const description =
          input.kind === 'idea'
            ? input.payload.summary
            : String(input.snapshot.summary ?? 'Project snapshot');
        const result = await client.query(
          `insert into public.submissions(bounty_id,project_id,submitted_by,title,description,status,submission_kind,visibility,idea_payload,submitted_at,locked_at,payout_wallet_address,payout_wallet_verified_at,team_payout_acknowledged_at) values($1,$2,$3,$4,$5,'submitted',$6,'private_owner_judges',$7,now(),now(),$8,$9,$10) returning id,bounty_id "bountyId",submission_kind kind,status,visibility,submitted_at "submittedAt"`,
          [
            bountyId,
            input.kind === 'project' ? input.projectId : null,
            actorId,
            title,
            description,
            input.kind,
            input.kind === 'idea' ? input.payload : null,
            rewardWallet.address,
            rewardWallet.verified_at,
            input.kind === 'project' ? new Date() : null,
          ],
        );
        const submission = result.rows[0];
        const snapshot = input.kind === 'idea' ? input.payload : input.snapshot;
        await client.query(
          `insert into public.submission_versions(submission_id,version,snapshot,content_hash,created_by) values($1,1,$2,encode(digest(convert_to($2::jsonb::text,'UTF8'),'sha256'),'hex'),$3)`,
          [submission.id, snapshot, actorId],
        );
        return submission;
      });
    },
    async listSubmissions(actorId, bountyId) {
      return (
        await pool.query(
          `select s.id,s.bounty_id "bountyId",s.submission_kind kind,s.title,s.description summary,s.status,s.visibility,s.submitted_at "submittedAt",s.current_version "currentVersion" from public.submissions s join public.bounties b on b.id=s.bounty_id where s.bounty_id=$2 and (s.submitted_by=$1 or exists(select 1 from public.bounty_participants bp where bp.bounty_id=s.bounty_id and bp.user_id=$1 and bp.role in ('creator','judge')) or exists(select 1 from public.organization_members om where om.organization_id=b.organization_id and om.user_id=$1 and om.permission_level in ('owner','admin','judge'))) order by s.created_at`,
          [actorId, bountyId],
        )
      ).rows;
    },
    async findSubmission(actorId, submissionId) {
      return (
        (
          await pool.query(
            `select s.*,v.snapshot from public.submissions s join public.bounties b on b.id=s.bounty_id join public.submission_versions v on v.submission_id=s.id and v.version=s.current_version where s.id=$2 and (s.submitted_by=$1 or exists(select 1 from public.bounty_participants bp where bp.bounty_id=s.bounty_id and bp.user_id=$1 and bp.role in ('creator','judge')) or exists(select 1 from public.organization_members om where om.organization_id=b.organization_id and om.user_id=$1 and om.permission_level in ('owner','admin','judge')))`,
            [actorId, submissionId],
          )
        ).rows[0] ?? null
      );
    },
    async scoreSubmission(actorId, submissionId, scores) {
      await transaction(pool, async (client) => {
        const access = await client.query(
          `select s.bounty_id from public.submissions s join public.bounties b on b.id=s.bounty_id where s.id=$1 and (exists(select 1 from public.bounty_participants bp where bp.bounty_id=s.bounty_id and bp.user_id=$2 and bp.role='judge') or exists(select 1 from public.organization_members om where om.organization_id=b.organization_id and om.user_id=$2 and om.permission_level in ('owner','admin','judge')))`,
          [submissionId, actorId],
        );
        const review = (
          await client.query(
            `insert into public.bounty_reviews(bounty_id,submission_id,reviewer_id,status) values($1,$2,$3,'completed') on conflict(reviewer_id,submission_id) where reviewer_id is not null do update set status='completed',updated_at=now() returning id`,
            [access.rows[0].bounty_id, submissionId, actorId],
          )
        ).rows[0];
        for (const score of scores)
          await client.query(
            `insert into public.bounty_review_scores(review_id,criterion_id,score,note) values($1,$2,$3,$4) on conflict(review_id,criterion_id) do update set score=excluded.score,note=excluded.note`,
            [review.id, score.criterionId, score.score, score.note ?? null],
          );
      });
    },
    async selectWinner(actorId, bountyId, submissionId, recipientAddress, idempotencyKey) {
      return transaction(
        pool,
        async (client) => {
          const bounty = (
            await client.query(
              `select b.*,b.prize_amount_raw::text from public.bounties b where id=$1 for update`,
              [bountyId],
            )
          ).rows[0];
          const existing = (
            await client.query(
              `select w.id "winnerId",case when w.submission_id=$2 then true else false end matches,p.id "payoutId",p.status,p.amount_raw::text "amountRaw",p.recipient_address "recipientAddress" from public.payout_intents p join public.bounty_winners w on w.id=p.bounty_winner_id where p.idempotency_key=$1`,
              [idempotencyKey, submissionId],
            )
          ).rows[0];
          if (existing) {
            if (!existing.matches)
              throw Object.assign(
                new Error('Idempotency key was used for another winner selection.'),
                { statusCode: 409, code: 'IDEMPOTENCY_CONFLICT' },
              );
            return {
              winnerId: existing.winnerId,
              promotedId: null,
              payout: {
                id: existing.payoutId,
                status: existing.status,
                amountRaw: existing.amountRaw,
                recipientAddress: existing.recipientAddress,
              },
            };
          }
          if (!bounty || !['closed', 'judging'].includes(bounty.status))
            throw Object.assign(new Error('Bounty is not in judging state.'), {
              statusCode: 409,
              code: 'INVALID_STATE',
            });
          const access = await client.query(
            `select 1 from public.organization_members where organization_id=$1 and user_id=$2 and permission_level in ('owner','admin','judge')`,
            [bounty.organization_id, actorId],
          );
          if (!access.rowCount)
            throw Object.assign(new Error('Judge access is required.'), {
              statusCode: 403,
              code: 'FORBIDDEN',
            });
          const submission = (
            await client.query(
              `select * from public.submissions where id=$1 and bounty_id=$2 and status in ('submitted','shortlisted') for update`,
              [submissionId, bountyId],
            )
          ).rows[0];
          if (!submission)
            throw Object.assign(new Error('Eligible submission not found.'), {
              statusCode: 404,
              code: 'NOT_FOUND',
            });
          if (
            !submission.payout_wallet_verified_at ||
            submission.payout_wallet_address !== recipientAddress
          )
            throw Object.assign(
              new Error(
                'Winner payout address must match the verified wallet snapshot locked at submission.',
              ),
              { statusCode: 409, code: 'PAYOUT_WALLET_REQUIRED' },
            );
          const winner = (
            await client.query(
              `insert into public.bounty_winners(bounty_id,submission_id,rank,amount_raw,terms_hash,selected_by,selected_at) values($1,$2,'winner',$3,$4,$5,now()) returning id`,
              [bountyId, submissionId, bounty.prize_amount_raw, bounty.terms_hash, actorId],
            )
          ).rows[0];
          await client.query(
            `update public.submissions set status=case when id=$2 then 'selected' else 'not_selected' end,selected_at=case when id=$2 then now() else null end,updated_at=now() where bounty_id=$1`,
            [bountyId, submissionId],
          );
          let promotedId: string;
          if (bounty.bounty_type === 'idea') {
            const payload = submission.idea_payload as Record<string, unknown>;
            const idea = (
              await client.query(
                `insert into public.ideas(slug,title,summary,thesis,solution,target_users,status,research_status,origin,reviewed_by_human,visibility,source_type,source_submission_id,created_by) values($1,$2,$3,$4,$5,'{}','draft','unresearched','human',true,'private','submission_winner',$6,$7) returning id`,
                [
                  `${slugBase(String(payload.title))}-${submissionId.slice(0, 8)}`,
                  payload.title,
                  payload.summary,
                  payload.why,
                  payload.solution,
                  submissionId,
                  submission.submitted_by,
                ],
              )
            ).rows[0];
            await client.query(
              `insert into public.idea_problem_links(idea_id,problem_id,relationship_type) values($1,$2,'primary')`,
              [idea.id, bounty.problem_id],
            );
            await client.query(
              `update public.bounties set selected_idea_id=$2,status='winner_pending_chain',updated_at=now() where id=$1`,
              [bountyId, idea.id],
            );
            promotedId = idea.id;
          } else {
            await client.query(
              `update public.projects set origin_type='build_winner',source_submission_id=$2,originating_bounty_id=$1,visibility='restricted',updated_at=now() where id=$3`,
              [bountyId, submissionId, submission.project_id],
            );
            await client.query(
              `update public.bounties set status='winner_pending_chain',updated_at=now() where id=$1`,
              [bountyId],
            );
            promotedId = submission.project_id;
          }
          const payout = (
            await client.query(
              `insert into public.payout_intents(bounty_winner_id,status,amount_raw,recipient_address,idempotency_key) values($1,'pending',$2,$3,$4) returning id,status,amount_raw::text "amountRaw",recipient_address "recipientAddress"`,
              [winner.id, bounty.prize_amount_raw, recipientAddress, idempotencyKey],
            )
          ).rows[0];
          await client.query(
            `insert into public.notifications(user_id,type,payload,dedupe_key) values($1,'bounty_winner',$2,$3) on conflict(user_id,dedupe_key) where dedupe_key is not null do nothing`,
            [
              submission.submitted_by,
              { bountyId, submissionId, winnerId: winner.id },
              `winner:${winner.id}`,
            ],
          );
          await client.query(
            `insert into public.audit_logs(actor_type,actor_id,action,entity_type,entity_id,after) values('user',$1,'bounty.winner_selected','bounty',$2,$3)`,
            [actorId, bountyId, { submissionId, winnerId: winner.id, payoutIntentId: payout.id }],
          );
          return { winnerId: winner.id, promotedId, payout };
        },
        'serializable',
      );
    },
    async createPost(actorId, input) {
      const publicTargets = {
        problem: `select 1 from public.problems where id=$1 and status='published' and visibility='public' and deleted_at is null`,
        idea: `select 1 from public.ideas where id=$1 and status='published' and visibility='public' and deleted_at is null`,
        project: `select 1 from public.projects where id=$1 and visibility='public' and deleted_at is null`,
        bounty: `select 1 from public.bounties where id=$1 and status not in ('draft','cancelled')`,
      } as const;
      if (
        !(
          await pool.query(publicTargets[input.entityType as keyof typeof publicTargets], [
            input.entityId,
          ])
        ).rowCount
      )
        throw Object.assign(new Error('Only an existing public entity may be discussed.'), {
          statusCode: 404,
          code: 'PUBLIC_ENTITY_NOT_FOUND',
        });
      let quotedSnapshot = null;
      if (input.quotedPostId) {
        quotedSnapshot = (
          await pool.query(
            `select jsonb_build_object('id',id,'title',title,'body',body,'createdAt',created_at) snapshot from public.posts where id=$1 and visibility='public' and deleted_at is null`,
            [input.quotedPostId],
          )
        ).rows[0]?.snapshot;
        if (!quotedSnapshot)
          throw Object.assign(new Error('Quoted post is unavailable.'), {
            statusCode: 404,
            code: 'NOT_FOUND',
          });
      }
      return (
        await pool.query(
          `insert into public.posts(entity_type,entity_id,title,body,created_by,post_type,visibility,quoted_post_id,quoted_snapshot) values($1,$2,$3,$4,$5,$6,'public',$7,$8) returning id,entity_type "entityType",entity_id "entityId",title,body,post_type "postType",created_at "createdAt"`,
          [
            input.entityType,
            input.entityId,
            input.title,
            input.body,
            actorId,
            input.quotedPostId ? 'quote' : 'discussion',
            input.quotedPostId ?? null,
            quotedSnapshot,
          ],
        )
      ).rows[0];
    },
    async listPosts(entityType, entityId) {
      return (
        await pool.query(
          `select p.id,p.entity_type "entityType",p.entity_id "entityId",p.title,p.body,p.post_type "postType",p.quoted_snapshot "quotedSnapshot",p.created_at "createdAt",u.username,u.display_name "displayName",u.avatar_url "avatarUrl" from public.posts p left join public.users u on u.id=p.created_by where p.entity_type=$1 and p.entity_id=$2 and p.visibility='public' and p.deleted_at is null order by p.created_at desc`,
          [entityType, entityId],
        )
      ).rows;
    },
    async findPost(postId) {
      if (
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(postId)
      )
        return null;
      const post = (
        await pool.query(
          `select p.id,p.entity_type "entityType",p.entity_id "entityId",p.title,p.body,p.post_type "postType",p.quoted_post_id "quotedPostId",p.quoted_snapshot "quotedSnapshot",p.created_at "createdAt",
          jsonb_build_object('username',coalesce(u.username,'guest'),'displayName',coalesce(u.display_name,'Guest'),'avatarUrl',u.avatar_url) actor,
          case p.entity_type
            when 'problem' then (select jsonb_build_object('kind','problem','slug',x.slug,'href','/problems/'||x.slug,'title',x.title,'summary',x.summary,'creatorName',coalesce(c.display_name,'Community'),'creatorUsername',c.username,'avatarUrl',c.avatar_url,'createdAt',x.created_at) from public.problems x left join public.users c on c.id=x.created_by where x.id=p.entity_id and x.status='published' and x.visibility='public' and x.deleted_at is null)
            when 'idea' then (select jsonb_build_object('kind','idea','slug',x.slug,'href','/ideas/'||x.slug,'title',x.title,'summary',x.summary,'creatorName',coalesce(c.display_name,'Community'),'creatorUsername',c.username,'avatarUrl',c.avatar_url,'createdAt',x.created_at) from public.ideas x left join public.users c on c.id=x.created_by where x.id=p.entity_id and x.status='published' and x.visibility='public' and x.deleted_at is null)
            when 'project' then (select jsonb_build_object('kind','project','slug',x.slug,'href','/projects/'||x.slug,'title',x.name,'summary',x.summary,'creatorName',coalesce(c.display_name,'Community'),'creatorUsername',c.username,'avatarUrl',c.avatar_url,'createdAt',x.created_at) from public.projects x left join public.users c on c.id=x.created_by where x.id=p.entity_id and x.visibility='public' and x.deleted_at is null)
            when 'bounty' then (select jsonb_build_object('kind','bounty','slug',x.slug,'href','/bounties/'||x.slug,'title',x.title,'summary',x.description,'creatorName',coalesce(c.display_name,'Community'),'creatorUsername',c.username,'avatarUrl',c.avatar_url,'createdAt',x.created_at) from public.bounties x left join public.users c on c.id=x.created_by where x.id=p.entity_id and x.status not in ('draft','cancelled'))
          end target
          from public.posts p left join public.users u on u.id=p.created_by
          where p.id=$1 and p.visibility='public' and p.deleted_at is null`,
          [postId],
        )
      ).rows[0];
      if (!post) return null;
      const replies = (
        await pool.query(
          `select r.id,r.post_id "postId",r.parent_reply_id "parentId",r.body,r.created_at "createdAt",jsonb_build_object('username',coalesce(u.username,'guest'),'displayName',coalesce(u.display_name,'Guest'),'avatarUrl',u.avatar_url) actor from public.post_replies r left join public.users u on u.id=r.created_by where r.post_id=$1 and r.visibility='public' and r.deleted_at is null order by r.created_at`,
          [postId],
        )
      ).rows;
      return { ...post, replies };
    },
    async createReply(actorId, postId, input) {
      const post = await pool.query(
        `select 1 from public.posts where id=$1 and visibility='public' and deleted_at is null`,
        [postId],
      );
      if (!post.rowCount)
        throw Object.assign(new Error('Post not found.'), { statusCode: 404, code: 'NOT_FOUND' });
      if (input.parentReplyId) {
        const parent = await pool.query(
          `select 1 from public.post_replies where id=$1 and post_id=$2 and deleted_at is null`,
          [input.parentReplyId, postId],
        );
        if (!parent.rowCount)
          throw Object.assign(new Error('Parent reply does not belong to this Post.'), {
            statusCode: 400,
            code: 'INVALID_PARENT_REPLY',
          });
      }
      return (
        await pool.query(
          `insert into public.post_replies(post_id,parent_reply_id,body,created_by,visibility) values($1,$2,$3,$4,'public') returning id,post_id "postId",parent_reply_id "parentId",body,created_at "createdAt"`,
          [postId, input.parentReplyId ?? null, input.body, actorId],
        )
      ).rows[0];
    },
    async createMediaAsset(actorId, input) {
      const id = crypto.randomUUID();
      const safeName =
        input.filename
          .normalize('NFKD')
          .replace(/[^a-zA-Z0-9._-]+/g, '-')
          .slice(-120) || 'upload';
      const bucket = input.visibility === 'private' ? 'private-submissions' : 'public-media';
      const objectKey = `${actorId}/${id}/${safeName}`;
      return (
        await pool.query(
          `insert into public.media_assets(id,owner_id,bucket,object_key,visibility,content_type,size_bytes,status) values($1,$2,$3,$4,$5,$6,$7,'pending') returning id,bucket,object_key "objectKey"`,
          [id, actorId, bucket, objectKey, input.visibility, input.contentType, input.sizeBytes],
        )
      ).rows[0];
    },
    async getMediaAsset(actorId, id) {
      return (
        (
          await pool.query(
            `select id,bucket,object_key "objectKey",status from public.media_assets where id=$1 and owner_id=$2`,
            [id, actorId],
          )
        ).rows[0] ?? null
      );
    },
    async getMediaAssetForView(actorId, id) {
      return (
        (
          await pool.query(
            `select distinct m.id,m.bucket,m.object_key "objectKey",m.status,m.visibility from public.media_assets m left join public.entity_media_assets a on a.media_asset_id=m.id left join public.submissions s on a.entity_type='submission' and a.entity_id=s.id left join public.bounties b on b.id=s.bounty_id where m.id=$2 and m.status='uploaded' and (m.owner_id=$1 or m.visibility='public' or s.submitted_by=$1 or exists(select 1 from public.bounty_participants bp where bp.bounty_id=s.bounty_id and bp.user_id=$1 and bp.role in ('creator','judge')) or exists(select 1 from public.organization_members om where om.organization_id=b.organization_id and om.user_id=$1 and om.permission_level in ('owner','admin','judge')))`,
            [actorId, id],
          )
        ).rows[0] ?? null
      );
    },
    async completeMediaAsset(actorId, id) {
      const result = await pool.query(
        `update public.media_assets set status='uploaded',updated_at=now() where id=$1 and owner_id=$2 and status='pending'`,
        [id, actorId],
      );
      if (!result.rowCount)
        throw Object.assign(new Error('Pending media asset not found.'), {
          statusCode: 404,
          code: 'NOT_FOUND',
        });
    },
    async attachMediaAsset(actorId, id, entityType, entityId, position) {
      const ownerColumns = {
        problem: 'created_by',
        idea: 'created_by',
        project: 'created_by',
        post: 'created_by',
        submission: 'submitted_by',
      } as const;
      const table =
        entityType === 'post'
          ? 'posts'
          : entityType === 'submission'
            ? 'submissions'
            : `${entityType}s`;
      const access = await pool.query(
        `select 1 from public.${table} where id=$1 and ${ownerColumns[entityType]}=$2`,
        [entityId, actorId],
      );
      if (!access.rowCount)
        throw Object.assign(new Error('The target is unavailable or not owned by the actor.'), {
          statusCode: 403,
          code: 'FORBIDDEN',
        });
      if (entityType === 'submission') {
        const media = await pool.query(
          `select 1 from public.media_assets where id=$1 and owner_id=$2 and visibility='private' and bucket='private-submissions' and status='uploaded'`,
          [id, actorId],
        );
        if (!media.rowCount)
          throw Object.assign(new Error('Submission attachments must use private storage.'), {
            statusCode: 400,
            code: 'PRIVATE_MEDIA_REQUIRED',
          });
      }
      const result = await pool.query(
        `insert into public.entity_media_assets(entity_type,entity_id,media_asset_id,position) select $1,$2,id,$4 from public.media_assets where id=$3 and owner_id=$5 and status='uploaded' on conflict do nothing`,
        [entityType, entityId, id, position, actorId],
      );
      if (!result.rowCount)
        throw Object.assign(new Error('Uploaded media asset not found.'), {
          statusCode: 404,
          code: 'NOT_FOUND',
        });
    },
    async queueResearch(actorId, entityType, entityId, entityVersion) {
      const result = await pool.query(
        `insert into public.research_runs(entity_type,entity_id,entity_version,status,requested_by,visibility_scope,pipeline_version) values($1,$2,$3,'queued',$4,'public','v1') on conflict do nothing returning id`,
        [entityType, entityId, entityVersion, actorId],
      );
      if (result.rows[0]) return { id: result.rows[0].id, created: true };
      const existing = (
        await pool.query(
          `select id from public.research_runs where entity_type=$1 and entity_id=$2 and entity_version=$3 and pipeline_version='v1' and status in ('queued','running','completed') order by created_at desc limit 1`,
          [entityType, entityId, entityVersion],
        )
      ).rows[0];
      return { id: existing.id, created: false };
    },
    async listNotifications(actorId, limit) {
      return (
        await pool.query(
          `select id,type,payload,delivery_status "deliveryStatus",read_at "readAt",created_at "createdAt" from public.notifications where user_id=$1 order by created_at desc limit $2`,
          [actorId, limit],
        )
      ).rows;
    },
    async markNotificationRead(actorId, notificationId) {
      return Boolean(
        (
          await pool.query(
            `update public.notifications set read_at=coalesce(read_at,now()),updated_at=now() where id=$1 and user_id=$2`,
            [notificationId, actorId],
          )
        ).rowCount,
      );
    },
    async createModerationFlag(actorId, input) {
      return (
        await pool.query(
          `insert into public.moderation_flags(entity_type,entity_id,reason,reported_by) values($1,$2,$3,$4) returning id,entity_type "entityType",entity_id "entityId",reason,status,created_at "createdAt"`,
          [input.entityType, input.entityId, input.reason, actorId],
        )
      ).rows[0];
    },
    async createResolution(actorId, bountyId, input) {
      return transaction(pool, async (client) => {
        const access = await client.query(
          `select b.status from public.bounties b where b.id=$1 and exists(select 1 from public.organization_members om where om.organization_id=b.organization_id and om.user_id=$2 and om.permission_level in ('owner','admin','judge')) for update`,
          [bountyId, actorId],
        );
        if (!access.rowCount)
          throw Object.assign(new Error('Bounty resolution access is required.'), {
            statusCode: 403,
            code: 'FORBIDDEN',
          });
        const resolution = (
          await client.query(
            `insert into public.bounty_resolutions(bounty_id,resolution_type,status,reason,requested_by) values($1,$2,'requested',$3,$4) returning id,bounty_id "bountyId",resolution_type "type",status,reason,created_at "createdAt"`,
            [bountyId, input.type, input.reason, actorId],
          )
        ).rows[0];
        await client.query(
          `insert into public.audit_logs(actor_type,actor_id,action,entity_type,entity_id,after) values('user',$1,'bounty.resolution_requested','bounty',$2,$3)`,
          [actorId, bountyId, resolution],
        );
        return resolution;
      });
    },
    async createWithdrawal(actorId, input) {
      return transaction(pool, async (client) => {
        const wallet = await client.query(
          `select 1 from public.user_wallets where user_id=$1 and chain='solana' and address=$2 and verified_at is not null`,
          [actorId, input.sourceAddress],
        );
        if (!wallet.rowCount)
          throw Object.assign(
            new Error('A verified source wallet owned by the actor is required.'),
            { statusCode: 403, code: 'UNVERIFIED_WALLET' },
          );
        const result = (
          await client.query(
            `insert into public.withdrawal_intents(user_id,idempotency_key,amount_raw,mint_address,source_address,destination_address) values($1,$2,$3,$4,$5,$6) on conflict(user_id,idempotency_key) do update set updated_at=now() returning id,status,amount_raw::text "amountRaw",mint_address "mintAddress",source_address "sourceAddress",destination_address "destinationAddress",created_at "createdAt"`,
            [
              actorId,
              input.idempotencyKey,
              input.amountRaw,
              input.mintAddress,
              input.sourceAddress,
              input.destinationAddress,
            ],
          )
        ).rows[0];
        await client.query(
          `insert into public.audit_logs(actor_type,actor_id,action,entity_type,entity_id,after) values('user',$1,'withdrawal.intent_created','withdrawal',$2,$3)`,
          [
            actorId,
            result.id,
            {
              amountRaw: result.amountRaw,
              mintAddress: result.mintAddress,
              destinationAddress: result.destinationAddress,
            },
          ],
        );
        return result;
      });
    },
    async createWalletLinkIntent(actorId, walletAddress, nonceHash) {
      return (
        await pool.query(
          `insert into public.wallet_link_nonces(user_id,wallet_address,nonce_hash,expires_at) values($1,$2,$3,now()+interval '10 minutes') returning id`,
          [actorId, walletAddress, nonceHash],
        )
      ).rows[0].id;
    },
    async consumeWalletLinkIntent(actorId, walletAddress, nonceHash) {
      await transaction(pool, async (client) => {
        const nonce = (
          await client.query(
            `update public.wallet_link_nonces set consumed_at=now() where user_id=$1 and wallet_address=$2 and nonce_hash=$3 and consumed_at is null and expires_at>now() returning id`,
            [actorId, walletAddress, nonceHash],
          )
        ).rows[0];
        if (!nonce)
          throw Object.assign(new Error('Wallet link intent is expired, used, or unavailable.'), {
            statusCode: 409,
            code: 'WALLET_LINK_INTENT_INVALID',
          });
        await client.query(
          `insert into public.user_wallets(user_id,chain,address,wallet_kind,provider,is_primary,is_reward_wallet,verified_at,verification_method) values($1,'solana',$2,'linked','signature',false,false,now(),'signed_nonce') on conflict(chain,address) do update set verified_at=now(),verification_method='signed_nonce',updated_at=now() where user_wallets.user_id=$1`,
          [actorId, walletAddress],
        );
        await client.query(
          `insert into public.audit_logs(actor_type,actor_id,action,entity_type,entity_id,after) values('user',$1,'wallet.linked','wallet',null,$2)`,
          [actorId, { address: walletAddress, nonceId: nonce.id }],
        );
      });
    },
    async recordChainEvent(input) {
      const result = await pool.query(
        `insert into public.blockchain_events(signature,event_index,event_type,slot,program_id,account_address,commitment,payload) values($1,$2,$3,$4,$5,$6,$7,$8) on conflict(chain,signature,event_index) do nothing`,
        [
          input.signature,
          input.eventIndex,
          input.eventType,
          input.slot,
          input.programId,
          input.accountAddress ?? null,
          input.commitment,
          input.payload,
        ],
      );
      return Boolean(result.rowCount);
    },
    async reconcileEscrow(bountyId, observed) {
      return transaction(pool, async (client) => {
        const escrow = (
          await client.query(
            `select e.*,b.prize_amount_raw::text,b.fee_amount_raw::text,b.deadline_at,b.judging_deadline_at from public.bounty_escrows e join public.bounties b on b.id=e.bounty_id where e.bounty_id=$1 for update`,
            [bountyId],
          )
        ).rows[0];
        if (!escrow)
          throw Object.assign(new Error('Escrow record not found.'), {
            statusCode: 404,
            code: 'NOT_FOUND',
          });
        const dbState = {
          status: escrow.status,
          address: escrow.escrow_address,
          termsHash: escrow.terms_hash,
          fundedAmountRaw: String(escrow.funded_amount_raw),
        };
        const expectedBountyId = Buffer.from(
          (await import('@gimme-idea/solana')).deriveBountyIdFromUuid(bountyId),
        ).toString('hex');
        const immutableMismatch =
          escrow.escrow_address !== observed.address ||
          expectedBountyId !== observed.bountyIdHex ||
          escrow.terms_hash !== observed.termsHash ||
          escrow.mint_address !== observed.mint ||
          String(escrow.prize_amount_raw) !== observed.prizeAmountRaw ||
          String(escrow.fee_amount_raw) !== observed.feeAmountRaw ||
          String(escrow.expected_amount_raw) !== observed.totalDepositedRaw;
        const expectedWinner =
          (
            await client.query(
              `select p.recipient_address from public.payout_intents p join public.bounty_winners w on w.id=p.bounty_winner_id where w.bounty_id=$1`,
              [bountyId],
            )
          ).rows[0]?.recipient_address ?? null;
        const winnerMismatch =
          ['winner_selected', 'settled'].includes(observed.state) &&
          expectedWinner !== observed.winner;
        if (immutableMismatch || winnerMismatch) {
          const reason = immutableMismatch ? 'IMMUTABLE_CHAIN_MISMATCH' : 'WINNER_CHAIN_MISMATCH';
          await client.query(
            `update public.bounty_escrows set status='error',last_observed_slot=$2,last_reconciled_at=now(),reconciliation_error=$3,updated_at=now() where bounty_id=$1`,
            [bountyId, observed.slot, reason],
          );
          await client.query(
            `update public.bounties set status='resolution',updated_at=now() where id=$1`,
            [bountyId],
          );
          await client.query(
            `insert into public.escrow_reconciliations(bounty_escrow_id,observed_slot,db_state,chain_state,result,error) values($1,$2,$3,$4,'error',$5)`,
            [escrow.id, observed.slot, dbState, observed, reason],
          );
          return 'mismatch';
        }
        const mapped =
          observed.state === 'funded'
            ? 'funded'
            : observed.state === 'active'
              ? 'funded'
              : observed.state === 'winner_selected'
                ? 'paying'
                : observed.state === 'settled'
                  ? 'paid'
                  : observed.state === 'refunded'
                    ? 'refunded'
                    : escrow.status;
        const matches =
          escrow.escrow_address === observed.address &&
          escrow.terms_hash === observed.termsHash &&
          String(escrow.funded_amount_raw) === observed.totalDepositedRaw &&
          escrow.status === mapped;
        if (!matches)
          await client.query(
            `update public.bounty_escrows set status=$2,escrow_address=$3,funded_amount_raw=$4,last_observed_slot=$5,last_reconciled_at=now(),reconciliation_error=null,updated_at=now() where bounty_id=$1`,
            [bountyId, mapped, observed.address, observed.totalDepositedRaw, observed.slot],
          );
        const productState =
          observed.state === 'funded'
            ? 'funded'
            : observed.state === 'active'
              ? new Date() <= new Date(escrow.deadline_at)
                ? 'open'
                : 'judging'
              : observed.state === 'winner_selected'
                ? 'settlement_pending'
                : observed.state === 'settled'
                  ? 'completed'
                  : observed.state === 'refunded'
                    ? 'refunded'
                    : null;
        if (productState)
          await client.query(`update public.bounties set status=$2,updated_at=now() where id=$1`, [
            bountyId,
            productState,
          ]);
        if (['funded', 'active'].includes(observed.state))
          await client.query(
            `update public.funding_intents set status='confirmed',updated_at=now() where bounty_id=$1 and status='submitted'`,
            [bountyId],
          );
        if (observed.state === 'settled')
          await client.query(
            `update public.payout_intents p set status='confirmed',confirmed_at=now(),updated_at=now() from public.bounty_winners w where p.bounty_winner_id=w.id and w.bounty_id=$1 and p.recipient_address=$2`,
            [bountyId, observed.winner],
          );
        await client.query(
          `insert into public.escrow_reconciliations(bounty_escrow_id,observed_slot,db_state,chain_state,result) values($1,$2,$3,$4,$5)`,
          [escrow.id, observed.slot, dbState, observed, matches ? 'match' : 'corrected'],
        );
        return matches ? 'match' : 'corrected';
      });
    },
    close: () => pool.end(),
  };
}
