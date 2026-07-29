'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Mail, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingDots } from './LoadingSpinner';

export function WalletEmailPopup() {
  const {
    user,
    showWalletEmailPopup,
    setShowWalletEmailPopup,
    updateWalletEmail,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!showWalletEmailPopup) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowWalletEmailPopup(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showWalletEmailPopup, setShowWalletEmailPopup]);

  if (!showWalletEmailPopup || !user || (user.authProvider && user.authProvider !== 'wallet') || user.email) {
    return null;
  }

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const val = email.trim();
    if (!val) {
      setError('Enter an email or skip for now.');
      return;
    }

    setError('');
    setSaving(true);
    const ok = await updateWalletEmail(val);
    setSaving(false);

    if (ok) {
      toast.success('Email saved successfully');
      setShowWalletEmailPopup(false);
    } else {
      setError('Could not save this email. Try another address.');
      toast.error('Failed to save email. Try another email.');
    }
  };

  const handleSkip = async () => {
    // Persist skip for this session only. Prompt will show again next login if email is still missing.
    setSaving(true);
    await updateWalletEmail('');
    setSaving(false);
    setShowWalletEmailPopup(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
        animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
        exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
        transition={{ duration: prefersReducedMotion ? 0.01 : 0.18, ease: 'easeOut' }}
        className="fixed bottom-4 right-4 z-[120] w-[calc(100vw-2rem)] max-w-sm sm:bottom-6 sm:right-6"
        role="dialog"
        aria-labelledby="wallet-email-title"
        aria-describedby="wallet-email-description"
      >
        <div className="modal-panel border-l-2 border-l-[#FFD700] p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px] border border-white/10 bg-white/[0.03]">
                <Mail className="h-4 w-4 text-[#FFD700]" aria-hidden="true" />
              </div>
              <div>
                <p className="ui-eyebrow mb-1">Wallet account</p>
                <h4 id="wallet-email-title" className="text-sm font-bold text-white">
                  Add email
                </h4>
                <p id="wallet-email-description" className="mt-1 text-xs leading-relaxed text-[#B5B5B5]">
                  To recover account & get updates. You can skip now.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowWalletEmailPopup(false)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px] border border-transparent text-[#B5B5B5] transition-colors hover:border-white/15 hover:bg-white/[0.04] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700]"
              aria-label="Close email prompt"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <form className="mt-4 space-y-3" onSubmit={handleSave} noValidate>
            <div className="space-y-1.5">
              <label htmlFor="wallet-email" className="text-xs font-semibold uppercase tracking-[0.14em] text-[#B5B5B5]">
                Email
              </label>
              <input
                id="wallet-email"
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (error) setError('');
                }}
                placeholder="you@example.com"
                autoComplete="email"
                spellCheck={false}
                aria-invalid={error ? 'true' : undefined}
                aria-describedby={error ? 'wallet-email-error' : 'wallet-email-help'}
                className="w-full rounded-[4px] border border-white/15 bg-white/[0.03] px-3 py-2.5 text-sm text-white placeholder:text-[#6A6A6A] transition-colors focus:border-[#FFD700] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700]/40"
              />
              {error ? (
                <p id="wallet-email-error" className="text-xs text-red-300">
                  {error}
                </p>
              ) : (
                <p id="wallet-email-help" className="text-xs text-[#8A8A8A]">
                  Used only for recovery and product updates.
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary flex min-h-10 flex-1 items-center justify-center gap-2 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                aria-busy={saving}
              >
                {saving ? (
                  <>
                    <LoadingDots className="text-black" />
                    Saving
                  </>
                ) : (
                  'Save email'
                )}
              </button>
              <button
                type="button"
                onClick={handleSkip}
                disabled={saving}
                className="btn-ghost min-h-10 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                Skip
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
