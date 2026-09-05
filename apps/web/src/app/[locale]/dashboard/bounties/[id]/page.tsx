import { ArrowRight } from 'lucide-react';
import { notFound } from 'next/navigation';
import { FundingWalletPreview } from '@/components/funding-wallet-preview';
import { PrivateSubmissionList } from '@/components/private-submission-list';
import { ReviewerGate } from '@/components/reviewer-gate';
import { FundingStatus, ProblemReference, RewardAmount } from '@/components/v1-primitives';
import { bountyClient } from '@/lib/domain/client';
import { isLocale } from '@/lib/i18n';
export default async function ManageBounty({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const bounty = await bountyClient.get(id);
  if (!bounty?.id) notFound();
  return (
    <main id="main" className="app-page v1-dashboard">
      <ReviewerGate locale={locale}>
        <div className="v1-authorized-dashboard">
          <header className="v1-management-header">
            <div>
              <p className="v1-kicker">{bounty.stage.toUpperCase()} BOUNTY / MANAGEMENT</p>
              <h1>{bounty.title}</h1>
              <p>{bounty.organization.name}</p>
            </div>
            <RewardAmount amount={bounty.amountUsdc} locale={locale} />
          </header>
          <div className="v1-management-tabs">
            <a href="#overview">Overview</a>
            <a href="#terms">Terms</a>
            <a href="#funding">Funding</a>
            <a href="#submissions">Private Submissions</a>
            <a href="#judging">Judging</a>
            <a href="#result">Result</a>
          </div>
          <section id="overview" className="v1-dashboard-section">
            <h2>Overview</h2>
            <ProblemReference problem={bounty.problem} locale={locale} />
            <FundingStatus state={bounty.funding} amount={bounty.amountUsdc} locale={locale} />
          </section>
          <section id="submissions" className="v1-dashboard-section">
            <header>
              <p className="v1-kicker">AUTHORIZED ONLY</p>
              <h2>Private Submissions</h2>
            </header>
            <PrivateSubmissionList bountyId={bounty.id} bountySlug={id} locale={locale} />
          </section>
          <section id="funding" className="v1-dashboard-section">
            <FundingWalletPreview bounty={bounty} locale={locale} />
          </section>
          {bounty.stage === 'idea' && (
            <section id="result" className="v1-next-stage">
              <p className="v1-kicker">NEXT STAGE</p>
              <h2>
                {locale === 'vi' ? 'Winning Idea → Build Bounty' : 'Winning Idea → Build Bounty'}
              </h2>
              <p>
                {locale === 'vi'
                  ? 'Chỉ launch Build Bounty sau khi một Idea được chọn. Funding dùng escrow riêng thứ hai.'
                  : 'Launch a Build Bounty only after selecting one Idea. Funding uses a separate second escrow.'}
              </p>
              <a
                className="button button-primary"
                href={`/${locale}/dashboard/bounties/repair-routing-build-draft`}
              >
                {locale === 'vi' ? 'Xem flow Launch Build Bounty' : 'Preview Launch Build Bounty'}{' '}
                <ArrowRight size={17} aria-hidden="true" />
              </a>
            </section>
          )}
        </div>
      </ReviewerGate>
    </main>
  );
}
