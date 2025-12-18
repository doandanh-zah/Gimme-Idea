'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

// Particle component for explosion effect
const Particle: React.FC<{ index: number; color: string }> = ({ index, color }) => {
  const angle = (index * 360) / 8; // 8 particles
  const distance = 25 + Math.random() * 15;
  const x = Math.cos((angle * Math.PI) / 180) * distance;
  const y = Math.sin((angle * Math.PI) / 180) * distance;

  return (
    <motion.div
      className="absolute w-1.5 h-1.5 rounded-full"
      style={{ backgroundColor: color }}
      initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
      animate={{
        x: x,
        y: y,
        scale: 0,
        opacity: 0,
      }}
      transition={{
        duration: 0.6,
        ease: 'easeOut',
      }}
    />
  );
};

// Star particle for extra sparkle
const StarParticle: React.FC<{ index: number }> = ({ index }) => {
  const angle = (index * 360) / 6 + 30; // 6 stars, offset
  const distance = 35 + Math.random() * 10;
  const x = Math.cos((angle * Math.PI) / 180) * distance;
  const y = Math.sin((angle * Math.PI) / 180) * distance;

  return (
    <motion.div
      className="absolute text-[#FFD700]"
      initial={{ x: 0, y: 0, scale: 0, opacity: 1, rotate: 0 }}
      animate={{
        x: x,
        y: y,
        scale: [0, 1.2, 0],
        opacity: [1, 1, 0],
        rotate: 180,
      }}
      transition={{
        duration: 0.5,
        delay: index * 0.02,
        ease: 'easeOut',
      }}
    >
      ✦
    </motion.div>
  );
};

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
  const [isAnimating, setIsAnimating] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
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
      setCount(prev => newLiked ? prev + 1 : prev - 1);
      
      if (newLiked) {
        // Trigger animations
        setIsAnimating(true);
        setShowParticles(true);
        
        setTimeout(() => setIsAnimating(false), 400);
        setTimeout(() => setShowParticles(false), 700);
      }
    } catch (error) {
      // Error handled by parent
    } finally {
      setIsLoading(false);
    }
  };

  const particleColors = ['#FFD700', '#FDB931', '#9945FF', '#14F195'];

  return (
    <motion.button
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={`relative flex items-center ${config.gap} ${config.padding} rounded-full ${config.text} font-semibold transition-all duration-300 overflow-visible ${
        isLiked 
          ? 'bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/30' 
          : 'bg-white/5 text-gray-400 hover:bg-[#FFD700]/10 hover:text-[#FFD700] border border-white/10 hover:border-[#FFD700]/30'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      whileTap={{ scale: 0.95 }}
    >
      {/* Particle explosion */}
      <AnimatePresence>
        {showParticles && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* Ring particles */}
            {[...Array(8)].map((_, i) => (
              <Particle key={`particle-${i}`} index={i} color={particleColors[i % 4]} />
            ))}
            {/* Star particles */}
            {[...Array(6)].map((_, i) => (
              <StarParticle key={`star-${i}`} index={i} />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Ring burst effect */}
      <AnimatePresence>
        {showParticles && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-[#FFD700]"
            initial={{ scale: 0.8, opacity: 1 }}
            animate={{ scale: 2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>

      {/* Glow effect */}
      <AnimatePresence>
        {showParticles && (
          <motion.div
            className="absolute inset-0 rounded-full bg-[#FFD700]/30"
            initial={{ scale: 0.5, opacity: 1 }}
            animate={{ scale: 1.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          />
        )}
      </AnimatePresence>

      {/* Icon with bounce animation */}
      <motion.div
        animate={isAnimating ? {
          scale: [1, 1.4, 0.9, 1.1, 1],
          rotate: [0, -15, 15, -5, 0],
        } : {}}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <Icon 
          style={{ width: config.icon, height: config.icon }}
          className={`${isLiked ? (variant === 'heart' ? 'fill-[#FFD700]' : 'fill-[#FFD700]') : ''} transition-colors`}
        />
      </motion.div>

      {/* Count with number animation */}
      {showCount && (
        <AnimatePresence mode="popLayout">
          <motion.span
            key={count}
            initial={{ y: isLiked ? 10 : -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: isLiked ? -10 : 10, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {count}
          </motion.span>
        </AnimatePresence>
      )}

      {/* +1 floating text */}
      <AnimatePresence>
        {showParticles && (
          <motion.span
            className="absolute -top-2 left-1/2 text-[#FFD700] font-bold text-xs pointer-events-none"
            initial={{ x: '-50%', y: 0, opacity: 1, scale: 0.5 }}
            animate={{ y: -20, opacity: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            +1
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

export default LikeButton;
