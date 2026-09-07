'use client';

import { userErrorMessage } from '@/lib/error-message';

import { useEffect, useState } from 'react';
import type { Locale } from '@gimme-idea/contracts';
import type { BountyModel, PrivateSubmissionModel } from '@/lib/domain/types';
import { useAuth } from '@/lib/auth';
import { submissionClient } from '@/lib/domain/client';
import { JudgingPreview } from './judging-preview';

function PrivateSubmissionReviewContent({
  bounty,
  submissionId,
  locale,
}: {
  bounty: BountyModel;
  submissionId: string;
  locale: Locale;
}) {
  const { getAccessToken, session } = useAuth();
  const [submission, setSubmission] = useState<PrivateSubmissionModel | null>(null);
  const [retry, setRetry] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset the external resource state for a new request.
    setLoading(true);
    setSubmission(null);
    setError(null);
    void (async () => {
      try {
        const token = await getAccessToken();
        if (!token) throw new Error('Sign in with an authorized judge account.');
        const value = await submissionClient.get(submissionId, token);
        if (active) setSubmission(value);
      } catch (caught) {
        if (active) setError(userErrorMessage(locale, caught));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [getAccessToken, session?.id, submissionId, retry, locale]);
  if (error)
    return (
      <p className="v1-form-error" role="alert">
        {error}
        <button type="button" onClick={() => setRetry((value) => value + 1)}>
          {locale === 'vi' ? 'Thử lại' : 'Try again'}
        </button>
      </p>
    );
  if (loading)
    return (
      <p className="empty-note" aria-live="polite">
        {locale === 'vi'
          ? 'Đang kiểm tra quyền và tải bài nộp…'
          : 'Checking access and loading submission…'}
      </p>
    );
  if (!submission)
    return (
      <p role="status">
        {locale === 'vi'
          ? 'Không tìm thấy bài nộp hoặc bạn không có quyền xem.'
          : 'Submission not found or you do not have access.'}
      </p>
    );
  return <JudgingPreview bounty={bounty} submission={submission} locale={locale} />;
}

export function PrivateSubmissionReview(
  props: Parameters<typeof PrivateSubmissionReviewContent>[0],
) {
  const { session } = useAuth();
  return (
    <PrivateSubmissionReviewContent
      key={`${session?.id ?? 'guest'}:${props.submissionId}`}
      {...props}
    />
  );
}
