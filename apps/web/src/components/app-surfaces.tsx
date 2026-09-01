import Link from 'next/link';
import { ArrowUpRight, Inbox } from 'lucide-react';
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
