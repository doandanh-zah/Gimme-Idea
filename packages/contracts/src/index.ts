import { z } from 'zod';

export const localeSchema = z.enum(['en', 'vi']);
export type Locale = z.infer<typeof localeSchema>;

export const researchStatusSchema = z.enum([
  'unresearched',
  'queued',
  'researching',
  'verified',
  'needs_review',
]);
export type ResearchStatusDTO = z.infer<typeof researchStatusSchema>;

export const sourceSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  url: z.string().url(),
  publisher: z.string().nullable(),
  publishedAt: z.string().datetime().nullable(),
});
export type SourceDTO = z.infer<typeof sourceSchema>;

export const provenanceSchema = z.object({
  origin: z.enum(['human', 'ai_assisted', 'imported']),
  reviewedByHuman: z.boolean(),
  lastResearchedAt: z.string().datetime().nullable(),
  sources: z.array(sourceSchema),
});
export type ProvenanceDTO = z.infer<typeof provenanceSchema>;

export const creatorSummarySchema = z.object({
  username: z.string(),
  displayName: z.string(),
  avatarUrl: z.string().url().nullable(),
});
export type CreatorSummaryDTO = z.infer<typeof creatorSummarySchema>;

export const previousAttemptSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  outcome: z.enum(['active', 'failed', 'acquired', 'sunset', 'unknown']),
  lesson: z.string(),
  sourceUrl: z.string().url().nullable(),
});
export type PreviousAttemptDTO = z.infer<typeof previousAttemptSchema>;

export const problemDetailSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  title: z.string(),
  summary: z.string(),
  description: z.string(),
  affectedGroups: z.array(z.string()),
  evidence: z.array(z.string()),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  status: z.enum(['draft', 'published', 'archived']),
  researchStatus: researchStatusSchema,
  createdAt: z.string().datetime(),
  creator: creatorSummarySchema.nullable(),
  provenance: provenanceSchema,
  relatedIdeas: z.array(z.object({ slug: z.string(), title: z.string(), summary: z.string() })),
  bounty: z
    .object({
      title: z.string(),
      status: z.enum([
        'draft',
        'awaiting_funding',
        'funding_pending',
        'open',
        'closed',
        'judging',
        'completed',
        'cancelled',
        'refunded',
        'resolution',
      ]),
      amountRaw: z.string(),
      currency: z.string(),
      openToHiring: z.boolean(),
    })
    .nullable(),
});
export type ProblemDetailDTO = z.infer<typeof problemDetailSchema>;

export const ideaDetailSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  title: z.string(),
  summary: z.string(),
  thesis: z.string(),
  solution: z.string(),
  targetUsers: z.array(z.string()),
  status: z.enum(['draft', 'published', 'archived']),
  researchStatus: researchStatusSchema,
  createdAt: z.string().datetime(),
  creator: creatorSummarySchema.nullable(),
  provenance: provenanceSchema,
  primaryProblem: z.object({ slug: z.string(), title: z.string(), summary: z.string() }),
  previousAttempts: z.array(previousAttemptSchema),
  project: z.object({ slug: z.string(), name: z.string(), stage: z.string() }).nullable(),
});
export type IdeaDetailDTO = z.infer<typeof ideaDetailSchema>;

export const apiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
  requestId: z.string(),
});
export type ApiError = z.infer<typeof apiErrorSchema>;

export const healthSchema = z.object({
  service: z.string(),
  status: z.literal('ok'),
  version: z.string(),
});
export const readinessSchema = z.object({
  service: z.string(),
  status: z.enum(['ready', 'not_ready']),
  checks: z.record(z.string(), z.enum(['ok', 'failed', 'not_configured'])),
});

export const uuidSchema = z.string().uuid();
export const rawAmountSchema = z
  .string()
  .regex(/^\d+$/, 'Token amounts must be unsigned integer strings.');
export const visibilitySchema = z.enum(['public', 'organization', 'private']);

export const actorSchema = z.object({
  id: uuidSchema,
  provider: z.enum(['privy', 'dev']),
  subject: z.string().min(1),
  username: z.string().nullable(),
  displayName: z.string().nullable(),
});
export type ActorDTO = z.infer<typeof actorSchema>;

export const profileSyncSchema = z.object({
  username: z
    .string()
    .trim()
    .min(2)
    .max(32)
    .regex(/^[a-z0-9_-]+$/),
  displayName: z.string().trim().min(1).max(80),
  avatarUrl: z.string().url().nullable().optional(),
  rewardWalletAddress: z.string().min(32).max(64).optional(),
});

export const createProblemSchema = z.object({
  title: z.string().trim().min(8).max(180),
  summary: z.string().trim().min(20).max(500),
  description: z.string().trim().min(30).max(20_000),
  industry: z.string().trim().max(100).nullable().optional(),
  region: z.string().trim().max(100).nullable().optional(),
  affectedGroups: z.array(z.string().trim().min(1).max(120)).max(20).default([]),
  evidence: z.array(z.string().trim().min(1).max(1_000)).max(30).default([]),
  desiredOutcome: z.string().trim().max(3_000).nullable().optional(),
  constraints: z.array(z.string().trim().min(1).max(500)).max(30).default([]),
  successMetrics: z.array(z.string().trim().min(1).max(500)).max(30).default([]),
  visibility: visibilitySchema.default('public'),
  organizationId: uuidSchema.nullable().optional(),
});
export type CreateProblemInput = z.infer<typeof createProblemSchema>;

export const createIdeaSchema = z.object({
  problemId: uuidSchema,
  title: z.string().trim().min(5).max(180),
  summary: z.string().trim().min(20).max(500),
  thesis: z.string().trim().min(20).max(5_000),
  solution: z.string().trim().min(20).max(10_000),
  opportunity: z.string().trim().max(5_000).nullable().optional(),
  whyNow: z.string().trim().max(5_000).nullable().optional(),
  targetUsers: z.array(z.string().trim().min(1).max(120)).max(20).default([]),
  risks: z.array(z.string().trim().min(1).max(500)).max(30).default([]),
  validationPlan: z.string().trim().max(5_000).nullable().optional(),
  visibility: visibilitySchema.default('public'),
});
export type CreateIdeaInput = z.infer<typeof createIdeaSchema>;

export const bountyStatusSchema = z.enum([
  'draft',
  'awaiting_funding',
  'funding_pending',
  'funded',
  'open',
  'closed',
  'judging',
  'winner_pending_chain',
  'settlement_pending',
  'completed',
  'cancelled',
  'refunded',
  'resolution',
]);
export const bountyTermsSchema = z.object({
  version: z.literal(1),
  bountyId: uuidSchema,
  type: z.enum(['idea', 'build']),
  currency: z.literal('USDC'),
  mintAddress: z.string().min(32).max(64),
  prizeAmountRaw: rawAmountSchema,
  feeAmountRaw: rawAmountSchema,
  deadlineAt: z.string().datetime(),
  judgingDeadlineAt: z.string().datetime(),
  submissionVisibility: z.literal('private'),
  eligibility: z.array(z.string()),
  ipTerms: z.string().min(1),
  parentBountyId: uuidSchema.nullable(),
  selectedIdeaId: uuidSchema.nullable(),
});
export type BountyTermsDTO = z.infer<typeof bountyTermsSchema>;

export const createBountySchema = z.object({
  slug: z
    .string()
    .trim()
    .min(3)
    .max(100)
    .regex(/^[a-z0-9-]+$/),
  type: z.enum(['idea', 'build']),
  problemId: uuidSchema,
  organizationId: uuidSchema,
  parentBountyId: uuidSchema.nullable().default(null),
  selectedIdeaId: uuidSchema.nullable().default(null),
  title: z.string().trim().min(8).max(180),
  description: z.string().trim().min(20).max(10_000),
  objective: z.string().trim().min(20).max(5_000),
  prizeAmountRaw: rawAmountSchema,
  feeAmountRaw: rawAmountSchema,
  mintAddress: z.string().min(32).max(64),
  deadlineAt: z.string().datetime(),
  judgingDeadlineAt: z.string().datetime(),
  requirements: z.array(z.string()).max(30).default([]),
  constraints: z.array(z.string()).max(30).default([]),
  eligibility: z.array(z.string()).max(30).default([]),
  ipTerms: z.string().min(1).max(10_000),
});
export type CreateBountyInput = z.infer<typeof createBountySchema>;

export const fundingIntentSchema = z.object({
  funderAddress: z.string().min(32).max(64),
});

export const createSubmissionSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('idea'),
    payload: z.object({
      title: z.string().min(5).max(180),
      summary: z.string().min(20).max(1_000),
      opportunity: z.string().min(20).max(5_000),
      solution: z.string().min(20).max(10_000),
      how: z.string().min(10).max(5_000),
      why: z.string().min(10).max(5_000),
    }),
  }),
  z.object({
    kind: z.literal('project'),
    projectId: uuidSchema,
    snapshot: z.record(z.string(), z.unknown()),
  }),
]);
export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;

export const scoreReviewSchema = z.object({
  scores: z
    .array(
      z.object({
        criterionId: uuidSchema,
        score: z.number().min(0).max(100),
        note: z.string().max(2_000).optional(),
      }),
    )
    .min(1),
});
export const selectWinnerSchema = z.object({
  submissionId: uuidSchema,
  recipientAddress: z.string().min(32).max(64),
});

export const createPostSchema = z.object({
  entityType: z.enum(['problem', 'idea', 'project', 'bounty']),
  entityId: uuidSchema,
  title: z.string().trim().min(1).max(180),
  body: z.string().trim().min(1).max(20_000),
  quotedPostId: uuidSchema.nullable().optional(),
});

export const queueRequestSchema = z.object({
  entityType: z.enum(['problem', 'idea']),
  entityId: uuidSchema,
  entityVersion: z.number().int().positive(),
});
