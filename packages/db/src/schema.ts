import { sql } from 'drizzle-orm';
import {
  boolean,
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
  authUserId: uuid('auth_user_id').notNull().unique(),
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
    ideaId: uuid('idea_id')
      .references(() => ideas.id)
      .notNull(),
    slug: text().notNull().unique(),
    name: text().notNull(),
    description: text().notNull(),
    stage: text().default('prototype').notNull(),
    repositoryUrl: text('repository_url'),
    websiteUrl: text('website_url'),
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
    problemId: uuid('problem_id')
      .references(() => problems.id)
      .notNull(),
    organizationId: uuid('organization_id').references(() => organizations.id),
    title: text().notNull(),
    description: text().notNull(),
    status: text().default('unfunded').notNull(),
    currency: text().default('USDC').notNull(),
    totalAmountRaw: numeric('total_amount_raw', { precision: 40, scale: 0 }).default('0').notNull(),
    deadlineAt: timestamp('deadline_at', { withTimezone: true }),
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
  escrowAddress: text('escrow_address'),
  fundingSignature: text('funding_signature'),
  fundedAmountRaw: numeric('funded_amount_raw', { precision: 40, scale: 0 }).default('0').notNull(),
  confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
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

export const discussions = pgTable(
  'discussions',
  {
    id: uuid().defaultRandom().primaryKey(),
    entityType: text('entity_type').notNull(),
    entityId: uuid('entity_id').notNull(),
    title: text().notNull(),
    body: text().notNull(),
    createdBy: uuid('created_by').references(() => users.id),
    ...timestamps,
    ...softDelete,
  },
  (t) => [index('discussions_entity_idx').on(t.entityType, t.entityId)],
);
export const discussionReplies = pgTable('discussion_replies', {
  id: uuid().defaultRandom().primaryKey(),
  discussionId: uuid('discussion_id')
    .references(() => discussions.id, { onDelete: 'cascade' })
    .notNull(),
  parentReplyId: uuid('parent_reply_id'),
  body: text().notNull(),
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
    importedAt: timestamp('imported_at', { withTimezone: true }).defaultNow().notNull(),
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
  ...timestamps,
});
export const blockchainEvents = pgTable(
  'blockchain_events',
  {
    id: uuid().defaultRandom().primaryKey(),
    chain: text().default('solana').notNull(),
    signature: text().notNull(),
    eventType: text('event_type').notNull(),
    slot: numeric({ precision: 40, scale: 0 }),
    payload: jsonb().notNull(),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => [uniqueIndex('blockchain_events_signature_type_uidx').on(t.signature, t.eventType)],
);
export const notifications = pgTable('notifications', {
  id: uuid().defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => users.id)
    .notNull(),
  type: text().notNull(),
  payload: jsonb().default({}).notNull(),
  readAt: timestamp('read_at', { withTimezone: true }),
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
