import Link from 'next/link';
import { ArrowRight, Building2 } from 'lucide-react';
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
            eyebrow="BOUNTIES"
            title={locale === 'vi' ? 'Bounty công khai' : 'Public Bounties'}
            summary={
              locale === 'vi'
                ? 'Chọn Bounty để kiểm tra quyền xem bài nộp. Tổng quan theo tổ chức chưa khả dụng.'
                : 'Select a Bounty to check access to its submissions. Organization summaries are not available yet.'
            }
            aside={<Building2 size={30} aria-hidden="true" />}
          />
          <nav
            className="v1-dashboard-nav"
            aria-label={locale === 'vi' ? 'Trong trang' : 'On this page'}
          >
            <a href="#idea-bounties">Idea Bounties</a>
            <a href="#build-bounties">Build Bounties</a>
          </nav>
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
                    <small>{bounty.status}</small>
                  </span>

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

                  <ArrowRight size={17} aria-hidden="true" />
                </Link>
              ))}
          </section>
        </div>
      </ReviewerGate>
    </main>
  );
}
