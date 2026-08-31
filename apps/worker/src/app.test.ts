import { afterEach, describe, expect, it } from 'vitest';
import { buildWorkerApp, jobRegistry } from './app.js';

const apps: ReturnType<typeof buildWorkerApp>[] = [];
afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});
describe('foundation worker', () => {
  it('boots with an explicit disabled registry', async () => {
    const app = buildWorkerApp(false);
    apps.push(app);
    const response = await app.inject('/ready');
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      status: 'ready',
      checks: { redis: 'not_configured', aiProvider: 'not_configured' },
    });
    expect(Object.values(jobRegistry).every((job) => !job.enabled)).toBe(true);
  });
  it('closes cleanly', async () => {
    const app = buildWorkerApp(false);
    await app.ready();
    await expect(app.close()).resolves.toBeUndefined();
  });
});
