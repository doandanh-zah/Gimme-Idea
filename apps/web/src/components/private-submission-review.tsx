'use client';

import { useEffect, useState } from 'react';
import type { Locale } from '@gimme-idea/contracts';
import type { BountyModel, PrivateSubmissionModel } from '@/lib/domain/types';
import { useAuth } from '@/lib/auth';
import { submissionClient } from '@/lib/domain/client';
import { JudgingPreview } from './judging-preview';

export function PrivateSubmissionReview({
  bounty,
  submissionId,
  locale,
}: {
  bounty: BountyModel;
  submissionId: string;
  locale: Locale;
}) {
  const auth = useAuth();
  const [submission, setSubmission] = useState<PrivateSubmissionModel | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const token = await auth.getAccessToken();
        if (!token) throw new Error('Sign in with an authorized judge account.');
        const value = await submissionClient.get(submissionId, token);
        if (active) setSubmission(value);
      } catch (caught) {
        if (active)
          setError(caught instanceof Error ? caught.message : 'Private submission is unavailable.');
      }
    })();
    return () => {
      active = false;
    };
  }, [auth, submissionId]);
  if (error)
    return (
      <p className="v1-form-error" role="alert">
        {error}
      </p>
    );
  if (!submission)
    return (
      <p className="empty-note" aria-live="polite">
        {locale === 'vi'
          ? 'Đang kiểm tra quyền và tải submission…'
          : 'Checking access and loading submission…'}
      </p>
    );
  return <JudgingPreview bounty={bounty} submission={submission} locale={locale} />;
}
