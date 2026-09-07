import Link from 'next/link';
import {
  ArrowUpRight,
  Blocks,
  Bookmark,
  CircleDollarSign,
  Compass,
  Inbox,
  Lightbulb,
  Search,
  Target,
} from 'lucide-react';
import type { ReactNode } from 'react';

export { KnowledgePost } from '@/components/knowledge-post';

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
  const tone = eyebrow.includes('PROBLEM')
    ? 'problem'
    : eyebrow.includes('/ IDEAS')
      ? 'idea'
      : 'neutral';
  const Icon = eyebrow.includes('PROBLEM')
    ? Target
    : eyebrow.includes('/ IDEAS')
      ? Lightbulb
      : eyebrow.includes('PROJECT')
        ? Blocks
        : eyebrow.includes('OPPORTUNITY')
          ? CircleDollarSign
          : eyebrow.includes('SEARCH') || eyebrow.includes('CATALOG')
            ? Search
            : eyebrow.includes('SAVED')
              ? Bookmark
              : Compass;
  return (
    <header className={`app-page-header is-${tone}`}>
      <span className="page-symbol" aria-hidden="true">
        <Icon size={28} strokeWidth={1.5} />
      </span>
      <div>
        <p>{eyebrow}</p>
        <h1>{title}</h1>
        <span>{summary}</span>
      </div>
      {aside && <div className="app-page-actions">{aside}</div>}
    </header>
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
