'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Shield, X, ExternalLink, Info } from 'lucide-react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction } from '@solana/web3.js';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAssociatedTokenAddress,
} from '@solana/spl-token';
import { useAuth } from '../contexts/AuthContext';
import { WalletRequiredModal } from './WalletRequiredModal';
import { getUsdcMintPubkey } from '../lib/solana/usdc';
import { showDonateToast } from '../lib/donate-toast';
import { apiClient } from '../lib/api-client';

const DEV_WALLET_DEFAULT = 'FzcnaZMYcoAYpLgr7Wym2b8hrKYk3VXsRxWSLuvZKLJm';
const USDC_DECIMALS = 6;

function shortenAddress(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function toBaseUnits(amount: number, decimals: number) {
  return BigInt(Math.round(amount * 10 ** decimals));
}

function fromBaseUnits(amount: bigint, decimals: number) {
  const denom = 10 ** decimals;
  return Number(amount) / denom;
}

export interface SupportDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  treasuryAddress?: string;
  ideaTitle: string;
  feeBps?: number; // e.g. 50
  feeCapUsdc?: number; // e.g. 20
  feeRecipient?: string;
}

export function SupportDepositModal({
  isOpen,
  onClose,
  projectId,
  treasuryAddress,
  ideaTitle,
  feeBps = 50,
  feeCapUsdc = 0,
  feeRecipient = DEV_WALLET_DEFAULT,
}: SupportDepositModalProps) {
  const { publicKey, sendTransaction, connected } = useWallet();
  const { connection } = useConnection();
  const { user } = useAuth();

  const [amount, setAmount] = useState('50');
  const [processing, setProcessing] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletModalMode, setWalletModalMode] = useState<'reconnect' | 'connect'>('connect');

  const isWalletConnected = connected && publicKey;
  const activeWalletAddress = publicKey?.toBase58();

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setProcessing(false);
      setTxHash('');
      setShowPreview(false);
    }
  }, [isOpen]);

  const parsedAmount = useMemo(() => {
    const n = Number(amount);
    return Number.isFinite(n) ? n : NaN;
  }, [amount]);

  const { feeAmount, netAmount } = useMemo(() => {
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return { feeAmount: 0, netAmount: 0 };

    const rawFee = (parsedAmount * feeBps) / 10000;
    const cappedFee = Math.min(rawFee, feeCapUsdc);
    const net = Math.max(parsedAmount - cappedFee, 0);
    return { feeAmount: cappedFee, netAmount: net };
  }, [parsedAmount, feeBps, feeCapUsdc]);

  const initiate = () => {
    if (!isWalletConnected) {
      if (user?.wallet) {
        setWalletModalMode('reconnect');
      } else {
        setWalletModalMode('connect');
      }
      setShowWalletModal(true);
      return;
    }

    if (user?.wallet && activeWalletAddress && activeWalletAddress !== user.wallet) {
      toast.error('Connected wallet does not match your profile. Please reconnect with the correct wallet.');
      setWalletModalMode('reconnect');
      setShowWalletModal(true);
      return;
    }

    if (!treasuryAddress) {
      toast.error('Treasury address not available');
      return;
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (netAmount <= 0) {
      toast.error('Amount must be greater than the fee');
      return;
    }

    setShowPreview(true);
  };

  const handleSend = async () => {
    if (!publicKey) return;
    if (!treasuryAddress) return;

    setShowPreview(false);
    setProcessing(true);

    try {
      const mint = getUsdcMintPubkey();
      const treasury = new PublicKey(treasuryAddress);
      const feeRecipientPk = new PublicKey(feeRecipient);

      // Treat treasuryAddress as an *owner* wallet/PDA and derive its USDC ATA
      const treasuryTokenAccount = await getAssociatedTokenAddress(
        mint,
        treasury,
        true,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const payerUsdcAta = await getAssociatedTokenAddress(
        mint,
        publicKey,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
      const feeRecipientAta = await getAssociatedTokenAddress(
        mint,
        feeRecipientPk,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const ixs = [];

      // Create treasury ATA if missing
      const treasuryAtaInfo = await connection.getAccountInfo(treasuryTokenAccount);
      if (!treasuryAtaInfo) {
        ixs.push(
          createAssociatedTokenAccountInstruction(
            publicKey,
            treasuryTokenAccount,
            treasury,
            mint,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
          )
        );
      }

      // Create fee recipient ATA if missing (only if fee enabled)
      if (feeBps > 0 && feeCapUsdc > 0) {
        const feeAtaInfo = await connection.getAccountInfo(feeRecipientAta);
        if (!feeAtaInfo) {
          ixs.push(
            createAssociatedTokenAccountInstruction(
              publicKey,
              feeRecipientAta,
              feeRecipientPk,
              mint,
              TOKEN_PROGRAM_ID,
              ASSOCIATED_TOKEN_PROGRAM_ID
            )
          );
        }
      }

      const amountBase = toBaseUnits(parsedAmount, USDC_DECIMALS);
      const feeBase = toBaseUnits(feeAmount, USDC_DECIMALS);
      const netBase = amountBase - feeBase;

      // Transfer net to treasury token account
      ixs.push(
        createTransferInstruction(
          payerUsdcAta,
          treasuryTokenAccount,
          publicKey,
          netBase,
          [],
          TOKEN_PROGRAM_ID
        )
      );

      // No fee split by default. If enabled (future), transfer fee to dev.
      if (feeBase > 0n && feeBps > 0 && feeCapUsdc > 0) {
        ixs.push(
          createTransferInstruction(
            payerUsdcAta,
            feeRecipientAta,
            publicKey,
            feeBase,
            [],
            TOKEN_PROGRAM_ID
          )
        );
      }

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      const tx = new Transaction({ feePayer: publicKey, recentBlockhash: blockhash });
      tx.add(...ixs);

      const signature = await sendTransaction(tx, connection);
      await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed');

      // Record canonical support ledger (best-effort)
      if (!projectId) {
        console.warn('Missing projectId for pool_supports ledger write');
      }
      try {
        const ledgerRes = await apiClient.recordPoolSupport({
          projectId,
          txHash: signature,
          amountUsdc: netAmount,
          feeUsdc: feeAmount,
          treasuryWallet: treasury.toBase58(),
          supporterWallet: publicKey.toBase58(),
        });

        if (!ledgerRes?.success) {
          console.warn('pool_supports ledger write failed:', ledgerRes?.error || ledgerRes);
          toast.error('Support sent, but donor ranking sync failed. Team has been notified.');
        }
      } catch (ledgerErr) {
        console.warn('Failed to record pool_supports ledger:', ledgerErr);
        toast.error('Support sent, but donor ranking sync failed. Team has been notified.');
      }

      setTxHash(signature);
      toast.success('Support sent');
      showDonateToast('support');
    } catch (e: any) {
      console.error(e);
      const msg = e?.message?.includes('User rejected') ? 'Transaction cancelled' : 'Transaction failed';
      toast.error(msg);
      setProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center px-3 sm:px-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={processing && !txHash ? undefined : onClose} />

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-md bg-[#0F0F0F] border border-white/10 rounded-2xl p-4 sm:p-6 shadow-2xl overflow-hidden min-h-[360px] flex flex-col"
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-white z-20"
          disabled={processing && !txHash}
        >
          <X className="w-5 h-5" />
        </button>

        <AnimatePresence mode="wait">
          {processing ? (
            txHash ? (
              <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-grow flex flex-col justify-center text-center">
                <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-green-300" />
                </div>
                <h2 className="text-xl font-bold text-white">Support sent</h2>
                <p className="text-sm text-gray-400 mt-1">Thanks for supporting this idea.</p>

                <div className="bg-white/5 border border-white/10 rounded-xl p-4 mt-5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Amount</span>
                    <span className="text-white font-bold">{parsedAmount} USDC</span>
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-gray-500">Fee</span>
                    <span className="text-gray-300">{feeAmount.toFixed(2)} USDC</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">To treasury</span>
                    <span className="text-gray-300">{netAmount.toFixed(2)} USDC</span>
                  </div>
                  <div className="h-px bg-white/10 my-3" />
                  <a
                    className="inline-flex items-center justify-center gap-2 text-xs text-green-300 hover:underline"
                    href={`https://solscan.io/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View on Solscan <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    onClick={onClose}
                    className="mt-3 w-full py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm text-white"
                  >
                    Done
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-grow flex items-center justify-center text-gray-300">
                Confirming transaction...
              </motion.div>
            )
          ) : showPreview ? (
            <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col flex-grow">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-green-300" />
                <h2 className="text-xl font-bold text-white">Confirm Support</h2>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
                <div className="text-[11px] text-gray-500 font-mono uppercase mb-2">Transaction</div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Idea</span>
                    <span className="text-white font-medium truncate max-w-[220px]">{ideaTitle}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Total</span>
                    <span className="text-white font-bold">{parsedAmount} USDC</span>
                  </div>
                  {/* fee row removed by request */}
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">To treasury</span>
                    <span className="text-gray-300">{netAmount.toFixed(2)} USDC</span>
                  </div>
                  <div className="h-px bg-white/10" />
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">From</span>
                    <span className="text-gray-300 font-mono">{activeWalletAddress ? shortenAddress(activeWalletAddress) : 'Your wallet'}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Treasury</span>
                    <span className="text-gray-300 font-mono">{treasuryAddress ? shortenAddress(treasuryAddress) : '—'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-4 text-[11px] text-gray-400 flex items-start gap-2">
                <Info className="w-4 h-4 mt-0.5 text-gray-300" />
                <div>
                  This sends USDC to the idea treasury in one transaction.
                </div>
              </div>

              <div className="flex gap-3 mt-auto">
                <button
                  onClick={() => setShowPreview(false)}
                  className="flex-1 py-3 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition-colors text-sm"
                >
                  Back
                </button>
                <button
                  onClick={handleSend}
                  className="flex-1 py-3 bg-[#FFD700] text-black font-bold rounded-xl hover:bg-[#FFD700]/90 transition-colors text-sm"
                >
                  Confirm & Send
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col flex-grow">
              <h2 className="text-xl font-bold text-white">Support with USDC</h2>
              <p className="text-sm text-gray-400 mt-1 line-clamp-2">{ideaTitle}</p>

              <div className="mt-6 space-y-3">
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1 font-mono uppercase">Amount (USDC)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      step="1"
                      min="0"
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xl font-bold outline-none focus:border-[#FFD700]/40 transition-colors text-white"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-mono text-sm">USDC</span>
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {['10', '25', '50', '100', '250'].map((val) => (
                    <button
                      key={val}
                      onClick={() => setAmount(val)}
                      className={`py-2 rounded-lg text-xs font-medium border transition-all ${
                        amount === val
                          ? 'bg-[#FFD700]/15 border-[#FFD700]/40 text-white'
                          : 'bg-transparent border-white/10 text-gray-400 hover:bg-white/5'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Estimated fee</span>
                    <span className="text-gray-200">{Number.isFinite(parsedAmount) && parsedAmount > 0 ? feeAmount.toFixed(2) : '—'} USDC</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-gray-400">To treasury</span>
                    <span className="text-gray-200">{Number.isFinite(parsedAmount) && parsedAmount > 0 ? netAmount.toFixed(2) : '—'} USDC</span>
                  </div>
                </div>
              </div>

              <button
                onClick={initiate}
                className="mt-auto w-full py-3 bg-[#FFD700] text-black font-bold rounded-xl hover:bg-[#FFD700]/90 transition-colors"
                disabled={!treasuryAddress}
              >
                Continue
              </button>
              {!treasuryAddress && (
                <div className="text-xs text-gray-500 mt-2">This idea does not have an open pool yet.</div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <WalletRequiredModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        mode={walletModalMode}
        onSuccess={() => setShowWalletModal(false)}
      />
    </div>
  );
}
