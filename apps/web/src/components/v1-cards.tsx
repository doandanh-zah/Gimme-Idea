import Link from 'next/link';
import {
  ArrowRight,
  Blocks,
  Clock3,
  FileSearch,
  Hammer,
  History,
  Lightbulb,
  LockKeyhole,
  Target,
  Users,
} from 'lucide-react';
import type { Locale } from '@gimme-idea/contracts';
import type { BountyModel, ProblemReferenceModel, ProjectModel } from '@/lib/domain/types';
import { DataOriginBadge, FundingStatus, RewardAmount } from '@/components/v1-primitives';

function daysUntil(value: string) {
  return Math.max(0, Math.ceil((new Date(value).getTime() - Date.now()) / 86_400_000));
}

export function BountyCard({
  bounty,
  locale,
  compact = false,
}: {
  bounty: BountyModel;
  locale: Locale;
  compact?: boolean;
}) {
  const isIdea = bounty.stage === 'idea';
  const StageIcon = isIdea ? Lightbulb : Hammer;
  const stageLabel = isIdea
    ? locale === 'vi'
      ? 'IDEA BOUNTY'
      : 'IDEA BOUNTY'
    : locale === 'vi'
      ? 'BUILD BOUNTY'
      : 'BUILD BOUNTY';
  return (
    <article
      className={`v1-record-card v1-bounty-card is-${bounty.stage}${compact ? ' is-compact' : ''}`}
    >
      <header>
        <div className="v1-record-type">
          <StageIcon size={17} aria-hidden="true" />
          <span>{stageLabel}</span>
        </div>
        <DataOriginBadge origin={bounty.origin} locale={locale} />
      </header>
      <div className="v1-bounty-lead">
        <p>{bounty.organization.name}</p>
        <h2>{bounty.problem.title}</h2>
        {!compact && <span>{bounty.summary}</span>}
      </div>
      <div className="v1-bounty-value">
        <RewardAmount amount={bounty.amountUsdc} locale={locale} />
        <dl>
          <div>
            <dt>
              <Clock3 size={14} aria-hidden="true" /> {locale === 'vi' ? 'Còn lại' : 'Time left'}
            </dt>
            <dd>
              {daysUntil(bounty.deadline)} {locale === 'vi' ? 'ngày' : 'days'}
            </dd>
          </div>
          <div>
            <dt>
              <LockKeyhole size={14} aria-hidden="true" /> {locale === 'vi' ? 'Bài gửi' : 'Entries'}
            </dt>
            <dd>
              {bounty.privateSubmissionCount}{' '}
              {isIdea
                ? locale === 'vi'
                  ? 'Ý tưởng riêng tư'
                  : 'private Ideas'
                : locale === 'vi'
                  ? 'Dự án riêng tư'
                  : 'private Projects'}
            </dd>
          </div>
          {bounty.joinedBuilders !== undefined && (
            <div>
              <dt>
                <Users size={14} aria-hidden="true" /> {locale === 'vi' ? 'Đã tham gia' : 'Joined'}
              </dt>
              <dd>
                {bounty.joinedBuilders} {locale === 'vi' ? 'builders' : 'builders'}
              </dd>
            </div>
          )}
        </dl>
      </div>
      <FundingStatus
        state={bounty.funding}
        amount={bounty.amountUsdc}
        locale={locale}
        explorerUrl={bounty.explorerUrl}
      />
      <footer>
        <span>{bounty.status.replaceAll('_', ' ')}</span>
        <Link href={`/${locale}/bounties/${bounty.slug}`}>
          {isIdea
            ? locale === 'vi'
              ? 'Khám phá Problem'
              : 'Explore Problem'
            : locale === 'vi'
              ? 'Xem Build Bounty'
              : 'View Build Bounty'}
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </footer>
    </article>
  );
}

export function ProblemDiscoveryCard({
  problem,
  locale,
  ideaCount,
  archiveCount,
}: {
  problem: ProblemReferenceModel;
  locale: Locale;
  ideaCount: number;
  archiveCount: number;
}) {
  return (
    <article className="v1-record-card v1-problem-card">
      <header>
        <div className="v1-record-type is-problem">
          <Target size={17} aria-hidden="true" />
          <span>PROBLEM</span>
        </div>
        <span className="v1-neutral-status">
          {locale === 'vi' ? 'Chưa có bounty được xác minh' : 'No verified bounty yet'}
        </span>
      </header>
      <h2>{problem.title}</h2>
      <p>{problem.summary}</p>
      <div className="v1-record-meta">
        <span>{problem.industry}</span>
        <span>{problem.region}</span>
        <span>
          {ideaCount} {locale === 'vi' ? 'Ý tưởng công khai' : 'public Ideas'}
        </span>
        <span>
          {archiveCount} {locale === 'vi' ? 'build lịch sử' : 'historical builds'}
        </span>
      </div>
      <footer>
        <Link href={`/${locale}/problems/${problem.slug}`}>
          {locale === 'vi' ? 'Khám phá' : 'Explore'} <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </footer>
    </article>
  );
}

export function ProjectCard({
  project,
  locale,
  compact = false,
}: {
  project: ProjectModel;
  locale: Locale;
  compact?: boolean;
}) {
  const historical = project.mode === 'historical_imported';
  return (
    <article
      className={`v1-record-card v1-project-card${historical ? ' is-historical' : ''}${compact ? ' is-compact' : ''}`}
    >
      <header>
        <div className="v1-record-type">
          {historical ? (
            <History size={17} aria-hidden="true" />
          ) : (
            <Blocks size={17} aria-hidden="true" />
          )}
          <span>
            {historical ? (locale === 'vi' ? 'TỪ KHO LƯU TRỮ' : 'FROM THE ARCHIVE') : 'PROJECT'}
          </span>
        </div>
        <DataOriginBadge origin={project.origin} locale={locale} />
      </header>
      {project.source && (
        <p className="v1-source-line">
          {project.source.label} · {project.source.year} · {project.source.result}
        </p>
      )}
      <h2>{project.name}</h2>
      <p>{project.summary}</p>
      {!compact && (
        <div className="v1-project-signal">
          <FileSearch size={17} aria-hidden="true" />
          <span>
            <small>
              {locale === 'vi' ? 'PROBLEM SIGNAL · GI RESEARCH' : 'PROBLEM SIGNAL · GI RESEARCH'}
            </small>
            <strong>{project.research.problemSignal}</strong>
          </span>
        </div>
      )}
      <div className="v1-record-meta">
        <span>{project.status}</span>
        {project.technologies.slice(0, 3).map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
      <footer>
        <Link href={`/${locale}/projects/${project.slug}`}>
          {historical
            ? locale === 'vi'
              ? 'Xem build lịch sử'
              : 'Inspect Build'
            : locale === 'vi'
              ? 'Xem Project'
              : 'View Project'}
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </footer>
    </article>
  );
}

export function UpdateCard({
  locale,
  title,
  body,
  href,
  label,
}: {
  locale: Locale;
  title: string;
  body: string;
  href: string;
  label: string;
}) {
  return (
    <article className="v1-record-card v1-update-card">
      <header>
        <div className="v1-record-type">
          <Hammer size={17} aria-hidden="true" />
          <span>{label}</span>
        </div>
      </header>
      <h2>{title}</h2>
      <p>{body}</p>
      <footer>
        <Link href={`/${locale}${href}`}>
          {locale === 'vi' ? 'Xem cập nhật' : 'Inspect update'}{' '}
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </footer>
    </article>
  );
}
