'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, Transaction, clusterApiUrl } from '@solana/web3.js';
import {
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferInstruction,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { apiClient } from '@/lib/api-client';
import { makeFutarchyClient } from '@/lib/metadao/client';
import { PERMISSIONLESS_ACCOUNT } from '@metadaoproject/futarchy/v0.7';

export function ProposalSendModal({
  isOpen,
  onClose,
  projectId,
  daoAddress,
  onSubmitted,
}: {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  daoAddress?: string;
  onSubmitted?: () => void;
}) {
  const wallet = useWallet();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [recipientWallet, setRecipientWallet] = useState('');
  const [amountUsdc, setAmountUsdc] = useState('');
  const [submitStep, setSubmitStep] = useState<string | null>(null);

  if (!isOpen) return null;

  const mainnetRpc =
    process.env.NEXT_PUBLIC_MAINNET_RPC_URL ||
    ((process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'mainnet-beta') === 'mainnet-beta'
      ? process.env.NEXT_PUBLIC_SOLANA_RPC_URL
      : undefined) ||
    clusterApiUrl('mainnet-beta');

  const signAndSendTransaction = async (
    connection: Connection,
    tx: Transaction,
    extraSigners: { publicKey: PublicKey; secretKey: Uint8Array }[] = []
  ) => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      throw new Error('Connect a wallet that supports transaction signing');
    }

    tx.feePayer = wallet.publicKey;
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    tx.recentBlockhash = blockhash;

    for (const signer of extraSigners) {
      tx.partialSign(signer as any);
    }

    const signed = await wallet.signTransaction(tx);
    const signature = await connection.sendRawTransaction(signed.serialize(), {
      skipPreflight: false,
      maxRetries: 3,
    });

    const confirmed = await connection.confirmTransaction(
      { signature, blockhash, lastValidBlockHeight },
      'confirmed'
    );

    if (confirmed.value.err) {
      throw new Error(`Transaction failed: ${JSON.stringify(confirmed.value.err)}`);
    }

    return signature;
  };

  const submit = async () => {
    if (!title.trim() || !description.trim()) {
      toast.error('Please fill title and description');
      return;
    }
    if (!daoAddress) {
      toast.error('DAO address is missing. Open pool first.');
      return;
    }

    const recipient = recipientWallet.trim();
    const parsedAmount = Number(amountUsdc);
    if (!recipient) {
      toast.error('Recipient wallet is required for refund proposal');
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast.error('Amount USDC must be greater than 0');
      return;
    }

    try {
      setSubmitting(true);
      setSubmitStep('Preparing on-chain proposal...');

      if (!wallet.publicKey) {
        throw new Error('Connect wallet to submit on-chain proposal');
      }

      const daoPubkey = new PublicKey(daoAddress);
      const recipientPubkey = new PublicKey(recipient);
      const amountRaw = BigInt(Math.round(parsedAmount * 1_000_000));
      if (amountRaw <= 0n) {
        throw new Error('Amount USDC is too small');
      }

      const mainnetConnection = new Connection(mainnetRpc, 'confirmed');
      const futarchy = makeFutarchyClient(mainnetConnection as any, wallet as any);
      const dao = await futarchy.getDao(daoPubkey);

      const recipientQuoteAta = getAssociatedTokenAddressSync(
        dao.quoteMint,
        recipientPubkey,
        true
      );
      const ensureAtaIx = createAssociatedTokenAccountIdempotentInstruction(
        wallet.publicKey,
        recipientQuoteAta,
        recipientPubkey,
        dao.quoteMint
      );
      setSubmitStep('Ensuring recipient USDC token account...');
      await signAndSendTransaction(mainnetConnection, new Transaction().add(ensureAtaIx));

      const squadsVaultQuoteAta = getAssociatedTokenAddressSync(
        dao.quoteMint,
        dao.squadsMultisigVault,
        true
      );
      const transferRefundIx = createTransferInstruction(
        squadsVaultQuoteAta,
        recipientQuoteAta,
        dao.squadsMultisigVault,
        amountRaw,
        [],
        TOKEN_PROGRAM_ID
      );

      const transactionIndex = BigInt(Date.now());
      const { tx: squadsProposalTx, squadsProposal } = futarchy.squadsProposalCreateTx({
        dao: daoPubkey,
        instructions: [transferRefundIx],
        transactionIndex,
        payer: wallet.publicKey,
      });

      setSubmitStep('Creating squads proposal transaction...');
      const onchainCreateTx = await signAndSendTransaction(mainnetConnection, squadsProposalTx, [
        PERMISSIONLESS_ACCOUNT,
      ]);

      setSubmitStep('Initializing Autocrat proposal account...');
      const proposalPubkey = await futarchy.initializeProposal(daoPubkey, squadsProposal);

      let launchTx: string | null = null;
      try {
        setSubmitStep('Launching proposal to voting state...');
        launchTx = await futarchy
          .launchProposalIx({
            proposal: proposalPubkey,
            dao: daoPubkey,
            baseMint: dao.baseMint,
            quoteMint: dao.quoteMint,
            squadsProposal,
          })
          .rpc();
      } catch (launchErr: any) {
        console.warn('[ProposalSendModal] launch proposal failed:', launchErr);
      }

      const proposalPdas = futarchy.getProposalPdas(
        proposalPubkey,
        dao.baseMint,
        dao.quoteMint,
        daoPubkey
      );

      const res = await apiClient.createProposal(projectId, {
        title: title.trim(),
        description: description.trim(),
        executionPayload: {
          recipientWallet: recipient,
          amountUsdc: parsedAmount,
          note: 'execute refund via on-chain futarchy flow',
        },
        onchainProposalPubkey: proposalPubkey.toBase58(),
        onchainCreateTx,
        onchainRefs: {
          dao: daoPubkey.toBase58(),
          squadsProposal: squadsProposal.toBase58(),
          baseMint: dao.baseMint.toBase58(),
          quoteMint: dao.quoteMint.toBase58(),
          question: proposalPdas.question.toBase58(),
          baseVault: proposalPdas.baseVault.toBase58(),
          quoteVault: proposalPdas.quoteVault.toBase58(),
          transactionIndex: transactionIndex.toString(),
          launchTx,
        },
      });

      if (!res.success) {
        toast.error(res.error || 'Failed to send proposal');
        return;
      }

      toast.success('On-chain proposal created and saved');
      setTitle('');
      setDescription('');
      setRecipientWallet('');
      setAmountUsdc('');
      setSubmitStep(null);
      onSubmitted?.();
      onClose();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to send proposal');
    } finally {
      setSubmitting(false);
      setSubmitStep(null);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-black/80" onClick={submitting ? undefined : onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="relative w-full max-w-xl rounded-2xl border border-white/10 bg-[#0F0F0F] p-5"
        >
          <button className="absolute top-3 right-3 text-gray-400" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>

          <h3 className="text-lg font-bold text-white">Send Proposal</h3>
          <p className="text-xs text-gray-400 mt-1">
            Submit a real on-chain proposal (wallet signature required), then store mapping in DB.
          </p>
          <div className="mt-2 text-[11px] text-gray-500 space-y-1">
            <div>
              Lifecycle: <span className="text-gray-300">pending</span> → <span className="text-yellow-300">voting</span> → <span className="text-emerald-300">passed / rejected</span> → <span className="text-green-300">executed</span>
            </div>
            <div>
              Where to track: <span className="text-gray-300">Idea page → Proposals list</span> (status + execution tx link when available)
            </div>
          </div>

          <a
            href="https://www.metadao.fi/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-xs text-blue-300 hover:underline"
          >
            Open MetaDAO official app <ExternalLink className="w-3 h-3" />
          </a>

          <div className="mt-4 space-y-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Proposal title"
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Rationale, recipient, amount, milestones, execution note"
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                value={recipientWallet}
                onChange={(e) => setRecipientWallet(e.target.value)}
                placeholder="Recipient wallet (required)"
                className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white"
              />
              <input
                value={amountUsdc}
                onChange={(e) => setAmountUsdc(e.target.value)}
                placeholder="Amount USDC (required)"
                inputMode="decimal"
                className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white"
              />
            </div>
          </div>

          {submitStep ? (
            <div className="mt-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-200">
              {submitStep}
            </div>
          ) : null}

          <button
            onClick={submit}
            disabled={submitting}
            className="mt-4 w-full rounded-xl bg-[#FFD700] text-black font-bold py-2.5 disabled:opacity-60 inline-flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" /> {submitting ? 'Sending...' : 'Send Proposal'}
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
