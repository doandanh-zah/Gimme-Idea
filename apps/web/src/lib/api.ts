import { ideaDetailSchema, problemDetailSchema } from '@gimme-idea/contracts';

const baseUrl = process.env.API_INTERNAL_URL ?? 'http://127.0.0.1:3001';
const publicBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3001';
export async function request(path: string): Promise<unknown | null> {
  const response = await fetch(`${baseUrl}${path}`, {
    next: { revalidate: 60 },
    headers: { accept: 'application/json' },
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`API request failed with ${response.status}`);
  return response.json() as Promise<unknown>;
}
export async function browserRequest<T>(
  path: string,
  options: RequestInit & { accessToken?: string | null } = {},
) {
  const headers = new Headers(options.headers);
  headers.set('accept', 'application/json');
  if (options.body) headers.set('content-type', 'application/json');
  if (options.accessToken) headers.set('authorization', `Bearer ${options.accessToken}`);
  const response = await fetch(`${publicBaseUrl}${path}`, { ...options, headers });
  if (response.status === 404) return null;
  const payload = (await response.json().catch(() => null)) as T | null;
  if (!response.ok)
    throw new Error(
      payload && typeof payload === 'object' && 'message' in payload
        ? String(payload.message)
        : `API request failed with ${response.status}`,
    );
  return payload;
}
export async function getProblem(slug: string) {
  const data = await request(`/v1/problems/${encodeURIComponent(slug)}`);
  return data === null ? null : problemDetailSchema.parse(data);
}
export async function getIdea(slug: string) {
  const data = await request(`/v1/ideas/${encodeURIComponent(slug)}`);
  return data === null ? null : ideaDetailSchema.parse(data);
}
