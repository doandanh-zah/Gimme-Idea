import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PrivateSubmissionReview } from '@/components/private-submission-review';
import { ReviewerGate } from '@/components/reviewer-gate';
import { bountyClient } from '@/lib/domain/client';
import { isLocale } from '@/lib/i18n';
export const metadata: Metadata = {
  title: 'Private submission review',
  robots: { index: false, follow: false },
};
export default async function SubmissionReview({
  params,
}: {
  params: Promise<{ locale: string; id: string; submissionId: string }>;
}) {
  const { locale, id, submissionId } = await params;
  if (!isLocale(locale)) notFound();
  const bounty = await bountyClient.get(id);
  if (!bounty) notFound();
  return (
    <main id="main" className="app-page v1-private-route">
      <ReviewerGate locale={locale}>
        <PrivateSubmissionReview bounty={bounty} submissionId={submissionId} locale={locale} />
      </ReviewerGate>
    </main>
  );
}
