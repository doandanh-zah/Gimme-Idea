import Link from 'next/link';
import type { Locale } from '@gimme-idea/contracts';
import type { submissionClient } from '@/lib/domain/client';

export type SubmissionReceipt = Awaited<ReturnType<typeof submissionClient.create>>;
export function SubmissionReceiptSummary({
  receipt,
  bountySlug,
  locale,
}: {
  receipt: SubmissionReceipt;
  bountySlug: string;
  locale: Locale;
}) {
  return (
    <div className="submission-receipt">
      <p>
        {locale === 'vi' ? 'Mã bài nộp' : 'Submission ID'}: <code>{receipt.id}</code>
      </p>
      <p>
        <time dateTime={receipt.submittedAt}>
          {new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'long' }).format(
            new Date(receipt.submittedAt),
          )}
        </time>
      </p>
      {receipt.version !== null && (
        <p>
          {locale === 'vi' ? 'Phiên bản' : 'Version'}: {receipt.version}
        </p>
      )}
      {receipt.contentHash && (
        <p>
          SHA-256: <code>{receipt.contentHash}</code>
        </p>
      )}
      {receipt.payoutWalletAddress && (
        <p>
          {locale === 'vi' ? 'Ví nhận thưởng đã ghi nhận' : 'Recorded reward wallet'}:{' '}
          <code>{receipt.payoutWalletAddress}</code>
        </p>
      )}
      <Link
        href={`/${locale}/dashboard/bounties/${encodeURIComponent(bountySlug)}/submissions/${encodeURIComponent(receipt.id)}`}
      >
        {locale === 'vi' ? 'Xem bài đã nộp' : 'View submitted entry'}
      </Link>
    </div>
  );
}
