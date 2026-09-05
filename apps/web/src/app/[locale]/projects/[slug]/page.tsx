import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, CheckCircle2, FileSearch, History, Users } from 'lucide-react';
import { notFound } from 'next/navigation';
import { EntityActions } from '@/components/v1-actions';
import { PrivateProjectWorkspace } from '@/components/project-experience';
import {
  DataOriginBadge,
  ProblemReference,
  RestrictedGate,
  VisibilityBadge,
} from '@/components/v1-primitives';
import { projectClient } from '@/lib/domain/client';
import { isLocale } from '@/lib/i18n';

type Props = { params: Promise<{ locale: string; slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const project = await projectClient.get(slug);
  if (!project || project.visibility !== 'public')
    return { title: 'Restricted Project', robots: { index: false, follow: false } };
  return {
    title: project.name,
    description: project.summary,
    alternates: {
      canonical: `/${locale}/projects/${slug}`,
      languages: { en: `/en/projects/${slug}`, vi: `/vi/projects/${slug}` },
    },
  };
}

export default async function ProjectDetail({ params }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const project = await projectClient.get(slug);
  if (!project) notFound();
  if (project.mode === 'private_workspace')
    return (
      <main id="main" className="app-page">
        <PrivateProjectWorkspace project={project} locale={locale} />
      </main>
    );
  if (project.mode === 'restricted_winner')
    return (
      <main id="main" className="app-page">
        <RestrictedGate
          locale={locale}
          title={locale === 'vi' ? 'Một Project đã được chọn' : 'A Project has been selected'}
          body={
            locale === 'vi'
              ? 'Winner và kết quả đã được ghi nhận. Nội dung, team và tệp vẫn riêng tư cho tới khi chủ sở hữu chọn xuất bản.'
              : 'A winner and result are recorded. Content, team and files remain private until the owner chooses to publish.'
          }
          action={
            <Link className="button button-quiet" href={`/${locale}/bounties/foodloop-build`}>
              {locale === 'vi' ? 'Xem Bounty công khai' : 'View public Bounty'}
            </Link>
          }
        />
      </main>
    );
  const historical = project.mode === 'historical_imported';
  return (
    <main id="main" className="app-page v1-detail-page">
      <Link className="v1-back-link" href={`/${locale}/projects`}>
        <ArrowLeft size={15} aria-hidden="true" />
        {locale === 'vi' ? 'Thư viện build' : 'Build library'}
      </Link>
      <header className="v1-entity-header is-project">
        <div className="v1-entity-header-copy">
          <p className="v1-kicker">
            {historical ? 'IMPORTED HISTORICAL PROJECT' : 'PUBLIC PROJECT'} /{' '}
            {project.status.toUpperCase()}
          </p>
          <h1>{project.name}</h1>
          <p>{project.summary}</p>
          <div className="v1-badge-row">
            <VisibilityBadge visibility={project.visibility} locale={locale} />
            <DataOriginBadge origin={project.origin} locale={locale} />
          </div>
        </div>
        <EntityActions
          locale={locale}
          target={{
            kind: 'project',
            slug: project.slug,
            href: `/${locale}/projects/${project.slug}`,
            title: project.name,
            summary: project.summary,
            creatorName: historical
              ? (project.source?.label ?? 'Public source')
              : (project.team[0] ?? 'Gimme Idea builder'),
            creatorUsername: null,
            createdAt: '2026-08-18T00:00:00.000Z',
          }}
        />
      </header>
      <ProblemReference problem={project.problem} locale={locale} />
      {historical && project.source ? (
        <div className="v1-evidence-split">
          <section className="v1-source-facts">
            <header>
              <History size={20} aria-hidden="true" />
              <div>
                <p className="v1-kicker">SOURCE FACTS</p>
                <h2>{locale === 'vi' ? 'Hồ sơ từ nguồn gốc' : 'Original public record'}</h2>
              </div>
            </header>
            <dl>
              <div>
                <dt>Source</dt>
                <dd>{project.source.label}</dd>
              </div>
              <div>
                <dt>Year</dt>
                <dd>{project.source.year}</dd>
              </div>
              <div>
                <dt>Result</dt>
                <dd>{project.source.result}</dd>
              </div>
              <div>
                <dt>Team</dt>
                <dd>{project.team.join(', ')}</dd>
              </div>
            </dl>
            <p>{project.source.originalDescription}</p>
            <a href={project.source.url} target="_blank" rel="noreferrer">
              {locale === 'vi' ? 'Mở nguồn công khai' : 'Open public source'}{' '}
              <ArrowUpRight size={15} aria-hidden="true" />
            </a>
          </section>
          <section className="v1-research-facts">
            <header>
              <FileSearch size={20} aria-hidden="true" />
              <div>
                <p className="v1-kicker">GIMME IDEA RESEARCH</p>
                <h2>
                  {locale === 'vi' ? 'Diễn giải có provenance' : 'Provenance-aware interpretation'}
                </h2>
              </div>
            </header>
            <span className="v1-research-state">
              AI-extracted · {project.research.reviewed ? 'Human-reviewed' : 'Needs review'} ·
              Confidence {project.research.confidence}
            </span>
            <h3>{locale === 'vi' ? 'Problem signal có khả năng' : 'Likely Problem signal'}</h3>
            <p>{project.research.problemSignal}</p>
            <h3>{locale === 'vi' ? 'Cách tiếp cận' : 'Approach'}</h3>
            <p>{project.research.approach}</p>
            <h3>{locale === 'vi' ? 'Điều gì đã thay đổi?' : 'What changed since?'}</h3>
            <p>{project.research.whatChanged}</p>
          </section>
        </div>
      ) : (
        <div className="v1-project-sections">
          <section>
            <p className="v1-kicker">01 / OVERVIEW</p>
            <h2>{locale === 'vi' ? 'Build công khai' : 'Public build'}</h2>
            <p>{project.research.approach}</p>
          </section>
          <section>
            <p className="v1-kicker">02 / TEAM</p>
            <h2>{locale === 'vi' ? 'Người đang xây' : 'People building'}</h2>
            <p>
              <Users size={17} aria-hidden="true" /> {project.team.join(' · ')}
            </p>
          </section>
          <section>
            <p className="v1-kicker">03 / OUTCOME</p>
            <h2>{locale === 'vi' ? 'Project Outcome' : 'Project Outcome'}</h2>
            <p>
              <CheckCircle2 size={17} aria-hidden="true" /> {project.outcome.state} ·{' '}
              {project.outcome.summary}
            </p>
          </section>
        </div>
      )}
      <section className="v1-outcome-separation">
        <div>
          <small>BOUNTY RESULT</small>
          <strong>
            {project.bountyResult?.label ??
              (locale === 'vi' ? 'Không có result được ghi nhận' : 'No result recorded')}
          </strong>
        </div>
        <div>
          <small>PROJECT OUTCOME</small>
          <strong>{project.outcome.state}</strong>
          <p>{project.outcome.summary}</p>
        </div>
      </section>
    </main>
  );
}
