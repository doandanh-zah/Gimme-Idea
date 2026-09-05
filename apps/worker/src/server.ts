import { workerEnv } from '@gimme-idea/config';
import { createPlatformRepository, createWorkerRepository } from '@gimme-idea/db';
import { Connection } from '@solana/web3.js';
import { Redis } from 'ioredis';
import { buildWorkerApp } from './app.js';
import { startRuntime } from './runtime.js';

const env = workerEnv();
const redis = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null, enableReadyCheck: true });
const database = createWorkerRepository(env.DATABASE_URL);
const platform = createPlatformRepository(env.DATABASE_URL);
const solana = new Connection(env.SOLANA_RPC_URL, 'confirmed');
const runtime = await startRuntime({
  connection: redis,
  database,
  platform,
  solana,
  programId: env.SOLANA_BOUNTY_PROGRAM_ID,
  ai: {
    provider: env.AI_PROVIDER,
    apiUrl: env.AI_API_URL,
    apiKey: env.AI_API_KEY,
    model: env.AI_MODEL,
  },
  colosseumFeedUrl: env.COLOSSEUM_FEED_URL,
});
const app = buildWorkerApp({
  readiness: async () => {
    const [redisOk, dbOk, solanaOk] = await Promise.all([
      redis
        .ping()
        .then(() => true)
        .catch(() => false),
      database
        .listEscrowsForReconciliation(1)
        .then(() => true)
        .catch(() => false),
      solana
        .getVersion()
        .then(() => true)
        .catch(() => false),
    ]);
    return {
      redis: redisOk ? 'ok' : 'failed',
      database: dbOk ? 'ok' : 'failed',
      solana: solanaOk ? 'ok' : 'failed',
      aiProvider:
        env.AI_PROVIDER === 'disabled'
          ? 'not_configured'
          : env.AI_API_URL && env.AI_API_KEY && env.AI_MODEL
            ? 'ok'
            : 'failed',
      colosseum: env.COLOSSEUM_FEED_URL ? 'ok' : 'not_configured',
    };
  },
});
let closing = false;
async function shutdown(signal: string) {
  if (closing) return;
  closing = true;
  app.log.info({ signal }, 'graceful shutdown');
  await app.close();
  await runtime.close();
  await database.close();
  await platform.close();
  await redis.quit();
}
process.once('SIGINT', () => {
  void shutdown('SIGINT');
});
process.once('SIGTERM', () => {
  void shutdown('SIGTERM');
});
await app.listen({ host: env.WORKER_HOST, port: env.WORKER_PORT });
