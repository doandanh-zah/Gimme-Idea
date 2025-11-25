'use client';

import { X } from 'lucide-react';
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1e] border border-white/10 rounded-2xl p-8 shadow-2xl"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Content */}
            <div className="text-center">
              {/* Icon */}
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 flex items-center justify-center">
                <span className="text-4xl">🚀</span>
              </div>

              {/* Title */}
              <h2 className="text-3xl font-display font-bold mb-3">
                Coming <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#9945FF] to-[#7c3aed]">Soon</span>
              </h2>

              {/* Description */}
              <p className="text-gray-400 mb-6 leading-relaxed">
                Projects feature is under development. We're working hard to bring you an amazing experience!
              </p>

              {/* Stats or info */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
                <p className="text-sm text-gray-300">
                  In the meantime, explore <span className="text-[#FFD700] font-bold">Ideas</span> to discover innovative concepts and share your feedback!
                </p>
              </div>

              {/* CTA Button */}
              <button
                onClick={onClose}
                className="w-full px-6 py-3 bg-gradient-to-r from-[#9945FF] to-[#8035e0] text-white font-bold rounded-full hover:shadow-lg hover:shadow-purple-500/20 transition-all"
              >
                Got it!
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
