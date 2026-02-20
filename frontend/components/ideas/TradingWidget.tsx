'use client';

import React, { useEffect, useMemo, useState } from 'react';
import BN from 'bn.js';
import toast from 'react-hot-toast';
import { clusterApiUrl, Connection, PublicKey } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { makeFutarchyClient } from '@/lib/metadao/client';
import { apiClient } from '@/lib/api-client';
import type { Project } from '@/lib/types';

type MarketStats = {
  poolStatus: string;
  proposalPubkey?: string | null;
  passPoolAddress?: string | null;
  failPoolAddress?: string | null;
  passPoolBalance: number;
  failPoolBalance: number;
  passProbability: number | null;
  failProbability: number | null;
  finalDecision?: string | null;
  finalizedAt?: string | null;
  updatedAt: string;
};

export function TradingWidget({ idea }: { idea: Project }) {
  const wallet = useWallet();
  const [loadingStats, setLoadingStats] = useState(false);
  const [stats, setStats] = useState<MarketStats | null>(null);
  const [tradeAmount, setTradeAmount] = useState('1');
  const [submitting, setSubmitting] = useState<'pass' | 'fail' | null>(null);
  const [error, setError] = useState('');

  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'mainnet-beta';
  const rpc = useMemo(() => {
    if (network === 'mainnet-beta') {
      return (
        process.env.NEXT_PUBLIC_MAINNET_RPC_URL ||
        process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
        clusterApiUrl('mainnet-beta')
      );
    }
    return process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl('devnet');
  }, [network]);

  const loadStats = async () => {
    setLoadingStats(true);
    try {
      const res = await apiClient.getIdeaMarketStats(idea.id);
      if (res.success && res.data) {
        setStats(res.data);
      }
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    if (idea.proposalPubkey) {
      loadStats();
    }
  }, [idea.id, idea.proposalPubkey]);

  if (!idea.proposalPubkey || !idea.governanceRealmAddress) {
    return null;
  }

  const handleTrade = async (market: 'pass' | 'fail') => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      toast.error('Connect wallet to trade');
      return;
    }
    const amount = Number(tradeAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Enter a valid USDC amount');
      return;
    }

    try {
      setSubmitting(market);
      setError('');
      const connection = new Connection(rpc, 'confirmed');
      const futarchy = makeFutarchyClient(connection as any, wallet as any);
      const daoPubkey = new PublicKey(idea.governanceRealmAddress);
      const proposalPubkey = new PublicKey(idea.proposalPubkey);
      const dao = await futarchy.getDao(daoPubkey);
      const inputAmount = new BN(Math.round(amount * 1_000_000));

      const sig = await futarchy
        .conditionalSwapIx({
          dao: daoPubkey,
          proposal: proposalPubkey,
          baseMint: dao.baseMint,
          quoteMint: dao.quoteMint,
          market,
          swapType: 'buy',
          inputAmount,
          minOutputAmount: new BN(0),
          trader: wallet.publicKey,
        })
        .rpc();

      const status = await connection.getSignatureStatus(sig, {
        searchTransactionHistory: true,
      });
      if (!status.value || status.value.err) {
        throw new Error(`Trade failed or unverifiable: ${sig}`);
      }

      toast.success(`Trade sent: https://solscan.io/tx/${sig}`);
      await loadStats();
    } catch (e: any) {
      const message = e?.message || 'Failed to trade';
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
          Decision Market
        </h3>
        {loadingStats ? <span className="text-[11px] text-gray-500">Refreshing...</span> : null}
      </div>

      <div className="text-xs text-gray-300 space-y-1">
        <div>
          Pass pool: {stats?.passPoolBalance?.toFixed?.(4) ?? '0.0000'} (
          {stats?.passProbability != null ? `${(stats.passProbability * 100).toFixed(2)}%` : 'n/a'})
        </div>
        <div>
          Fail pool: {stats?.failPoolBalance?.toFixed?.(4) ?? '0.0000'} (
          {stats?.failProbability != null ? `${(stats.failProbability * 100).toFixed(2)}%` : 'n/a'})
        </div>
        {stats?.finalDecision ? (
          <div className="text-yellow-300">Final decision: {stats.finalDecision}</div>
        ) : null}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="number"
          min="0"
          step="0.01"
          value={tradeAmount}
          onChange={(e) => setTradeAmount(e.target.value)}
          className="w-full sm:w-40 px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm text-white"
          placeholder="USDC amount"
        />
        <button
          disabled={!!submitting}
          onClick={() => handleTrade('pass')}
          className="px-3 py-2 rounded-md text-xs font-semibold bg-emerald-600 text-white disabled:opacity-50"
        >
          {submitting === 'pass' ? 'Buying Pass...' : 'Buy Pass'}
        </button>
        <button
          disabled={!!submitting}
          onClick={() => handleTrade('fail')}
          className="px-3 py-2 rounded-md text-xs font-semibold bg-red-600 text-white disabled:opacity-50"
        >
          {submitting === 'fail' ? 'Buying Fail...' : 'Buy Fail'}
        </button>
        <button
          disabled={loadingStats}
          onClick={loadStats}
          className="px-3 py-2 rounded-md text-xs font-semibold bg-white/10 text-white disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      {error ? <p className="text-[11px] text-red-400 break-all">{error}</p> : null}
    </div>
  );
}
