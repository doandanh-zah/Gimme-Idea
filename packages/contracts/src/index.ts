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
  provenance: provenanceSchema,
  relatedIdeas: z.array(z.object({ slug: z.string(), title: z.string(), summary: z.string() })),
  bounty: z
    .object({
      title: z.string(),
      status: z.enum(['unfunded', 'mock_funded']),
      amountRaw: z.string(),
      currency: z.string(),
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
