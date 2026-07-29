'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

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
  const prefersReducedMotion = useReducedMotion();

  const sizeConfig = {
    sm: { frame: 36, scan: 10, text: 'text-[10px]', gap: 'mt-3', bar: 'w-24', pad: 'py-8' },
    md: { frame: 52, scan: 16, text: 'text-[11px]', gap: 'mt-4', bar: 'w-32', pad: 'py-10' },
    lg: { frame: 68, scan: 24, text: 'text-xs', gap: 'mt-5', bar: 'w-40', pad: 'py-12' },
  };

  const config = sizeConfig[size];

  useEffect(() => {
    if (!isLoading && shouldRender) {
      setIsExiting(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsExiting(false);
        onLoadingComplete?.();
      }, prefersReducedMotion ? 0 : 180);
      return () => clearTimeout(timer);
    } else if (isLoading && !shouldRender) {
      setShouldRender(true);
    }
  }, [isLoading, shouldRender, onLoadingComplete, prefersReducedMotion]);

  if (!shouldRender) return null;

  const containerClasses = fullScreen
    ? 'fixed inset-0 z-50 flex items-center justify-center bg-[#050505]/95'
    : `flex flex-col items-center justify-center ${config.pad}`;

  const motionOff = prefersReducedMotion || isExiting;

  return (
    <AnimatePresence mode="wait">
      {shouldRender && (
        <motion.div
          className={containerClasses}
          role="status"
          aria-live="polite"
          aria-busy={isLoading}
          initial={{ opacity: 0 }}
          animate={isExiting ? { opacity: 0, scale: prefersReducedMotion ? 1 : 0.98 } : { opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.18, ease: 'easeOut' }}
        >
          <div className="relative flex flex-col items-center">
            <motion.div
              className="relative overflow-hidden rounded-[4px] border border-white/15 bg-[#0A0A0A]"
              style={{ width: config.frame, height: config.frame }}
              animate={
                motionOff
                  ? undefined
                  : {
                      borderColor: [
                        'rgba(255, 255, 255, 0.16)',
                        'rgba(255, 215, 0, 0.55)',
                        'rgba(255, 255, 255, 0.16)',
                      ],
                    }
              }
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <span className="absolute left-0 top-0 h-2 w-2 border-l border-t border-[#FFD700]" />
              <span className="absolute right-0 top-0 h-2 w-2 border-r border-t border-[#FFD700]" />
              <span className="absolute bottom-0 left-0 h-2 w-2 border-b border-l border-[#FFD700]" />
              <span className="absolute bottom-0 right-0 h-2 w-2 border-b border-r border-[#FFD700]" />

              <div className="absolute inset-3 grid grid-cols-3 gap-1">
                {Array.from({ length: 9 }).map((_, index) => (
                  <motion.span
                    key={index}
                    className={`border border-white/[0.06] ${
                      index === 4 ? 'bg-[#FFD700]' : 'bg-white/[0.07]'
                    }`}
                    animate={
                      motionOff
                        ? undefined
                        : {
                            opacity: index === 4 ? [0.65, 1, 0.65] : [0.18, 0.52, 0.18],
                          }
                    }
                    transition={{
                      duration: 0.9,
                      repeat: Infinity,
                      delay: index * 0.06,
                      ease: 'easeInOut',
                    }}
                  />
                ))}
              </div>

              <motion.span
                className="absolute left-2 right-2 top-1/2 h-px bg-[#FFD700]"
                animate={
                  motionOff
                    ? undefined
                    : {
                        y: [-config.scan, config.scan, -config.scan],
                        opacity: [0.18, 0.9, 0.18],
                      }
                }
                transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.div>

            <span className="sr-only">{text}</span>

            {showText && (
              <motion.p
                aria-hidden="true"
                className={`${config.gap} max-w-[220px] text-center font-mono ${config.text} uppercase tracking-[0.14em] text-gray-500`}
                initial={{ opacity: prefersReducedMotion ? 1 : 0 }}
                animate={{ opacity: isExiting ? 0 : 1 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.18 }}
              >
                {text}
              </motion.p>
            )}

            <div className={`${showText ? 'mt-3' : config.gap} ${config.bar} h-px overflow-hidden bg-white/10`}>
              <motion.span
                className="block h-full w-1/3 bg-[#FFD700]"
                animate={motionOff ? { x: '110%' } : { x: ['-120%', '320%'] }}
                transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Simple inline version for buttons and small areas
export const LoadingDots: React.FC<{ className?: string }> = ({ className = '' }) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <span className={`inline-flex items-center gap-1 ${className}`} role="status" aria-label="Loading">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 bg-current"
          animate={
            prefersReducedMotion
              ? { opacity: 0.65 }
              : { opacity: [0.35, 1, 0.35], scaleY: [0.8, 1.15, 0.8] }
          }
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'easeInOut',
          }}
        />
      ))}
    </span>
  );
};

export default LoadingSpinner;
