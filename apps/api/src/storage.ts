import { createClient } from '@supabase/supabase-js';

export type StorageSigner = {
  createSignedUpload(
    bucket: string,
    objectKey: string,
  ): Promise<{ token: string; signedUrl: string }>;
  createSignedDownload(
    bucket: string,
    objectKey: string,
    expiresInSeconds: number,
  ): Promise<string>;
  objectExists(bucket: string, objectKey: string): Promise<boolean>;
};

export function createStorageSigner(endpoint: string, serviceRoleKey: string): StorageSigner {
  const client = createClient(endpoint, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return {
    async createSignedUpload(bucket, objectKey) {
      const { data, error } = await client.storage
        .from(bucket)
        .createSignedUploadUrl(objectKey, { upsert: false });
      if (error)
        throw Object.assign(new Error('Could not create the signed upload URL.'), {
          statusCode: 502,
          code: 'STORAGE_UNAVAILABLE',
        });
      return { token: data.token, signedUrl: data.signedUrl };
    },
    async createSignedDownload(bucket, objectKey, expiresInSeconds) {
      const { data, error } = await client.storage
        .from(bucket)
        .createSignedUrl(objectKey, expiresInSeconds, { download: false });
      if (error)
        throw Object.assign(new Error('Could not authorize the requested file.'), {
          statusCode: 502,
          code: 'STORAGE_UNAVAILABLE',
        });
      return data.signedUrl;
    },
    async objectExists(bucket, objectKey) {
      const slash = objectKey.lastIndexOf('/');
      const folder = objectKey.slice(0, slash);
      const name = objectKey.slice(slash + 1);
      const { data, error } = await client.storage
        .from(bucket)
        .list(folder, { search: name, limit: 2 });
      if (error) return false;
      return data.some((entry) => entry.name === name);
    },
  };
}
