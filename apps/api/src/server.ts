import { apiEnv } from '@gimme-idea/config';
import { createKnowledgeRepository, createPlatformRepository } from '@gimme-idea/db';
import { createAuthVerifier } from '@gimme-idea/auth';
import { Connection } from '@solana/web3.js';
import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { buildApp } from './app.js';
import { createDevMockAuthProvider } from './mock-auth.js';
import { createStorageSigner } from './storage.js';

const env = apiEnv();
const repository = createKnowledgeRepository(env.DATABASE_URL);
const platformRepository = createPlatformRepository(env.DATABASE_URL);
const devAuthEnabled = env.NODE_ENV !== 'production' && env.ENABLE_DEV_MOCK_AUTH;
const authVerifier = createAuthVerifier({
  privyAppId: env.PRIVY_APP_ID,
  privyAppSecret: env.PRIVY_APP_SECRET,
  privyVerificationKey: env.PRIVY_VERIFICATION_KEY,
  devAuth: { enabled: devAuthEnabled, secret: env.DEV_AUTH_SECRET },
});
const devMockAuth = devAuthEnabled
  ? createDevMockAuthProvider(env.DEV_MOCK_WALLET_KEYPAIR_PATH, env.DEV_AUTH_SECRET)
  : null;
const redis = env.REDIS_URL
  ? new Redis(env.REDIS_URL, { maxRetriesPerRequest: null, enableReadyCheck: true })
  : null;
const queues = redis
  ? new Map(
      ['research', 'chain', 'imports', 'notifications'].map((name) => [
        name,
        new Queue(name, { connection: redis }),
      ]),
    )
  : new Map<string, Queue>();
const solana = new Connection(env.SOLANA_RPC_URL, 'confirmed');
const storage =
  env.STORAGE_ENDPOINT && env.STORAGE_SERVICE_ROLE_KEY
    ? createStorageSigner(env.STORAGE_ENDPOINT, env.STORAGE_SERVICE_ROLE_KEY)
    : undefined;
const app = await buildApp({
  repository,
  platformRepository,
  authVerifier,
  logger: env.LOG_LEVEL === 'silent' ? false : true,
  devMockAuth,
  allowedOrigins: env.CORS_ALLOWED_ORIGINS.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  enqueue: redis
    ? async (queue, name, payload, jobId) => {
        await queues.get(queue)!.add(name, payload, {
          jobId,
          attempts: 5,
          backoff: { type: 'exponential', delay: 1_000 },
          removeOnComplete: 1_000,
          removeOnFail: 5_000,
        });
      }
    : undefined,
  readiness: async () => {
    const [redisOk, solanaOk] = await Promise.all([
      redis
        ? redis
            .ping()
            .then(() => true)
            .catch(() => false)
        : Promise.resolve(null),
      solana
        .getVersion()
        .then(() => true)
        .catch(() => false),
    ]);
    return {
      database: 'ok',
      auth: env.PRIVY_APP_ID && env.PRIVY_APP_SECRET ? 'ok' : 'not_configured',
      redis: redisOk === null ? 'not_configured' : redisOk ? 'ok' : 'failed',
      solana: solanaOk ? 'ok' : 'failed',
      storage: env.STORAGE_ENDPOINT && env.STORAGE_SERVICE_ROLE_KEY ? 'ok' : 'not_configured',
      aiProvider:
        env.AI_PROVIDER === 'disabled'
          ? 'not_configured'
          : env.AI_API_URL && env.AI_API_KEY && env.AI_MODEL
            ? 'ok'
            : 'failed',
    };
  },
  storage,
  programId: env.SOLANA_BOUNTY_PROGRAM_ID,
  solanaCluster: env.SOLANA_CLUSTER,
  chainWebhookSecret: env.CHAIN_WEBHOOK_SECRET,
  rateLimitMax: env.RATE_LIMIT_MAX,
  devMockRateLimitMax: env.DEV_MOCK_RATE_LIMIT_MAX,
});
let closing = false;
async function shutdown(signal: string) {
  if (closing) return;
  closing = true;
  app.log.info({ signal }, 'graceful shutdown');
  await app.close();
  await repository.close();
  await platformRepository.close();
  await Promise.all([...queues.values()].map((queue) => queue.close()));
  if (redis) await redis.quit();
}
process.once('SIGINT', () => {
  void shutdown('SIGINT');
});
process.once('SIGTERM', () => {
  void shutdown('SIGTERM');
});
await app.listen({ host: env.API_HOST, port: env.API_PORT });
