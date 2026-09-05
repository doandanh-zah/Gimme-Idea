import { createClient } from '@supabase/supabase-js';
import { issueDevAccessToken } from '@gimme-idea/auth';

const api = process.env.API_URL ?? 'http://127.0.0.1:3011';
const storageEndpoint = process.env.STORAGE_ENDPOINT;
const anonKey = process.env.STORAGE_ANON_KEY;
const secret = process.env.DEV_AUTH_SECRET ?? 'local-development-auth-secret-change-me';
if (!storageEndpoint || !anonKey)
  throw new Error('STORAGE_ENDPOINT and STORAGE_ANON_KEY are required.');
async function json(path: string, init: RequestInit = {}) {
  const response = await fetch(`${api}${path}`, init);
  const text = await response.text();
  if (!response.ok) throw new Error(`${path} returned ${response.status}: ${text}`);
  return text ? JSON.parse(text) : null;
}
const mock = await json('/v1/auth/mock', { method: 'POST' });
const ownerHeaders = {
  authorization: `Bearer ${mock.accessToken}`,
  'content-type': 'application/json',
};
await json('/v1/me/sync', {
  method: 'POST',
  headers: ownerHeaders,
  body: JSON.stringify({
    username: mock.user.username,
    displayName: mock.user.displayName,
    rewardWalletAddress: mock.wallet.address,
  }),
});
const bytes = new TextEncoder().encode('%PDF-1.4\n% private integration fixture\n');
const intent = await json('/v1/uploads/intents', {
  method: 'POST',
  headers: ownerHeaders,
  body: JSON.stringify({
    filename: 'private-proof.pdf',
    contentType: 'application/pdf',
    sizeBytes: bytes.byteLength,
    visibility: 'private',
  }),
});
const storage = createClient(storageEndpoint, anonKey, { auth: { persistSession: false } });
const uploaded = await storage.storage
  .from(intent.bucket)
  .uploadToSignedUrl(
    intent.objectKey,
    intent.token,
    new Blob([bytes], { type: 'application/pdf' }),
    { contentType: 'application/pdf' },
  );
if (uploaded.error) throw uploaded.error;
await json(`/v1/uploads/${intent.id}/complete`, {
  method: 'POST',
  headers: { authorization: `Bearer ${mock.accessToken}` },
});
const anonymous = await fetch(`${api}/v1/uploads/${intent.id}/download`);
const strangerToken = issueDevAccessToken('storage-stranger', secret);
await json('/v1/me/sync', {
  method: 'POST',
  headers: { authorization: `Bearer ${strangerToken}`, 'content-type': 'application/json' },
  body: JSON.stringify({ username: 'storage-stranger', displayName: 'Storage Stranger' }),
});
const stranger = await fetch(`${api}/v1/uploads/${intent.id}/download`, {
  headers: { authorization: `Bearer ${strangerToken}` },
});
const owner = await json(`/v1/uploads/${intent.id}/download`, {
  headers: { authorization: `Bearer ${mock.accessToken}` },
});
const object = await fetch(owner.url);
if (anonymous.status !== 401 || stranger.status !== 404 || !object.ok)
  throw new Error(
    `Storage privacy failed: anonymous=${anonymous.status}, stranger=${stranger.status}, ownerObject=${object.status}`,
  );
console.log(
  JSON.stringify(
    {
      ok: true,
      privateAssetId: intent.id,
      anonymousStatus: anonymous.status,
      strangerStatus: stranger.status,
      ownerSignedUrlStatus: object.status,
      signedUrlTtlSeconds: owner.expiresInSeconds,
    },
    null,
    2,
  ),
);
