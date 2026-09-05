'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Locale } from '@gimme-idea/contracts';
import { useAuth } from '@/lib/auth';
import { submissionClient } from '@/lib/domain/client';
import type { PrivateSubmissionModel } from '@/lib/domain/types';

export function PrivateSubmissionList({
  bountyId,
  bountySlug,
  locale,
}: {
  bountyId: string;
  bountySlug: string;
  locale: Locale;
}) {
  const { getAccessToken, session } = useAuth();
  const [submissions, setSubmissions] = useState<PrivateSubmissionModel[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const token = await getAccessToken();
        if (!token) throw new Error('Authentication is required.');
        const rows = await submissionClient.forBounty(bountyId, token);
        if (active) setSubmissions(rows);
      } catch (caught) {
        if (active)
          setError(caught instanceof Error ? caught.message : 'Submissions are unavailable.');
      }
    })();
    return () => {
      active = false;
    };
  }, [bountyId, getAccessToken, session?.id]);
  if (error)
    return (
      <p className="v1-form-error" role="alert">
        {error}
      </p>
    );
  if (!submissions)
    return (
      <p className="empty-note" aria-live="polite">
        {locale === 'vi'
          ? 'Đang kiểm tra quyền và tải submissions…'
          : 'Checking access and loading submissions…'}
      </p>
    );
  if (!submissions.length)
    return (
      <p>
        {locale === 'vi'
          ? 'Chưa có submission. Danh tính competitor không được hiển thị công khai.'
          : 'No submissions yet. Competitor identities are never shown publicly.'}
      </p>
    );
  return submissions.map((submission) => (
    <Link
      className="v1-dashboard-row is-private"
      key={submission.id}
      href={`/${locale}/dashboard/bounties/${bountySlug}/submissions/${submission.id}`}
    >
      <span>
        <strong>{submission.title}</strong>
        <small>
          {submission.owner} · {submission.status}
        </small>
      </span>
      <span>Private review</span>
      <ArrowRight size={17} aria-hidden="true" />
    </Link>
  ));
}
