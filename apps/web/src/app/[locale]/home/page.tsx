import { notFound } from 'next/navigation';
import { AppPageHeader, KnowledgePost } from '@/components/app-surfaces';
import { getIdea, getProblem } from '@/lib/api';
import { copy, isLocale } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export default async function HomeFeed({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = copy[locale];
  const [problem, idea] = await Promise.all([
    getProblem('restaurant-food-waste'),
    getIdea('demand-pulse-for-kitchens'),
  ]);

  return (
    <main id="main" className="app-page">
      <AppPageHeader
        eyebrow="GIMME IDEA / HOME"
        title={t.shell.home}
        summary={
          locale === 'vi'
            ? 'Những vấn đề và ý tưởng đáng chú ý trong mạng lưới.'
            : 'Problems and ideas worth noticing across the network.'
        }
      />
      <section className="feed-stream" aria-label="Home feed">
        {problem && (
          <KnowledgePost
            kind={t.shell.problems}
            title={problem.title}
            summary={problem.summary}
            href={`/${locale}/problems/${problem.slug}`}
            status={problem.researchStatus.replaceAll('_', ' ')}
            meta={`${problem.relatedIdeas.length} ${t.ideasUnit.toLowerCase()}`}
          />
        )}
        {idea && (
          <KnowledgePost
            kind={t.shell.ideas}
            title={idea.title}
            summary={idea.summary}
            href={`/${locale}/ideas/${idea.slug}`}
            status={idea.researchStatus.replaceAll('_', ' ')}
            meta={`${idea.previousAttempts.length} ${t.attempts.toLowerCase()}`}
            relationship={`${t.primaryProblem}: ${idea.primaryProblem.title}`}
          />
        )}
      </section>
    </main>
  );
}
