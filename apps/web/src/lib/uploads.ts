'use client';

import { createClient } from '@supabase/supabase-js';
import { ApiRequestError, browserRequest } from './api';
import { getCurrentAccessToken } from './auth';

type Intent = { id: string; bucket: string; objectKey: string; token: string; signedUrl: string };
export type PendingUpload = { intent: Intent; signature: string };
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
  resume: {
    uploaded: UploadedAsset[];
    pending?: PendingUpload;
    onPendingChange?: (pending: PendingUpload | undefined) => void;
    onProgress?: (uploaded: UploadedAsset[], index: number, total: number) => void;
  } = { uploaded: [] },
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
  const uploaded = resume.uploaded;
  for (let index = uploaded.length; index < files.length; index++) {
    const file = files[index]!;
    resume.onProgress?.(uploaded, index, files.length);
    const signature = `${file.name}:${file.size}:${file.type}`;
    if (resume.pending && resume.pending.signature !== signature)
      throw new Error('Reselect the original files in the same order to resume this upload.');
    const resuming = Boolean(resume.pending);
    const intent =
      resume.pending?.intent ??
      (await browserRequest<Intent>('/v1/uploads/intents', {
        method: 'POST',
        accessToken: token,
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          sizeBytes: file.size,
          visibility,
        }),
      }));
    if (!intent) throw new Error('Could not create an upload intent.');
    resume.pending = { intent, signature };
    resume.onPendingChange?.(resume.pending);
    let complete = false;
    if (resuming) {
      try {
        await browserRequest(`/v1/uploads/${intent.id}/complete`, {
          method: 'POST',
          accessToken: token,
        });
        complete = true;
      } catch (error) {
        if (!(error instanceof ApiRequestError) || error.code !== 'UPLOAD_INCOMPLETE') throw error;
      }
    }
    if (!complete) {
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
    }
    uploaded.push({
      id: intent.id,
      bucket: intent.bucket,
      objectKey: intent.objectKey,
      name: file.name,
      size: file.size,
      mimeType: file.type,
      kind: file.type.startsWith('video/') ? 'video' : 'image',
    });
    resume.pending = undefined;
    resume.onPendingChange?.(undefined);
    resume.onProgress?.(uploaded, index + 1, files.length);
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
