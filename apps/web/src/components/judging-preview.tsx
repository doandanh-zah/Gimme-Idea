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
  const vi = locale === 'vi';
  const fields: [string, string][] = [
    ['opportunity', vi ? 'Cơ hội' : 'Opportunity'],
    ['solution', vi ? 'Giải pháp' : 'Solution'],
    ['how', vi ? 'Cách hoạt động' : 'How it works'],
    ['why', vi ? 'Vì sao là lúc này' : 'Why now'],
    ['stage', vi ? 'Giai đoạn' : 'Stage'],
    ['repositoryUrl', vi ? 'Địa chỉ mã nguồn' : 'Repository URL'],
    ['demoUrl', vi ? 'Địa chỉ bản demo' : 'Demo URL'],
    ['payoutWalletAddress', vi ? 'Ví nhận thưởng' : 'Reward wallet'],
  ];
  const snapshot = submission.snapshot ?? {};
  const content =
    snapshot.payload && typeof snapshot.payload === 'object'
      ? (snapshot.payload as Record<string, unknown>)
      : snapshot;
  return (
    <div className="v1-judging-page">
      <PrivateNotice locale={locale} judge />
      <header className="v1-judging-header">
        <div>
          <p className="v1-kicker">{vi ? 'BÀI NỘP RIÊNG TƯ' : 'PRIVATE SUBMISSION'}</p>
          <h1>{submission.title}</h1>
          <p>
            {vi ? 'Phiên bản' : 'Version'} {submission.snapshotVersion}
            {submission.submittedAt && (
              <>
                {' '}
                ·{' '}
                <time dateTime={submission.submittedAt}>
                  {new Intl.DateTimeFormat(locale, {
                    dateStyle: 'medium',
                    timeStyle: 'long',
                  }).format(new Date(submission.submittedAt))}
                </time>
              </>
            )}
          </p>
        </div>
      </header>
      <section className="v1-submission-snapshot">
        <h2>{vi ? 'Nội dung đã nộp' : 'Submitted content'}</h2>
        <p>{submission.summary}</p>
        <dl>
          {fields.map(([key, label]) =>
            typeof content[key] === 'string' && content[key] ? (
              <div key={key}>
                <dt>{label}</dt>
                <dd style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                  {String(content[key])}
                </dd>
              </div>
            ) : null,
          )}
        </dl>
        <details>
          <summary>{vi ? 'Thông tin biên nhận' : 'Receipt details'}</summary>
          <p>
            {vi ? 'Mã bài nộp' : 'Submission ID'}: <code>{submission.id}</code>
          </p>
          {submission.contentHash && (
            <p style={{ overflowWrap: 'anywhere' }}>
              SHA-256: <code>{submission.contentHash}</code>
            </p>
          )}
        </details>
      </section>
      <section className="v1-review-score">
        <h2>{vi ? 'Tiêu chí chấm' : 'Judging criteria'}</h2>
        {bounty.criteria.length ? (
          <ul>
            {bounty.criteria.map((criterion) => (
              <li key={criterion.name}>
                {criterion.name} · {criterion.weight}%
              </li>
            ))}
          </ul>
        ) : (
          <p>{vi ? 'Chưa công bố tiêu chí chấm.' : 'Judging criteria have not been published.'}</p>
        )}
        <p>
          {vi
            ? 'Hiện có thể xem bản nộp. Chấm điểm, yêu cầu làm rõ và chọn người thắng chưa khả dụng trên màn hình này.'
            : 'You can view the submitted entry. Scoring, clarification requests and winner selection are not available on this screen yet.'}
        </p>
      </section>
    </div>
  );
}
