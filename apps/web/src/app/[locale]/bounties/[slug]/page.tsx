import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Clock3, LockKeyhole, Scale, ShieldCheck } from 'lucide-react';
import { notFound } from 'next/navigation';
import { BuildAccessPanel } from '@/components/build-access-panel';
import { EntityActions } from '@/components/v1-actions';
import {
  FundingStatus,
  ProblemReference,
  RewardAmount,
  VisibilityBadge,
} from '@/components/v1-primitives';
import { bountyClient } from '@/lib/domain/client';
import { isLocale } from '@/lib/i18n';

type Props = { params: Promise<{ locale: string; slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const bounty = await bountyClient.get(slug);
  return bounty
    ? {
        title: bounty.title,
        description: bounty.summary,
        alternates: { canonical: `/${locale}/bounties/${slug}` },
      }
    : {};
}

export default async function BountyDetail({ params }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const bounty = await bountyClient.get(slug);
  if (!bounty) notFound();
  const isIdea = bounty.stage === 'idea';
  const acceptingSubmissions = bounty.status === 'open';
  return (
    <main id="main" className={`app-page v1-detail-page v1-bounty-detail is-${bounty.stage}`}>
      <Link className="v1-back-link" href={`/${locale}/bounties`}>
        <ArrowLeft size={15} aria-hidden="true" />
        {locale === 'vi' ? 'Tất cả Bounty' : 'All Bounties'}
      </Link>
      <header className="v1-bounty-hero">
        <div>
          <p className="v1-kicker">
            {isIdea ? 'IDEA BOUNTY' : 'BUILD BOUNTY'} /{' '}
            {bounty.status.replaceAll('_', ' ').toUpperCase()}
          </p>
          <RewardAmount amount={bounty.amountUsdc} locale={locale} />
          <h1>{bounty.title}</h1>
          <p>
            {bounty.organization.name} · {bounty.summary}
          </p>
          <div className="v1-badge-row">
            <VisibilityBadge visibility={bounty.visibility} locale={locale} />
            <span className="v1-deadline">
              <Clock3 size={14} aria-hidden="true" />
              {new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(
                new Date(bounty.deadline),
              )}
            </span>
          </div>
          <EntityActions
            locale={locale}
            target={{
              kind: 'bounty',
              slug: bounty.slug,
              href: `/${locale}/bounties/${bounty.slug}`,
              title: bounty.title,
              summary: bounty.summary,
              creatorName: bounty.organization.name,
              creatorUsername: null,
              createdAt: '2026-09-01T00:00:00.000Z',
            }}
          />
        </div>
        <div className="v1-bounty-primary">
          {acceptingSubmissions ? (
            isIdea ? (
              <Link
                className="button button-primary"
                href={`/${locale}/bounties/${bounty.slug}/submit`}
              >
                <LockKeyhole size={17} aria-hidden="true" />
                {locale === 'vi'
                  ? `Gửi Idea riêng tư · ${bounty.amountUsdc.toLocaleString()} USDC`
                  : `Submit Private Idea · ${bounty.amountUsdc.toLocaleString()} USDC`}
              </Link>
            ) : (
              <a className="button button-primary" href="#build-access">
                {locale === 'vi' ? 'Tham gia Build Bounty' : 'Join Build Bounty'}{' '}
                <ArrowRight size={17} aria-hidden="true" />
              </a>
            )
          ) : (
            <span className="button" aria-disabled="true">
              <LockKeyhole size={17} aria-hidden="true" />
              {locale === 'vi' ? 'Chưa nhận bài dự thi' : 'Submissions not open'}
            </span>
          )}
          <small>
            {bounty.privateSubmissionCount} {isIdea ? 'Ideas' : 'Projects'}{' '}
            {locale === 'vi' ? 'đã gửi riêng tư' : 'submitted privately'}
          </small>
        </div>
      </header>
      <ProblemReference problem={bounty.problem} locale={locale} />
      <FundingStatus
        state={bounty.funding}
        amount={bounty.amountUsdc}
        locale={locale}
        explorerUrl={bounty.explorerUrl}
      />
      <div className="v1-bounty-sections">
        <section>
          <p className="v1-kicker">01 / {isIdea ? 'DIRECTION' : 'EXECUTION'}</p>
          <h2>{locale === 'vi' ? 'Điều chúng tôi tìm kiếm' : "What we're looking for"}</h2>
          <p>{bounty.objective}</p>
        </section>
        <section>
          <p className="v1-kicker">02 / REQUIREMENTS</p>
          <h2>{locale === 'vi' ? 'Yêu cầu và ràng buộc' : 'Requirements and constraints'}</h2>
          <div className="v1-two-list">
            <ul>
              {bounty.requirements.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <ul>
              {bounty.constraints.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>
        <section>
          <p className="v1-kicker">03 / REVIEW</p>
          <h2>{locale === 'vi' ? 'Tiêu chí đánh giá' : 'Judging criteria'}</h2>
          <div className="v1-criteria">
            {bounty.criteria.map((criterion) => (
              <div key={criterion.name}>
                <Scale size={16} aria-hidden="true" />
                <strong>{criterion.name}</strong>
                <span>{criterion.weight}%</span>
              </div>
            ))}
          </div>
        </section>
        <section>
          <p className="v1-kicker">04 / TERMS</p>
          <h2>{locale === 'vi' ? 'Riêng tư và quyền sử dụng' : 'Privacy and usage terms'}</h2>
          <p>
            <ShieldCheck size={17} aria-hidden="true" /> {bounty.ipTerms}
          </p>
        </section>
      </div>
      {!isIdea && acceptingSubmissions && (
        <div id="build-access">
          <BuildAccessPanel bounty={bounty} locale={locale} />
        </div>
      )}
    </main>
  );
}
