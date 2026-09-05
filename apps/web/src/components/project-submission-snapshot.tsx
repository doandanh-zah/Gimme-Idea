'use client';

import Link from 'next/link';
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const auth = useAuth();
  return (
    <div className="v1-private-workspace">
      <PrivateNotice locale={locale} />
      <header className="v1-workspace-header">
        <div>
          <p className="v1-kicker">PROJECT → BOUNTY SUBMISSION</p>
          <h1>{locale === 'vi' ? 'Kiểm tra snapshot' : 'Review submission snapshot'}</h1>
          <p>
            {locale === 'vi'
              ? 'Project tiếp tục thay đổi; snapshot v0.8 này sẽ bị khóa cho quá trình chấm.'
              : 'Your Project can keep changing; this v0.8 snapshot is locked for judging.'}
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
            <dt>Snapshot</dt>
            <dd>v0.8 · 04 Sep 2026</dd>
          </div>
          <div>
            <dt>Visibility</dt>
            <dd>Private owner + authorized judges</dd>
          </div>
        </dl>
      </section>
      {!submitted ? (
        <button
          type="button"
          className="button button-primary"
          disabled={saving}
          onClick={async () => {
            if (!auth.requireAuth('submit private project snapshot') || !project.id || !bounty.id)
              return;
            setSaving(true);
            setError(null);
            try {
              const token = await auth.getAccessToken();
              if (!token) throw new Error('Your authenticated session expired. Sign in again.');
              await submissionClient.create(
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
                    payoutAcknowledged: true,
                  },
                },
                token,
              );
              trackFrontendEvent({
                name: 'project_submission_submit',
                entityId: project.slug,
                origin: 'api',
              });
              setSubmitted(true);
            } catch (caught) {
              setError(
                caught instanceof Error ? caught.message : 'Could not submit this snapshot.',
              );
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
              ? 'Gửi snapshot riêng tư'
              : 'Submit private snapshot'}
        </button>
      ) : (
        <section className="v1-winner-preview" aria-live="polite">
          <CheckCircle2 size={28} aria-hidden="true" />
          <div>
            <p className="v1-kicker">SUBMITTED · SERVER SNAPSHOT</p>
            <h2>
              {locale === 'vi' ? 'Snapshot đã được khóa để chấm' : 'Snapshot locked for judging'}
            </h2>
            <p>
              {locale === 'vi'
                ? 'Chưa có kết quả hoặc payout cho đến khi Solana xác nhận settlement.'
                : 'No result or payout is shown until Solana confirms settlement.'}
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
