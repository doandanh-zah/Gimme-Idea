import { notFound } from 'next/navigation';
import { QuoteThread } from '@/components/quote-post';
import { isLocale } from '@/lib/i18n';

export default async function QuoteThreadPage({
  params,
}: {
  params: Promise<{ locale: string; postId: string }>;
}) {
  const { locale, postId } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <main id="main" className="app-page">
      <QuoteThread locale={locale} postId={postId} />
    </main>
  );
}
