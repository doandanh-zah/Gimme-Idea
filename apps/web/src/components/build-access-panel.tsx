'use client';

import Link from 'next/link';
import { ArrowRight, Check, LockKeyhole } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Locale } from '@gimme-idea/contracts';
import type { BountyModel } from '@/lib/domain/types';
import { IdeaReference, PrivateNotice } from '@/components/v1-primitives';
import { grantPrivateProjectAccess } from '@/components/project-experience';
import { trackFrontendEvent } from '@/lib/domain/analytics';
import { useAuth } from '@/lib/auth';

const keyFor = (slug: string) => `gimme-v1-build-joined:${slug}`;

export function BuildAccessPanel({ bounty, locale }: { bounty: BountyModel; locale: Locale }) {
  const auth = useAuth();
  const [joined, setJoined] = useState(false);
  const [accepted, setAccepted] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(
      () => setJoined(window.localStorage.getItem(keyFor(bounty.slug)) === 'accepted'),
      0,
    );
    return () => window.clearTimeout(id);
  }, [bounty.slug]);

  if (joined) {
    return (
      <section className="v1-unlocked-brief" aria-live="polite">
        <PrivateNotice locale={locale} />
        <div className="v1-unlocked-heading">
          <Check size={22} aria-hidden="true" />
          <div>
            <p className="v1-kicker">BUILD BRIEF / UNLOCKED</p>
            <h2>
              {locale === 'vi' ? 'Bạn đã tham gia Build Bounty' : 'You joined this Build Bounty'}
            </h2>
          </div>
        </div>
        {bounty.selectedIdea && <IdeaReference idea={bounty.selectedIdea} locale={locale} />}
        <div className="v1-brief-columns">
          <div>
            <h3>{locale === 'vi' ? 'Mục tiêu build' : 'Build objective'}</h3>
            <p>{bounty.objective}</p>
          </div>
          <div>
            <h3>{locale === 'vi' ? 'Deliverables' : 'Deliverables'}</h3>
            <ul>
              {bounty.requirements.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3>{locale === 'vi' ? 'Ràng buộc' : 'Constraints'}</h3>
            <ul>
              {bounty.constraints.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
        <Link
          className="button button-primary"
          href={`/${locale}/projects/foodloop-mvp`}
          onClick={() => {
            grantPrivateProjectAccess('foodloop-mvp');
            trackFrontendEvent({ name: 'private_project_start', entityId: bounty.slug });
          }}
        >
          {locale === 'vi' ? 'Bắt đầu Private Project' : 'Start Private Project'}{' '}
          <ArrowRight size={17} aria-hidden="true" />
        </Link>
      </section>
    );
  }

  return (
    <section className="v1-join-gate">
      <LockKeyhole size={26} aria-hidden="true" />
      <p className="v1-kicker">PRIVATE BUILD BRIEF</p>
      <h2>{locale === 'vi' ? 'Tham gia trước khi mở brief' : 'Join before opening the brief'}</h2>
      <p>
        {locale === 'vi'
          ? 'Problem là công khai. Ý tưởng được chọn và tài liệu triển khai chỉ dành cho builder đã chấp nhận điều khoản.'
          : 'The Problem is public. The selected Idea and implementation material are limited to builders who accept the terms.'}
      </p>
      <label className="v1-terms-check">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(event) => setAccepted(event.target.checked)}
        />
        <span>
          {locale === 'vi'
            ? 'Tôi sẽ không phân phối lại tài liệu riêng tư; Project và Submission của tôi sẽ được giữ kín.'
            : 'I will not redistribute private material; my Project and Submission will remain confidential.'}
        </span>
      </label>
      <button
        type="button"
        className="button button-primary"
        disabled={!accepted}
        onClick={() => {
          if (!auth.requireAuth('join build bounty')) return;
          window.localStorage.setItem(keyFor(bounty.slug), 'accepted');
          setJoined(true);
          trackFrontendEvent({ name: 'build_bounty_join', entityId: bounty.slug });
        }}
      >
        {locale === 'vi' ? 'Chấp nhận & Tham gia' : 'Accept & Join'}{' '}
        <ArrowRight size={17} aria-hidden="true" />
      </button>
    </section>
  );
}
