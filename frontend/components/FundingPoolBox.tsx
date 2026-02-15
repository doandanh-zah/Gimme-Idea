'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { DollarSign, ExternalLink, Info } from 'lucide-react';
import { Project } from '../lib/types';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';

const DEV_WALLET_DEFAULT = 'FzcnaZMYcoAYpLgr7Wym2b8hrKYk3VXsRxWSLuvZKLJm';

function formatUsdc(n?: number | null) {
  if (n === null || n === undefined) return '—';
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(n);
}

function formatBps(bps?: number | null) {
  if (bps === null || bps === undefined) return '—';
  return `${(bps / 100).toFixed(2)}%`;
}

export function FundingPoolBox({ project, onSupport }: { project: Project; onSupport?: () => void }) {
  const fee = useMemo(() => {
    const bps = project.supportFeeBps ?? 50;
    const cap = project.supportFeeCapUsdc ?? 20;
    const recipient = project.supportFeeRecipient ?? DEV_WALLET_DEFAULT;
    return { bps, cap, recipient };
  }, [project.supportFeeBps, project.supportFeeCapUsdc, project.supportFeeRecipient]);

  const { connection } = useConnection();
  const [totalRaisedUsdc, setTotalRaisedUsdc] = useState<number | null>(null);

  const isOpen = project.poolStatus === 'pool_open' && !!project.governanceTreasuryAddress;

  useEffect(() => {
    let cancelled = false;

    async function loadBalance() {
      if (!project.governanceTreasuryAddress) {
        setTotalRaisedUsdc(null);
        return;
      }

      try {
        const pk = new PublicKey(project.governanceTreasuryAddress);
        const bal = await connection.getTokenAccountBalance(pk);
        const ui = bal?.value?.uiAmount;
        if (!cancelled) setTotalRaisedUsdc(ui ?? 0);
      } catch (e) {
        // Might not be a token account, or RPC error.
        if (!cancelled) setTotalRaisedUsdc(null);
      }
    }

    loadBalance();
    return () => {
      cancelled = true;
    };
  }, [connection, project.governanceTreasuryAddress]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-[#FFD700]" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Funding Pool</h3>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Support this idea, then vote to select a builder and unlock milestone payouts (SPL Governance).
          </p>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full border ${isOpen ? 'border-green-500/30 text-green-300 bg-green-500/10' : 'border-white/10 text-gray-300 bg-white/5'}`}>
          {isOpen ? 'POOL OPEN' : (project.poolStatus ? project.poolStatus.toUpperCase() : 'POOL NOT OPEN')}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
        <div className="rounded-xl border border-white/10 bg-black/30 p-3">
          <div className="text-[11px] text-gray-500">Treasury</div>
          {project.governanceTreasuryAddress ? (
            <>
              <div className="mt-1 flex items-center gap-2">
                <code className="text-xs text-gray-200 break-all">{project.governanceTreasuryAddress}</code>
                <Link
                  href={`https://solscan.io/account/${project.governanceTreasuryAddress}`}
                  target="_blank"
                  className="text-gray-400 hover:text-white"
                  title="View on Solscan"
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
              <div className="mt-2 text-xs text-gray-400">
                Total raised: <span className="text-white font-bold">{formatUsdc(totalRaisedUsdc)} USDC</span>
              </div>
            </>
          ) : (
            <div className="mt-1 text-xs text-gray-400">Not created yet</div>
          )}
        </div>

        <div className="rounded-xl border border-white/10 bg-black/30 p-3">
          <div className="text-[11px] text-gray-500">Support fee</div>
          <div className="mt-1 text-xs text-gray-200">
            {formatBps(fee.bps)} (cap {formatUsdc(fee.cap)} USDC) →{' '}
            <code className="text-gray-300">{fee.recipient.slice(0, 4)}…{fee.recipient.slice(-4)}</code>
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-gray-500">
            <Info className="w-3 h-3" />
            Fees are disclosed before you sign.
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row gap-2">
        <button
          disabled={!isOpen}
          onClick={isOpen ? onSupport : undefined}
          className="w-full sm:w-auto px-4 py-2 rounded-full font-bold text-sm bg-[#FFD700] text-black disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Support with USDC
        </button>
        {!isOpen && (
          <div className="text-xs text-gray-400 flex items-center">
            Pool needs approval + setup first.
          </div>
        )}
      </div>
    </div>
  );
}
