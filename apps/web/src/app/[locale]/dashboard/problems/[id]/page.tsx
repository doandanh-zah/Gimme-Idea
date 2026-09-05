import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { notFound } from 'next/navigation';
import { ProblemReference } from '@/components/v1-primitives';
import { ReviewerGate } from '@/components/reviewer-gate';
import { bountyClient } from '@/lib/domain/client';
import { problemClient } from '@/lib/domain/client';
import { isLocale } from '@/lib/i18n';
export default async function DashboardProblem({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const problemRecord = await problemClient.get(id);
  const problem = problemRecord
    ? {
        slug: problemRecord.slug,
        title: problemRecord.title,
        summary: problemRecord.summary,
        industry: 'Unspecified',
        region: 'Unspecified',
      }
    : null;
  if (!problem) notFound();
  const bounty = (await bountyClient.list('idea')).find((item) => item.problem.slug === id);
  return (
    <main id="main" className="app-page v1-dashboard">
      <ReviewerGate locale={locale}>
        <div className="v1-authorized-dashboard">
          <p className="v1-kicker">ORGANIZATION PROBLEM</p>
          <h1>{problem.title}</h1>
          <ProblemReference problem={problem} locale={locale} />
          {bounty ? (
            <section className="v1-dashboard-section">
              <h2>{locale === 'vi' ? 'Giai đoạn hiện tại' : 'Current stage'}</h2>
              <Link
                className="v1-dashboard-row"
                href={`/${locale}/dashboard/bounties/${bounty.slug}`}
              >
                <span>
                  <strong>Idea Bounty</strong>
                  <small>
                    {bounty.status} · {bounty.privateSubmissionCount} private Ideas
                  </small>
                </span>
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </section>
          ) : (
            <Link className="button button-primary" href={`/${locale}/bounties`}>
              {locale === 'vi' ? 'Fund Idea Bounty' : 'Fund an Idea Bounty'}
            </Link>
          )}
        </div>
      </ReviewerGate>
    </main>
  );
}
