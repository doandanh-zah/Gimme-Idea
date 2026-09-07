import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
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
  // Server request time determines whether this competition can accept entries.
  // eslint-disable-next-line react-hooks/purity
  const requestTime = Date.now();
  if (
    bounty.status !== 'open' ||
    Date.parse(bounty.deadline) <= requestTime ||
    !bounty.criteria.length
  )
    return (
      <main id="main" className="app-page">
        <h1>{locale === 'vi' ? 'Chưa thể nhận bài dự thi' : 'Submissions are unavailable'}</h1>
        <p>
          {locale === 'vi'
            ? 'Kiểm tra thời hạn, trạng thái và tiêu chí đánh giá trên Bounty.'
            : 'Check the deadline, status and judging criteria on the Bounty.'}
        </p>
        <Link href={`/${locale}/bounties/${bounty.slug}`}>
          {locale === 'vi' ? 'Xem Bounty' : 'View Bounty'}
        </Link>
      </main>
    );
  return (
    <main id="main" className="app-page v1-private-route">
      <PrivateIdeaSubmissionForm bounty={bounty} locale={locale} />
    </main>
  );
}
