import Link from 'next/link';
import { ArrowLeft, ExternalLink, ShieldCheck } from 'lucide-react';
import {
  BOUNTY_ESCROW_PROGRAM_ID,
  DEVNET_DEMO_BOUNTY_ADDRESS,
  devnetExplorerUrl,
  fetchDevnetBountySnapshot,
  formatRawTokenAmount,
  truncateSolanaAddress,
} from '@gimme-idea/solana';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Devnet bounty diagnostics',
  robots: { index: false, follow: false },
};

export default async function DevnetBountyDiagnostics() {
  let snapshot: Awaited<ReturnType<typeof fetchDevnetBountySnapshot>> | null = null;
  try {
    snapshot = await fetchDevnetBountySnapshot();
  } catch {
    /* Recovery UI below. */
  }
  const bounty = snapshot?.bounty ?? null;
  return (
    <main id="main" className="devnet-admin">
      <section className="devnet-admin__panel">
        <Link className="v1-back-link" href="/en/bounties">
          <ArrowLeft size={15} aria-hidden="true" />
          Back to product Bounties
        </Link>
        <p className="devnet-admin__eyebrow">DEVELOPMENT UTILITY / SOLANA DEVNET</p>
        <h1>Bounty diagnostics</h1>
        <p className="devnet-admin__intro">
          This route exposes technical Devnet state for development verification. It is not a
          product opportunity and is not mapped to a canonical Problem.
        </p>
        <dl className="devnet-admin__facts">
          <div>
            <dt>Program</dt>
            <dd>{BOUNTY_ESCROW_PROGRAM_ID}</dd>
          </div>
          <div>
            <dt>Program state</dt>
            <dd>
              {snapshot?.programDeployed
                ? 'Deployed'
                : snapshot
                  ? 'Not deployed'
                  : 'RPC unavailable'}
            </dd>
          </div>
          {bounty && (
            <>
              <div>
                <dt>Bounty</dt>
                <dd>{bounty.address}</dd>
              </div>
              <div>
                <dt>State</dt>
                <dd>{bounty.state}</dd>
              </div>
              <div>
                <dt>Prize</dt>
                <dd>{formatRawTokenAmount(bounty.prizePoolRaw)} TEST</dd>
              </div>
              <div>
                <dt>Vault deposit</dt>
                <dd>{formatRawTokenAmount(bounty.totalDepositedRaw)} TEST</dd>
              </div>
              <div>
                <dt>Winner</dt>
                <dd>{bounty.winner ? truncateSolanaAddress(bounty.winner, 6) : '—'}</dd>
              </div>
            </>
          )}
        </dl>
        {!snapshot && (
          <div className="devnet-admin__status" role="alert">
            Could not read the public Devnet RPC. Refresh to try again.
          </div>
        )}
        {bounty && (
          <a
            className="button button-primary"
            href={devnetExplorerUrl('address', DEVNET_DEMO_BOUNTY_ADDRESS ?? bounty.address)}
            target="_blank"
            rel="noreferrer"
          >
            <ShieldCheck size={17} aria-hidden="true" />
            Inspect on Explorer <ExternalLink size={15} aria-hidden="true" />
          </a>
        )}
      </section>
    </main>
  );
}
