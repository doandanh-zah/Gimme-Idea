import { notFound } from 'next/navigation';
import { AppPageHeader } from '@/components/app-surfaces';
import { KnowledgeFeed } from '@/components/knowledge-feed';
import { getProblem } from '@/lib/api';
import { copy, isLocale } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export default async function ProblemsFeed({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = copy[locale];
  const problems = await Promise.all([
    getProblem('restaurant-food-waste'),
    getProblem('tenant-repair-visibility'),
  ]);

  return (
    <main id="main" className="app-page">
      <AppPageHeader
        eyebrow="EXPLORE / PROBLEMS"
        title={t.shell.problems}
        summary={
          locale === 'vi'
            ? 'Những vấn đề thực tế cần được hiểu rõ trước khi đề xuất giải pháp.'
            : 'Real problems to understand before proposing a solution.'
        }
      />
      <KnowledgeFeed
        locale={locale}
        kind="problem"
        initialItems={problems.filter((problem) => problem !== null)}
      />
    </main>
  );
}
