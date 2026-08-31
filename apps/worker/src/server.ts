import { workerEnv } from '@gimme-idea/config';
import { buildWorkerApp } from './app.js';

const env = workerEnv();
const app = buildWorkerApp();
let closing = false;
async function shutdown(signal: string) {
  if (closing) return;
  closing = true;
  app.log.info({ signal }, 'graceful shutdown');
  await app.close();
}
process.once('SIGINT', () => {
  void shutdown('SIGINT');
});
process.once('SIGTERM', () => {
  void shutdown('SIGTERM');
});
await app.listen({ host: env.WORKER_HOST, port: env.WORKER_PORT });
