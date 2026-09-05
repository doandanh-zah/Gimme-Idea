import { describe, expect, it } from 'vitest';
import { apiEnv } from './index.js';

describe('production configuration', () => {
  it('cannot enable development auth in production', () => {
    expect(() =>
      apiEnv({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgres://db',
        ENABLE_DEV_MOCK_AUTH: 'true',
      }),
    ).toThrow(/must be false/);
  });
  it('requires external stateful dependencies in production', () => {
    expect(() =>
      apiEnv({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgres://db',
        ENABLE_DEV_MOCK_AUTH: 'false',
      }),
    ).toThrow(/REDIS_URL/);
  });
  it('allows auth to remain fail-closed until Privy is configured', () => {
    expect(
      apiEnv({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgres://db',
        ENABLE_DEV_MOCK_AUTH: 'false',
        REDIS_URL: 'redis://cache.example.com:6379',
        STORAGE_ENDPOINT: 'https://storage.example.com',
        STORAGE_SERVICE_ROLE_KEY: 'server-only-key',
      }).PRIVY_APP_ID,
    ).toBeUndefined();
  });
});
