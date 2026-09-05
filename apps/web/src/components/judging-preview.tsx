'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, MessageSquareText, Trophy } from 'lucide-react';
import { useState } from 'react';
import type { Locale } from '@gimme-idea/contracts';
import type { BountyModel, PrivateSubmissionModel } from '@/lib/domain/types';
import { PrivateNotice } from '@/components/v1-primitives';

export function JudgingPreview({
  bounty,
  submission,
  locale,
}: {
  bounty: BountyModel;
  submission: PrivateSubmissionModel;
  locale: Locale;
}) {
  const [clarify, setClarify] = useState(false);
  const [winnerPreview, setWinnerPreview] = useState(false);
  return (
    <div className="v1-judging-page">
      <PrivateNotice locale={locale} judge />
      <header className="v1-judging-header">
        <div>
          <p className="v1-kicker">PRIVATE SUBMISSION / {submission.status.toUpperCase()}</p>
          <h1>{submission.title}</h1>
          <p>
            {submission.owner} · {submission.snapshotVersion} ·{' '}
            {submission.submittedAt
              ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(
                  new Date(submission.submittedAt),
                )
              : 'Draft'}
          </p>
        </div>
        <span>{bounty.amountUsdc.toLocaleString(locale)} USDC</span>
      </header>
      <section className="v1-submission-snapshot">
        <h2>{locale === 'vi' ? 'Submission Snapshot' : 'Submission Snapshot'}</h2>
        <p>{submission.summary}</p>
        <dl>
          <div>
            <dt>Project</dt>
            <dd>{submission.title}</dd>
          </div>
          <div>
            <dt>Version</dt>
            <dd>{submission.snapshotVersion}</dd>
          </div>
          <div>
            <dt>Visibility</dt>
            <dd>Private · authorized review</dd>
          </div>
        </dl>
      </section>
      <section className="v1-review-score">
        <h2>{locale === 'vi' ? 'Đánh giá theo tiêu chí' : 'Criteria review'}</h2>
        {bounty.criteria.map((criterion, index) => (
          <label key={criterion.name}>
            <span>
              <strong>{criterion.name}</strong>
              <small>{criterion.weight}% weight</small>
            </span>
            <input
              type="text"
              inputMode="numeric"
              pattern="(?:10|[0-9])"
              defaultValue={8 + (index % 2)}
              aria-label={`${criterion.name} score`}
            />
            <textarea
              rows={2}
              placeholder={locale === 'vi' ? 'Ghi chú riêng tư' : 'Private review note'}
              aria-label={`${criterion.name} note`}
            />
          </label>
        ))}
      </section>
      {clarify && (
        <section className="v1-clarification" aria-live="polite">
          <strong>{locale === 'vi' ? 'Yêu cầu làm rõ' : 'Clarification request'}</strong>
          <p>Northstar: Does this support multi-location operators?</p>
          <textarea
            rows={3}
            aria-label={locale === 'vi' ? 'Nội dung yêu cầu' : 'Clarification message'}
            defaultValue="Please clarify how location-level permissions are handled."
          />
          <small>Development preview · message not sent</small>
        </section>
      )}
      {winnerPreview && (
        <section className="v1-winner-preview" aria-live="polite">
          <Trophy size={28} aria-hidden="true" />
          <div>
            <p className="v1-kicker">WINNER PREVIEW · NOT FINAL</p>
            <h2>{locale === 'vi' ? 'Chọn Project này?' : 'Select this Project?'}</h2>
            <p>
              {locale === 'vi'
                ? 'Kết quả và payout chưa được ghi hoặc xác minh. Đây chỉ là preview trước quyết định.'
                : 'No result or payout has been recorded or verified. This is a pre-decision preview only.'}
            </p>
            <div className="v1-gate-actions">
              <button type="button" className="button button-quiet" disabled>
                {locale === 'vi' ? 'Mời phỏng vấn · Phase 3' : 'Invite to interview · Phase 3'}
              </button>
              <button type="button" className="button button-quiet" disabled>
                {locale === 'vi' ? 'Đề xuất hợp đồng · Phase 3' : 'Offer contract · Phase 3'}
              </button>
            </div>
          </div>
        </section>
      )}
      <footer className="v1-review-actions">
        <button
          type="button"
          className="button button-quiet"
          onClick={() => setClarify((value) => !value)}
        >
          <MessageSquareText size={17} aria-hidden="true" />
          {locale === 'vi' ? 'Yêu cầu làm rõ' : 'Request Clarification'}
        </button>
        <button type="button" className="button button-quiet">
          <CheckCircle2 size={17} aria-hidden="true" />
          Shortlist
        </button>
        <button
          type="button"
          className="button button-primary"
          onClick={() => setWinnerPreview(true)}
        >
          <Trophy size={17} aria-hidden="true" />
          {locale === 'vi' ? 'Xem trước Winner' : 'Select Winner Preview'}
        </button>
      </footer>
      {winnerPreview && (
        <Link className="v1-next-link" href={`/${locale}/projects/foodloop-winning-build`}>
          {locale === 'vi' ? 'Xem Winning Project bị giới hạn' : 'View restricted Winning Project'}{' '}
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
