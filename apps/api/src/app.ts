import Fastify, { type FastifyInstance, type FastifyRequest } from 'fastify';
import { createHash, timingSafeEqual } from 'node:crypto';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import type { AuthIdentity, AuthVerifier } from '@gimme-idea/auth';
import {
  createBountySchema,
  createIdeaSchema,
  createPostSchema,
  createProblemSchema,
  createSubmissionSchema,
  fundingIntentSchema,
  ideaDetailSchema,
  problemDetailSchema,
  profileSyncSchema,
  queueRequestSchema,
  scoreReviewSchema,
  selectWinnerSchema,
} from '@gimme-idea/contracts';
import type { KnowledgeRepository, PlatformActor, PlatformRepository } from '@gimme-idea/db';
import { deriveBountyEscrowPda, deriveBountyIdFromUuid, hashBountyTerms } from '@gimme-idea/solana';
import type { DevMockSession } from './mock-auth.js';
import type { StorageSigner } from './storage.js';
import { createWalletLinkChallenge, verifyWalletLinkChallenge } from './wallet-link.js';

export type AppOptions = {
  repository: KnowledgeRepository;
  platformRepository?: PlatformRepository;
  authVerifier?: AuthVerifier;
  enqueue?: (
    queue: string,
    name: string,
    payload: Record<string, unknown>,
    jobId: string,
  ) => Promise<void>;
  logger?: boolean;
  devMockAuth?: (() => Promise<DevMockSession>) | null;
  allowedOrigins?: string[];
  readiness?: () => Promise<Record<string, 'ok' | 'failed' | 'not_configured'>>;
  storage?: StorageSigner;
  programId?: string;
  solanaCluster?: 'devnet' | 'mainnet-beta';
  chainWebhookSecret?: string;
  rateLimitMax?: number;
  devMockRateLimitMax?: number;
};

export const moduleBoundaries = [
  'identity',
  'organizations',
  'problems',
  'ideas',
  'projects',
  'bounties',
  'submissions',
  'posts',
  'research',
  'imports',
  'storage',
  'notifications',
  'moderation',
  'audit',
  'chain-reconciliation',
] as const;

function httpError(statusCode: number, code: string, message: string) {
  return Object.assign(new Error(message), { statusCode, code });
}

function idempotencyKey(request: FastifyRequest) {
  const value = request.headers['idempotency-key'];
  if (typeof value !== 'string' || value.length < 8 || value.length > 200) {
    throw httpError(400, 'IDEMPOTENCY_KEY_REQUIRED', 'A valid Idempotency-Key header is required.');
  }
  return value;
}
function secretsMatch(left: string | undefined, right: string | undefined) {
  if (!left || !right) return false;
  const a = createHash('sha256').update(left).digest();
  const b = createHash('sha256').update(right).digest();
  return timingSafeEqual(a, b);
}

async function identityFor(
  request: FastifyRequest,
  verifier?: AuthVerifier,
): Promise<AuthIdentity> {
  if (!verifier) throw httpError(401, 'UNAUTHENTICATED', 'Authentication is not configured.');
  return verifier.verifyAuthorizationHeader(request.headers.authorization);
}

async function actorFor(
  request: FastifyRequest,
  verifier?: AuthVerifier,
  repository?: PlatformRepository,
): Promise<PlatformActor> {
  if (!repository)
    throw httpError(
      503,
      'PLATFORM_REPOSITORY_UNAVAILABLE',
      'The platform repository is unavailable.',
    );
  return repository.syncActor(await identityFor(request, verifier));
}

export async function buildApp(options: AppOptions): Promise<FastifyInstance> {
  const {
    repository,
    platformRepository,
    authVerifier,
    logger = true,
    devMockAuth = null,
  } = options;
  const app = Fastify({
    logger,
    requestIdHeader: 'x-request-id',
    genReqId: () => crypto.randomUUID(),
    bodyLimit: 1_048_576,
  });
  await app.register(helmet, { contentSecurityPolicy: false });
  const allowed = new Set(options.allowedOrigins ?? ['http://localhost:3000']);
  await app.register(cors, {
    origin: (origin, callback) => callback(null, !origin || allowed.has(origin)),
    credentials: true,
  });
  await app.register(rateLimit, { max: options.rateLimitMax ?? 120, timeWindow: '1 minute' });

  app.get('/health', () => ({ service: 'api', status: 'ok', version: '3.0.0-v1' }));
  if (devMockAuth)
    app.post(
      '/v1/auth/mock',
      { config: { rateLimit: { max: options.devMockRateLimitMax ?? 5, timeWindow: '1 minute' } } },
      async () => devMockAuth(),
    );
  app.get('/ready', async (_request, reply) => {
    const database = await repository.ping().catch(() => false);
    const checks = options.readiness
      ? await options.readiness()
      : {
          database: database ? ('ok' as const) : ('failed' as const),
          aiProvider: 'not_configured' as const,
          redis: 'not_configured' as const,
          solana: 'not_configured' as const,
          storage: 'not_configured' as const,
        };
    if (!database || Object.values(checks).includes('failed')) reply.code(503);
    return {
      service: 'api',
      status: reply.statusCode === 503 ? 'not_ready' : 'ready',
      checks: { ...checks, database: database ? 'ok' : 'failed' },
    };
  });

  app.post('/v1/me/sync', async (request) => {
    if (!platformRepository)
      throw httpError(
        503,
        'PLATFORM_REPOSITORY_UNAVAILABLE',
        'The platform repository is unavailable.',
      );
    const identity = await identityFor(request, authVerifier);
    return platformRepository.syncActor(identity, profileSyncSchema.parse(request.body));
  });
  app.post('/v1/wallets/link-intent', async (request, reply) => {
    const actor = await actorFor(request, authVerifier, platformRepository);
    const walletAddress = (request.body as { walletAddress?: unknown })?.walletAddress;
    if (typeof walletAddress !== 'string')
      throw httpError(400, 'VALIDATION_ERROR', 'walletAddress is required.');
    let challenge;
    try {
      challenge = createWalletLinkChallenge(actor.id, walletAddress);
    } catch {
      throw httpError(400, 'INVALID_WALLET', 'A valid Solana wallet is required.');
    }
    const intentId = await platformRepository!.createWalletLinkIntent(
      actor.id,
      challenge.address,
      challenge.nonceHash,
    );
    return reply.code(201).send({
      intentId,
      walletAddress: challenge.address,
      nonce: challenge.nonce,
      message: challenge.message,
      expiresInSeconds: 600,
    });
  });
  app.post('/v1/wallets/verify', async (request, reply) => {
    const actor = await actorFor(request, authVerifier, platformRepository);
    const body = request.body as { walletAddress?: unknown; nonce?: unknown; signature?: unknown };
    if (
      typeof body.walletAddress !== 'string' ||
      typeof body.nonce !== 'string' ||
      typeof body.signature !== 'string'
    )
      throw httpError(400, 'VALIDATION_ERROR', 'walletAddress, nonce, and signature are required.');
    let verified;
    try {
      verified = verifyWalletLinkChallenge({
        userId: actor.id,
        walletAddress: body.walletAddress,
        nonce: body.nonce,
        signature: body.signature,
      });
    } catch (error) {
      if ((error as { statusCode?: number }).statusCode) throw error;
      throw httpError(400, 'INVALID_WALLET', 'A valid Solana wallet is required.');
    }
    await platformRepository!.consumeWalletLinkIntent(
      actor.id,
      verified.address,
      verified.nonceHash,
    );
    return reply.code(204).send();
  });

  app.get('/v1/home', async () => platformRepository?.home() ?? []);
  for (const kind of ['problems', 'ideas', 'projects', 'bounties', 'organizations'] as const) {
    app.get(`/v1/${kind}`, async (request) => {
      if (!platformRepository) return [];
      const query = request.query as { limit?: string; offset?: string };
      return platformRepository.listCatalog(
        kind,
        Math.min(Math.max(Number(query.limit) || 30, 1), 100),
        Math.max(Number(query.offset) || 0, 0),
      );
    });
  }
  app.get('/v1/search', async (request) => {
    const query = request.query as { q?: string; limit?: string };
    return (
      platformRepository?.searchPublic(
        (query.q ?? '').trim().slice(0, 200),
        Math.min(Number(query.limit) || 30, 100),
      ) ?? []
    );
  });
  app.get<{ Params: { slug: string } }>('/v1/organizations/:slug', async (request, reply) => {
    const value = await platformRepository?.findOrganization(request.params.slug);
    return (
      value ??
      reply.code(404).send({
        code: 'ORGANIZATION_NOT_FOUND',
        message: 'Organization not found',
        requestId: request.id,
      })
    );
  });
  app.get<{ Params: { slug: string } }>('/v1/projects/:slug', async (request, reply) => {
    let actorId: string | undefined;
    if (request.headers.authorization && platformRepository)
      actorId = (await actorFor(request, authVerifier, platformRepository)).id;
    const value = await platformRepository?.findProject(request.params.slug, actorId);
    return (
      value ??
      reply
        .code(404)
        .send({ code: 'PROJECT_NOT_FOUND', message: 'Project not found', requestId: request.id })
    );
  });
  app.get<{ Params: { slug: string } }>('/v1/bounties/:slug', async (request, reply) => {
    let actorId: string | undefined;
    if (request.headers.authorization && platformRepository)
      actorId = (await actorFor(request, authVerifier, platformRepository)).id;
    const value = await platformRepository?.findBounty(request.params.slug, actorId);
    return (
      value ??
      reply
        .code(404)
        .send({ code: 'BOUNTY_NOT_FOUND', message: 'Bounty not found', requestId: request.id })
    );
  });

  app.get<{ Params: { slug: string } }>('/v1/problems/:slug', async (request, reply) => {
    const value = await repository.findProblem(request.params.slug);
    if (!value)
      return reply
        .code(404)
        .send({ code: 'PROBLEM_NOT_FOUND', message: 'Problem not found', requestId: request.id });
    return problemDetailSchema.parse(value);
  });
  app.get<{ Params: { slug: string } }>('/v1/ideas/:slug', async (request, reply) => {
    const value = await repository.findIdea(request.params.slug);
    if (!value)
      return reply
        .code(404)
        .send({ code: 'IDEA_NOT_FOUND', message: 'Idea not found', requestId: request.id });
    return ideaDetailSchema.parse(value);
  });
  app.post('/v1/problems', async (request, reply) => {
    const actor = await actorFor(request, authVerifier, platformRepository);
    return reply
      .code(201)
      .send(
        await platformRepository!.createProblem(actor.id, createProblemSchema.parse(request.body)),
      );
  });
  app.post('/v1/ideas', async (request, reply) => {
    const actor = await actorFor(request, authVerifier, platformRepository);
    return reply
      .code(201)
      .send(await platformRepository!.createIdea(actor.id, createIdeaSchema.parse(request.body)));
  });
  app.post<{ Params: { kind: 'problems' | 'ideas'; id: string } }>(
    '/v1/:kind/:id/publish',
    async (request, reply) => {
      if (!['problems', 'ideas'].includes(request.params.kind))
        throw httpError(404, 'ROUTE_NOT_FOUND', 'Route not found');
      const actor = await actorFor(request, authVerifier, platformRepository);
      await platformRepository!.publishEntity(actor.id, request.params.kind, request.params.id);
      return reply.code(204).send();
    },
  );
  app.post('/v1/bounties', async (request, reply) => {
    const actor = await actorFor(request, authVerifier, platformRepository);
    const input = createBountySchema.parse(request.body);
    const bountyId = crypto.randomUUID();
    const terms = {
      version: 1,
      bountyId,
      type: input.type,
      currency: 'USDC',
      mintAddress: input.mintAddress,
      prizeAmountRaw: input.prizeAmountRaw,
      feeAmountRaw: input.feeAmountRaw,
      deadlineAt: input.deadlineAt,
      judgingDeadlineAt: input.judgingDeadlineAt,
      submissionVisibility: 'private',
      eligibility: input.eligibility,
      ipTerms: input.ipTerms,
      parentBountyId: input.parentBountyId,
      selectedIdeaId: input.selectedIdeaId,
    };
    return reply
      .code(201)
      .send(
        await platformRepository!.createBounty(
          actor.id,
          bountyId,
          input,
          terms,
          hashBountyTerms(terms),
        ),
      );
  });
  app.post<{ Params: { problemId: string } }>(
    '/v1/problems/:problemId/idea-bounties',
    async (request, reply) => {
      const actor = await actorFor(request, authVerifier, platformRepository);
      const body =
        request.body && typeof request.body === 'object'
          ? (request.body as Record<string, unknown>)
          : {};
      const input = createBountySchema.parse({
        ...body,
        type: 'idea',
        problemId: request.params.problemId,
        parentBountyId: null,
        selectedIdeaId: null,
      });
      const bountyId = crypto.randomUUID();
      const terms = {
        version: 1,
        bountyId,
        type: 'idea',
        currency: 'USDC',
        mintAddress: input.mintAddress,
        prizeAmountRaw: input.prizeAmountRaw,
        feeAmountRaw: input.feeAmountRaw,
        deadlineAt: input.deadlineAt,
        judgingDeadlineAt: input.judgingDeadlineAt,
        submissionVisibility: 'private',
        eligibility: input.eligibility,
        ipTerms: input.ipTerms,
        parentBountyId: null,
        selectedIdeaId: null,
      };
      return reply
        .code(201)
        .send(
          await platformRepository!.createBounty(
            actor.id,
            bountyId,
            input,
            terms,
            hashBountyTerms(terms),
          ),
        );
    },
  );
  app.post<{ Params: { ideaId: string } }>(
    '/v1/ideas/:ideaId/build-bounties',
    async (request, reply) => {
      const actor = await actorFor(request, authVerifier, platformRepository);
      const body =
        request.body && typeof request.body === 'object'
          ? (request.body as Record<string, unknown>)
          : {};
      const input = createBountySchema.parse({
        ...body,
        type: 'build',
        selectedIdeaId: request.params.ideaId,
      });
      const bountyId = crypto.randomUUID();
      const terms = {
        version: 1,
        bountyId,
        type: 'build',
        currency: 'USDC',
        mintAddress: input.mintAddress,
        prizeAmountRaw: input.prizeAmountRaw,
        feeAmountRaw: input.feeAmountRaw,
        deadlineAt: input.deadlineAt,
        judgingDeadlineAt: input.judgingDeadlineAt,
        submissionVisibility: 'private',
        eligibility: input.eligibility,
        ipTerms: input.ipTerms,
        parentBountyId: input.parentBountyId,
        selectedIdeaId: request.params.ideaId,
      };
      return reply
        .code(201)
        .send(
          await platformRepository!.createBounty(
            actor.id,
            bountyId,
            input,
            terms,
            hashBountyTerms(terms),
          ),
        );
    },
  );
  app.post<{ Params: { id: string } }>('/v1/bounties/:id/accept-terms', async (request, reply) => {
    const actor = await actorFor(request, authVerifier, platformRepository);
    const termsHash = (request.body as { termsHash?: unknown })?.termsHash;
    if (typeof termsHash !== 'string' || !/^[0-9a-f]{64}$/i.test(termsHash))
      throw httpError(400, 'VALIDATION_ERROR', 'A canonical termsHash is required.');
    await platformRepository!.acceptBountyTerms(actor.id, request.params.id, termsHash);
    return reply.code(204).send();
  });
  app.post<{ Params: { id: string } }>('/v1/bounties/:id/projects', async (request, reply) => {
    const actor = await actorFor(request, authVerifier, platformRepository);
    const body = request.body as { name?: unknown; summary?: unknown; description?: unknown };
    if (
      typeof body.name !== 'string' ||
      body.name.trim().length < 3 ||
      body.name.length > 180 ||
      typeof body.summary !== 'string' ||
      body.summary.trim().length < 20 ||
      body.summary.length > 500 ||
      typeof body.description !== 'string' ||
      body.description.trim().length < 30 ||
      body.description.length > 10_000
    )
      throw httpError(
        400,
        'VALIDATION_ERROR',
        'Project name, summary, and description are required.',
      );
    return reply.code(201).send(
      await platformRepository!.createPrivateBountyProject(actor.id, request.params.id, {
        name: body.name.trim(),
        summary: body.summary.trim(),
        description: body.description.trim(),
      }),
    );
  });
  app.post<{ Params: { id: string } }>(
    '/v1/bounties/:id/funding-intents',
    async (request, reply) => {
      const actor = await actorFor(request, authVerifier, platformRepository);
      const input = fundingIntentSchema.parse(request.body);
      const escrowAddress = deriveBountyEscrowPda(
        deriveBountyIdFromUuid(request.params.id),
        options.programId,
      ).toBase58();
      const intent = (await platformRepository!.createFundingIntent(
        actor.id,
        request.params.id,
        input.funderAddress,
        idempotencyKey(request),
        escrowAddress,
      )) as Record<string, unknown>;
      return reply.code(201).send({
        ...intent,
        escrowAddress,
        programId: options.programId,
        cluster: options.solanaCluster ?? 'devnet',
        canonical: false,
      });
    },
  );
  app.post<{ Params: { id: string } }>(
    '/v1/funding-intents/:id/submitted',
    async (request, reply) => {
      const actor = await actorFor(request, authVerifier, platformRepository);
      const signature = (request.body as { signature?: unknown })?.signature;
      if (typeof signature !== 'string' || signature.length < 64 || signature.length > 128)
        throw httpError(400, 'VALIDATION_ERROR', 'A Solana transaction signature is required.');
      const value = await platformRepository!.submitFundingIntent(
        actor.id,
        request.params.id,
        signature,
      );
      if (options.enqueue)
        await options.enqueue(
          'chain',
          'funding.verify',
          { bountyId: value.bountyId, signature },
          `funding:${signature}`,
        );
      return reply
        .code(202)
        .send({ status: 'submitted', canonical: false, reconciliationQueued: true });
    },
  );
  app.post<{ Params: { id: string } }>('/v1/bounties/:id/submissions', async (request, reply) => {
    const actor = await actorFor(request, authVerifier, platformRepository);
    return reply
      .code(201)
      .send(
        await platformRepository!.createSubmission(
          actor.id,
          request.params.id,
          createSubmissionSchema.parse(request.body),
        ),
      );
  });
  app.get<{ Params: { id: string } }>('/v1/bounties/:id/submissions', async (request) => {
    const actor = await actorFor(request, authVerifier, platformRepository);
    return platformRepository!.listSubmissions(actor.id, request.params.id);
  });
  app.get<{ Params: { id: string } }>('/v1/submissions/:id', async (request, reply) => {
    const actor = await actorFor(request, authVerifier, platformRepository);
    const value = await platformRepository!.findSubmission(actor.id, request.params.id);
    return (
      value ??
      reply.code(404).send({
        code: 'SUBMISSION_NOT_FOUND',
        message: 'Submission not found',
        requestId: request.id,
      })
    );
  });
  app.put<{ Params: { id: string } }>('/v1/submissions/:id/review', async (request, reply) => {
    const actor = await actorFor(request, authVerifier, platformRepository);
    await platformRepository!.scoreSubmission(
      actor.id,
      request.params.id,
      scoreReviewSchema.parse(request.body).scores,
    );
    return reply.code(204).send();
  });
  app.post<{ Params: { id: string } }>('/v1/bounties/:id/winner', async (request, reply) => {
    const actor = await actorFor(request, authVerifier, platformRepository);
    const input = selectWinnerSchema.parse(request.body);
    const result = (await platformRepository!.selectWinner(
      actor.id,
      request.params.id,
      input.submissionId,
      input.recipientAddress,
      idempotencyKey(request),
    )) as Record<string, unknown>;
    return reply
      .code(201)
      .send({ ...result, canonical: false, settlementQueued: false, chainCommitRequired: true });
  });
  app.post<{ Params: { id: string } }>('/v1/bounties/:id/resolutions', async (request, reply) => {
    const actor = await actorFor(request, authVerifier, platformRepository);
    const body = request.body as { type?: unknown; reason?: unknown };
    if (
      !['cancel', 'refund', 'dispute', 'manual_review'].includes(String(body.type)) ||
      typeof body.reason !== 'string' ||
      body.reason.trim().length < 8 ||
      body.reason.length > 2_000
    )
      throw httpError(400, 'VALIDATION_ERROR', 'A valid resolution type and reason are required.');
    const result = (await platformRepository!.createResolution(actor.id, request.params.id, {
      type: body.type as 'cancel' | 'refund' | 'dispute' | 'manual_review',
      reason: body.reason.trim(),
    })) as Record<string, unknown>;
    return reply
      .code(202)
      .send({ ...result, canonical: false, processingQueued: false, chainActionRequired: true });
  });
  app.post('/v1/withdrawals', async (request, reply) => {
    const actor = await actorFor(request, authVerifier, platformRepository);
    const body = request.body as {
      amountRaw?: unknown;
      mintAddress?: unknown;
      sourceAddress?: unknown;
      destinationAddress?: unknown;
    };
    const amountRaw = typeof body.amountRaw === 'string' ? body.amountRaw : '';
    const addresses = [body.mintAddress, body.sourceAddress, body.destinationAddress];
    if (
      !/^\d+$/.test(amountRaw) ||
      BigInt(amountRaw) <= 0n ||
      addresses.some((value) => typeof value !== 'string' || value.length < 32 || value.length > 64)
    )
      throw httpError(
        400,
        'VALIDATION_ERROR',
        'A positive raw amount and valid Solana addresses are required.',
      );
    const key = idempotencyKey(request);
    const result = (await platformRepository!.createWithdrawal(actor.id, {
      amountRaw,
      mintAddress: String(body.mintAddress),
      sourceAddress: String(body.sourceAddress),
      destinationAddress: String(body.destinationAddress),
      idempotencyKey: key,
    })) as Record<string, unknown>;
    return reply
      .code(202)
      .send({ ...result, canonical: false, processingQueued: false, userSignatureRequired: true });
  });
  app.post('/v1/posts', async (request, reply) => {
    const actor = await actorFor(request, authVerifier, platformRepository);
    return reply
      .code(201)
      .send(await platformRepository!.createPost(actor.id, createPostSchema.parse(request.body)));
  });
  app.get('/v1/posts', async (request) => {
    const query = request.query as { entityType?: string; entityId?: string };
    if (!query.entityType || !query.entityId)
      throw httpError(400, 'INVALID_QUERY', 'entityType and entityId are required.');
    return platformRepository?.listPosts(query.entityType, query.entityId) ?? [];
  });
  app.get<{ Params: { id: string } }>('/v1/posts/:id', async (request) => {
    const post = await platformRepository!.findPost(request.params.id);
    if (!post) throw httpError(404, 'POST_NOT_FOUND', 'Post not found');
    return post;
  });
  app.post<{ Params: { id: string } }>('/v1/posts/:id/replies', async (request, reply) => {
    const actor = await actorFor(request, authVerifier, platformRepository);
    const body = request.body as { body?: unknown; parentReplyId?: unknown };
    if (typeof body?.body !== 'string' || !body.body.trim() || body.body.length > 10_000)
      throw httpError(
        400,
        'VALIDATION_ERROR',
        'Reply body is required and must be under 10,000 characters.',
      );
    if (body.parentReplyId != null && typeof body.parentReplyId !== 'string')
      throw httpError(400, 'VALIDATION_ERROR', 'parentReplyId is invalid.');
    return reply.code(201).send(
      await platformRepository!.createReply(actor.id, request.params.id, {
        body: body.body.trim(),
        parentReplyId: body.parentReplyId,
      }),
    );
  });
  app.get('/v1/notifications', async (request) => {
    const actor = await actorFor(request, authVerifier, platformRepository);
    const query = request.query as { limit?: string };
    return platformRepository!.listNotifications(
      actor.id,
      Math.min(Math.max(Number(query.limit) || 30, 1), 100),
    );
  });
  app.patch<{ Params: { id: string } }>('/v1/notifications/:id/read', async (request, reply) => {
    const actor = await actorFor(request, authVerifier, platformRepository);
    const updated = await platformRepository!.markNotificationRead(actor.id, request.params.id);
    if (!updated) throw httpError(404, 'NOT_FOUND', 'Notification not found.');
    return reply.code(204).send();
  });
  app.post('/v1/moderation/flags', async (request, reply) => {
    const actor = await actorFor(request, authVerifier, platformRepository);
    const body = request.body as { entityType?: unknown; entityId?: unknown; reason?: unknown };
    if (
      typeof body.entityType !== 'string' ||
      body.entityType.length > 40 ||
      typeof body.entityId !== 'string' ||
      !/^[0-9a-f-]{36}$/i.test(body.entityId) ||
      typeof body.reason !== 'string' ||
      body.reason.trim().length < 8 ||
      body.reason.length > 1_000
    )
      throw httpError(400, 'VALIDATION_ERROR', 'A valid entity target and reason are required.');
    return reply.code(201).send(
      await platformRepository!.createModerationFlag(actor.id, {
        entityType: body.entityType,
        entityId: body.entityId,
        reason: body.reason.trim(),
      }),
    );
  });
  app.post('/v1/research/runs', async (request, reply) => {
    const actor = await actorFor(request, authVerifier, platformRepository);
    const input = queueRequestSchema.parse(request.body);
    const run = await platformRepository!.queueResearch(
      actor.id,
      input.entityType,
      input.entityId,
      input.entityVersion,
    );
    if (run.created && options.enqueue)
      await options.enqueue(
        'research',
        `research.${input.entityType}`,
        { runId: run.id, ...input },
        `research:${run.id}`,
      );
    return reply.code(run.created ? 202 : 200).send(run);
  });
  app.post('/v1/chain/events', async (request, reply) => {
    const supplied = request.headers['x-chain-webhook-secret'];
    if (typeof supplied !== 'string' || !secretsMatch(supplied, options.chainWebhookSecret))
      throw httpError(401, 'INVALID_WEBHOOK', 'The chain webhook credential is invalid.');
    const body = request.body as {
      signature?: unknown;
      eventIndex?: unknown;
      eventType?: unknown;
      slot?: unknown;
      programId?: unknown;
      accountAddress?: unknown;
      commitment?: unknown;
      payload?: unknown;
    };
    if (
      typeof body.signature !== 'string' ||
      !Number.isInteger(body.eventIndex) ||
      typeof body.eventType !== 'string' ||
      body.programId !== options.programId
    )
      throw httpError(400, 'INVALID_CHAIN_EVENT', 'The chain event envelope is invalid.');
    const eventIndex = Number(body.eventIndex);
    const inserted = await platformRepository!.recordChainEvent({
      signature: body.signature,
      eventIndex,
      eventType: body.eventType,
      slot: typeof body.slot === 'string' ? body.slot : null,
      programId: String(body.programId),
      accountAddress: typeof body.accountAddress === 'string' ? body.accountAddress : undefined,
      commitment: typeof body.commitment === 'string' ? body.commitment : 'observed',
      payload: body.payload ?? {},
    });
    if (inserted && options.enqueue)
      await options.enqueue(
        'chain',
        'escrow.reconcile',
        { accountAddress: body.accountAddress ?? null },
        `chain:${body.signature}:${eventIndex}`,
      );
    return reply
      .code(inserted ? 202 : 200)
      .send({ accepted: inserted, canonical: false, reconciliationQueued: inserted });
  });
  app.post('/v1/uploads/intents', async (request, reply) => {
    const actor = await actorFor(request, authVerifier, platformRepository);
    if (!options.storage)
      throw httpError(503, 'STORAGE_UNAVAILABLE', 'Object storage is not configured.');
    const body = request.body as {
      filename?: unknown;
      contentType?: unknown;
      sizeBytes?: unknown;
      visibility?: unknown;
    };
    if (
      typeof body.filename !== 'string' ||
      typeof body.contentType !== 'string' ||
      typeof body.sizeBytes !== 'number' ||
      !Number.isSafeInteger(body.sizeBytes) ||
      body.sizeBytes < 1 ||
      !['public', 'private'].includes(String(body.visibility))
    )
      throw httpError(
        400,
        'VALIDATION_ERROR',
        'filename, contentType, sizeBytes, and visibility are required.',
      );
    const allowed =
      body.visibility === 'private'
        ? ['image/png', 'image/jpeg', 'image/webp', 'application/pdf', 'video/mp4', 'video/webm']
        : ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
    const max = body.visibility === 'private' ? 25 * 1024 * 1024 : 5 * 1024 * 1024;
    if (!allowed.includes(body.contentType) || body.sizeBytes > max)
      throw httpError(400, 'UPLOAD_REJECTED', 'The upload type or size is not allowed.');
    const asset = await platformRepository!.createMediaAsset(actor.id, {
      filename: body.filename,
      contentType: body.contentType,
      sizeBytes: body.sizeBytes,
      visibility: body.visibility as 'public' | 'private',
    });
    const signed = await options.storage.createSignedUpload(asset.bucket, asset.objectKey);
    return reply
      .code(201)
      .send({ ...asset, ...signed, visibility: body.visibility, expiresInSeconds: 7200 });
  });
  app.post<{ Params: { id: string } }>('/v1/uploads/:id/complete', async (request, reply) => {
    const actor = await actorFor(request, authVerifier, platformRepository);
    if (!options.storage)
      throw httpError(503, 'STORAGE_UNAVAILABLE', 'Object storage is not configured.');
    const asset = await platformRepository!.getMediaAsset(actor.id, request.params.id);
    if (!asset) throw httpError(404, 'NOT_FOUND', 'Media asset not found.');
    if (!(await options.storage.objectExists(asset.bucket, asset.objectKey)))
      throw httpError(409, 'UPLOAD_INCOMPLETE', 'The object is not present in storage.');
    await platformRepository!.completeMediaAsset(actor.id, asset.id);
    return reply.code(204).send();
  });
  app.get<{ Params: { id: string } }>('/v1/uploads/:id/download', async (request) => {
    const actor = await actorFor(request, authVerifier, platformRepository);
    if (!options.storage)
      throw httpError(503, 'STORAGE_UNAVAILABLE', 'Object storage is not configured.');
    const asset = await platformRepository!.getMediaAssetForView(actor.id, request.params.id);
    if (!asset) throw httpError(404, 'NOT_FOUND', 'Media asset not found.');
    return {
      url: await options.storage.createSignedDownload(asset.bucket, asset.objectKey, 300),
      expiresInSeconds: 300,
    };
  });
  app.post<{ Params: { id: string } }>('/v1/uploads/:id/attach', async (request, reply) => {
    const actor = await actorFor(request, authVerifier, platformRepository);
    const body = request.body as { entityType?: unknown; entityId?: unknown; position?: unknown };
    if (
      !['problem', 'idea', 'project', 'post', 'submission'].includes(String(body.entityType)) ||
      typeof body.entityId !== 'string' ||
      (body.position !== undefined &&
        (!Number.isInteger(body.position) || Number(body.position) < 0))
    )
      throw httpError(
        400,
        'VALIDATION_ERROR',
        'A valid entityType, entityId, and position are required.',
      );
    await platformRepository!.attachMediaAsset(
      actor.id,
      request.params.id,
      body.entityType as 'problem' | 'idea' | 'project' | 'post' | 'submission',
      body.entityId,
      Number(body.position ?? 0),
    );
    return reply.code(204).send();
  });

  app.setNotFoundHandler((request, reply) =>
    reply
      .code(404)
      .send({ code: 'ROUTE_NOT_FOUND', message: 'Route not found', requestId: request.id }),
  );
  app.setErrorHandler((error, request, reply) => {
    const known = error instanceof Error ? error : new Error('Unknown server error');
    const metadata = known as Error & { statusCode?: unknown; code?: unknown };
    const statusCode =
      typeof metadata.statusCode === 'number'
        ? metadata.statusCode
        : known.name === 'ZodError'
          ? 400
          : 500;
    if (statusCode >= 500) request.log.error(known);
    else request.log.warn({ code: metadata.code }, known.message);
    reply.code(statusCode).send({
      code:
        typeof metadata.code === 'string'
          ? metadata.code
          : statusCode === 400
            ? 'VALIDATION_ERROR'
            : 'INTERNAL_ERROR',
      message: statusCode >= 500 ? 'Unexpected server error' : known.message,
      requestId: request.id,
    });
  });
  return app;
}
