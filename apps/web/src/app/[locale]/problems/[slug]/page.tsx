import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { notFound } from 'next/navigation';
import { Eyebrow, StatusPill } from '@gimme-idea/ui';
import { LocalKnowledgeDetail } from '@/components/local-knowledge-detail';
import { PageIndex } from '@/components/page-index';
import { Provenance } from '@/components/provenance';
import { getProblem } from '@/lib/api';
import { copy, isLocale } from '@/lib/i18n';

type PageProps = { params: Promise<{ locale: string; slug: string }> };
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  if (slug.startsWith('local-')) {
    return {
      title: 'Local problem',
      alternates: {
        canonical: `/${locale}/problems/${slug}`,
        languages: { en: `/en/problems/${slug}`, vi: `/vi/problems/${slug}` },
      },
    };
  }
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
  if (slug.startsWith('local-')) {
    return <LocalKnowledgeDetail locale={locale} kind="problem" slug={slug} />;
  }
  const problem = await getProblem(slug);
  if (!problem) {
    notFound();
  }
  const relatedIndex = problem.bounty ? '05' : '04';
  return (
    <main id="main" className="detail-page problem-page">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href={`/${locale}`}>
          <ArrowLeft size={14} />
          {t.navHome}
        </Link>
        <span>/</span>
        <strong>{t.navProblems}</strong>
      </nav>
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
      <PageIndex
        label={t.onThisPage}
        items={[
          { index: '01', label: t.problem, href: '#problem' },
          { index: '02', label: t.whoHasThisProblem, href: '#who' },
          { index: '03', label: t.whyItMatters, href: '#why' },
          ...(problem.bounty
            ? [{ index: '04', label: t.opportunity, href: '#opportunity' as const }]
            : []),
          { index: relatedIndex, label: t.relatedIdeas, href: '#related-ideas' },
          { index: problem.bounty ? '06' : '05', label: t.sources, href: '#sources' },
        ]}
      />
      <div className="detail-grid">
        <article className="canonical-content">
          <section id="problem" className="content-section">
            <div className="chapter-heading">
              <span>01</span>
              <div>
                <small>{t.oneLineDescription}</small>
                <h2>{t.problem}</h2>
              </div>
            </div>
            <p className="long-copy">{problem.description}</p>
          </section>
          <section id="who" className="content-section content-section-raised">
            <div className="chapter-heading">
              <span>02</span>
              <div>
                <small>{t.signals}</small>
                <h2>{t.whoHasThisProblem}</h2>
              </div>
            </div>
            <ul className="editorial-list">
              {problem.affectedGroups.map((group) => (
                <li key={group}>{group}</li>
              ))}
            </ul>
          </section>
          <section id="why" className="content-section content-section-raised">
            <div className="chapter-heading">
              <span>03</span>
              <div>
                <small>{t.evidence}</small>
                <h2>{t.whyItMatters}</h2>
              </div>
            </div>
            <ul className="editorial-list evidence-list">
              {problem.evidence.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
          {problem.bounty && (
            <section id="opportunity" className="content-section">
              <div className="chapter-heading">
                <span>04</span>
                <div>
                  <small>{t.opportunity}</small>
                  <h2>{t.bounty}</h2>
                </div>
              </div>
              <div className="bounty-panel">
                <div>
                  <Eyebrow>{t.bounty}</Eyebrow>
                  <h3>{problem.bounty.title}</h3>
                </div>
                <div>
                  <StatusPill
                    tone={problem.bounty.status === 'mock_funded' ? 'success' : 'neutral'}
                  >
                    {problem.bounty.status.replace('_', ' ')}
                  </StatusPill>
                  <p>
                    {(Number(problem.bounty.amountRaw) / 1_000_000).toLocaleString()}{' '}
                    {problem.bounty.currency} <small>DEV FIXTURE</small>
                  </p>
                </div>
              </div>
            </section>
          )}
          <section id="related-ideas" className="content-section content-section-raised">
            <div className="chapter-heading">
              <span>{relatedIndex}</span>
              <div>
                <small>
                  {problem.relatedIdeas.length.toString().padStart(2, '0')} {t.ideasUnit}
                </small>
                <h2>{t.relatedIdeas}</h2>
              </div>
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
        <Provenance id="sources" value={problem.provenance} label={t.sourceLabel} />
      </div>
    </main>
  );
}
