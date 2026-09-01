import { notFound } from 'next/navigation';
import { AppPageHeader } from '@/components/app-surfaces';
import { HomeQuoteFeed } from '@/components/home-feed';
import { copy, isLocale } from '@/lib/i18n';

export default async function HomeFeed({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = copy[locale];

  return (
    <main id="main" className="app-page">
      <AppPageHeader
        eyebrow="GIMME IDEA / HOME"
        title={t.shell.home}
        summary={
          locale === 'vi'
            ? 'Home chỉ hiện những bài quote từ Problem và Idea.'
            : 'Home only shows quotes of Problems and Ideas.'
        }
      />
      <HomeQuoteFeed locale={locale} />
    </main>
  );
}
