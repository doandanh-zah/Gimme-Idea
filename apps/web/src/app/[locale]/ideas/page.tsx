import { notFound } from 'next/navigation';
import { AppPageHeader, KnowledgePost } from '@/components/app-surfaces';
import { getIdea } from '@/lib/api';
import { copy, isLocale } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export default async function IdeasFeed({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = copy[locale];
  const idea = await getIdea('demand-pulse-for-kitchens');

  return (
    <main id="main" className="app-page">
      <AppPageHeader
        eyebrow="EXPLORE / IDEAS"
        title={t.shell.ideas}
        summary={
          locale === 'vi'
            ? 'Các hướng giải quyết có Primary Problem và nguồn nghiên cứu rõ ràng.'
            : 'Buildable approaches with a clear Primary Problem and research trail.'
        }
      />
      <section className="feed-stream" aria-label={t.shell.ideas}>
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
