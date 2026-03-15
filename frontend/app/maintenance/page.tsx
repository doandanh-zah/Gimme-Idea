'use client';

import { motion } from 'framer-motion';
import { Zap, Clock } from 'lucide-react';

export default function MaintenancePage() {
    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
    };

    const pulseVariants = {
        pulse: {
            scale: [1, 1.2, 1],
            transition: { duration: 1.5, repeat: Infinity }
        }
    };

    const rotateVariants = {
        rotate: {
            rotate: 360,
            transition: { duration: 3, repeat: Infinity, ease: 'linear' }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0D0D12] to-[#1a1a22] flex items-center justify-center p-4 overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{
                        background: [
                            'radial-gradient(circle at 20% 50%, rgba(255, 215, 0, 0.1) 0%, transparent 50%)',
                            'radial-gradient(circle at 80% 80%, rgba(255, 215, 0, 0.1) 0%, transparent 50%)',
                            'radial-gradient(circle at 40% 20%, rgba(255, 215, 0, 0.1) 0%, transparent 50%)'
                        ]
                    }}
                    transition={{ duration: 8, repeat: Infinity }}
                    className="absolute inset-0"
                />
            </div>

            {/* Content */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="text-center max-w-md relative z-10"
            >
                {/* Icon */}
                <motion.div
                    variants={rotateVariants}
                    animate="rotate"
                    className="mb-8 inline-block"
                >
                    <div className="relative">
                        <Zap className="w-16 h-16 text-yellow-400 drop-shadow-lg" />
                        <motion.div
                            variants={pulseVariants}
                            animate="pulse"
                            className="absolute inset-0 rounded-full border-2 border-yellow-400/30"
                        />
                    </div>
                </motion.div>

                {/* Title */}
                <motion.h1
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    className="text-4xl sm:text-5xl font-bold text-white mb-3 font-display"
                >
                    Under Maintenance
                </motion.h1>

                {/* Divider */}
                <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className="h-1 w-20 bg-gradient-to-r from-yellow-400 to-yellow-600 mx-auto mb-6 rounded-full"
                />

                {/* Description */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    className="text-gray-400 text-base sm:text-lg mb-6 leading-relaxed"
                >
                    We're upgrading Gimme Idea to serve you better. We'll be back online shortly!
                </motion.p>

                {/* Status Indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                    className="flex items-center justify-center gap-3 mb-8"
                >
                    <motion.div
                        variants={pulseVariants}
                        animate="pulse"
                        className="w-3 h-3 rounded-full bg-yellow-400 shadow-lg shadow-yellow-400/50"
                    />
                    <span className="text-gray-400 text-sm font-medium">Maintenance in progress</span>
                </motion.div>

                {/* Info Box */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.6 }}
                    className="bg-white/5 border border-yellow-400/20 rounded-xl p-6 backdrop-blur-sm mb-6"
                >
                    <div className="flex items-center justify-center gap-3 mb-3">
                        <Clock className="w-5 h-5 text-yellow-400" />
                        <p className="text-gray-300 font-medium">Estimated time: 1 day</p>
                    </div>
                    <p className="text-gray-400 text-sm">Thank you for your patience!</p>
                </motion.div>

                {/* Footer */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7, duration: 0.6 }}
                    className="text-gray-500 text-xs sm:text-sm"
                >
                    Questions? Contact us at{' '}
                    <a href="mailto:gimmeidea.contact@gmail.com" className="text-yellow-400 hover:text-yellow-300 transition">
                        gimmeidea.contact@gmail.com
                    </a>
                </motion.p>
            </motion.div>
        </div>
    );
}
