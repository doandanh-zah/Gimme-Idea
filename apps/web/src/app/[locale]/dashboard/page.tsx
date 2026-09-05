import Link from 'next/link';
import { ArrowRight, Building2, CircleDollarSign, Lightbulb, Target, Trophy } from 'lucide-react';
import { notFound } from 'next/navigation';
import { AppPageHeader } from '@/components/app-surfaces';
import { ReviewerGate } from '@/components/reviewer-gate';
import { bountyClient } from '@/lib/domain/client';
import { isLocale } from '@/lib/i18n';

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const items = await bountyClient.list();
  return (
    <main id="main" className="app-page v1-dashboard">
      <ReviewerGate locale={locale}>
        <div className="v1-authorized-dashboard">
          <AppPageHeader
            eyebrow="ORGANIZATION / NORTHSTAR FOODS"
            title={locale === 'vi' ? 'Problem-solving pipeline' : 'Problem-solving pipeline'}
            summary={
              locale === 'vi'
                ? 'Theo dõi từ Problem đến Idea competition, Build competition và Outcome.'
                : 'Follow work from Problem to Idea competition, Build competition and Outcome.'
            }
            aside={<Building2 size={30} aria-hidden="true" />}
          />
          <div className="v1-lifecycle-strip">
            <div className="is-complete">
              <Target size={18} aria-hidden="true" />
              <span>
                Problem<strong>Published</strong>
              </span>
            </div>
            <div className="is-active">
              <Lightbulb size={18} aria-hidden="true" />
              <span>
                Idea Bounty<strong>Judging</strong>
              </span>
            </div>
            <div>
              <CircleDollarSign size={18} aria-hidden="true" />
              <span>
                Build Bounty<strong>Configured</strong>
              </span>
            </div>
            <div>
              <Trophy size={18} aria-hidden="true" />
              <span>
                Outcome<strong>Pending</strong>
              </span>
            </div>
          </div>
          <nav className="v1-dashboard-nav" aria-label="Dashboard sections">
            <a href="#problems">Problems</a>
            <a href="#idea-bounties">Idea Bounties</a>
            <a href="#build-bounties">Build Bounties</a>
            <a href="#submissions">Submissions</a>
            <a href="#funding">Funding</a>
            <a href="#results">Results</a>
          </nav>
          <section id="problems" className="v1-dashboard-section">
            <header>
              <p className="v1-kicker">PUBLIC ROOT</p>
              <h2>Problems</h2>
            </header>
            <Link
              className="v1-dashboard-row"
              href={`/${locale}/dashboard/problems/restaurant-food-waste`}
            >
              <span>
                <strong>Restaurant demand planning</strong>
                <small>Published · Northstar Foods</small>
              </span>
              <span>18 private Ideas</span>
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </section>
          <section id="idea-bounties" className="v1-dashboard-section">
            <header>
              <p className="v1-kicker">DIRECTION</p>
              <h2>Idea Bounties</h2>
            </header>
            {items
              .filter((item) => item.stage === 'idea')
              .map((bounty) => (
                <Link
                  className="v1-dashboard-row"
                  key={bounty.slug}
                  href={`/${locale}/dashboard/bounties/${bounty.slug}`}
                >
                  <span>
                    <strong>{bounty.title}</strong>
                    <small>{bounty.status} · development funding state</small>
                  </span>
                  <span>{bounty.privateSubmissionCount} private Ideas</span>
                  <ArrowRight size={17} aria-hidden="true" />
                </Link>
              ))}
          </section>
          <section id="build-bounties" className="v1-dashboard-section">
            <header>
              <p className="v1-kicker">EXECUTION</p>
              <h2>Build Bounties</h2>
            </header>
            {items
              .filter((item) => item.stage === 'build')
              .map((bounty) => (
                <Link
                  className="v1-dashboard-row"
                  key={bounty.slug}
                  href={`/${locale}/dashboard/bounties/${bounty.slug}`}
                >
                  <span>
                    <strong>{bounty.title}</strong>
                    <small>
                      {bounty.status} · {bounty.amountUsdc.toLocaleString(locale)} USDC
                    </small>
                  </span>
                  <span>{bounty.privateSubmissionCount} private Projects</span>
                  <ArrowRight size={17} aria-hidden="true" />
                </Link>
              ))}
          </section>
        </div>
      </ReviewerGate>
    </main>
  );
}
