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
  it('requires external canonical dependencies in production', () => {
    expect(() =>
      apiEnv({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgres://db',
        ENABLE_DEV_MOCK_AUTH: 'false',
      }),
    ).toThrow(/Privy server credentials/);
  });
});
