'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingSpinnerProps {
  isLoading: boolean;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  text?: string;
  fullScreen?: boolean;
  onLoadingComplete?: () => void;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  isLoading,
  size = 'md',
  showText = true,
  text = 'Loading...',
  fullScreen = false,
  onLoadingComplete,
}) => {
  const [isExiting, setIsExiting] = useState(false);
  const [shouldRender, setShouldRender] = useState(isLoading);

  // Size configurations
  const sizeConfig = {
    sm: { logo: 32, ring: 48, stroke: 2 },
    md: { logo: 48, ring: 72, stroke: 3 },
    lg: { logo: 64, ring: 96, stroke: 4 },
  };

  const config = sizeConfig[size];

  useEffect(() => {
    if (!isLoading && shouldRender) {
      // Trigger exit animation
      setIsExiting(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsExiting(false);
        onLoadingComplete?.();
      }, 500); // Duration of exit animation
      return () => clearTimeout(timer);
    } else if (isLoading && !shouldRender) {
      setShouldRender(true);
    }
  }, [isLoading, shouldRender, onLoadingComplete]);

  if (!shouldRender) return null;

  const containerClasses = fullScreen
    ? 'fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0a]/90 backdrop-blur-sm'
    : 'flex flex-col items-center justify-center py-12';

  return (
    <AnimatePresence mode="wait">
      {shouldRender && (
        <motion.div
          className={containerClasses}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="relative flex flex-col items-center">
            {/* Glitch container for exit effect */}
            <motion.div
              className="relative"
              animate={isExiting ? {
                x: [0, -3, 3, -2, 2, 0],
                opacity: [1, 0.8, 1, 0.6, 0.8, 0],
                filter: [
                  'hue-rotate(0deg)',
                  'hue-rotate(90deg)',
                  'hue-rotate(-90deg)',
                  'hue-rotate(45deg)',
                  'hue-rotate(0deg)',
                  'hue-rotate(0deg)',
                ],
              } : {}}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              {/* Rotating gradient ring */}
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  width: config.ring,
                  height: config.ring,
                  left: '50%',
                  top: '50%',
                  marginLeft: -config.ring / 2,
                  marginTop: -config.ring / 2,
                }}
              >
                <svg
                  width={config.ring}
                  height={config.ring}
                  viewBox={`0 0 ${config.ring} ${config.ring}`}
                  className="absolute"
                >
                  <defs>
                    <linearGradient id="loadingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FFD700" />
                      <stop offset="50%" stopColor="#9945FF" />
                      <stop offset="100%" stopColor="#FFD700" />
                    </linearGradient>
                  </defs>
                  <motion.circle
                    cx={config.ring / 2}
                    cy={config.ring / 2}
                    r={(config.ring - config.stroke * 2) / 2}
                    fill="none"
                    stroke="url(#loadingGradient)"
                    strokeWidth={config.stroke}
                    strokeLinecap="round"
                    strokeDasharray={`${(config.ring - config.stroke * 2) * Math.PI * 0.75} ${(config.ring - config.stroke * 2) * Math.PI * 0.25}`}
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                    style={{ transformOrigin: 'center' }}
                  />
                </svg>

                {/* Glow effect */}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'conic-gradient(from 0deg, transparent, rgba(255, 215, 0, 0.3), transparent, rgba(153, 69, 255, 0.3), transparent)',
                    filter: 'blur(8px)',
                  }}
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                />
              </motion.div>

              {/* Logo with popping animation */}
              <motion.div
                className="relative z-10 flex items-center justify-center"
                style={{ width: config.ring, height: config.ring }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: [0, 1.2, 0.9, 1.05, 1],
                  opacity: 1,
                }}
                transition={{
                  duration: 0.6,
                  ease: [0.34, 1.56, 0.64, 1], // Spring-like bounce
                }}
              >
                {/* Pulsing background glow */}
                <motion.div
                  className="absolute rounded-full bg-gradient-to-br from-[#FFD700]/20 to-[#9945FF]/20"
                  style={{ width: config.logo + 16, height: config.logo + 16 }}
                  animate={{
                    scale: [1, 1.15, 1],
                    opacity: [0.5, 0.8, 0.5],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />

                {/* Logo */}
                <motion.img
                  src="/gmi-logo.png"
                  alt="Loading"
                  style={{ width: config.logo, height: config.logo }}
                  className="relative z-10 drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]"
                  animate={{
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              </motion.div>
            </motion.div>

            {/* Loading text */}
            {showText && (
              <motion.p
                className="mt-4 text-gray-400 text-sm font-medium"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <motion.span
                  animate={isExiting ? { opacity: 0 } : { opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  {text}
                </motion.span>
              </motion.p>
            )}

            {/* Glitch lines on exit */}
            <AnimatePresence>
              {isExiting && (
                <>
                  <motion.div
                    className="absolute left-0 right-0 h-[2px] bg-[#FFD700]"
                    style={{ top: '30%' }}
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: [0, 1, 0], opacity: [0, 1, 0], x: [-20, 20, -10] }}
                    transition={{ duration: 0.3 }}
                  />
                  <motion.div
                    className="absolute left-0 right-0 h-[1px] bg-[#9945FF]"
                    style={{ top: '60%' }}
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: [0, 1, 0], opacity: [0, 1, 0], x: [20, -20, 10] }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  />
                </>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Simple inline version for buttons and small areas
export const LoadingDots: React.FC<{ className?: string }> = ({ className = '' }) => (
  <span className={`inline-flex items-center gap-1 ${className}`}>
    {[0, 1, 2].map((i) => (
      <motion.span
        key={i}
        className="w-1.5 h-1.5 rounded-full bg-current"
        animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          delay: i * 0.15,
        }}
      />
    ))}
  </span>
);

export default LoadingSpinner;
