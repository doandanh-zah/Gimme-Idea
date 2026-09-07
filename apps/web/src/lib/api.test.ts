import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiRequestError, browserRequest } from './api';

afterEach(() => vi.unstubAllGlobals());

describe('HTTP result semantics', () => {
  it('treats a missing read as absent but a missing mutation as a failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{"message":"Not found"}', { status: 404 })),
    );
    expect(await browserRequest('/v1/ideas/missing')).toBeNull();
    await expect(
      browserRequest('/v1/submissions', { method: 'POST', body: '{}' }),
    ).rejects.toMatchObject({ name: 'ApiRequestError', status: 404 });
  });
  it('accepts an intentional no-content acknowledgement', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { status: 204 })),
    );
    expect(await browserRequest('/v1/notifications/id/read', { method: 'PATCH' })).toBeNull();
  });
  it('preserves an HTTP rejection status so publication can distinguish a retry from an unknown result', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{"message":"Invalid title"}', { status: 400 })),
    );
    await expect(browserRequest('/v1/problems', { method: 'POST' })).rejects.toBeInstanceOf(
      ApiRequestError,
    );
  });
});
