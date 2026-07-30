'use client';

import { Rocket, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ComingSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ComingSoonModal = ({ isOpen, onClose }: ComingSoonModalProps) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 modal-overlay"
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="modal-frame max-w-md p-6 sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-labelledby="coming-soon-title"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              type="button"
              className="modal-close"
              aria-label="Close coming soon dialog"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>

            {/* Content */}
            <div className="text-center">
              {/* Icon */}
              <div className="modal-icon mx-auto mb-6 h-16 w-16">
                <Rocket className="h-7 w-7" aria-hidden="true" />
              </div>

              {/* Title */}
              <p className="ui-eyebrow mx-auto mb-4 w-fit">Projects</p>
              <h2 id="coming-soon-title" className="font-display text-3xl font-bold mb-3 text-white">
                Coming Soon
              </h2>

              {/* Description */}
              <p className="text-gray-400 mb-6 leading-relaxed">
                Projects feature is under development. We're working hard to bring you an amazing experience!
              </p>

              {/* Stats or info */}
              <div className="modal-section mb-6">
                <p className="text-sm text-gray-300">
                  In the meantime, explore <span className="text-[#FFD700] font-bold">Ideas</span> to discover innovative concepts and share your feedback!
                </p>
              </div>

              {/* CTA Button */}
              <button
                onClick={onClose}
                className="btn-primary w-full"
              >
                Got it
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
