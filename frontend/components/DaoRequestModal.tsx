'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { apiClient } from '@/lib/api-client';

export function DaoRequestModal({
  isOpen,
  onClose,
  projectId,
  minUsd = 3,
  recipientWallet,
}: {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  minUsd?: number;
  recipientWallet: string;
}) {
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [estimatedSol, setEstimatedSol] = useState<number | null>(null);
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  if (!isOpen) return null;

  const submit = async () => {
    if (!publicKey) {
      toast.error('Please connect wallet first');
      return;
    }

    try {
      setSubmitting(true);

      const priceRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
      const json = await priceRes.json();
      const solUsd = Number(json?.solana?.usd);
      if (!Number.isFinite(solUsd) || solUsd <= 0) {
        throw new Error('Cannot fetch SOL price');
      }

      const requiredSol = (minUsd / solUsd) * 1.03; // 3% buffer for price drift
      setEstimatedSol(requiredSol);

      const lamports = Math.ceil(requiredSol * LAMPORTS_PER_SOL);
      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(recipientWallet),
          lamports,
        })
      );

      const sig = await sendTransaction(tx, connection);
      await connection.confirmTransaction(sig, 'confirmed');

      const res = await apiClient.createDaoRequest(projectId, {
        txSignature: sig,
        note: note.trim() || undefined,
      });

      if (!res.success) {
        toast.error(res.error || 'Failed to submit DAO request');
        return;
      }

      toast.success('DAO request submitted. Waiting for admin approval.');
      onClose();
      setNote('');
    } catch (e: any) {
      toast.error(e?.message || 'Request failed');
    } finally {
      setSubmitting(false);
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
          className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#0F0F0F] p-5"
        >
          <button className="absolute top-3 right-3 text-gray-400" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>

          <h3 className="text-lg font-bold text-white">Request Create DAO</h3>
          <p className="text-sm text-gray-400 mt-1">
            Transfer at least <b>${minUsd}</b> (in SOL equivalent) to:
          </p>
          <code className="mt-2 block text-xs break-all bg-white/5 border border-white/10 rounded-lg p-2 text-gray-200">
            {recipientWallet}
          </code>

          <div className="mt-4 space-y-3">
            <div className="text-xs text-gray-400">
              App will open your wallet to transfer ~${minUsd} (SOL equivalent), then submit request automatically.
              {estimatedSol ? <span className="block mt-1 text-gray-500">Last estimate: {estimatedSol.toFixed(4)} SOL</span> : null}
            </div>
            <div>
              <label className="text-xs text-gray-400">Note (optional)</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white"
              />
            </div>
          </div>

          <button
            disabled={submitting}
            onClick={submit}
            className="mt-4 w-full rounded-xl bg-[#FFD700] text-black font-bold py-2.5 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" /> {submitting ? 'Submitting...' : 'Submit request'}
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
