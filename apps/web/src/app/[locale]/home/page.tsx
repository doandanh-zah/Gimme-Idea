import { notFound } from 'next/navigation';
import { AppPageHeader } from '@/components/app-surfaces';
import { V1HomeFeed } from '@/components/v1-home-feed';
import { homeClient } from '@/lib/domain/client';
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
            ? 'Tìm một vấn đề đáng giải, một cơ hội để cạnh tranh hoặc điều đã được thử trước đây.'
            : 'Find a problem worth solving, an opportunity to compete for, or something already tried.'
        }
      />
      <V1HomeFeed locale={locale} items={await homeClient.list()} />
    </main>
  );
}
