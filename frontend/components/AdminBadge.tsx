'use client';

import React from 'react';
import { Shield, ShieldCheck, Star } from 'lucide-react';
import { motion } from 'framer-motion';

interface AdminBadgeProps {
  variant?: 'inline' | 'card' | 'small';
  showLabel?: boolean;
  className?: string;
}

export default function AdminBadge({ 
  variant = 'inline', 
  showLabel = true,
  className = '' 
}: AdminBadgeProps) {
  if (variant === 'small') {
    return (
      <span 
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30 ${className}`}
        title="Admin"
      >
        <ShieldCheck className="w-3 h-3" />
        {showLabel && 'ADMIN'}
      </span>
    );
  }

  if (variant === 'card') {
    return (
      <motion.div 
        className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 ${className}`}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <div className="p-1.5 rounded-md bg-amber-500/20">
          <Shield className="w-4 h-4 text-amber-400" />
        </div>
        <div>
          <div className="text-xs font-semibold text-amber-400">Administrator</div>
          <div className="text-[10px] text-gray-500">Full platform access</div>
        </div>
      </motion.div>
    );
  }

  // Default inline variant
  return (
    <span 
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30 ${className}`}
      title="Platform Administrator"
    >
      <ShieldCheck className="w-3.5 h-3.5" />
      {showLabel && 'Admin'}
    </span>
  );
}

// Special badge for Gimme Sensei
export function GimmeSenseiBadge({ className = '' }: { className?: string }) {
  return (
    <motion.span 
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 text-purple-400 border border-purple-500/30 ${className}`}
      title="AI Mentor & Platform Admin"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <Star className="w-3.5 h-3.5 fill-current" />
      AI Mentor
    </motion.span>
  );
}
