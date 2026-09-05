import { getIdea, getProblem, request, browserRequest } from '@/lib/api';
import type {
  BountyModel,
  BountyStage,
  HomeFeedItem,
  OrganizationSummary,
  PrivateSubmissionModel,
  ProblemReferenceModel,
  ProjectModel,
  SearchResult,
} from './types';

type Row = Record<string, unknown>;
const asString = (value: unknown, fallback = '') => (typeof value === 'string' ? value : fallback);
const asArray = (value: unknown) =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
const date = (value: unknown) =>
  value instanceof Date ? value.toISOString() : asString(value, new Date(0).toISOString());
const usdc = (raw: string) => Number(BigInt(raw)) / 1_000_000;

async function list(path: string) {
  return ((await request(path)) ?? []) as Row[];
}

function problemFrom(value: unknown): ProblemReferenceModel {
  const row = (value && typeof value === 'object' ? value : {}) as Row;
  return {
    slug: asString(row.slug),
    title: asString(row.title),
    summary: asString(row.summary),
    industry: asString(row.industry, 'Unspecified'),
    region: asString(row.region, 'Unspecified'),
  };
}
function organizationFrom(row: Row): OrganizationSummary {
  return {
    slug: asString(row.organizationSlug ?? row.slug),
    name: asString(row.organizationName ?? row.name),
    description: asString(row.description),
    origin: 'api',
  };
}
function bountyFrom(row: Row): BountyModel {
  const problem = problemFrom(
    row.problem ?? { slug: row.problemSlug, title: row.problemTitle, summary: row.description },
  );
  const organization = organizationFrom(
    (row.organization && typeof row.organization === 'object' ? row.organization : row) as Row,
  );
  const prizeRaw = asString(row.prizeAmountRaw ?? row.prize_amount_raw, '0');
  const feeRaw = asString(row.feeAmountRaw ?? row.fee_amount_raw, '0');
  const escrow = (
    row.escrow && typeof row.escrow === 'object'
      ? row.escrow
      : { status: row.escrowStatus, address: row.escrowAddress }
  ) as Row;
  const escrowStatus = asString(escrow.status);
  return {
    id: asString(row.id),
    slug: asString(row.slug),
    title: asString(row.title),
    stage: asString(row.type ?? row.bounty_type, 'idea') as BountyStage,
    status: asString(row.status, 'draft') as BountyModel['status'],
    visibility: 'public',
    origin: 'api',
    organization,
    problem,
    amountUsdc: usdc(prizeRaw),
    platformFeeUsdc: feeRaw === '0' ? null : usdc(feeRaw),
    amountRaw: prizeRaw,
    platformFeeRaw: feeRaw,
    funding:
      escrowStatus === 'funded'
        ? asString(escrow.cluster) === 'mainnet-beta'
          ? 'mainnet_verified'
          : 'devnet_verified'
        : escrowStatus === 'chain_unverified'
          ? 'development_unverified'
          : 'not_connected',
    explorerUrl: asString(escrow.address)
      ? `https://explorer.solana.com/address/${asString(escrow.address)}?cluster=${asString(escrow.cluster, 'devnet')}`
      : undefined,
    deadline: date(row.deadlineAt ?? row.deadline_at),
    judgingDeadline: date(row.judgingDeadlineAt ?? row.judging_deadline_at),
    privateSubmissionCount: Number(row.submission_count ?? 0),
    summary: asString(row.description),
    objective: asString(row.objective, row.description as string),
    requirements: asArray(row.requirements),
    constraints: asArray(row.constraints),
    criteria: [],
    eligibility: asArray(row.eligibility),
    ipTerms: asString(row.ip_terms, 'Terms are shown before submission.'),
    termsHash: asString(row.termsHash ?? row.terms_hash),
  };
}
function projectFrom(row: Row): ProjectModel {
  const problem = problemFrom(row.problem);
  const stage = asString(row.stage, 'concept');
  return {
    id: asString(row.id),
    slug: asString(row.slug),
    name: asString(row.name),
    summary: asString(row.summary, row.description as string),
    mode:
      asString(row.originType ?? row.origin_type) === 'historical_import'
        ? 'historical_imported'
        : 'public_community',
    visibility: asString(row.visibility, 'public') as ProjectModel['visibility'],
    origin: 'api',
    status: stage,
    problem,
    team: [],
    technologies: [],
    repositoryUrl: asString(row.repositoryUrl ?? row.repository_url) || undefined,
    demoUrl: asString(row.demoUrl ?? row.demo_url) || undefined,
    research: {
      problemSignal: 'Research is queued from the canonical project record.',
      approach: asString(row.description),
      targetUsers: [],
      whatChanged: 'No verified update recorded.',
      confidence: 'low',
      reviewed: false,
    },
    outcome: {
      state: stage === 'live' ? 'live' : stage === 'paused' ? 'paused' : 'unknown',
      summary: 'No verified outcome has been recorded.',
    },
  };
}

export const problemClient = { get: getProblem, list: () => list('/v1/problems') };
export const ideaClient = { get: getIdea, list: () => list('/v1/ideas') };
export const homeClient = {
  list: async (): Promise<HomeFeedItem[]> => {
    const rows = await list('/v1/home');
    const [bounties, projects, problems] = await Promise.all([
      bountyClient.list(),
      projectClient.list(),
      problemClient.list(),
    ]);
    return rows.flatMap((row): HomeFeedItem[] => {
      const type = asString(row.type);
      if (type === 'bounty') {
        const found = bounties.find((item) => item.id === row.id);
        return found ? [{ type: 'bounty', priority: Number(row.priority), bounty: found }] : [];
      }
      if (type === 'project') {
        const found = projects.find((item) => item.id === row.id);
        return found ? [{ type: 'project', priority: Number(row.priority), project: found }] : [];
      }
      if (type === 'problem') {
        const found = problems.find((item) => item.id === row.id);
        return found
          ? [
              {
                type: 'problem',
                priority: Number(row.priority),
                problem: problemFrom(found),
                ideaCount: 0,
                archiveCount: 0,
              },
            ]
          : [];
      }
      if (type === 'update')
        return [
          {
            type: 'update',
            priority: Number(row.priority),
            id: asString(row.id),
            label: 'Contextual discussion',
            title: asString(row.title),
            body: asString(row.summary),
            href: `/home/${asString(row.slug)}`,
          },
        ];
      return [];
    });
  },
};
export const projectClient = {
  list: async () => (await list('/v1/projects')).map(projectFrom),
  get: async (slug: string) => {
    const value = await request(`/v1/projects/${encodeURIComponent(slug)}`);
    return value ? projectFrom(value as Row) : null;
  },
};
export const bountyClient = {
  list: async (stage?: BountyStage) => {
    const values = (await list('/v1/bounties')).map(bountyFrom);
    return stage ? values.filter((item) => item.stage === stage) : values;
  },
  get: async (slug: string) => {
    const value = await request(`/v1/bounties/${encodeURIComponent(slug)}`);
    return value ? bountyFrom(value as Row) : null;
  },
};
export const organizationClient = {
  get: async (slug: string) => {
    const value = await request(`/v1/organizations/${encodeURIComponent(slug)}`);
    return value ? organizationFrom(value as Row) : null;
  },
};
export const submissionClient = {
  get: async (id: string, accessToken?: string | null): Promise<PrivateSubmissionModel | null> => {
    const value = await browserRequest<Row>(`/v1/submissions/${encodeURIComponent(id)}`, {
      accessToken,
    });
    return value
      ? {
          id: asString(value.id),
          bountySlug: asString(value.bounty_slug),
          kind: asString(value.submission_kind) as 'idea' | 'project',
          title: asString(value.title),
          summary: asString(value.description),
          owner: 'Private entrant',
          visibility: 'private_judge',
          status: asString(value.status) as PrivateSubmissionModel['status'],
          submittedAt: date(value.submitted_at),
          snapshotVersion: String(value.current_version),
        }
      : null;
  },
  forBounty: async (
    bountyId: string,
    accessToken?: string | null,
  ): Promise<PrivateSubmissionModel[]> =>
    (
      (await browserRequest<Row[]>(`/v1/bounties/${encodeURIComponent(bountyId)}/submissions`, {
        accessToken,
      })) ?? []
    ).map((value) => ({
      id: asString(value.id),
      bountySlug: bountyId,
      kind: asString(value.kind ?? value.submission_kind) as 'idea' | 'project',
      title: asString(value.title),
      summary: asString(value.summary ?? value.description),
      owner: 'Private entrant',
      visibility: 'private_judge',
      status: asString(value.status) as PrivateSubmissionModel['status'],
      submittedAt: date(value.submittedAt ?? value.submitted_at),
      snapshotVersion: String(value.currentVersion ?? value.current_version),
    })),
  create: async (
    bountyId: string,
    input: unknown,
    accessToken: string,
    idempotencyKey = crypto.randomUUID(),
  ) =>
    browserRequest(`/v1/bounties/${encodeURIComponent(bountyId)}/submissions`, {
      method: 'POST',
      accessToken,
      headers: { 'idempotency-key': idempotencyKey },
      body: JSON.stringify(input),
    }),
};

export async function searchPublicCatalog(locale: string, query: string): Promise<SearchResult[]> {
  const rows = await list(`/v1/search?q=${encodeURIComponent(query)}`);
  return rows.map((row) => ({
    type: asString(row.type) as SearchResult['type'],
    title: asString(row.title),
    summary: asString(row.summary),
    href: `/${locale}/${asString(row.type) === 'organization' ? 'org' : `${asString(row.type)}s`}/${asString(row.slug)}`,
    origin: 'api',
  }));
}
