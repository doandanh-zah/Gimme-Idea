'use client';

import { userErrorMessage } from '@/lib/error-message';

import Link from 'next/link';
import { SubmissionReceiptSummary, type SubmissionReceipt } from './submission-receipt';
import { CheckCircle2, FileLock2, Send } from 'lucide-react';
import { useState } from 'react';
import type { Locale } from '@gimme-idea/contracts';
import type { BountyModel, ProjectModel } from '@/lib/domain/types';
import { PrivateNotice } from '@/components/v1-primitives';
import { trackFrontendEvent } from '@/lib/domain/analytics';
import { useAuth } from '@/lib/auth';
import { submissionClient } from '@/lib/domain/client';

export function ProjectSubmissionSnapshot({
  project,
  bounty,
  locale,
}: {
  project: ProjectModel;
  bounty: BountyModel;
  locale: Locale;
}) {
  const [submitted, setSubmitted] = useState(false);
  const [receipt, setReceipt] = useState<SubmissionReceipt | null>(null);
  const [saving, setSaving] = useState(false);
  const [submissionKey] = useState(() => crypto.randomUUID());
  const [error, setError] = useState<string | null>(null);
  const auth = useAuth();
  const [payoutAcknowledged, setPayoutAcknowledged] = useState(false);
  return (
    <div className="v1-private-workspace">
      <PrivateNotice locale={locale} />
      <header className="v1-workspace-header">
        <div>
          <p className="v1-kicker">PROJECT → BOUNTY SUBMISSION</p>
          <h1>{locale === 'vi' ? 'Kiểm tra bản nộp' : 'Review your entry'}</h1>
          <p>
            {locale === 'vi'
              ? 'Project tiếp tục thay đổi; bản nộp này sẽ bị khóa cho quá trình chấm.'
              : 'Your Project can keep changing; this submission is locked for judging.'}
          </p>
        </div>
        <FileLock2 size={34} aria-hidden="true" />
      </header>
      <section className="v1-submission-snapshot">
        <h2>{project.name}</h2>
        <p>{project.summary}</p>
        <dl>
          <div>
            <dt>Bounty</dt>
            <dd>{bounty.title}</dd>
          </div>
          <div>
            <dt>{locale === 'vi' ? 'Bản nộp' : 'Entry'}</dt>
            <dd>
              {locale === 'vi'
                ? 'Phiên bản được cấp khi gửi thành công'
                : 'Version assigned on successful submission'}
            </dd>
          </div>
          <div>
            <dt>{locale === 'vi' ? 'Quyền xem' : 'Visibility'}</dt>
            <dd>
              {locale === 'vi' ? 'Bạn và người chấm có quyền' : 'You and authorized reviewers'}
            </dd>
          </div>
        </dl>
      </section>
      {!submitted && (
        <label>
          <input
            type="checkbox"
            disabled={saving}
            checked={payoutAcknowledged}
            onChange={(event) => setPayoutAcknowledged(event.target.checked)}
          />
          {locale === 'vi'
            ? 'Tôi xác nhận ví nhận thưởng của đội: '
            : 'I confirm the team payout wallet: '}
          {auth.wallet?.address ?? (locale === 'vi' ? 'Chưa có ví' : 'No wallet available')}
        </label>
      )}
      {!submitted ? (
        <button
          type="button"
          className="button button-primary"
          disabled={saving || !payoutAcknowledged || !auth.wallet?.address}
          onClick={async () => {
            if (!auth.requireAuth('submit private project snapshot') || !project.id || !bounty.id)
              return;
            setSaving(true);
            setError(null);
            try {
              const token = await auth.getAccessToken();
              if (!token) throw new Error('Your authenticated session expired. Sign in again.');
              const result = await submissionClient.create(
                bounty.id,
                {
                  kind: 'project',
                  projectId: project.id,
                  snapshot: {
                    title: project.name,
                    summary: project.summary,
                    stage: project.status,
                    repositoryUrl: project.repositoryUrl ?? null,
                    demoUrl: project.demoUrl ?? null,
                    payoutAcknowledged,
                  },
                },
                token,
                submissionKey,
              );
              trackFrontendEvent({
                name: 'project_submission_submit',
                entityId: project.slug,
                origin: 'api',
              });
              setReceipt(result);
              setSubmitted(true);
            } catch (caught) {
              setError(userErrorMessage(locale, caught));
            } finally {
              setSaving(false);
            }
          }}
        >
          <Send size={17} aria-hidden="true" />{' '}
          {saving
            ? locale === 'vi'
              ? 'Đang gửi…'
              : 'Submitting…'
            : locale === 'vi'
              ? 'Gửi bản nộp riêng tư'
              : 'Submit private entry'}
        </button>
      ) : (
        <section className="v1-winner-preview" aria-live="polite">
          <CheckCircle2 size={28} aria-hidden="true" />
          <div>
            {receipt && (
              <SubmissionReceiptSummary
                receipt={receipt}
                bountySlug={bounty.slug}
                locale={locale}
              />
            )}
            <p className="v1-kicker">SUBMITTED · PRIVATE</p>
            <h2>
              {locale === 'vi' ? 'Bản nộp đã được lưu cố định để chấm' : 'Entry saved for judging'}
            </h2>
            <p>
              {locale === 'vi'
                ? 'Kết quả và tiền thưởng chỉ được cập nhật sau khi quyết định trao giải được xác nhận.'
                : 'Results and rewards will be updated after the award decision is confirmed.'}
            </p>
          </div>
        </section>
      )}
      {error && (
        <p className="v1-form-error" role="alert">
          {error}
        </p>
      )}
      <Link className="v1-next-link" href={`/${locale}/projects/${project.slug}`}>
        {locale === 'vi' ? 'Quay lại Project' : 'Return to Project'}
      </Link>
    </div>
  );
}
