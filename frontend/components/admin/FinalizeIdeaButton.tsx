'use client';

import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { makeFutarchyClient } from '@/lib/metadao/client';
import { apiClient } from '@/lib/api-client';
import type { Project } from '@/lib/types';

type FinalizeIdeaButtonProps = {
  idea: Project;
  onFinalized?: () => Promise<void> | void;
};

export function FinalizeIdeaButton({ idea, onFinalized }: FinalizeIdeaButtonProps) {
  const wallet = useWallet();
  const [submitting, setSubmitting] = useState<'pass' | 'reject' | null>(null);
  const [step, setStep] = useState('');
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

  if (!idea.proposalPubkey || !idea.governanceRealmAddress || idea.poolStatus === 'finalized') {
    return null;
  }

  const finalize = async (decision: 'pass' | 'reject') => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      toast.error('Connect admin wallet first');
      return;
    }

    try {
      setSubmitting(decision);
      setError('');
      setStep('Finalizing on-chain proposal...');

      const connection = new Connection(rpc, 'confirmed');
      const futarchy = makeFutarchyClient(connection as any, wallet as any);
      const proposalPubkey = new PublicKey(idea.proposalPubkey);

      const sig = await futarchy.finalizeProposal(proposalPubkey);
      const status = await connection.getSignatureStatus(sig, {
        searchTransactionHistory: true,
      });
      if (!status.value || status.value.err) {
        throw new Error(`Finalize tx failed or unverifiable: ${sig}`);
      }

      setStep('Syncing finalized state to DB...');
      const res = await apiClient.finalizeIdea(idea.id, {
        decision,
        onchainTx: sig,
        proposalPubkey: idea.proposalPubkey,
      });
      if (!res.success) {
        throw new Error(res.error || 'Failed to sync finalize result');
      }

      setStep('Done');
      toast.success(`Finalized (${decision}). Solscan: https://solscan.io/tx/${sig}`);
      await onFinalized?.();
    } catch (e: any) {
      const message = e?.message || 'Failed to finalize idea';
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button
          disabled={!!submitting}
          onClick={() => finalize('pass')}
          className="px-3 py-2 rounded-md bg-emerald-600 text-white text-xs font-semibold disabled:opacity-50"
        >
          {submitting === 'pass' ? 'Finalizing Pass...' : 'Approve (Pass)'}
        </button>
        <button
          disabled={!!submitting}
          onClick={() => finalize('reject')}
          className="px-3 py-2 rounded-md bg-red-600 text-white text-xs font-semibold disabled:opacity-50"
        >
          {submitting === 'reject' ? 'Finalizing Reject...' : 'Reject (Fail)'}
        </button>
      </div>
      {step ? <p className="text-[11px] text-yellow-300">{step}</p> : null}
      {error ? <p className="text-[11px] text-red-400 break-all">{error}</p> : null}
    </div>
  );
}
