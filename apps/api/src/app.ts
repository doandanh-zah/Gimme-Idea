import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { ideaDetailSchema, problemDetailSchema } from '@gimme-idea/contracts';
import type { KnowledgeRepository } from '@gimme-idea/db/repository';

export type AppOptions = { repository: KnowledgeRepository; logger?: boolean };
export const moduleBoundaries = [
  'identity',
  'organizations',
  'problems',
  'ideas',
  'projects',
  'bounties',
  'submissions',
  'discussions',
  'research',
  'imports',
  'moderation',
  'audit',
] as const;

export async function buildApp({
  repository,
  logger = true,
}: AppOptions): Promise<FastifyInstance> {
  const app = Fastify({
    logger,
    requestIdHeader: 'x-request-id',
    genReqId: () => crypto.randomUUID(),
  });
  await app.register(cors, { origin: true });
  app.get('/health', () => ({ service: 'api', status: 'ok', version: '2.0.0-foundation' }));
  app.get('/ready', async (_request, reply) => {
    const database = await repository.ping().catch(() => false);
    if (!database) reply.code(503);
    return {
      service: 'api',
      status: database ? 'ready' : 'not_ready',
      checks: {
        database: database ? 'ok' : 'failed',
        aiProvider: 'not_configured',
        redis: 'not_configured',
        solana: 'not_configured',
      },
    };
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
  app.setNotFoundHandler((request, reply) =>
    reply
      .code(404)
      .send({ code: 'ROUTE_NOT_FOUND', message: 'Route not found', requestId: request.id }),
  );
  app.setErrorHandler((error, request, reply) => {
    request.log.error(error);
    const known = error instanceof Error ? error : new Error('Unknown server error');
    const statusCode =
      'statusCode' in known && typeof known.statusCode === 'number' ? known.statusCode : 500;
    reply.code(statusCode >= 400 ? statusCode : 500).send({
      code: 'INTERNAL_ERROR',
      message: statusCode < 500 ? known.message : 'Unexpected server error',
      requestId: request.id,
    });
  });
  return app;
}
