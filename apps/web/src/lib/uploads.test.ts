import { afterEach, describe, expect, it, vi } from 'vitest';
import { browserRequest } from './api';
import { uploadFiles, type PendingUpload, type UploadedAsset } from './uploads';
const { transfer } = vi.hoisted(() => ({ transfer: vi.fn(async () => ({ error: null })) }));
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ storage: { from: () => ({ uploadToSignedUrl: transfer }) } }),
}));
vi.mock('./auth', () => ({ getCurrentAccessToken: async () => 'test-token' }));
vi.mock('./api', async (original) => ({
  ...(await original<typeof import('./api')>()),
  browserRequest: vi.fn(),
}));
afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});
describe('upload acknowledgement recovery', () => {
  it('checks an existing object after a lost confirmation instead of uploading another copy', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://127.0.0.1:54321');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-key');
    const intent = {
      id: 'asset-id',
      bucket: 'public-media',
      objectKey: 'test/image.png',
      token: 'signed-test-token',
      signedUrl: 'http://localhost/upload',
    };
    vi.mocked(browserRequest)
      .mockResolvedValueOnce(intent)
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValue(null);
    const operation: { uploaded: UploadedAsset[]; pending?: PendingUpload } = { uploaded: [] };
    const files = [new File(['png-fixture'], 'image.png', { type: 'image/png' })];
    await expect(uploadFiles(files, 'public', operation)).rejects.toThrow('Failed to fetch');
    expect(operation.pending?.intent.id).toBe('asset-id');
    expect(await uploadFiles(files, 'public', operation)).toEqual([
      expect.objectContaining({ id: 'asset-id', name: 'image.png' }),
    ]);
    expect(transfer).toHaveBeenCalledTimes(1);
    expect(
      vi.mocked(browserRequest).mock.calls.filter(([path]) => path === '/v1/uploads/intents'),
    ).toHaveLength(1);
    expect(operation.pending).toBeUndefined();
  });
});
