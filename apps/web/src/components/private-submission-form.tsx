'use client';

import { userErrorMessage } from '@/lib/error-message';

import Link from 'next/link';
import { SubmissionReceiptSummary, type SubmissionReceipt } from './submission-receipt';
import { ArrowLeft, CheckCircle2, LoaderCircle } from 'lucide-react';
import { useState } from 'react';
import type { Locale } from '@gimme-idea/contracts';
import type { BountyModel } from '@/lib/domain/types';
import { PrivateNotice } from '@/components/v1-primitives';
import { trackFrontendEvent } from '@/lib/domain/analytics';
import { useAuth } from '@/lib/auth';
import { submissionClient } from '@/lib/domain/client';

export function PrivateIdeaSubmissionForm({
  bounty,
  locale,
}: {
  bounty: BountyModel;
  locale: Locale;
}) {
  const auth = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [receipt, setReceipt] = useState<SubmissionReceipt | null>(null);
  const [saving, setSaving] = useState(false);
  const [submissionKey] = useState(() => crypto.randomUUID());
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [opportunity, setOpportunity] = useState('');
  const [solution, setSolution] = useState('');
  const [how, setHow] = useState('');
  const [why, setWhy] = useState('');
  const [attempted, setAttempted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const invalid =
    attempted &&
    (!title.trim() ||
      !summary.trim() ||
      !opportunity.trim() ||
      !solution.trim() ||
      !how.trim() ||
      !why.trim());

  if (submitted) {
    return (
      <section className="v1-submission-success" aria-live="polite">
        <CheckCircle2 size={32} aria-hidden="true" />
        <p className="v1-kicker">SUBMITTED · PRIVATE</p>
        <h1>
          {locale === 'vi'
            ? 'Đã nhận bài nộp riêng tư của bạn'
            : 'Your private entry has been received'}
        </h1>
        <p>
          {locale === 'vi'
            ? 'Bản nộp đã được lưu cố định để chấm. Nội dung chỉ dành cho bạn và người có quyền xem, không xuất hiện trên bảng tin hoặc tìm kiếm công khai.'
            : 'Your entry has been saved for judging. Only you and authorized reviewers can view it; it is excluded from public feeds and search.'}
        </p>
        {receipt && (
          <SubmissionReceiptSummary receipt={receipt} bountySlug={bounty.slug} locale={locale} />
        )}
        <div className="v1-gate-actions">
          <Link className="button button-primary" href={`/${locale}/bounties/${bounty.slug}`}>
            {locale === 'vi' ? 'Quay lại Bounty' : 'Return to Bounty'}
          </Link>
          <Link className="button button-quiet" href={`/${locale}/problems/${bounty.problem.slug}`}>
            {locale === 'vi' ? 'Xem Problem' : 'View Problem'}
          </Link>
        </div>
      </section>
    );
  }

  return (
    <form
      className="v1-submission-form"
      aria-busy={saving}
      onSubmit={async (event) => {
        event.preventDefault();
        if (!auth.requireAuth('submit private idea')) return;
        setAttempted(true);
        setError(null);
        if (
          !bounty.id ||
          !title.trim() ||
          !summary.trim() ||
          !opportunity.trim() ||
          !solution.trim() ||
          !how.trim() ||
          !why.trim()
        )
          return;
        setSaving(true);
        try {
          const token = await auth.getAccessToken();
          if (!token)
            throw new Error(
              locale === 'vi'
                ? 'Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.'
                : 'Your session expired. Sign in again.',
            );
          const result = await submissionClient.create(
            bounty.id,
            { kind: 'idea', payload: { title, summary, opportunity, solution, how, why } },
            token,
            submissionKey,
          );
          setReceipt(result);
          setSubmitted(true);
          trackFrontendEvent({
            name: 'idea_submission_submit',
            entityId: bounty.slug,
            origin: 'api',
          });
        } catch (caught) {
          setError(userErrorMessage(locale, caught));
        } finally {
          setSaving(false);
        }
      }}
    >
      <Link className="v1-back-link" href={`/${locale}/bounties/${bounty.slug}`}>
        <ArrowLeft size={15} aria-hidden="true" />
        {locale === 'vi' ? 'Quay lại Bounty' : 'Back to Bounty'}
      </Link>
      <PrivateNotice locale={locale} judge />
      <header>
        <p className="v1-kicker">PRIVATE IDEA SUBMISSION</p>
        <h1>{locale === 'vi' ? 'Đề xuất một hướng giải quyết' : 'Propose a direction'}</h1>
        <p>{bounty.problem.title}</p>
      </header>
      <fieldset
        className="v1-form-grid"
        disabled={saving}
        style={{ border: 0, padding: 0, margin: 0 }}
      >
        <label>
          <span>{locale === 'vi' ? 'Tiêu đề *' : 'Title *'}</span>
          <input
            required
            minLength={5}
            id="submission-title"
            aria-describedby="submission-title-hint"
            value={title}
            maxLength={120}
            autoComplete="off"
            onChange={(event) => setTitle(event.target.value)}
            aria-invalid={attempted && !title.trim()}
          />
          <small id="submission-title-hint">
            {locale === 'vi' ? 'Bắt buộc, 5–120 ký tự.' : 'Required, 5–120 characters.'}
          </small>
        </label>
        <label>
          <span>{locale === 'vi' ? 'Mô tả một dòng *' : 'One-line summary *'}</span>
          <input
            required
            minLength={20}
            id="submission-summary"
            aria-describedby="submission-summary-hint"
            value={summary}
            maxLength={180}
            autoComplete="off"
            onChange={(event) => setSummary(event.target.value)}
            aria-invalid={attempted && !summary.trim()}
          />
          <small id="submission-summary-hint">
            {locale === 'vi' ? 'Bắt buộc, 20–180 ký tự.' : 'Required, 20–180 characters.'}
          </small>
        </label>
        <label>
          <span>{locale === 'vi' ? 'Cơ hội *' : 'Opportunity *'}</span>
          <textarea
            required
            minLength={20}
            maxLength={5000}
            id="submission-opportunity"
            aria-describedby="submission-opportunity-hint"
            value={opportunity}
            rows={5}
            onChange={(event) => setOpportunity(event.target.value)}
            aria-invalid={attempted && !opportunity.trim()}
          />
          <small id="submission-opportunity-hint">
            {locale === 'vi' ? 'Bắt buộc, 20–5000 ký tự.' : 'Required, 20–5000 characters.'}
          </small>
        </label>
        <label>
          <span>{locale === 'vi' ? 'Giải pháp *' : 'Solution *'}</span>
          <textarea
            required
            minLength={20}
            maxLength={10000}
            id="submission-solution"
            aria-describedby="submission-solution-hint"
            value={solution}
            rows={5}
            onChange={(event) => setSolution(event.target.value)}
            aria-invalid={attempted && !solution.trim()}
          />
          <small id="submission-solution-hint">
            {locale === 'vi' ? 'Bắt buộc, 20–10000 ký tự.' : 'Required, 20–10000 characters.'}
          </small>
        </label>
        <label>
          <span>{locale === 'vi' ? 'Cách hoạt động *' : 'How it works *'}</span>
          <textarea
            required
            minLength={10}
            maxLength={5000}
            id="submission-how"
            aria-describedby="submission-how-hint"
            value={how}
            rows={4}
            onChange={(event) => setHow(event.target.value)}
            aria-invalid={attempted && !how.trim()}
          />
          <small id="submission-how-hint">
            {locale === 'vi' ? 'Bắt buộc, 10–5000 ký tự.' : 'Required, 10–5000 characters.'}
          </small>
        </label>
        <label>
          <span>{locale === 'vi' ? 'Tại sao là lúc này? *' : 'Why now? *'}</span>
          <textarea
            required
            minLength={10}
            maxLength={5000}
            id="submission-why"
            aria-describedby="submission-why-hint"
            value={why}
            rows={4}
            onChange={(event) => setWhy(event.target.value)}
            aria-invalid={attempted && !why.trim()}
          />
          <small id="submission-why-hint">
            {locale === 'vi' ? 'Bắt buộc, 10–5000 ký tự.' : 'Required, 10–5000 characters.'}
          </small>
        </label>
      </fieldset>
      {invalid && (
        <p className="v1-form-error" role="alert">
          {locale === 'vi'
            ? 'Hãy hoàn thành các trường bắt buộc trước khi gửi.'
            : 'Complete every required field before submitting.'}
        </p>
      )}
      {error && (
        <p className="v1-form-error" role="alert">
          {error}
        </p>
      )}
      <footer>
        <p>
          {locale === 'vi'
            ? 'Chỉ bạn và người chấm có quyền xem'
            : 'Only you and authorized reviewers can view this entry'}
        </p>
        <button className="button button-primary" type="submit" disabled={saving}>
          {saving && <LoaderCircle className="composer-spinner" size={17} aria-hidden="true" />}
          {locale === 'vi' ? 'Gửi Idea riêng tư' : 'Submit Private Idea'}
        </button>
      </footer>
    </form>
  );
}
