import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import { notFound } from 'next/navigation';
import { Eyebrow, StatusPill } from '@gimme-idea/ui';
import { LocalKnowledgeDetail } from '@/components/local-knowledge-detail';
import { PageIndex } from '@/components/page-index';
import { Provenance } from '@/components/provenance';
import { EntityActions } from '@/components/v1-actions';
import { BountyCard, ProjectCard } from '@/components/v1-cards';
import { bountyClient, problemClient, projectClient } from '@/lib/domain/client';
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
  const problem = await problemClient.get(slug);
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
  const problem = await problemClient.get(slug);
  if (!problem) {
    notFound();
  }
  const [ideaBounties, projects] = await Promise.all([
    bountyClient.list('idea'),
    projectClient.list(),
  ]);
  const ideaBounty = ideaBounties.find((item) => item.problem.slug === slug);
  const historical = projects.filter(
    (item) => item.mode === 'historical_imported' && item.problem.slug === slug,
  );
  const relatedIndex = ideaBounty ? '06' : '05';
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
      <div className="v1-canonical-actionbar">
        <EntityActions
          locale={locale}
          target={{
            kind: 'problem',
            slug: problem.slug,
            href: `/${locale}/problems/${problem.slug}`,
            title: problem.title,
            summary: problem.summary,
            creatorName: problem.creator?.displayName ?? 'Gimme Idea',
            creatorUsername: problem.creator?.username ?? null,
            avatarUrl: problem.creator?.avatarUrl ?? null,
            createdAt: problem.createdAt,
          }}
        />
        <Link
          className="button button-primary"
          href={
            ideaBounty ? `/${locale}/bounties/${ideaBounty.slug}/submit` : `/${locale}/create/idea`
          }
        >
          {ideaBounty
            ? locale === 'vi'
              ? `Gửi Idea riêng tư · ${ideaBounty.amountUsdc.toLocaleString(locale)} USDC`
              : `Submit Private Idea · ${ideaBounty.amountUsdc.toLocaleString(locale)} USDC`
            : locale === 'vi'
              ? 'Đề xuất Public Idea'
              : 'Propose a Public Idea'}
          <ArrowRight size={17} aria-hidden="true" />
        </Link>
      </div>
      <PageIndex
        label={t.onThisPage}
        items={[
          { index: '01', label: t.problem, href: '#problem' },
          { index: '02', label: t.whoHasThisProblem, href: '#who' },
          { index: '03', label: t.whyItMatters, href: '#why' },
          {
            index: '04',
            label: locale === 'vi' ? 'Những gì đã thử' : 'What was tried',
            href: '#attempts',
          },
          ...(ideaBounty
            ? [{ index: '05', label: 'Idea Bounty', href: '#opportunity' as const }]
            : []),
          { index: relatedIndex, label: t.relatedIdeas, href: '#related-ideas' },
          { index: ideaBounty ? '07' : '06', label: t.sources, href: '#sources' },
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
          <section
            id="attempts"
            className="content-section content-section-raised v1-attempt-section"
          >
            <div className="chapter-heading">
              <span>04</span>
              <div>
                <small>
                  {locale === 'vi' ? 'HISTORICAL INTELLIGENCE' : 'HISTORICAL INTELLIGENCE'}
                </small>
                <h2>{locale === 'vi' ? 'Điều gì đã được thử?' : 'What has already been tried?'}</h2>
              </div>
            </div>
            {historical.length ? (
              <div className="v1-related-records">
                {historical.map((project) => (
                  <ProjectCard key={project.slug} project={project} locale={locale} compact />
                ))}
              </div>
            ) : (
              <p className="empty-note">
                {locale === 'vi'
                  ? 'Chưa tìm thấy build lịch sử liên quan. Đây là research gap, không phải bằng chứng Problem mới.'
                  : 'No related historical builds found yet. This is a research gap, not proof the Problem is novel.'}
              </p>
            )}
          </section>
          {ideaBounty && (
            <section id="opportunity" className="content-section">
              <div className="chapter-heading">
                <span>05</span>
                <div>
                  <small>{t.opportunity}</small>
                  <h2>{t.bounty}</h2>
                </div>
              </div>
              <BountyCard bounty={ideaBounty} locale={locale} compact />
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
              {problem.relatedIdeas.length === 0 && (
                <Link href={`/${locale}/create/idea`}>
                  <small>01 / OPEN</small>
                  <strong>{locale === 'vi' ? 'Chưa có Public Idea' : 'No public Ideas yet'}</strong>
                  <p>
                    {locale === 'vi'
                      ? 'Private bounty submissions, nếu có, không được hiển thị ở đây.'
                      : 'Private bounty submissions, if any, are not shown here.'}
                  </p>
                  <ArrowUpRight size={17} />
                </Link>
              )}
            </div>
          </section>
        </article>
        <Provenance id="sources" value={problem.provenance} label={t.sourceLabel} />
      </div>
    </main>
  );
}
