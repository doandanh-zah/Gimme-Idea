import { afterEach, describe, expect, it } from 'vitest';
import type { IdeaDetailDTO, ProblemDetailDTO } from '@gimme-idea/contracts';
import type { KnowledgeRepository } from '@gimme-idea/db/repository';
import { buildApp } from './app.js';

const provenance = {
  origin: 'human' as const,
  reviewedByHuman: true,
  lastResearchedAt: null,
  sources: [],
};
const problem: ProblemDetailDTO = {
  id: '30000000-0000-4000-8000-000000000001',
  slug: 'test-problem',
  title: 'Test problem',
  summary: 'A bounded test problem.',
  description: 'Evidence-backed description.',
  affectedGroups: ['Operators'],
  evidence: ['Observed delay'],
  severity: 'high',
  status: 'published',
  researchStatus: 'verified',
  createdAt: '2026-08-20T08:00:00.000Z',
  creator: { username: 'test-user', displayName: 'Test User', avatarUrl: null },
  provenance,
  relatedIdeas: [],
  bounty: {
    title: 'Test bounty',
    status: 'mock_funded',
    amountRaw: '1000000',
    currency: 'USDC',
    openToHiring: true,
  },
};
const idea: IdeaDetailDTO = {
  id: '40000000-0000-4000-8000-000000000001',
  slug: 'test-idea',
  title: 'Test idea',
  summary: 'A bounded test idea.',
  thesis: 'A falsifiable thesis.',
  solution: 'A focused solution.',
  targetUsers: ['Operators'],
  status: 'published',
  researchStatus: 'verified',
  createdAt: '2026-08-21T08:00:00.000Z',
  creator: { username: 'test-user', displayName: 'Test User', avatarUrl: null },
  provenance,
  primaryProblem: { slug: problem.slug, title: problem.title, summary: problem.summary },
  previousAttempts: [],
  project: null,
};
const repo: KnowledgeRepository = {
  ping: () => Promise.resolve(true),
  findProblem: (slug) => Promise.resolve(slug === problem.slug ? problem : null),
  findIdea: (slug) => Promise.resolve(slug === idea.slug ? idea : null),
  close: () => Promise.resolve(),
};
const apps: Awaited<ReturnType<typeof buildApp>>[] = [];
afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

describe('API boundaries', () => {
  it('reports health and readiness', async () => {
    const app = await buildApp({ repository: repo, logger: false });
    apps.push(app);
    expect((await app.inject('/health')).statusCode).toBe(200);
    expect((await app.inject('/ready')).json()).toMatchObject({
      status: 'ready',
      checks: { database: 'ok', redis: 'not_configured' },
    });
  });
  it('returns schema-valid problem and idea data', async () => {
    const app = await buildApp({ repository: repo, logger: false });
    apps.push(app);
    expect((await app.inject('/v1/problems/test-problem')).json()).toMatchObject({
      slug: 'test-problem',
      creator: { username: 'test-user' },
      bounty: { openToHiring: true },
    });
    expect((await app.inject('/v1/ideas/test-idea')).json()).toMatchObject({ slug: 'test-idea' });
  });
  it('uses the stable 404 envelope', async () => {
    const app = await buildApp({ repository: repo, logger: false });
    apps.push(app);
    const response = await app.inject('/v1/problems/missing');
    const payload = response.json<{ code: string; message: string; requestId: string }>();
    expect(response.statusCode).toBe(404);
    expect(payload).toMatchObject({ code: 'PROBLEM_NOT_FOUND', message: 'Problem not found' });
    expect(payload.requestId).toBeTruthy();
  });
  it('keeps unknown routes outside feature boundaries', async () => {
    const app = await buildApp({ repository: repo, logger: false });
    apps.push(app);
    expect((await app.inject('/v1/create')).json()).toMatchObject({ code: 'ROUTE_NOT_FOUND' });
  });
  it('only exposes the injected development account and returns its real Devnet address', async () => {
    const app = await buildApp({
      repository: repo,
      logger: false,
      devMockAuth: () =>
        Promise.resolve({
          user: {
            id: 'dev-mock-builder',
            displayName: 'Devnet Builder',
            username: 'devnet-builder',
            avatarUrl: null,
          },
          wallet: {
            address: '8zD7fA1dP4xiM8ce7uePtwLnDCvDUDNzuysp9WTuxEwF',
            network: 'devnet',
            custody: 'development-server',
          },
        }),
    });
    apps.push(app);
    const response = await app.inject({ method: 'POST', url: '/v1/auth/mock' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      user: { username: 'devnet-builder' },
      wallet: { network: 'devnet', custody: 'development-server' },
    });
  });
});
