'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/api-client';

export function ProposalSendModal({
  isOpen,
  onClose,
  projectId,
}: {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const submit = async () => {
    if (!title.trim() || !description.trim()) {
      toast.error('Please fill title and description');
      return;
    }

    try {
      setSubmitting(true);
      const res = await apiClient.createProposal(projectId, {
        title: title.trim(),
        description: description.trim(),
      });

      if (!res.success) {
        toast.error(res.error || 'Failed to send proposal');
        return;
      }

      toast.success('Proposal sent successfully');
      setTitle('');
      setDescription('');
      onClose();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to send proposal');
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
          className="relative w-full max-w-xl rounded-2xl border border-white/10 bg-[#0F0F0F] p-5"
        >
          <button className="absolute top-3 right-3 text-gray-400" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>

          <h3 className="text-lg font-bold text-white">Send Proposal</h3>
          <p className="text-xs text-gray-400 mt-1">
            Send a proposal to governance. You can submit here or use MetaDAO official interface.
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
          </div>

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
