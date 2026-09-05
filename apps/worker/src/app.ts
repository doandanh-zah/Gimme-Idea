import Fastify from 'fastify';

export const jobRegistry = {
  'research.problem': { queue: 'research', enabled: true },
  'research.idea': { queue: 'research', enabled: true },
  'escrow.reconcile': { queue: 'chain', enabled: true },
  'colosseum.incremental': { queue: 'imports', enabled: true },
  'notification.deliver': { queue: 'notifications', enabled: true },
} as const;

export function buildWorkerApp(options: {
  logger?: boolean;
  readiness: () => Promise<Record<string, 'ok' | 'failed' | 'not_configured'>>;
}) {
  const app = Fastify({ logger: options.logger ?? true });
  app.get('/health', () => ({ service: 'worker', status: 'ok', version: '3.0.0-v1' }));
  app.get('/ready', async (_request, reply) => {
    const checks = await options.readiness();
    if (Object.values(checks).includes('failed')) reply.code(503);
    return {
      service: 'worker',
      status: reply.statusCode === 503 ? 'not_ready' : 'ready',
      checks,
      registeredJobs: Object.keys(jobRegistry),
    };
  });
  return app;
}
