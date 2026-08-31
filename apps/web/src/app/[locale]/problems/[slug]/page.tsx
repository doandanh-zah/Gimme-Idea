import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { notFound } from 'next/navigation';
import { Eyebrow, StatusPill } from '@gimme-idea/ui';
import { Provenance } from '@/components/provenance';
import { getProblem } from '@/lib/api';
import { copy, isLocale } from '@/lib/i18n';

type PageProps = { params: Promise<{ locale: string; slug: string }> };
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const problem = await getProblem(slug);
  return problem
    ? {
        title: problem.title,
        description: problem.summary,
        alternates: {
          canonical: `/${locale}/problems/${slug}`,
          languages: { en: `/en/problems/${slug}`, vi: `/vi/problems/${slug}` },
        },
      }
    : {};
}
export default async function ProblemPage({ params }: PageProps) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const t = copy[locale];
  const problem = await getProblem(slug);
  if (!problem) notFound();
  return (
    <main id="main" className="detail-page problem-page">
      <Link className="back-link" href={`/${locale}`}>
        <ArrowLeft size={14} />
        {t.back}
      </Link>
      <header className="detail-header">
        <div>
          <Eyebrow>PROBLEM / {problem.severity.toUpperCase()}</Eyebrow>
          <h1>{problem.title}</h1>
          <p className="detail-summary">{problem.summary}</p>
        </div>
        <div className="status-stack">
          <StatusPill tone="warning">{problem.researchStatus.replace('_', ' ')}</StatusPill>
          <StatusPill>{problem.provenance.origin.replace('_', ' ')}</StatusPill>
        </div>
      </header>
      <div className="detail-grid">
        <article className="canonical-content">
          <section>
            <h2>Problem frame</h2>
            <p className="long-copy">{problem.description}</p>
          </section>
          <section className="split-section">
            <div>
              <h2>{t.affected}</h2>
              <ul className="editorial-list">
                {problem.affectedGroups.map((group) => (
                  <li key={group}>{group}</li>
                ))}
              </ul>
            </div>
            <div>
              <h2>{t.evidence}</h2>
              <ul className="editorial-list evidence-list">
                {problem.evidence.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </section>
          {problem.bounty && (
            <section className="bounty-panel">
              <div>
                <Eyebrow>{t.bounty}</Eyebrow>
                <h2>{problem.bounty.title}</h2>
              </div>
              <div>
                <StatusPill tone={problem.bounty.status === 'mock_funded' ? 'success' : 'neutral'}>
                  {problem.bounty.status.replace('_', ' ')}
                </StatusPill>
                <p>
                  {(Number(problem.bounty.amountRaw) / 1_000_000).toLocaleString()}{' '}
                  {problem.bounty.currency} <small>DEV FIXTURE</small>
                </p>
              </div>
            </section>
          )}
          <section>
            <div className="section-heading">
              <h2>{t.relatedIdeas}</h2>
              <span>{problem.relatedIdeas.length.toString().padStart(2, '0')}</span>
            </div>
            <div className="idea-links">
              {problem.relatedIdeas.map((idea, index) => (
                <Link key={idea.slug} href={`/${locale}/ideas/${idea.slug}`}>
                  <small>{String(index + 1).padStart(2, '0')} / IDEA</small>
                  <strong>{idea.title}</strong>
                  <p>{idea.summary}</p>
                  <ArrowUpRight size={17} />
                </Link>
              ))}
            </div>
          </section>
        </article>
        <Provenance value={problem.provenance} label={t.sourceLabel} />
      </div>
    </main>
  );
}
