const collections = {
  problem: 'problems',
  idea: 'ideas',
  project: 'projects',
  bounty: 'bounties',
  organization: 'org',
} as const;

export function publicEntityHref(locale: string, type: string, slug: string): string | null {
  if (!Object.hasOwn(collections, type) || !slug) return null;
  return `/${locale}/${collections[type as keyof typeof collections]}/${encodeURIComponent(slug)}`;
}
