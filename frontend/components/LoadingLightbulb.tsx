
import React from 'react';
import { motion } from 'framer-motion';
import { Zap, X } from 'lucide-react';

export type LoadingStatus = 'loading' | 'success' | 'error';

interface LoadingLightbulbProps {
  text?: string;
  status?: LoadingStatus;
}

export const LoadingLightbulb: React.FC<LoadingLightbulbProps> = ({ 
  text = "Loading...", 
  status = 'loading' 
}) => {
  const isSuccess = status === 'success';
  const isError = status === 'error';

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-black/80 backdrop-blur-xl rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] z-50 min-w-[300px]">
      <div className="relative w-24 h-24 flex items-center justify-center mb-8">
        
        {/* Dynamic Background Glow */}
        <motion.div 
            animate={{ 
                scale: isSuccess ? [1, 1.5, 1.2] : 1,
                opacity: isSuccess ? 0.8 : 0.5 
            }}
            transition={{ duration: 0.5 }}
            className={`absolute inset-0 blur-[40px] rounded-full transition-colors duration-500 ${
            isSuccess ? 'bg-green-500' : isError ? 'bg-red-500' : 'bg-gold/40'
        }`} />

        {/* Loading Spinner Ring */}
        {status === 'loading' && (
             <motion.div
                className="absolute inset-0 rounded-full border-2 border-transparent border-t-gold border-r-gold"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
             />
        )}

        {/* Success Rings Effect */}
        {isSuccess && (
            <>
                <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="absolute inset-0 border border-green-500 rounded-full"
                />
                <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                    className="absolute inset-0 border border-green-400 rounded-full"
                />
                {/* Particle Burst */}
                {[...Array(8)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1.5 h-1.5 bg-green-400 rounded-full"
                        initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                        animate={{ 
                            x: Math.cos(i * 45 * (Math.PI / 180)) * 50,
                            y: Math.sin(i * 45 * (Math.PI / 180)) * 50,
                            opacity: 0,
                            scale: 1
                        }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                    />
                ))}
            </>
        )}

        {/* Center Icon Container */}
        <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: isSuccess ? 1.1 : 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 10 }}
            className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center border transition-colors duration-300 ${
                isSuccess 
                ? 'bg-green-500 border-green-400 shadow-[0_0_20px_rgba(20,241,149,0.5)]' 
                : isError 
                    ? 'bg-red-500/10 border-red-500' 
                    : 'bg-[#0F0F0F] border-white/10'
            }`}
        >
            {status === 'loading' ? (
                <Zap className="w-10 h-10 text-gold animate-pulse" fill="#FFD700" />
            ) : isSuccess ? (
                <svg className="w-10 h-10 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                    <motion.path
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                        d="M5 13l4 4L19 7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            ) : (
                <X className="w-10 h-10 text-red-500" strokeWidth={3} />
            )}
        </motion.div>
      </div>

      <div className="text-center relative z-10">
        <motion.h3 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={status} // Re-animate on status change
            className={`text-xl font-bold font-display mb-2 ${
                isSuccess ? 'text-[#14F195]' : isError ? 'text-red-500' : 'text-white'
            }`}
        >
            {status === 'loading' ? 'Processing' : status === 'success' ? 'Success!' : 'Error'}
        </motion.h3>
        <p className="text-sm text-gray-400 font-mono">{text}</p>
      </div>
    </div>
  );
};
