'use client';

import { createClient } from '@supabase/supabase-js';
import { browserRequest } from './api';
import { getCurrentAccessToken } from './auth';

type Intent = { id: string; bucket: string; objectKey: string; token: string; signedUrl: string };
export type UploadedAsset = {
  id: string;
  bucket: string;
  objectKey: string;
  name: string;
  size: number;
  mimeType: string;
  kind: 'image' | 'video';
};

export async function uploadFiles(
  files: File[],
  visibility: 'public' | 'private',
): Promise<UploadedAsset[]> {
  if (!files.length) return [];
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Object storage is not configured in this client.');
  const token = await getCurrentAccessToken();
  if (!token) throw new Error('Your authenticated session expired. Sign in again.');
  const storage = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  }).storage;
  const uploaded: UploadedAsset[] = [];
  for (const file of files) {
    const intent = await browserRequest<Intent>('/v1/uploads/intents', {
      method: 'POST',
      accessToken: token,
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type,
        sizeBytes: file.size,
        visibility,
      }),
    });
    if (!intent) throw new Error('Could not create an upload intent.');
    const { error } = await storage
      .from(intent.bucket)
      .uploadToSignedUrl(intent.objectKey, intent.token, file, {
        contentType: file.type,
        cacheControl: '3600',
      });
    if (error) throw new Error(`Upload failed: ${error.message}`);
    await browserRequest(`/v1/uploads/${intent.id}/complete`, {
      method: 'POST',
      accessToken: token,
    });
    uploaded.push({
      id: intent.id,
      bucket: intent.bucket,
      objectKey: intent.objectKey,
      name: file.name,
      size: file.size,
      mimeType: file.type,
      kind: file.type.startsWith('video/') ? 'video' : 'image',
    });
  }
  return uploaded;
}

export async function attachUploads(
  assets: UploadedAsset[],
  entityType: 'problem' | 'idea' | 'project' | 'post' | 'submission',
  entityId: string,
) {
  const token = await getCurrentAccessToken();
  if (!token) throw new Error('Your authenticated session expired. Sign in again.');
  await Promise.all(
    assets.map((asset, position) =>
      browserRequest(`/v1/uploads/${asset.id}/attach`, {
        method: 'POST',
        accessToken: token,
        body: JSON.stringify({ entityType, entityId, position }),
      }),
    ),
  );
}
