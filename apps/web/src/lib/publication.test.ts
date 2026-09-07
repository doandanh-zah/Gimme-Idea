import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiRequestError } from './api';
import { createLocalKnowledgePost, type PublishOperation } from './social';
import { browserRequest } from './api';
import { attachUploads, uploadFiles } from './uploads';

vi.mock('./auth', () => ({ getCurrentAccessToken: vi.fn(async () => 'test-token') }));
vi.mock('./uploads', () => ({
  uploadFiles: vi.fn(async () => []),
  attachUploads: vi.fn(async () => undefined),
}));
vi.mock('./api', async (original) => ({
  ...(await original<typeof import('./api')>()),
  browserRequest: vi.fn(),
}));

const input = {
  kind: 'problem' as const,
  title: 'A recurring real problem',
  summary: 'This is a sufficiently descriptive summary.',
  files: [],
};
beforeEach(() => {
  vi.clearAllMocks();
});

describe('resumable publication', () => {
  it('resumes attachment failure without creating or uploading a second entity', async () => {
    const operation: PublishOperation = { uploaded: [] };
    vi.mocked(browserRequest)
      .mockResolvedValueOnce({ id: 'problem-id', slug: 'real-problem' })
      .mockResolvedValue(null);
    vi.mocked(attachUploads).mockRejectedValueOnce(new Error('Connection interrupted'));
    await expect(createLocalKnowledgePost({ ...input, operation })).rejects.toThrow(
      'Connection interrupted',
    );
    expect(operation.saved).toEqual({ id: 'problem-id', slug: 'real-problem' });
    const post = await createLocalKnowledgePost({ ...input, operation });
    expect(post.slug).toBe('real-problem');
    expect(uploadFiles).toHaveBeenCalledTimes(1);
    expect(
      vi.mocked(browserRequest).mock.calls.filter(([path]) => path === '/v1/problems'),
    ).toHaveLength(1);
    expect(browserRequest).toHaveBeenLastCalledWith(
      '/v1/problems/problem-id/publish',
      expect.objectContaining({ method: 'POST' }),
    );
  });
  it('allows correction after a definite rejection and reuses the request key after a lost response', async () => {
    const rejected: PublishOperation = { uploaded: [] };
    vi.mocked(browserRequest).mockRejectedValueOnce(new ApiRequestError('Invalid title', 400));
    await expect(createLocalKnowledgePost({ ...input, operation: rejected })).rejects.toThrow(
      'Invalid title',
    );
    expect(rejected.createUncertain).toBe(false);

    const unknown: PublishOperation = { uploaded: [] };
    vi.mocked(browserRequest).mockRejectedValueOnce(new TypeError('Failed to fetch'));
    await expect(createLocalKnowledgePost({ ...input, operation: unknown })).rejects.toThrow(
      'Failed to fetch',
    );
    expect(unknown.createUncertain).toBe(true);
    const key = unknown.idempotencyKey;
    vi.mocked(browserRequest)
      .mockResolvedValueOnce({ id: 'replayed-id', slug: 'replayed-problem' })
      .mockResolvedValue(null);
    expect((await createLocalKnowledgePost({ ...input, operation: unknown })).slug).toBe(
      'replayed-problem',
    );
    const creates = vi
      .mocked(browserRequest)
      .mock.calls.filter(([path]) => path === '/v1/problems')
      .slice(-2);
    expect(creates).toHaveLength(2);
    for (const [, options] of creates) expect(options?.headers).toEqual({ 'idempotency-key': key });
  });
  it('does not retry a legacy uncertain operation without a server request key', async () => {
    const operation: PublishOperation = { uploaded: [], createUncertain: true };
    await expect(createLocalKnowledgePost({ ...input, operation })).rejects.toThrow(
      'could not be confirmed',
    );
    expect(browserRequest).not.toHaveBeenCalled();
  });
});
