import { afterEach, describe, expect, it } from 'vitest';
import type { AuthIdentity, AuthVerifier } from '@gimme-idea/auth';
import type { KnowledgeRepository, PlatformRepository } from '@gimme-idea/db';
import { buildApp } from './app.js';

const knowledge = {
  ping: () => Promise.resolve(true),
  findProblem: () => Promise.resolve(null),
  findIdea: () => Promise.resolve(null),
  close: () => Promise.resolve(),
} satisfies KnowledgeRepository;
const verifier: AuthVerifier = {
  verifyAuthorizationHeader: (header) => {
    if (!header?.startsWith('Bearer '))
      throw Object.assign(new Error('Authentication is required.'), {
        statusCode: 401,
        code: 'UNAUTHENTICATED',
      });
    const subject = header.slice(7);
    return Promise.resolve({ provider: 'dev', subject, sessionId: `session-${subject}` });
  },
};
const submission = {
  id: '62000000-0000-4000-8000-000000000001',
  bounty_id: '60000000-0000-4000-8000-000000000001',
  submitted_by: 'owner',
  title: 'Private direction',
};
const platform = {
  syncActor: (identity: AuthIdentity) =>
    Promise.resolve({
      id: identity.subject,
      provider: identity.provider,
      subject: identity.subject,
      username: null,
      displayName: null,
    }),
  findSubmission: (actorId: string, id: string) =>
    Promise.resolve(
      id === submission.id && ['owner', 'judge'].includes(actorId) ? submission : null,
    ),
} as unknown as PlatformRepository;
const apps: Awaited<ReturnType<typeof buildApp>>[] = [];
afterEach(async () => Promise.all(apps.splice(0).map((app) => app.close())));

describe('private content boundary', () => {
  it('rejects anonymous reads and returns the same server identity across sessions', async () => {
    const app = await buildApp({
      repository: knowledge,
      platformRepository: platform,
      authVerifier: verifier,
      logger: false,
    });
    apps.push(app);
    expect((await app.inject(`/v1/submissions/${submission.id}`)).statusCode).toBe(401);
    const first = await app.inject({
      url: '/v1/me/sync',
      method: 'POST',
      headers: { authorization: 'Bearer owner' },
      payload: { username: 'owner', displayName: 'Owner' },
    });
    const second = await app.inject({
      url: '/v1/me/sync',
      method: 'POST',
      headers: { authorization: 'Bearer owner' },
      payload: { username: 'owner', displayName: 'Owner' },
    });
    expect(first.json<{ id: string }>().id).toBe(second.json<{ id: string }>().id);
  });
  it('does not disclose a submission to another authenticated user', async () => {
    const app = await buildApp({
      repository: knowledge,
      platformRepository: platform,
      authVerifier: verifier,
      logger: false,
    });
    apps.push(app);
    const denied = await app.inject({
      url: `/v1/submissions/${submission.id}`,
      headers: { authorization: 'Bearer stranger' },
    });
    expect(denied.statusCode).toBe(404);
    expect(JSON.stringify(denied.json())).not.toContain('Private direction');
    const allowed = await app.inject({
      url: `/v1/submissions/${submission.id}`,
      headers: { authorization: 'Bearer judge' },
    });
    expect(allowed.statusCode).toBe(200);
  });
});
