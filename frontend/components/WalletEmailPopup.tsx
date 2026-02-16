'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Mail, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';

export function WalletEmailPopup() {
  const {
    user,
    showWalletEmailPopup,
    setShowWalletEmailPopup,
    updateWalletEmail,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  if (!showWalletEmailPopup || !user || (user.authProvider && user.authProvider !== 'wallet') || user.email) {
    return null;
  }

  const handleSave = async () => {
    const val = email.trim();
    if (!val) {
      toast.error('Please enter an email or click Skip');
      return;
    }

    setSaving(true);
    const ok = await updateWalletEmail(val);
    setSaving(false);

    if (ok) {
      toast.success('Email saved successfully');
      setShowWalletEmailPopup(false);
    } else {
      toast.error('Failed to save email. Try another email.');
    }
  };

  const handleSkip = async () => {
    // Persist skip for this session only. Prompt will show again next login if email is still missing.
    await updateWalletEmail('');
    setShowWalletEmailPopup(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="fixed bottom-6 right-6 z-[120] max-w-sm w-[90vw]"
      >
        <div className="bg-[#0F0F0F] border border-white/10 rounded-2xl p-4 shadow-2xl">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-yellow-500/20 flex items-center justify-center mt-0.5">
                <Mail className="w-4 h-4 text-yellow-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Add email (optional)</h4>
                <p className="text-xs text-gray-400 mt-1">
                  To recover account & get updates. You can skip now.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowWalletEmailPopup(false)}
              className="text-gray-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 space-y-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-white/25 outline-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 rounded-xl bg-[#FFD700] text-black text-sm font-bold py-2 hover:bg-[#f2cb00] disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Save email'}
              </button>
              <button
                onClick={handleSkip}
                disabled={saving}
                className="rounded-xl border border-white/10 text-gray-300 text-sm font-medium px-3 py-2 hover:bg-white/5"
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
