import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CreateRouteNotice } from '@/components/create-route-notice';
import { isLocale } from '@/lib/i18n';
export const metadata: Metadata = { title: 'Create Idea', robots: { index: false, follow: false } };
export default async function CreateIdea({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <main id="main" className="app-page">
      <CreateRouteNotice locale={locale} type="idea" />
    </main>
  );
}
