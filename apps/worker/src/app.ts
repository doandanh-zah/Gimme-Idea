import Fastify from 'fastify';

export const jobRegistry = {
  'research.problem': {
    enabled: false,
    reason: 'AI provider and Redis queue are outside Foundation Milestone',
  },
  'research.idea': {
    enabled: false,
    reason: 'AI provider and Redis queue are outside Foundation Milestone',
  },
  'imports.reconcile': {
    enabled: false,
    reason: 'Import execution is outside Foundation Milestone',
  },
} as const;

export function buildWorkerApp(logger = true) {
  const app = Fastify({ logger });
  app.get('/health', () => ({ service: 'worker', status: 'ok', version: '2.0.0-foundation' }));
  app.get('/ready', () => ({
    service: 'worker',
    status: 'ready',
    checks: {
      lifecycle: 'ok',
      registry: 'ok',
      redis: 'not_configured',
      aiProvider: 'not_configured',
    },
    registeredJobs: Object.keys(jobRegistry),
  }));
  return app;
}
