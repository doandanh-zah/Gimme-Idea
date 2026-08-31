import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { notFound } from 'next/navigation';
import { Eyebrow, StatusPill } from '@gimme-idea/ui';
import { PageIndex } from '@/components/page-index';
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
  const attemptIndex = idea.project ? '05' : '04';
  return (
    <main id="main" className="detail-page idea-page">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href={`/${locale}`}>
          <ArrowLeft size={14} />
          {t.navHome}
        </Link>
        <span>/</span>
        <strong>{t.navIdeas}</strong>
      </nav>
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
      <PageIndex
        label={t.onThisPage}
        items={[
          { index: '01', label: t.thesis, href: '#thesis' },
          { index: '02', label: t.solution, href: '#solution' },
          { index: '03', label: t.targetUsers, href: '#audience' },
          ...(idea.project ? [{ index: '04', label: t.build, href: '#build' as const }] : []),
          { index: attemptIndex, label: t.attempts, href: '#attempts' },
          { index: idea.project ? '06' : '05', label: t.sources, href: '#sources' },
        ]}
      />
      <div className="detail-grid">
        <article className="canonical-content">
          <section id="thesis" className="content-section content-section-accent">
            <div className="chapter-heading">
              <span>01</span>
              <div>
                <small>{t.buildableThesis}</small>
                <h2>{t.thesis}</h2>
              </div>
            </div>
            <p className="thesis-statement">{idea.thesis}</p>
          </section>
          <section id="solution" className="content-section">
            <div className="chapter-heading">
              <span>02</span>
              <div>
                <small>{t.overview}</small>
                <h2>{t.solution}</h2>
              </div>
            </div>
            <p className="long-copy">{idea.solution}</p>
          </section>
          <section id="audience" className="content-section content-section-raised">
            <div className="chapter-heading">
              <span>03</span>
              <div>
                <small>{t.audience}</small>
                <h2>{t.targetUsers}</h2>
              </div>
            </div>
            <div className="tag-list">
              {idea.targetUsers.map((user) => (
                <span key={user}>{user}</span>
              ))}
            </div>
          </section>
          {idea.project && (
            <section id="build" className="content-section">
              <div className="chapter-heading">
                <span>04</span>
                <div>
                  <small>{t.build}</small>
                  <h2>{t.project}</h2>
                </div>
              </div>
              <div className="project-panel">
                <Eyebrow>{t.project}</Eyebrow>
                <div>
                  <h3>{idea.project.name}</h3>
                  <StatusPill tone="success">{idea.project.stage}</StatusPill>
                </div>
                <p>Project evidence is tracked independently from the original idea thesis.</p>
              </div>
            </section>
          )}
          <section id="attempts" className="content-section content-section-raised">
            <div className="chapter-heading">
              <span>{attemptIndex}</span>
              <div>
                <small>
                  {idea.previousAttempts.length.toString().padStart(2, '0')} {t.documented}
                </small>
                <h2>{t.attempts}</h2>
              </div>
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
        <Provenance id="sources" value={idea.provenance} label={t.sourceLabel} />
      </div>
    </main>
  );
}
