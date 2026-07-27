'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, TrendingUp, Users, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LeaderboardPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#FFD700]/10 rounded-full blur-3xl" />
      </div>

      <main className="relative z-10 pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => router.push('/home')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>

          {/* Coming Soon Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-[#1a1a2e] to-[#0F0F0F] border border-white/10 rounded-3xl p-12 text-center"
          >
            {/* Trophy Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-24 h-24 bg-gradient-to-br from-[#FFD700]/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-8"
            >
              <Trophy className="w-12 h-12 text-[#FFD700]" />
            </motion.div>

            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-[#FFD700] to-purple-400 bg-clip-text text-transparent">
              Leaderboard Coming Soon
            </h1>
            
            <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto leading-relaxed">
              We're building an exciting leaderboard to showcase the top idea creators, 
              most helpful feedbackers, and generous tippers in our community!
            </p>

            {/* Preview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <Star className="w-8 h-8 text-[#FFD700] mx-auto mb-3" />
                <h3 className="font-bold text-white mb-1">Top Creators</h3>
                <p className="text-sm text-gray-500">Most innovative idea publishers</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <TrendingUp className="w-8 h-8 text-green-400 mx-auto mb-3" />
                <h3 className="font-bold text-white mb-1">Top Feedbackers</h3>
                <p className="text-sm text-gray-500">Most helpful community members</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <Users className="w-8 h-8 text-purple-400 mx-auto mb-3" />
                <h3 className="font-bold text-white mb-1">Top Supporters</h3>
                <p className="text-sm text-gray-500">Generous tip contributors</p>
              </div>
            </div>

            {/* CTA */}
            <p className="text-gray-500 text-sm">
              Stay tuned! Start building your reputation now by sharing ideas and giving feedback.
            </p>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
