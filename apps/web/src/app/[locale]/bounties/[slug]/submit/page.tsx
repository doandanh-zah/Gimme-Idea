import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PrivateIdeaSubmissionForm } from '@/components/private-submission-form';
import { bountyClient } from '@/lib/domain/client';
import { isLocale } from '@/lib/i18n';

export const metadata: Metadata = {
  title: 'Private Idea submission',
  robots: { index: false, follow: false },
};
export default async function SubmitIdeaPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const bounty = await bountyClient.get(slug);
  if (!bounty || bounty.stage !== 'idea') notFound();
  return (
    <main id="main" className="app-page v1-private-route">
      <PrivateIdeaSubmissionForm bounty={bounty} locale={locale} />
    </main>
  );
}
