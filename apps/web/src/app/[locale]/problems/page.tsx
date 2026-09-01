import { notFound } from 'next/navigation';
import { AppPageHeader, KnowledgePost } from '@/components/app-surfaces';
import { getProblem } from '@/lib/api';
import { copy, isLocale } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export default async function ProblemsFeed({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = copy[locale];
  const problem = await getProblem('restaurant-food-waste');

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
      <section className="feed-stream" aria-label={t.shell.problems}>
        {problem && (
          <KnowledgePost
            locale={locale}
            href={`/${locale}/problems/${problem.slug}`}
            item={{ kind: 'problem', data: problem }}
          />
        )}
      </section>
    </main>
  );
}
