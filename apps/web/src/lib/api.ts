import { ideaDetailSchema, problemDetailSchema } from '@gimme-idea/contracts';

const baseUrl = process.env.API_INTERNAL_URL ?? 'http://127.0.0.1:3001';
async function request(path: string): Promise<unknown | null> {
  const response = await fetch(`${baseUrl}${path}`, {
    next: { revalidate: 60 },
    headers: { accept: 'application/json' },
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`API request failed with ${response.status}`);
  return response.json() as Promise<unknown>;
}
export async function getProblem(slug: string) {
  const data = await request(`/v1/problems/${encodeURIComponent(slug)}`);
  return data === null ? null : problemDetailSchema.parse(data);
}
export async function getIdea(slug: string) {
  const data = await request(`/v1/ideas/${encodeURIComponent(slug)}`);
  return data === null ? null : ideaDetailSchema.parse(data);
}
