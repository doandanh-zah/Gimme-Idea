import { sql } from 'drizzle-orm';
import {
  boolean,
  integer,
  index,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
};
const softDelete = { deletedAt: timestamp('deleted_at', { withTimezone: true }) };

export const users = pgTable('users', {
  id: uuid().defaultRandom().primaryKey(),
  authUserId: uuid('auth_user_id').unique(),
  authProvider: text('auth_provider').default('legacy').notNull(),
  authSubject: text('auth_subject').notNull(),
  profileSource: text('profile_source').default('user').notNull(),
  username: text().unique(),
  displayName: text('display_name'),
  bio: text(),
  avatarUrl: text('avatar_url'),
  location: text(),
  websiteUrl: text('website_url'),
  githubUrl: text('github_url'),
  linkedinUrl: text('linkedin_url'),
  xUrl: text('x_url'),
  profileVisibility: text('profile_visibility').default('public').notNull(),
  ...timestamps,
  ...softDelete,
});
export const userWallets = pgTable(
  'user_wallets',
  {
    id: uuid().defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id)
      .notNull(),
    chain: text().default('solana').notNull(),
    address: text().notNull(),
    isPrimary: boolean('is_primary').default(false).notNull(),
    walletKind: text('wallet_kind').default('linked').notNull(),
    provider: text(),
    isRewardWallet: boolean('is_reward_wallet').default(false).notNull(),
    verificationMethod: text('verification_method'),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => [uniqueIndex('user_wallets_chain_address_uidx').on(t.chain, t.address)],
);
export const organizations = pgTable('organizations', {
  id: uuid().defaultRandom().primaryKey(),
  slug: text().notNull().unique(),
  name: text().notNull(),
  organizationType: text('organization_type').notNull(),
  oneLineDescription: text('one_line_description'),
  description: text(),
  logoUrl: text('logo_url'),
  websiteUrl: text('website_url'),
  location: text(),
  industry: text(),
  verificationStatus: text('verification_status').default('unverified').notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  ...timestamps,
  ...softDelete,
});
export const organizationMembers = pgTable(
  'organization_members',
  {
    organizationId: uuid('organization_id')
      .references(() => organizations.id)
      .notNull(),
    userId: uuid('user_id')
      .references(() => users.id)
      .notNull(),
    role: text(),
    permissionLevel: text('permission_level').default('member').notNull(),
    joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.organizationId, t.userId] })],
);

export const problems = pgTable(
  'problems',
  {
    id: uuid().defaultRandom().primaryKey(),
    slug: text().notNull().unique(),
    title: text().notNull(),
    summary: text().notNull(),
    description: text().notNull(),
    affectedGroups: text('affected_groups').array().default([]).notNull(),
    evidence: text().array().default([]).notNull(),
    severity: text().default('medium').notNull(),
    status: text().default('draft').notNull(),
    researchStatus: text('research_status').default('unresearched').notNull(),
    origin: text().default('human').notNull(),
    reviewedByHuman: boolean('reviewed_by_human').default(true).notNull(),
    lastResearchedAt: timestamp('last_researched_at', { withTimezone: true }),
    createdBy: uuid('created_by').references(() => users.id),
    organizationId: uuid('organization_id').references(() => organizations.id),
    industry: text(),
    region: text(),
    currentWorkaround: text('current_workaround'),
    existingSolutions: text('existing_solutions').array().default([]).notNull(),
    desiredOutcome: text('desired_outcome'),
    constraints: text().array().default([]).notNull(),
    knownData: text('known_data').array().default([]).notNull(),
    successMetrics: text('success_metrics').array().default([]).notNull(),
    visibility: text().default('public').notNull(),
    contentVersion: integer('content_version').default(1).notNull(),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    ...timestamps,
    ...softDelete,
  },
  (t) => [
    index('problems_status_idx').on(t.status),
    index('problems_research_status_idx').on(t.researchStatus),
  ],
);
export const problemSources = pgTable('problem_sources', {
  id: uuid().defaultRandom().primaryKey(),
  problemId: uuid('problem_id')
    .references(() => problems.id, { onDelete: 'cascade' })
    .notNull(),
  title: text().notNull(),
  url: text().notNull(),
  publisher: text(),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  ...timestamps,
});
export const ideas = pgTable(
  'ideas',
  {
    id: uuid().defaultRandom().primaryKey(),
    slug: text().notNull().unique(),
    title: text().notNull(),
    summary: text().notNull(),
    thesis: text().notNull(),
    solution: text().notNull(),
    targetUsers: text('target_users').array().default([]).notNull(),
    status: text().default('draft').notNull(),
    researchStatus: text('research_status').default('unresearched').notNull(),
    origin: text().default('human').notNull(),
    reviewedByHuman: boolean('reviewed_by_human').default(true).notNull(),
    lastResearchedAt: timestamp('last_researched_at', { withTimezone: true }),
    createdBy: uuid('created_by').references(() => users.id),
    visibility: text().default('public').notNull(),
    sourceType: text('source_type').default('direct').notNull(),
    sourceSubmissionId: uuid('source_submission_id'),
    opportunity: text(),
    whyNow: text('why_now'),
    differentiation: text(),
    risks: text().array().default([]).notNull(),
    validationPlan: text('validation_plan'),
    contentVersion: integer('content_version').default(1).notNull(),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    ...timestamps,
    ...softDelete,
  },
  (t) => [index('ideas_status_idx').on(t.status)],
);
export const ideaProblemLinks = pgTable(
  'idea_problem_links',
  {
    ideaId: uuid('idea_id')
      .references(() => ideas.id, { onDelete: 'cascade' })
      .notNull(),
    problemId: uuid('problem_id')
      .references(() => problems.id, { onDelete: 'cascade' })
      .notNull(),
    relationshipType: text('relationship_type').default('secondary').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.ideaId, t.problemId] }),
    uniqueIndex('idea_one_primary_problem_uidx')
      .on(t.ideaId)
      .where(sql`${t.relationshipType} = 'primary'`),
  ],
);
export const previousAttempts = pgTable('previous_attempts', {
  id: uuid().defaultRandom().primaryKey(),
  ideaId: uuid('idea_id')
    .references(() => ideas.id, { onDelete: 'cascade' })
    .notNull(),
  name: text().notNull(),
  description: text().notNull(),
  outcome: text().default('unknown').notNull(),
  lesson: text().notNull(),
  sourceUrl: text('source_url'),
  ...timestamps,
});
export const previousAttemptFailureFactors = pgTable('previous_attempt_failure_factors', {
  id: uuid().defaultRandom().primaryKey(),
  previousAttemptId: uuid('previous_attempt_id')
    .references(() => previousAttempts.id, { onDelete: 'cascade' })
    .notNull(),
  factor: text().notNull(),
  category: text().notNull(),
});
export const previousAttemptSources = pgTable('previous_attempt_sources', {
  id: uuid().defaultRandom().primaryKey(),
  previousAttemptId: uuid('previous_attempt_id')
    .references(() => previousAttempts.id, { onDelete: 'cascade' })
    .notNull(),
  title: text().notNull(),
  url: text().notNull(),
});

export const projects = pgTable(
  'projects',
  {
    id: uuid().defaultRandom().primaryKey(),
    ideaId: uuid('idea_id').references(() => ideas.id),
    slug: text().notNull().unique(),
    name: text().notNull(),
    description: text().notNull(),
    summary: text().notNull(),
    stage: text().default('concept').notNull(),
    originType: text('origin_type').default('community').notNull(),
    visibility: text().default('public').notNull(),
    repositoryUrl: text('repository_url'),
    websiteUrl: text('website_url'),
    demoUrl: text('demo_url'),
    originatingBountyId: uuid('originating_bounty_id'),
    sourceSubmissionId: uuid('source_submission_id'),
    contentVersion: integer('content_version').default(1).notNull(),
    ownerStatus: text('owner_status').default('active').notNull(),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    createdBy: uuid('created_by').references(() => users.id),
    ...timestamps,
    ...softDelete,
  },
  (t) => [index('projects_idea_idx').on(t.ideaId)],
);
export const projectMembers = pgTable(
  'project_members',
  {
    projectId: uuid('project_id')
      .references(() => projects.id, { onDelete: 'cascade' })
      .notNull(),
    userId: uuid('user_id')
      .references(() => users.id)
      .notNull(),
    role: text().notNull(),
    joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.projectId, t.userId] })],
);
export const projectUpdates = pgTable('project_updates', {
  id: uuid().defaultRandom().primaryKey(),
  projectId: uuid('project_id')
    .references(() => projects.id, { onDelete: 'cascade' })
    .notNull(),
  title: text().notNull(),
  body: text().notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  ...timestamps,
});
export const projectOutcomes = pgTable('project_outcomes', {
  id: uuid().defaultRandom().primaryKey(),
  projectId: uuid('project_id')
    .references(() => projects.id, { onDelete: 'cascade' })
    .notNull(),
  outcomeType: text('outcome_type').notNull(),
  summary: text().notNull(),
  evidenceUrl: text('evidence_url'),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).defaultNow().notNull(),
});

export const bounties = pgTable(
  'bounties',
  {
    id: uuid().defaultRandom().primaryKey(),
    slug: text().notNull().unique(),
    bountyType: text('bounty_type').default('idea').notNull(),
    problemId: uuid('problem_id')
      .references(() => problems.id)
      .notNull(),
    organizationId: uuid('organization_id').references(() => organizations.id),
    parentBountyId: uuid('parent_bounty_id'),
    selectedIdeaId: uuid('selected_idea_id').references(() => ideas.id),
    createdBy: uuid('created_by').references(() => users.id),
    title: text().notNull(),
    description: text().notNull(),
    objective: text(),
    requirements: text().array().default([]).notNull(),
    constraints: text().array().default([]).notNull(),
    eligibility: text().array().default([]).notNull(),
    ipTerms: text('ip_terms').notNull(),
    status: text().default('draft').notNull(),
    currency: text().default('USDC').notNull(),
    totalAmountRaw: numeric('total_amount_raw', { precision: 40, scale: 0 }).default('0').notNull(),
    prizeAmountRaw: numeric('prize_amount_raw', { precision: 40, scale: 0 }).default('0').notNull(),
    feeAmountRaw: numeric('fee_amount_raw', { precision: 40, scale: 0 }).default('0').notNull(),
    openToHiring: boolean('open_to_hiring').default(false).notNull(),
    deadlineAt: timestamp('deadline_at', { withTimezone: true }),
    judgingDeadlineAt: timestamp('judging_deadline_at', { withTimezone: true }),
    submissionVisibility: text('submission_visibility').default('private').notNull(),
    termsVersion: integer('terms_version').default(1).notNull(),
    termsPayload: jsonb('terms_payload').default({}).notNull(),
    termsHash: text('terms_hash'),
    accessMode: text('access_mode').default('open').notNull(),
    ...timestamps,
  },
  (t) => [index('bounties_problem_idx').on(t.problemId)],
);
export const bountyPrizes = pgTable('bounty_prizes', {
  id: uuid().defaultRandom().primaryKey(),
  bountyId: uuid('bounty_id')
    .references(() => bounties.id, { onDelete: 'cascade' })
    .notNull(),
  rank: text().notNull(),
  amountRaw: numeric('amount_raw', { precision: 40, scale: 0 }).notNull(),
});
export const bountyEscrows = pgTable('bounty_escrows', {
  id: uuid().defaultRandom().primaryKey(),
  bountyId: uuid('bounty_id')
    .references(() => bounties.id)
    .notNull()
    .unique(),
  status: text().default('not_created').notNull(),
  cluster: text().default('devnet').notNull(),
  programId: text('program_id'),
  escrowVersion: integer('escrow_version'),
  mintAddress: text('mint_address'),
  authorityAddress: text('authority_address'),
  expectedAmountRaw: numeric('expected_amount_raw', { precision: 40, scale: 0 })
    .default('0')
    .notNull(),
  escrowAddress: text('escrow_address'),
  fundingSignature: text('funding_signature'),
  fundedAmountRaw: numeric('funded_amount_raw', { precision: 40, scale: 0 }).default('0').notNull(),
  confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
  lastObservedSlot: numeric('last_observed_slot', { precision: 40, scale: 0 }),
  lastReconciledAt: timestamp('last_reconciled_at', { withTimezone: true }),
  reconciliationError: text('reconciliation_error'),
  termsHash: text('terms_hash'),
  ...timestamps,
});
export const submissions = pgTable('submissions', {
  id: uuid().defaultRandom().primaryKey(),
  bountyId: uuid('bounty_id')
    .references(() => bounties.id)
    .notNull(),
  ideaId: uuid('idea_id').references(() => ideas.id),
  projectId: uuid('project_id').references(() => projects.id),
  submittedBy: uuid('submitted_by').references(() => users.id),
  title: text().notNull(),
  description: text().notNull(),
  status: text().default('submitted').notNull(),
  submissionKind: text('submission_kind').notNull(),
  visibility: text().default('private_owner_judges').notNull(),
  ideaPayload: jsonb('idea_payload'),
  currentVersion: integer('current_version').default(1).notNull(),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  shortlistedAt: timestamp('shortlisted_at', { withTimezone: true }),
  selectedAt: timestamp('selected_at', { withTimezone: true }),
  withdrawnAt: timestamp('withdrawn_at', { withTimezone: true }),
  payoutWalletAddress: text('payout_wallet_address'),
  payoutWalletVerifiedAt: timestamp('payout_wallet_verified_at', { withTimezone: true }),
  teamPayoutAcknowledgedAt: timestamp('team_payout_acknowledged_at', { withTimezone: true }),
  ...timestamps,
});
export const submissionResults = pgTable('submission_results', {
  id: uuid().defaultRandom().primaryKey(),
  submissionId: uuid('submission_id')
    .references(() => submissions.id)
    .notNull()
    .unique(),
  decision: text().notNull(),
  rationale: text(),
  decidedAt: timestamp('decided_at', { withTimezone: true }).defaultNow().notNull(),
});
export const externalOpportunities = pgTable('external_opportunities', {
  id: uuid().defaultRandom().primaryKey(),
  sourceName: text('source_name').notNull(),
  externalId: text('external_id'),
  title: text().notNull(),
  url: text().notNull(),
  payload: jsonb().default({}).notNull(),
  ...timestamps,
});
export const externalSubmissions = pgTable('external_submissions', {
  id: uuid().defaultRandom().primaryKey(),
  externalOpportunityId: uuid('external_opportunity_id')
    .references(() => externalOpportunities.id)
    .notNull(),
  projectId: uuid('project_id').references(() => projects.id),
  status: text().notNull(),
  externalUrl: text('external_url'),
  ...timestamps,
});

export const posts = pgTable(
  'posts',
  {
    id: uuid().defaultRandom().primaryKey(),
    entityType: text('entity_type').notNull(),
    entityId: uuid('entity_id').notNull(),
    title: text().notNull(),
    body: text().notNull(),
    postType: text('post_type').default('discussion').notNull(),
    visibility: text().default('public').notNull(),
    quotedPostId: uuid('quoted_post_id'),
    quotedEntityType: text('quoted_entity_type'),
    quotedEntityId: uuid('quoted_entity_id'),
    quotedSnapshot: jsonb('quoted_snapshot'),
    createdBy: uuid('created_by').references(() => users.id),
    ...timestamps,
    ...softDelete,
  },
  (t) => [index('posts_entity_idx').on(t.entityType, t.entityId)],
);
export const postReplies = pgTable('post_replies', {
  id: uuid().defaultRandom().primaryKey(),
  postId: uuid('post_id')
    .references(() => posts.id, { onDelete: 'cascade' })
    .notNull(),
  parentReplyId: uuid('parent_reply_id'),
  body: text().notNull(),
  visibility: text().default('public').notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  ...timestamps,
  ...softDelete,
});
export const likes = pgTable(
  'likes',
  {
    userId: uuid('user_id')
      .references(() => users.id)
      .notNull(),
    entityType: text('entity_type').notNull(),
    entityId: uuid('entity_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.entityType, t.entityId] })],
);
export const follows = pgTable(
  'follows',
  {
    followerId: uuid('follower_id')
      .references(() => users.id)
      .notNull(),
    entityType: text('entity_type').notNull(),
    entityId: uuid('entity_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.followerId, t.entityType, t.entityId] })],
);
export const collections = pgTable('collections', {
  id: uuid().defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => users.id)
    .notNull(),
  name: text().notNull(),
  visibility: text().default('private').notNull(),
  ...timestamps,
});
export const collectionItems = pgTable(
  'collection_items',
  {
    collectionId: uuid('collection_id')
      .references(() => collections.id, { onDelete: 'cascade' })
      .notNull(),
    entityType: text('entity_type').notNull(),
    entityId: uuid('entity_id').notNull(),
    addedAt: timestamp('added_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.collectionId, t.entityType, t.entityId] })],
);

export const researchRuns = pgTable('research_runs', {
  id: uuid().defaultRandom().primaryKey(),
  entityType: text('entity_type').notNull(),
  entityId: uuid('entity_id').notNull(),
  status: text().notNull(),
  provider: text(),
  model: text(),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  metadata: jsonb().default({}).notNull(),
  entityVersion: integer('entity_version').default(1).notNull(),
  pipelineVersion: text('pipeline_version').default('v1').notNull(),
  promptHash: text('prompt_hash'),
  requestedBy: uuid('requested_by').references(() => users.id),
  visibilityScope: text('visibility_scope').default('public').notNull(),
  attempt: integer().default(1).notNull(),
  errorCode: text('error_code'),
  ...timestamps,
});
export const researchClaims = pgTable('research_claims', {
  id: uuid().defaultRandom().primaryKey(),
  researchRunId: uuid('research_run_id')
    .references(() => researchRuns.id, { onDelete: 'cascade' })
    .notNull(),
  fieldPath: text('field_path').notNull(),
  claim: text().notNull(),
  confidence: numeric({ precision: 4, scale: 3 }),
  ...timestamps,
});
export const researchSources = pgTable('research_sources', {
  id: uuid().defaultRandom().primaryKey(),
  researchClaimId: uuid('research_claim_id')
    .references(() => researchClaims.id, { onDelete: 'cascade' })
    .notNull(),
  title: text().notNull(),
  url: text().notNull(),
  publisher: text(),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  retrievedAt: timestamp('retrieved_at', { withTimezone: true }).defaultNow().notNull(),
});
export const verificationResults = pgTable('verification_results', {
  id: uuid().defaultRandom().primaryKey(),
  researchClaimId: uuid('research_claim_id')
    .references(() => researchClaims.id, { onDelete: 'cascade' })
    .notNull(),
  status: text().notNull(),
  rationale: text(),
  verifiedBy: text('verified_by').notNull(),
  verifierRunId: uuid('verifier_run_id').references(() => researchRuns.id),
  evidenceCoverage: numeric('evidence_coverage', { precision: 4, scale: 3 }),
  ...timestamps,
});
export const entityFieldProvenance = pgTable(
  'entity_field_provenance',
  {
    id: uuid().defaultRandom().primaryKey(),
    entityType: text('entity_type').notNull(),
    entityId: uuid('entity_id').notNull(),
    fieldPath: text('field_path').notNull(),
    origin: text().notNull(),
    sourceId: uuid('source_id'),
    version: text().default('1').notNull(),
    ...timestamps,
  },
  (t) => [index('field_provenance_entity_idx').on(t.entityType, t.entityId)],
);

export const importSources = pgTable('import_sources', {
  id: uuid().defaultRandom().primaryKey(),
  name: text().notNull(),
  sourceType: text('source_type').notNull(),
  baseUrl: text('base_url'),
  configuration: jsonb().default({}).notNull(),
  adapterVersion: text('adapter_version').default('v1').notNull(),
  enabled: boolean().default(false).notNull(),
  cursor: jsonb().default({}).notNull(),
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
  lastError: text('last_error'),
  ...timestamps,
});
export const importedEntities = pgTable(
  'imported_entities',
  {
    id: uuid().defaultRandom().primaryKey(),
    importSourceId: uuid('import_source_id')
      .references(() => importSources.id)
      .notNull(),
    externalId: text('external_id').notNull(),
    entityType: text('entity_type').notNull(),
    canonicalEntityId: uuid('canonical_entity_id'),
    payload: jsonb().notNull(),
    normalizedPayload: jsonb('normalized_payload'),
    payloadHash: text('payload_hash'),
    sourceUpdatedAt: timestamp('source_updated_at', { withTimezone: true }),
    importStatus: text('import_status').default('stored').notNull(),
    importedAt: timestamp('imported_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex('imported_entities_source_external_uidx').on(t.importSourceId, t.externalId)],
);
export const duplicateCandidates = pgTable('duplicate_candidates', {
  id: uuid().defaultRandom().primaryKey(),
  leftEntityId: uuid('left_entity_id').notNull(),
  rightEntityId: uuid('right_entity_id').notNull(),
  entityType: text('entity_type').notNull(),
  confidence: numeric({ precision: 4, scale: 3 }).notNull(),
  status: text().default('pending').notNull(),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  ...timestamps,
});
export const entityRedirects = pgTable(
  'entity_redirects',
  {
    id: uuid().defaultRandom().primaryKey(),
    entityType: text('entity_type').notNull(),
    fromSlug: text('from_slug').notNull(),
    toEntityId: uuid('to_entity_id').notNull(),
    ...timestamps,
  },
  (t) => [uniqueIndex('entity_redirects_type_slug_uidx').on(t.entityType, t.fromSlug)],
);
export const bountyReviews = pgTable('bounty_reviews', {
  id: uuid().defaultRandom().primaryKey(),
  bountyId: uuid('bounty_id')
    .references(() => bounties.id)
    .notNull(),
  reviewerId: uuid('reviewer_id').references(() => users.id),
  submissionId: uuid('submission_id')
    .references(() => submissions.id)
    .notNull(),
  status: text().default('assigned').notNull(),
  ...timestamps,
});
export const bountyJudgingCriteria = pgTable('bounty_judging_criteria', {
  id: uuid().defaultRandom().primaryKey(),
  bountyId: uuid('bounty_id')
    .references(() => bounties.id)
    .notNull(),
  name: text().notNull(),
  weight: numeric({ precision: 5, scale: 2 }).notNull(),
});
export const bountyReviewScores = pgTable(
  'bounty_review_scores',
  {
    reviewId: uuid('review_id')
      .references(() => bountyReviews.id)
      .notNull(),
    criterionId: uuid('criterion_id')
      .references(() => bountyJudgingCriteria.id)
      .notNull(),
    score: numeric({ precision: 5, scale: 2 }).notNull(),
    note: text(),
  },
  (t) => [primaryKey({ columns: [t.reviewId, t.criterionId] })],
);
export const bountyWinners = pgTable('bounty_winners', {
  id: uuid().defaultRandom().primaryKey(),
  bountyId: uuid('bounty_id')
    .references(() => bounties.id)
    .notNull(),
  submissionId: uuid('submission_id')
    .references(() => submissions.id)
    .notNull(),
  rank: text().notNull(),
  amountRaw: numeric('amount_raw', { precision: 40, scale: 0 }).notNull(),
  termsHash: text('terms_hash'),
  selectedBy: uuid('selected_by').references(() => users.id),
  selectedAt: timestamp('selected_at', { withTimezone: true }),
  ...timestamps,
});
export const payoutIntents = pgTable('payout_intents', {
  id: uuid().defaultRandom().primaryKey(),
  bountyWinnerId: uuid('bounty_winner_id')
    .references(() => bountyWinners.id)
    .notNull()
    .unique(),
  status: text().default('pending').notNull(),
  amountRaw: numeric('amount_raw', { precision: 40, scale: 0 }).notNull(),
  recipientAddress: text('recipient_address'),
  transactionSignature: text('transaction_signature'),
  confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
  idempotencyKey: text('idempotency_key').notNull(),
  lastError: text('last_error'),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  ...timestamps,
});
export const blockchainEvents = pgTable(
  'blockchain_events',
  {
    id: uuid().defaultRandom().primaryKey(),
    chain: text().default('solana').notNull(),
    signature: text().notNull(),
    eventType: text('event_type').notNull(),
    eventIndex: integer('event_index').default(0).notNull(),
    slot: numeric({ precision: 40, scale: 0 }),
    payload: jsonb().notNull(),
    programId: text('program_id'),
    accountAddress: text('account_address'),
    commitment: text(),
    observedAt: timestamp('observed_at', { withTimezone: true }).defaultNow().notNull(),
    processedAt: timestamp('processed_at', { withTimezone: true }),
    processingError: text('processing_error'),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('blockchain_events_signature_index_uidx').on(t.chain, t.signature, t.eventIndex),
  ],
);
export const notifications = pgTable('notifications', {
  id: uuid().defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => users.id)
    .notNull(),
  type: text().notNull(),
  payload: jsonb().default({}).notNull(),
  readAt: timestamp('read_at', { withTimezone: true }),
  deliveryStatus: text('delivery_status').default('pending').notNull(),
  dedupeKey: text('dedupe_key'),
  ...timestamps,
});
export const moderationFlags = pgTable('moderation_flags', {
  id: uuid().defaultRandom().primaryKey(),
  entityType: text('entity_type').notNull(),
  entityId: uuid('entity_id').notNull(),
  reason: text().notNull(),
  status: text().default('open').notNull(),
  reportedBy: uuid('reported_by').references(() => users.id),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  ...timestamps,
});
export const auditLogs = pgTable('audit_logs', {
  id: uuid().defaultRandom().primaryKey(),
  actorType: text('actor_type').notNull(),
  actorId: uuid('actor_id'),
  action: text().notNull(),
  entityType: text('entity_type').notNull(),
  entityId: uuid('entity_id'),
  before: jsonb(),
  after: jsonb(),
  requestId: text('request_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const organizationWallets = pgTable('organization_wallets', {
  id: uuid().defaultRandom().primaryKey(),
  organizationId: uuid('organization_id')
    .references(() => organizations.id, { onDelete: 'cascade' })
    .notNull(),
  chain: text().default('solana').notNull(),
  address: text().notNull(),
  purpose: text().default('funding').notNull(),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  ...timestamps,
});
export const bountyParticipants = pgTable(
  'bounty_participants',
  {
    bountyId: uuid('bounty_id')
      .references(() => bounties.id, { onDelete: 'cascade' })
      .notNull(),
    userId: uuid('user_id')
      .references(() => users.id)
      .notNull(),
    role: text().notNull(),
    acceptedTermsHash: text('accepted_terms_hash'),
    joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.bountyId, t.userId, t.role] })],
);
export const fundingIntents = pgTable('funding_intents', {
  id: uuid().defaultRandom().primaryKey(),
  bountyId: uuid('bounty_id')
    .references(() => bounties.id)
    .notNull(),
  idempotencyKey: text('idempotency_key').notNull(),
  status: text().default('created').notNull(),
  expectedAmountRaw: numeric('expected_amount_raw', { precision: 40, scale: 0 }).notNull(),
  mintAddress: text('mint_address').notNull(),
  funderAddress: text('funder_address').notNull(),
  transactionSignature: text('transaction_signature'),
  lastError: text('last_error'),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdBy: uuid('created_by')
    .references(() => users.id)
    .notNull(),
  ...timestamps,
});
export const submissionVersions = pgTable(
  'submission_versions',
  {
    id: uuid().defaultRandom().primaryKey(),
    submissionId: uuid('submission_id')
      .references(() => submissions.id, { onDelete: 'cascade' })
      .notNull(),
    version: integer().notNull(),
    snapshot: jsonb().notNull(),
    contentHash: text('content_hash').notNull(),
    createdBy: uuid('created_by')
      .references(() => users.id)
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex('submission_versions_submission_version_uidx').on(t.submissionId, t.version)],
);
export const mediaAssets = pgTable('media_assets', {
  id: uuid().defaultRandom().primaryKey(),
  ownerId: uuid('owner_id')
    .references(() => users.id)
    .notNull(),
  bucket: text().notNull(),
  objectKey: text('object_key').notNull(),
  visibility: text().notNull(),
  contentType: text('content_type').notNull(),
  sizeBytes: numeric('size_bytes', { precision: 40, scale: 0 }).notNull(),
  sha256: text(),
  status: text().default('pending').notNull(),
  ...timestamps,
});
export const entityMediaAssets = pgTable(
  'entity_media_assets',
  {
    entityType: text('entity_type').notNull(),
    entityId: uuid('entity_id').notNull(),
    mediaAssetId: uuid('media_asset_id')
      .references(() => mediaAssets.id, { onDelete: 'cascade' })
      .notNull(),
    position: integer().default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.entityType, t.entityId, t.mediaAssetId] })],
);
export const chainCursors = pgTable(
  'chain_cursors',
  {
    consumer: text().notNull(),
    chain: text().default('solana').notNull(),
    programId: text('program_id').notNull(),
    lastFinalizedSlot: numeric('last_finalized_slot', { precision: 40, scale: 0 })
      .default('0')
      .notNull(),
    lastSignature: text('last_signature'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.consumer, t.chain, t.programId] })],
);
export const escrowReconciliations = pgTable('escrow_reconciliations', {
  id: uuid().defaultRandom().primaryKey(),
  bountyEscrowId: uuid('bounty_escrow_id')
    .references(() => bountyEscrows.id, { onDelete: 'cascade' })
    .notNull(),
  observedSlot: numeric('observed_slot', { precision: 40, scale: 0 }),
  dbState: jsonb('db_state').notNull(),
  chainState: jsonb('chain_state'),
  result: text().notNull(),
  error: text(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
export const problemSignals = pgTable('problem_signals', {
  id: uuid().defaultRandom().primaryKey(),
  problemId: uuid('problem_id')
    .references(() => problems.id, { onDelete: 'cascade' })
    .notNull(),
  signalType: text('signal_type').notNull(),
  strength: numeric({ precision: 4, scale: 3 }),
  statement: text().notNull(),
  sourceUrl: text('source_url'),
  observedAt: timestamp('observed_at', { withTimezone: true }),
  provenance: jsonb().default({}).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
export const problemProjectLinks = pgTable(
  'problem_project_links',
  {
    problemId: uuid('problem_id')
      .references(() => problems.id, { onDelete: 'cascade' })
      .notNull(),
    projectId: uuid('project_id')
      .references(() => projects.id, { onDelete: 'cascade' })
      .notNull(),
    relationshipType: text('relationship_type').notNull(),
    confidence: numeric({ precision: 4, scale: 3 }),
    evidence: jsonb().default({}).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.problemId, t.projectId, t.relationshipType] })],
);
export const idempotencyKeys = pgTable(
  'idempotency_keys',
  {
    scope: text().notNull(),
    actorId: uuid('actor_id')
      .references(() => users.id)
      .notNull(),
    key: text().notNull(),
    requestHash: text('request_hash').notNull(),
    responseStatus: integer('response_status'),
    responseBody: jsonb('response_body'),
    lockedAt: timestamp('locked_at', { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.scope, t.actorId, t.key] })],
);
export const bountyResolutions = pgTable('bounty_resolutions', {
  id: uuid().defaultRandom().primaryKey(),
  bountyId: uuid('bounty_id')
    .references(() => bounties.id)
    .notNull(),
  resolutionType: text('resolution_type').notNull(),
  status: text().notNull(),
  reason: text().notNull(),
  requestedBy: uuid('requested_by')
    .references(() => users.id)
    .notNull(),
  transactionSignature: text('transaction_signature'),
  ...timestamps,
});
export const withdrawalIntents = pgTable(
  'withdrawal_intents',
  {
    id: uuid().defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id)
      .notNull(),
    idempotencyKey: text('idempotency_key').notNull(),
    amountRaw: numeric('amount_raw', { precision: 40, scale: 0 }).notNull(),
    mintAddress: text('mint_address').notNull(),
    sourceAddress: text('source_address').notNull(),
    destinationAddress: text('destination_address').notNull(),
    status: text().default('created').notNull(),
    transactionSignature: text('transaction_signature'),
    lastError: text('last_error'),
    ...timestamps,
  },
  (t) => [uniqueIndex('withdrawal_intents_user_idempotency_uidx').on(t.userId, t.idempotencyKey)],
);
