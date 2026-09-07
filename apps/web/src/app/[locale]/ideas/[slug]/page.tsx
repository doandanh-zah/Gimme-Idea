import { PostMediaGallery } from '@/components/post-media-gallery';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import { notFound } from 'next/navigation';
import { Eyebrow, StatusPill } from '@gimme-idea/ui';
import { LocalKnowledgeDetail } from '@/components/local-knowledge-detail';
import { PageIndex } from '@/components/page-index';
import { Provenance } from '@/components/provenance';
import { EntityActions } from '@/components/v1-actions';
import { ProjectCard } from '@/components/v1-cards';
import { RestrictedGate } from '@/components/v1-primitives';
import { ideaClient, projectClient } from '@/lib/domain/client';
import { copy, isLocale } from '@/lib/i18n';

type PageProps = { params: Promise<{ locale: string; slug: string }> };
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  if (slug.startsWith('local-')) {
    return {
      title: 'Local idea',
      alternates: {
        canonical: `/${locale}/ideas/${slug}`,
        languages: { en: `/en/ideas/${slug}`, vi: `/vi/ideas/${slug}` },
      },
    };
  }
  if (slug === 'selected-demand-direction')
    return { title: 'Selected Idea', robots: { index: false, follow: false } };
  const idea = await ideaClient.get(slug);
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
  if (slug.startsWith('local-')) {
    return <LocalKnowledgeDetail locale={locale} kind="idea" slug={slug} />;
  }
  if (slug === 'selected-demand-direction') {
    return (
      <main id="main" className="app-page v1-private-route">
        <RestrictedGate
          locale={locale}
          title={
            locale === 'vi'
              ? 'Một hướng giải đã được chọn'
              : 'A solution direction has been selected'
          }
          body={
            locale === 'vi'
              ? 'Winning Idea vẫn bị giới hạn. Nội dung chỉ dành cho creator, Organization, judge và builder đã tham gia Build Bounty.'
              : 'The winning Idea remains restricted. Full content is available only to its creator, the Organization, judges and joined Build Bounty participants.'
          }
          action={
            <>
              <Link className="button button-primary" href={`/${locale}/bounties/foodloop-build`}>
                {locale === 'vi' ? 'Xem Build Bounty' : 'View Build Bounty'}{' '}
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link
                className="button button-quiet"
                href={`/${locale}/problems/restaurant-food-waste`}
              >
                {locale === 'vi' ? 'Xem Problem công khai' : 'View public Problem'}
              </Link>
            </>
          }
        />
      </main>
    );
  }
  const idea = await ideaClient.get(slug);
  if (!idea) {
    notFound();
  }
  const landscapeProject = (await projectClient.list()).find(
    (project) =>
      project.mode === 'historical_imported' && project.problem.slug === idea.primaryProblem.slug,
  );
  const attemptIndex = idea.project ? '05' : '04';
  return (
    <main id="main" className="detail-page idea-page">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href={`/${locale}/ideas`}>
          <ArrowLeft size={14} />
          {t.navIdeas}
        </Link>
        <span>/</span>
        <strong>{locale === 'vi' ? 'Chi tiết' : 'Overview'}</strong>
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
      <div className="v1-canonical-actionbar">
        <EntityActions
          locale={locale}
          target={{
            kind: 'idea',
            slug: idea.slug,
            href: `/${locale}/ideas/${idea.slug}`,
            title: idea.title,
            summary: idea.summary,
            creatorName: idea.creator?.displayName ?? 'Gimme Idea',
            creatorUsername: idea.creator?.username ?? null,
            avatarUrl: idea.creator?.avatarUrl ?? null,
            createdAt: idea.createdAt,
          }}
        />
        <span className="empty-note">
          {locale === 'vi'
            ? 'Tạo dự án từ ý tưởng này chưa khả dụng.'
            : 'Creating a project from this Idea is not available yet.'}
        </span>
      </div>
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
          { index: '01', label: t.opportunity, href: '#opportunity' },
          { index: '02', label: t.solution, href: '#solution' },
          { index: '03', label: t.targetUsers, href: '#audience' },
          ...(idea.project ? [{ index: '04', label: t.build, href: '#build' as const }] : []),
          { index: attemptIndex, label: t.attempts, href: '#attempts' },
          {
            index: idea.project ? '06' : '05',
            label: locale === 'vi' ? 'Dự án liên quan' : 'Related projects',
            href: '#landscape',
          },
          { index: idea.project ? '07' : '06', label: t.sources, href: '#sources' },
        ]}
      />
      <div className="detail-grid">
        <article className="canonical-content">
          {Boolean(idea.media?.length) && (
            <PostMediaGallery attachments={idea.media!} locale={locale} />
          )}
          <section id="opportunity" className="content-section content-section-accent">
            <div className="chapter-heading">
              <span>01</span>
              <div>
                <small>{t.buildableThesis}</small>
                <h2>{t.opportunity}</h2>
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
            {idea.whyNow && (
              <>
                <h3>{locale === 'vi' ? 'Vì sao là lúc này' : 'Why now'}</h3>
                <p className="long-copy">{idea.whyNow}</p>
              </>
            )}
            {!!idea.risks?.length && (
              <>
                <h3>{locale === 'vi' ? 'Rủi ro' : 'Risks'}</h3>
                <ul>
                  {idea.risks.map((risk) => (
                    <li key={risk}>{risk}</li>
                  ))}
                </ul>
              </>
            )}
            {idea.validationPlan && (
              <>
                <h3>{locale === 'vi' ? 'Tiêu chí thành công' : 'Success criteria'}</h3>
                <p className="long-copy">{idea.validationPlan}</p>
              </>
            )}
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
                  <StatusPill>{idea.project.stage}</StatusPill>
                </div>
                <p>Project evidence is tracked independently from the original idea thesis.</p>
                <Link
                  className="v1-inline-action"
                  href={`/${locale}/projects/${encodeURIComponent(idea.project.slug)}`}
                >
                  {locale === 'vi' ? 'Xem Project' : 'View Project'}{' '}
                  <ArrowRight size={15} aria-hidden="true" />
                </Link>
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
          <section id="landscape" className="content-section v1-landscape-section">
            <div className="chapter-heading">
              <span>{idea.project ? '06' : '05'}</span>
              <div>
                <small>RESEARCH PREVIEW</small>
                <h2>{locale === 'vi' ? 'Landscape check' : 'Landscape check'}</h2>
              </div>
            </div>
            <p className="empty-note">
              {locale === 'vi'
                ? 'Các approach liên quan được hiển thị trung lập; similarity không phải phán quyết về Idea hiện tại.'
                : 'Related approaches are shown neutrally; similarity is not a verdict on the current Idea.'}
            </p>
            {landscapeProject ? (
              <ProjectCard project={landscapeProject} locale={locale} compact />
            ) : (
              <p className="empty-note">
                {locale === 'vi'
                  ? 'Chưa có dự án lịch sử đã xác minh.'
                  : 'No verified historical project is available yet.'}
              </p>
            )}
          </section>
        </article>
        <Provenance locale={locale} id="sources" value={idea.provenance} label={t.sourceLabel} />
      </div>
    </main>
  );
}
