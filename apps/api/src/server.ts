import { apiEnv } from '@gimme-idea/config';
import { createKnowledgeRepository } from '@gimme-idea/db/repository';
import { buildApp } from './app.js';

const env = apiEnv();
const repository = createKnowledgeRepository(env.DATABASE_URL);
const app = await buildApp({ repository });
let closing = false;
async function shutdown(signal: string) {
  if (closing) return;
  closing = true;
  app.log.info({ signal }, 'graceful shutdown');
  await app.close();
  await repository.close();
}
process.once('SIGINT', () => {
  void shutdown('SIGINT');
});
process.once('SIGTERM', () => {
  void shutdown('SIGTERM');
});
await app.listen({ host: env.API_HOST, port: env.API_PORT });
