import { CircleDollarSign, ExternalLink, ShieldCheck } from 'lucide-react';
import { notFound } from 'next/navigation';
import {
  BOUNTY_ESCROW_PROGRAM_ID,
  DEVNET_DEMO_BOUNTY_ADDRESS,
  devnetExplorerUrl,
  fetchDevnetBountySnapshot,
  formatRawTokenAmount,
  truncateSolanaAddress,
} from '@gimme-idea/solana';
import { AppPageHeader, EmptySurface } from '@/components/app-surfaces';
import { copy, isLocale } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

function formatDate(locale: string, timestamp: number | null) {
  if (!timestamp) return '—';
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(timestamp * 1_000);
}

export default async function BountiesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = copy[locale];
  const text =
    locale === 'vi'
      ? {
          eyebrow: 'DEVNET / BOUNTY ESCROW',
          summary:
            'Trạng thái bounty được đọc trực tiếp từ Solana, không dựa vào state trong trình duyệt.',
          program: 'Escrow program',
          live: 'Đã deploy',
          waiting: 'Chờ deploy',
          unavailable: 'Không đọc được Devnet',
          unavailableBody:
            'RPC Solana đang chậm hoặc tạm thời không phản hồi. Hãy thử tải lại trang.',
          noBounty: 'Chưa có bounty on-chain',
          noBountyBody:
            'Program sẵn sàng. Bounty test sẽ xuất hiện sau khi hoàn tất giao dịch tạo và nạp vault.',
          notDeployed: 'Program chưa có trên Devnet',
          notDeployedBody: 'Binary đã vượt test local nhưng chưa được ghi lên Devnet.',
          bounty: 'Bounty test',
          prize: 'Giải thưởng',
          fee: 'Phí platform',
          deposited: 'Đã nạp vault',
          sponsor: 'Sponsor',
          judge: 'Judge',
          winner: 'Winner',
          mint: 'Token mint',
          created: 'Khởi tạo',
          activated: 'Kích hoạt',
          settled: 'Hoàn tất',
          terms: 'Terms hash',
          explorer: 'Xem trên Solana Explorer',
          testToken: 'DEVNET TEST TOKEN · KHÔNG CÓ GIÁ TRỊ',
        }
      : {
          eyebrow: 'DEVNET / BOUNTY ESCROW',
          summary: 'Bounty state is read directly from Solana, never inferred from browser state.',
          program: 'Escrow program',
          live: 'Deployed',
          waiting: 'Awaiting deploy',
          unavailable: 'Devnet is unavailable',
          unavailableBody:
            'The Solana RPC is slow or temporarily unavailable. Try refreshing this page.',
          noBounty: 'No on-chain bounty yet',
          noBountyBody:
            'The program is ready. The test bounty appears after its account and vault are funded.',
          notDeployed: 'Program is not on Devnet yet',
          notDeployedBody: 'The binary passed local tests but has not been written to Devnet.',
          bounty: 'Test bounty',
          prize: 'Prize',
          fee: 'Platform fee',
          deposited: 'Vault deposit',
          sponsor: 'Sponsor',
          judge: 'Judge',
          winner: 'Winner',
          mint: 'Token mint',
          created: 'Created',
          activated: 'Activated',
          settled: 'Settled',
          terms: 'Terms hash',
          explorer: 'View on Solana Explorer',
          testToken: 'DEVNET TEST TOKEN · NO REAL VALUE',
        };

  let snapshot: Awaited<ReturnType<typeof fetchDevnetBountySnapshot>> | null = null;
  try {
    snapshot = await fetchDevnetBountySnapshot();
  } catch {
    // Keep the shell and recovery action available when the public RPC is unavailable.
  }

  const bounty = snapshot?.bounty ?? null;
  const stateLabel = bounty?.state.replaceAll('_', ' ').toUpperCase();
  const partyRows: Array<[string, string | null]> = bounty
    ? [
        [text.sponsor, bounty.sponsor],
        [text.judge, bounty.judge],
        [text.winner, bounty.winner],
        [text.mint, bounty.mint],
      ]
    : [];
  const timelineRows: Array<[string, number | null]> = bounty
    ? [
        [text.created, bounty.createdAt],
        [text.activated, bounty.activatedAt],
        [text.settled, bounty.settledAt],
      ]
    : [];

  return (
    <main id="main" className="app-page bounty-page">
      <AppPageHeader eyebrow={text.eyebrow} title={t.shell.bounties} summary={text.summary} />

      <section className="bounty-program-strip" aria-label={text.program}>
        <span className={snapshot?.programDeployed ? 'is-live' : ''} aria-hidden="true" />
        <div>
          <small>{text.program}</small>
          <strong>{truncateSolanaAddress(BOUNTY_ESCROW_PROGRAM_ID, 5)}</strong>
        </div>
        <b>{snapshot?.programDeployed ? text.live : text.waiting}</b>
        <a
          href={devnetExplorerUrl('address', BOUNTY_ESCROW_PROGRAM_ID)}
          target="_blank"
          rel="noreferrer"
          aria-label={`${text.explorer}: ${text.program}`}
        >
          <ExternalLink size={17} aria-hidden="true" />
        </a>
      </section>

      {!snapshot && (
        <EmptySurface
          title={text.unavailable}
          body={text.unavailableBody}
          action={<a href={`/${locale}/bounties`}>{locale === 'vi' ? 'Thử lại' : 'Try again'}</a>}
        />
      )}

      {snapshot && !snapshot.programDeployed && (
        <EmptySurface title={text.notDeployed} body={text.notDeployedBody} />
      )}

      {snapshot?.programDeployed && !bounty && (
        <EmptySurface title={text.noBounty} body={text.noBountyBody} />
      )}

      {bounty && (
        <article className="onchain-bounty-card">
          <header>
            <div className="onchain-bounty-icon" aria-hidden="true">
              <CircleDollarSign size={25} />
            </div>
            <div>
              <p>{text.testToken}</p>
              <h2>{text.bounty}</h2>
            </div>
            <span data-state={bounty.state}>{stateLabel}</span>
          </header>

          <div className="onchain-bounty-money">
            <div>
              <small>{text.prize}</small>
              <strong>{formatRawTokenAmount(bounty.prizePoolRaw)} TEST</strong>
            </div>
            <div>
              <small>{text.deposited}</small>
              <strong>{formatRawTokenAmount(bounty.totalDepositedRaw)} TEST</strong>
            </div>
            <div>
              <small>{text.fee}</small>
              <strong>{formatRawTokenAmount(bounty.platformFeeRaw)} TEST</strong>
            </div>
          </div>

          <dl className="onchain-bounty-parties">
            {partyRows.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd title={value ?? undefined}>{value ? truncateSolanaAddress(value, 6) : '—'}</dd>
              </div>
            ))}
          </dl>

          <ol className="onchain-bounty-timeline">
            {timelineRows.map(([label, timestamp]) => (
              <li key={label} className={timestamp ? 'is-complete' : ''}>
                <ShieldCheck size={18} aria-hidden="true" />
                <span>
                  <small>{label}</small>
                  <strong>{formatDate(locale, timestamp)}</strong>
                </span>
              </li>
            ))}
          </ol>

          <footer>
            <div>
              <small>{text.terms}</small>
              <code
                title={bounty.termsHashHex}
              >{`${bounty.termsHashHex.slice(0, 12)}…${bounty.termsHashHex.slice(-8)}`}</code>
            </div>
            <a
              href={devnetExplorerUrl('address', DEVNET_DEMO_BOUNTY_ADDRESS ?? bounty.address)}
              target="_blank"
              rel="noreferrer"
            >
              {text.explorer}
              <ExternalLink size={16} aria-hidden="true" />
            </a>
          </footer>
        </article>
      )}
    </main>
  );
}
