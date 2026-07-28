'use client';

import React, { useState } from 'react';
import { ThumbsUp, Heart } from 'lucide-react';

interface LikeButtonProps {
  initialCount: number;
  isLiked?: boolean;
  onLike: () => Promise<void>;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'thumbs' | 'heart';
  showCount?: boolean;
  className?: string;
}

export const LikeButton: React.FC<LikeButtonProps> = ({
  initialCount,
  isLiked: initialIsLiked = false,
  onLike,
  disabled = false,
  size = 'sm',
  variant = 'thumbs',
  showCount = true,
  className = '',
}) => {
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [count, setCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);

  const sizeConfig = {
    sm: { icon: 14, padding: 'px-3 py-1.5', text: 'text-xs', gap: 'gap-1.5' },
    md: { icon: 16, padding: 'px-4 py-2', text: 'text-sm', gap: 'gap-2' },
    lg: { icon: 20, padding: 'px-5 py-2.5', text: 'text-base', gap: 'gap-2' },
  };

  const config = sizeConfig[size];
  const Icon = variant === 'heart' ? Heart : ThumbsUp;

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (disabled || isLoading) return;

    setIsLoading(true);

    try {
      await onLike();

      const newLiked = !isLiked;
      setIsLiked(newLiked);
      setCount((prev) => (newLiked ? prev + 1 : prev - 1));
    } catch {
      // Error handled by parent
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={`relative flex items-center ${config.gap} ${config.padding} rounded-sm ${config.text} font-semibold font-mono transition-colors duration-150 min-h-[40px] ${
        isLiked
          ? 'bg-[#FFD700]/15 text-[#FFD700] border border-[#FFD700]/40'
          : 'bg-transparent text-gray-400 hover:text-[#FFD700] border border-white/10 hover:border-[#FFD700]/35'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
    >
      <Icon
        style={{ width: config.icon, height: config.icon }}
        className={`${isLiked ? 'fill-[#FFD700]' : ''} transition-colors`}
        aria-hidden
      />

      {showCount && <span className="tabular-nums">{count}</span>}
    </button>
  );
};

export default LikeButton;
