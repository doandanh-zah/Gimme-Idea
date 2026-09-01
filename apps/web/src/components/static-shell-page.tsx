import { AppPageHeader, EmptySurface } from '@/components/app-surfaces';

export function StaticShellPage({
  eyebrow,
  title,
  summary,
  emptyTitle,
  emptyBody,
}: {
  eyebrow: string;
  title: string;
  summary: string;
  emptyTitle: string;
  emptyBody: string;
}) {
  return (
    <main id="main" className="app-page">
      <AppPageHeader eyebrow={eyebrow} title={title} summary={summary} />
      <EmptySurface title={emptyTitle} body={emptyBody} />
    </main>
  );
}
