import Link from 'next/link';
import { ArrowUpRight, Inbox } from 'lucide-react';
import type { ReactNode } from 'react';

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

export function KnowledgePost({
  kind,
  title,
  summary,
  href,
  status,
  meta,
  relationship,
}: {
  kind: string;
  title: string;
  summary: string;
  href: string;
  status: string;
  meta: string;
  relationship?: string;
}) {
  return (
    <article className="knowledge-post">
      <div className="knowledge-post-marker" aria-hidden="true">
        <span />
      </div>
      <div className="knowledge-post-body">
        <div className="knowledge-post-meta">
          <span>{kind}</span>
          <span>{status}</span>
        </div>
        <h2>
          <Link href={href}>{title}</Link>
        </h2>
        <p>{summary}</p>
        {relationship && <div className="knowledge-relationship">{relationship}</div>}
        <div className="knowledge-post-footer">
          <small>{meta}</small>
          <Link href={href} aria-label={`Open ${title}`}>
            Open
            <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
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
