'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Check, X, Zap } from 'lucide-react';

export type LoadingStatus = 'loading' | 'success' | 'error';

interface LoadingLightbulbProps {
  text?: string;
  status?: LoadingStatus;
}

export const LoadingLightbulb: React.FC<LoadingLightbulbProps> = ({
  text = 'Loading...',
  status = 'loading',
}) => {
  const isSuccess = status === 'success';
  const isError = status === 'error';
  const prefersReducedMotion = useReducedMotion();

  const statusLabel = status === 'loading' ? 'Processing' : isSuccess ? 'Success' : 'Error';
  const statusColor = isSuccess ? 'text-[#14F195]' : isError ? 'text-red-400' : 'text-[#FFD700]';
  const frameBorder = isSuccess
    ? 'border-[#14F195]/55'
    : isError
      ? 'border-red-500/55'
      : 'border-white/15';

  return (
    <div
      className="modal-panel z-50 flex min-w-[300px] flex-col items-center justify-center p-6 text-center"
      role="status"
      aria-live="polite"
    >
      <div
        className={`relative mb-6 flex h-20 w-20 items-center justify-center overflow-hidden rounded-[4px] border bg-[#0A0A0A] ${frameBorder}`}
      >
        <span className="absolute left-0 top-0 h-2 w-2 border-l border-t border-[#FFD700]" />
        <span className="absolute right-0 top-0 h-2 w-2 border-r border-t border-[#FFD700]" />
        <span className="absolute bottom-0 left-0 h-2 w-2 border-b border-l border-[#FFD700]" />
        <span className="absolute bottom-0 right-0 h-2 w-2 border-b border-r border-[#FFD700]" />

        {status === 'loading' && (
          <>
            <div className="absolute inset-4 grid grid-cols-2 gap-1.5">
              {Array.from({ length: 4 }).map((_, index) => (
                <motion.span
                  key={index}
                  className="border border-white/[0.06] bg-white/[0.07]"
                  animate={prefersReducedMotion ? undefined : { opacity: [0.2, 0.72, 0.2] }}
                  transition={{
                    duration: 0.9,
                    repeat: Infinity,
                    delay: index * 0.12,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </div>
            <motion.span
              className="absolute left-3 right-3 top-1/2 h-px bg-[#FFD700]"
              animate={prefersReducedMotion ? undefined : { y: [-22, 22, -22], opacity: [0.2, 0.9, 0.2] }}
              transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
            />
          </>
        )}

        {isSuccess && !prefersReducedMotion && (
          <motion.span
            className="absolute inset-2 border border-[#14F195]"
            initial={{ opacity: 0.75, scale: 0.9 }}
            animate={{ opacity: 0, scale: 1.35 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
          />
        )}

        {isError && (
          <span className="absolute inset-x-3 top-1/2 h-px rotate-45 bg-red-500/60" />
        )}

        <motion.div
          key={status}
          initial={{ opacity: prefersReducedMotion ? 1 : 0, scale: prefersReducedMotion ? 1 : 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.18, ease: 'easeOut' }}
          className={`relative z-10 flex h-10 w-10 items-center justify-center border ${
            isSuccess
              ? 'border-[#14F195] bg-[#14F195] text-black'
              : isError
                ? 'border-red-500/70 bg-red-500/10 text-red-400'
                : 'border-[#FFD700]/50 bg-[#050505] text-[#FFD700]'
          }`}
        >
          {status === 'loading' ? (
            <motion.span
              animate={prefersReducedMotion ? undefined : { opacity: [0.55, 1, 0.55] }}
              transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Zap className="h-5 w-5" fill="#FFD700" />
            </motion.span>
          ) : isSuccess ? (
            <Check className="h-5 w-5" strokeWidth={3} />
          ) : (
            <X className="h-5 w-5" strokeWidth={3} />
          )}
        </motion.div>
      </div>

      <div className="relative z-10 text-center">
        <motion.h3
          initial={{ opacity: prefersReducedMotion ? 1 : 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.18 }}
          key={status}
          className={`mb-2 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] ${statusColor}`}
        >
          {statusLabel}
        </motion.h3>
        <p className="max-w-[260px] text-sm leading-6 text-gray-400">{text}</p>
      </div>
    </div>
  );
};
