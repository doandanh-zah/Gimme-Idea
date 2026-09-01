import Link from 'next/link';
import {
  ArrowUpRight,
  BadgeCheck,
  BookOpen,
  GitBranch,
  Inbox,
  Lightbulb,
  ShieldCheck,
  Target,
} from 'lucide-react';
import type { ReactNode } from 'react';
import type { IdeaDetailDTO, Locale, ProblemDetailDTO } from '@gimme-idea/contracts';

export function AppPageHeader({
  eyebrow,
  title,
  summary,
  aside,
}: {
  eyebrow: string;
  title: string;
  summary: string;
  aside?: ReactNode;
}) {
  return (
    <header className="app-page-header">
      <div>
        <p>{eyebrow}</p>
        <h1>{title}</h1>
        <span>{summary}</span>
      </div>
      {aside && <div className="app-page-actions">{aside}</div>}
    </header>
  );
}

type KnowledgePostItem =
  { kind: 'idea'; data: IdeaDetailDTO } | { kind: 'problem'; data: ProblemDetailDTO };

const postCopy = {
  en: {
    idea: 'Idea',
    problem: 'Problem',
    open: 'Open details',
    primaryProblem: 'Primary problem',
    targetUsers: 'Designed for',
    activeBuild: 'Active build',
    affectedGroups: 'Affected groups',
    severity: 'Severity',
    bounty: 'Bounty',
    source: 'source',
    sources: 'sources',
    attempt: 'previous attempt',
    attempts: 'previous attempts',
    relatedIdea: 'related idea',
    relatedIdeas: 'related ideas',
    humanReviewed: 'Human reviewed',
    origins: { human: 'Human origin', ai_assisted: 'AI-assisted', imported: 'Imported' },
    research: {
      unresearched: 'Unresearched',
      queued: 'Queued',
      researching: 'Researching',
      verified: 'Verified',
      needs_review: 'Needs review',
    },
    severityValues: { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' },
    bountyValues: { unfunded: 'Unfunded', mock_funded: 'Mock funded' },
  },
  vi: {
    idea: 'Ý tưởng',
    problem: 'Vấn đề',
    open: 'Xem chi tiết',
    primaryProblem: 'Vấn đề chính',
    targetUsers: 'Dành cho',
    activeBuild: 'Dự án đang xây',
    affectedGroups: 'Nhóm bị ảnh hưởng',
    severity: 'Mức độ',
    bounty: 'Bounty',
    source: 'nguồn',
    sources: 'nguồn',
    attempt: 'cách đã thử',
    attempts: 'cách đã thử',
    relatedIdea: 'ý tưởng liên quan',
    relatedIdeas: 'ý tưởng liên quan',
    humanReviewed: 'Đã được người kiểm tra',
    origins: { human: 'Nguồn từ người dùng', ai_assisted: 'AI hỗ trợ', imported: 'Đã nhập' },
    research: {
      unresearched: 'Chưa nghiên cứu',
      queued: 'Đang chờ',
      researching: 'Đang nghiên cứu',
      verified: 'Đã xác minh',
      needs_review: 'Cần kiểm tra',
    },
    severityValues: { low: 'Thấp', medium: 'Vừa', high: 'Cao', critical: 'Nghiêm trọng' },
    bountyValues: { unfunded: 'Chưa tài trợ', mock_funded: 'Tài trợ thử nghiệm' },
  },
} as const;

export function KnowledgePost({
  locale,
  href,
  item,
}: {
  locale: Locale;
  href: string;
  item: KnowledgePostItem;
}) {
  const t = postCopy[locale];
  const data = item.data;
  const isIdea = item.kind === 'idea';
  const kindLabel = isIdea ? t.idea : t.problem;
  const Icon = isIdea ? Lightbulb : Target;
  const researchedAt = data.provenance.lastResearchedAt;
  const formattedDate = researchedAt
    ? new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(
        new Date(researchedAt),
      )
    : null;

  const facts: Array<{ label: string; value: string; accent?: boolean }> = isIdea
    ? [
        { label: t.primaryProblem, value: item.data.primaryProblem.title, accent: true },
        { label: t.targetUsers, value: item.data.targetUsers.join(' · ') },
        ...(item.data.project
          ? [
              {
                label: t.activeBuild,
                value: `${item.data.project.name} · ${item.data.project.stage}`,
              },
            ]
          : []),
      ]
    : [
        { label: t.affectedGroups, value: item.data.affectedGroups.join(' · ') },
        { label: t.severity, value: t.severityValues[item.data.severity] },
        ...(item.data.bounty
          ? [
              {
                label: t.bounty,
                value: `${item.data.bounty.title} · ${t.bountyValues[item.data.bounty.status]}`,
              },
            ]
          : []),
      ];

  const relationCount = isIdea ? item.data.previousAttempts.length : item.data.relatedIdeas.length;
  const sourceLabel = data.provenance.sources.length === 1 ? t.source : t.sources;
  const relationLabel = isIdea
    ? relationCount === 1
      ? t.attempt
      : t.attempts
    : relationCount === 1
      ? t.relatedIdea
      : t.relatedIdeas;

  return (
    <Link className="knowledge-post-link" href={href} aria-label={`${t.open}: ${data.title}`}>
      <article className={`knowledge-post knowledge-post-${item.kind}`}>
        <div className="knowledge-post-avatar" aria-hidden="true">
          <Icon size={22} strokeWidth={1.8} />
        </div>
        <div className="knowledge-post-body">
          <header className="knowledge-post-identity">
            <div>
              <strong>{kindLabel}</strong>
              <BadgeCheck size={16} aria-hidden="true" />
              <span>{t.research[data.researchStatus]}</span>
              {formattedDate && (
                <>
                  <span aria-hidden="true">·</span>
                  <time dateTime={researchedAt ?? undefined}>{formattedDate}</time>
                </>
              )}
            </div>
            <small>
              @{data.slug} · {t.origins[data.provenance.origin]}
            </small>
          </header>

          <h2>{data.title}</h2>
          <p>{data.summary}</p>

          <dl className="knowledge-post-facts">
            {facts.map((fact) => (
              <div key={fact.label} className={fact.accent ? 'is-accented' : undefined}>
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>

          <footer className="knowledge-post-footer">
            <span>
              <BookOpen size={16} aria-hidden="true" />
              {data.provenance.sources.length} {sourceLabel}
            </span>
            <span>
              <GitBranch size={16} aria-hidden="true" />
              {relationCount} {relationLabel}
            </span>
            {data.provenance.reviewedByHuman && (
              <span>
                <ShieldCheck size={16} aria-hidden="true" />
                {t.humanReviewed}
              </span>
            )}
            <strong>
              {t.open}
              <ArrowUpRight size={16} aria-hidden="true" />
            </strong>
          </footer>
        </div>
      </article>
    </Link>
  );
}

export function EmptySurface({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <section className="app-empty-state">
      <Inbox size={28} aria-hidden="true" />
      <h2>{title}</h2>
      <p>{body}</p>
      {action && <div>{action}</div>}
    </section>
  );
}

export function AppTextLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link className="app-text-link" href={href}>
      {children}
      <ArrowUpRight size={15} aria-hidden="true" />
    </Link>
  );
}
