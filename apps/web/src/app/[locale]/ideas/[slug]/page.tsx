import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { notFound } from 'next/navigation';
import { Eyebrow, StatusPill } from '@gimme-idea/ui';
import { Provenance } from '@/components/provenance';
import { getIdea } from '@/lib/api';
import { copy, isLocale } from '@/lib/i18n';

type PageProps = { params: Promise<{ locale: string; slug: string }> };
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const idea = await getIdea(slug);
  return idea
    ? {
        title: idea.title,
        description: idea.summary,
        alternates: {
          canonical: `/${locale}/ideas/${slug}`,
          languages: { en: `/en/ideas/${slug}`, vi: `/vi/ideas/${slug}` },
        },
      }
    : {};
}
export default async function IdeaPage({ params }: PageProps) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const t = copy[locale];
  const idea = await getIdea(slug);
  if (!idea) notFound();
  return (
    <main id="main" className="detail-page idea-page">
      <Link className="back-link" href={`/${locale}`}>
        <ArrowLeft size={14} />
        {t.back}
      </Link>
      <header className="detail-header idea-header">
        <div>
          <Eyebrow>IDEA / BUILDABLE THESIS</Eyebrow>
          <h1>{idea.title}</h1>
          <p className="detail-summary">{idea.summary}</p>
        </div>
        <div className="status-stack">
          <StatusPill tone="purple">{idea.researchStatus.replace('_', ' ')}</StatusPill>
          <StatusPill>{idea.provenance.origin.replace('_', ' ')}</StatusPill>
        </div>
      </header>
      <div className="problem-anchor">
        <small>{t.primaryProblem.toUpperCase()}</small>
        <Link href={`/${locale}/problems/${idea.primaryProblem.slug}`}>
          <strong>{idea.primaryProblem.title}</strong>
          <p>{idea.primaryProblem.summary}</p>
          <ArrowUpRight size={17} />
        </Link>
      </div>
      <div className="detail-grid">
        <article className="canonical-content">
          <section className="thesis-block">
            <Eyebrow>{t.thesis}</Eyebrow>
            <p>{idea.thesis}</p>
          </section>
          <section>
            <h2>{t.solution}</h2>
            <p className="long-copy">{idea.solution}</p>
          </section>
          <section>
            <h2>{t.targetUsers}</h2>
            <div className="tag-list">
              {idea.targetUsers.map((user) => (
                <span key={user}>{user}</span>
              ))}
            </div>
          </section>
          {idea.project && (
            <section className="project-panel">
              <Eyebrow>{t.project}</Eyebrow>
              <div>
                <h2>{idea.project.name}</h2>
                <StatusPill tone="success">{idea.project.stage}</StatusPill>
              </div>
              <p>Project evidence is tracked independently from the original idea thesis.</p>
            </section>
          )}
          <section>
            <div className="section-heading">
              <h2>{t.attempts}</h2>
              <span>{idea.previousAttempts.length.toString().padStart(2, '0')}</span>
            </div>
            {idea.previousAttempts.length === 0 ? (
              <p className="empty-note">
                No documented attempts yet. This is a research gap, not proof of novelty.
              </p>
            ) : (
              <ol className="attempt-list">
                {idea.previousAttempts.map((attempt, index) => (
                  <li key={attempt.id}>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <div>
                      <div>
                        <h3>{attempt.name}</h3>
                        <StatusPill>{attempt.outcome}</StatusPill>
                      </div>
                      <p>{attempt.description}</p>
                      <blockquote>
                        <strong>LESSON</strong>
                        {attempt.lesson}
                      </blockquote>
                      {attempt.sourceUrl && (
                        <a href={attempt.sourceUrl} target="_blank" rel="noreferrer">
                          Inspect source <ArrowUpRight size={14} />
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </article>
        <Provenance value={idea.provenance} label={t.sourceLabel} />
      </div>
    </main>
  );
}
