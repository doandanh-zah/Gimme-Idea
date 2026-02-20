'use client';

import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import BN from 'bn.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, SystemProgram, Transaction, clusterApiUrl } from '@solana/web3.js';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import {
  META_MINT,
  MAINNET_USDC,
  PERMISSIONLESS_ACCOUNT,
  PriceMath,
  getDaoAddr,
} from '@metadaoproject/futarchy/v0.7';
import { makeFutarchyClient } from '@/lib/metadao/client';
import { apiClient } from '@/lib/api-client';
import type { Project } from '@/lib/types';

const DEFAULT_VOTE_THRESHOLD = Number(process.env.NEXT_PUBLIC_IDEA_POOL_VOTE_THRESHOLD || 10);

type CreatePoolButtonProps = {
  idea: Project;
  onCreated?: () => Promise<void> | void;
};

export function CreatePoolButton({ idea, onCreated }: CreatePoolButtonProps) {
  const wallet = useWallet();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<string>('');
  const [error, setError] = useState<string>('');

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

  const needsSponsor = Number(idea.votes || 0) < DEFAULT_VOTE_THRESHOLD;
  const isActive = idea.poolStatus === 'active' && !!idea.proposalPubkey;

  if (isActive || idea.poolStatus === 'finalized') {
    return null;
  }

  const signAndSendTransaction = async (
    connection: Connection,
    tx: Transaction,
    extraSigners: { publicKey: PublicKey; secretKey: Uint8Array }[] = []
  ) => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      throw new Error('Connect wallet to sign');
    }

    tx.feePayer = wallet.publicKey;
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    tx.recentBlockhash = blockhash;

    for (const signer of extraSigners) {
      tx.partialSign(signer as any);
    }

    const signed = await wallet.signTransaction(tx);
    const sig = await connection.sendRawTransaction(signed.serialize(), {
      skipPreflight: false,
      maxRetries: 3,
    });
    const confirmation = await connection.confirmTransaction(
      { signature: sig, blockhash, lastValidBlockHeight },
      'confirmed'
    );
    if (confirmation.value.err) {
      throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
    }
    return sig;
  };

  const handleCreatePool = async () => {
    if (!wallet.publicKey) {
      toast.error('Connect wallet first');
      return;
    }

    setLoading(true);
    setError('');
    setStep('Preparing pool creation...');

    try {
      const connection = new Connection(rpc, 'confirmed');
      const futarchy = makeFutarchyClient(connection as any, wallet as any);

      let daoPubkey: PublicKey;
      let daoInitTx: string | null = null;

      if (idea.governanceRealmAddress) {
        daoPubkey = new PublicKey(idea.governanceRealmAddress);
      } else {
        setStep('Creating DAO...');
        const nonce = new BN(Date.now());
        const oneBuck = PriceMath.getAmmPrice(1, 6, 6);
        const baseMintAddress = process.env.NEXT_PUBLIC_FUTARCHY_BASE_MINT || META_MINT.toBase58();
        const baseMint = new PublicKey(baseMintAddress);

        const ixBuilder = futarchy.initializeDaoIx({
          baseMint,
          quoteMint: MAINNET_USDC,
          params: {
            secondsPerProposal: 60 * 60 * 24 * 3,
            twapStartDelaySeconds: 60 * 60 * 24,
            twapInitialObservation: oneBuck,
            twapMaxObservationChangePerUpdate: oneBuck.divn(100),
            minQuoteFutarchicLiquidity: new BN(10_000),
            minBaseFutarchicLiquidity: new BN(10_000),
            passThresholdBps: 300,
            nonce,
            initialSpendingLimit: null,
            baseToStake: new BN(0),
            teamSponsoredPassThresholdBps: 300,
            teamAddress: wallet.publicKey,
          },
          provideLiquidity: false,
        });
        const daoTx = await (ixBuilder as any).transaction();
        daoInitTx = await signAndSendTransaction(connection, daoTx);
        [daoPubkey] = getDaoAddr({ nonce, daoCreator: wallet.publicKey });
      }

      const dao = await futarchy.getDao(daoPubkey);

      setStep('Creating on-chain proposal...');
      const noopIx = SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: wallet.publicKey,
        lamports: 0,
      });
      const transactionIndex = BigInt(Date.now());
      const { tx: squadsProposalTx, squadsProposal } = futarchy.squadsProposalCreateTx({
        dao: daoPubkey,
        instructions: [noopIx],
        transactionIndex,
        payer: wallet.publicKey,
      });
      const squadsCreateTx = await signAndSendTransaction(connection, squadsProposalTx, [
        PERMISSIONLESS_ACCOUNT,
      ]);

      const proposalPubkey = await futarchy.initializeProposal(daoPubkey, squadsProposal);

      setStep('Launching decision markets...');
      const launchTx = await futarchy
        .launchProposalIx({
          proposal: proposalPubkey,
          dao: daoPubkey,
          baseMint: dao.baseMint,
          quoteMint: dao.quoteMint,
          squadsProposal,
        })
        .rpc();

      const proposal = await futarchy.getProposal(proposalPubkey);
      const passPoolAddress = getAssociatedTokenAddressSync(
        proposal.passQuoteMint,
        daoPubkey,
        true
      ).toBase58();
      const failPoolAddress = getAssociatedTokenAddressSync(
        proposal.failQuoteMint,
        daoPubkey,
        true
      ).toBase58();

      setStep('Saving pool mapping to DB...');
      const res = await apiClient.createIdeaPool(idea.id, {
        daoAddress: daoPubkey.toBase58(),
        proposalPubkey: proposalPubkey.toBase58(),
        passPoolAddress,
        failPoolAddress,
        poolCreateTx: launchTx,
        sponsor: needsSponsor,
        onchainRefs: {
          daoInitTx,
          squadsCreateTx,
          launchTx,
          squadsProposal: squadsProposal.toBase58(),
          transactionIndex: transactionIndex.toString(),
          question: proposal.question.toBase58(),
          baseVault: proposal.baseVault.toBase58(),
          quoteVault: proposal.quoteVault.toBase58(),
        },
      });

      if (!res.success) {
        throw new Error(res.error || 'Failed to persist pool mapping');
      }

      setStep('Done');
      toast.success(`Pool created. Solscan: https://solscan.io/tx/${launchTx}`);
      await onCreated?.();
    } catch (e: any) {
      const message = e?.message || 'Failed to create decision pool';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleCreatePool}
        disabled={loading}
        className="px-4 py-2 rounded-full bg-[#FFD700] text-black text-sm font-bold disabled:opacity-60"
      >
        {loading
          ? 'Creating Pool...'
          : needsSponsor
            ? 'Create Pool (Sponsor)'
            : 'Create Decision Pool'}
      </button>
      {step ? <p className="text-[11px] text-yellow-300">{step}</p> : null}
      {error ? <p className="text-[11px] text-red-400 break-all">{error}</p> : null}
    </div>
  );
}
