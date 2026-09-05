'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, Clock3, FileCheck2, LockKeyhole, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Locale } from '@gimme-idea/contracts';
import type { ProjectModel } from '@/lib/domain/types';
import { PrivateNotice, ProblemReference, IdeaReference } from '@/components/v1-primitives';
import { trackFrontendEvent } from '@/lib/domain/analytics';

const accessKey = (slug: string) => `gimme-v1-project-access:${slug}`;

export function PrivateProjectWorkspace({
  project,
  locale,
}: {
  project: ProjectModel;
  locale: Locale;
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(
      () => setReady(window.localStorage.getItem(accessKey(project.slug)) === 'owner'),
      0,
    );
    return () => window.clearTimeout(id);
  }, [project.slug]);

  if (!ready) {
    return (
      <section className="v1-workspace-lock">
        <LockKeyhole size={28} aria-hidden="true" />
        <p className="v1-kicker">PRIVATE PROJECT</p>
        <h1>{locale === 'vi' ? 'Workspace không công khai' : 'This workspace is not public'}</h1>
        <p>
          {locale === 'vi'
            ? 'Hãy tham gia Build Bounty và chấp nhận điều khoản để mở brief.'
            : 'Join the Build Bounty and accept its terms to unlock the brief.'}
        </p>
        <Link className="button button-primary" href={`/${locale}/bounties/foodloop-build`}>
          {locale === 'vi' ? 'Quay lại Build Bounty' : 'Return to Build Bounty'}{' '}
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </section>
    );
  }

  return (
    <div className="v1-private-workspace">
      <PrivateNotice locale={locale} />
      <header className="v1-workspace-header">
        <div>
          <p className="v1-kicker">PRIVATE PROJECT / {project.status.toUpperCase()}</p>
          <h1>{project.name}</h1>
          <p>{project.summary}</p>
        </div>
        <Link
          className="button button-primary"
          href={`/${locale}/projects/${project.slug}/submit`}
          onClick={() =>
            trackFrontendEvent({ name: 'project_submission_submit_dev', entityId: project.slug })
          }
        >
          <Upload size={17} aria-hidden="true" />{' '}
          {locale === 'vi' ? 'Gửi snapshot' : 'Submit snapshot'}
        </Link>
      </header>
      <div className="v1-workspace-priority">
        <div>
          <Clock3 size={18} aria-hidden="true" />
          <span>
            <small>{locale === 'vi' ? 'DEADLINE' : 'DEADLINE'}</small>
            <strong>16 Oct 2026 · 16:00 UTC</strong>
          </span>
        </div>
        <div>
          <FileCheck2 size={18} aria-hidden="true" />
          <span>
            <small>{locale === 'vi' ? 'DELIVERABLES' : 'DELIVERABLES'}</small>
            <strong>3 / 4 ready</strong>
          </span>
        </div>
        <div>
          <CheckCircle2 size={18} aria-hidden="true" />
          <span>
            <small>{locale === 'vi' ? 'PAYOUT RECIPIENT' : 'PAYOUT RECIPIENT'}</small>
            <strong>Devnet Builder · verified profile</strong>
          </span>
        </div>
      </div>
      <div className="v1-workspace-grid">
        <section>
          <h2>{locale === 'vi' ? 'Ngữ cảnh được phép xem' : 'Authorized context'}</h2>
          <ProblemReference problem={project.problem} locale={locale} />
          {project.idea && <IdeaReference idea={project.idea} locale={locale} />}
        </section>
        <section>
          <h2>{locale === 'vi' ? 'Deliverables' : 'Deliverables'}</h2>
          <ul className="v1-check-list">
            <li>Responsive product flow</li>
            <li>Demo walkthrough</li>
            <li>Repository snapshot</li>
            <li>Setup documentation</li>
          </ul>
        </section>
        <section>
          <h2>{locale === 'vi' ? 'Tiến độ hiện tại' : 'Current Project'}</h2>
          <div className="v1-snapshot-flow">
            <strong>{project.name}</strong>
            <span>v0.8 · working</span>
            <ArrowRight size={18} aria-hidden="true" />
            <strong>Bounty Submission</strong>
            <span>{locale === 'vi' ? 'Snapshot sẽ bị khóa' : 'Snapshot will be locked'}</span>
          </div>
        </section>
      </div>
    </div>
  );
}

export function grantPrivateProjectAccess(slug: string) {
  window.localStorage.setItem(accessKey(slug), 'owner');
}
