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
            locale={locale}
            href={`/${locale}/problems/${problem.slug}`}
            item={{ kind: 'problem', data: problem }}
          />
        )}
        {idea && (
          <KnowledgePost
            locale={locale}
            href={`/${locale}/ideas/${idea.slug}`}
            item={{ kind: 'idea', data: idea }}
          />
        )}
      </section>
    </main>
  );
}
