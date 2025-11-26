'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

interface AICommentBadgeProps {
  model?: string;
  className?: string;
}

export const AICommentBadge: React.FC<AICommentBadgeProps> = ({ model, className = '' }) => {
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 ${className}`}>
      <Sparkles className="w-3.5 h-3.5 text-purple-500 animate-pulse" />
      <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
        AI Generated
      </span>
      {model && (
        <span className="text-xs text-gray-500">({model})</span>
      )}
    </div>
  );
};
