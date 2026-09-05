'use client';

import Link from 'next/link';
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
  const [saving, setSaving] = useState(false);
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
        <h1>{locale === 'vi' ? 'Idea riêng tư đã được đồng bộ' : 'Your private Idea is synced'}</h1>
        <p>
          {locale === 'vi'
            ? 'Server đã lưu snapshot bất biến cho vòng chấm. Nội dung không xuất hiện trên Home, Search hoặc public Idea.'
            : 'The server stored an immutable judging snapshot. It does not appear on Home, Search, or public Idea pages.'}
        </p>
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
          if (!token) throw new Error('Your authenticated session expired. Sign in again.');
          await submissionClient.create(
            bounty.id,
            { kind: 'idea', payload: { title, summary, opportunity, solution, how, why } },
            token,
          );
          setSubmitted(true);
          trackFrontendEvent({
            name: 'idea_submission_submit',
            entityId: bounty.slug,
            origin: 'api',
          });
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : 'Could not submit the private Idea.');
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
      <div className="v1-form-grid">
        <label>
          <span>{locale === 'vi' ? 'Tiêu đề *' : 'Title *'}</span>
          <input
            value={title}
            maxLength={120}
            autoComplete="off"
            onChange={(event) => setTitle(event.target.value)}
            aria-invalid={attempted && !title.trim()}
          />
        </label>
        <label>
          <span>{locale === 'vi' ? 'Mô tả một dòng *' : 'One-line summary *'}</span>
          <input
            value={summary}
            maxLength={180}
            autoComplete="off"
            onChange={(event) => setSummary(event.target.value)}
            aria-invalid={attempted && !summary.trim()}
          />
        </label>
        <label>
          <span>{locale === 'vi' ? 'Cơ hội *' : 'Opportunity *'}</span>
          <textarea
            value={opportunity}
            rows={5}
            onChange={(event) => setOpportunity(event.target.value)}
            aria-invalid={attempted && !opportunity.trim()}
          />
        </label>
        <label>
          <span>{locale === 'vi' ? 'Giải pháp *' : 'Solution *'}</span>
          <textarea
            value={solution}
            rows={5}
            onChange={(event) => setSolution(event.target.value)}
            aria-invalid={attempted && !solution.trim()}
          />
        </label>
        <label>
          <span>{locale === 'vi' ? 'Cách hoạt động' : 'How it works'}</span>
          <textarea value={how} rows={4} onChange={(event) => setHow(event.target.value)} />
        </label>
        <label>
          <span>{locale === 'vi' ? 'Tại sao là lúc này?' : 'Why now?'}</span>
          <textarea value={why} rows={4} onChange={(event) => setWhy(event.target.value)} />
        </label>
      </div>
      {invalid && (
        <p className="v1-form-error" role="alert">
          {locale === 'vi'
            ? 'Hãy hoàn thành tất cả trường để khóa snapshot.'
            : 'Complete every field before locking the snapshot.'}
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
            ? 'Mã hóa khi truyền · chỉ owner và judge được phép xem'
            : 'Encrypted in transit · owner and authorized judges only'}
        </p>
        <button className="button button-primary" type="submit" disabled={saving}>
          {saving && <LoaderCircle className="composer-spinner" size={17} aria-hidden="true" />}
          {locale === 'vi' ? 'Gửi Idea riêng tư' : 'Submit Private Idea'}
        </button>
      </footer>
    </form>
  );
}
