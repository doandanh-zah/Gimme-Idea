'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Trophy, ExternalLink, Loader2, Sparkles, Users, Flame } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import ConstellationBackground from '@/components/ConstellationBackground';

function shorten(addr?: string) {
  if (!addr) return '—';
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

export default function ProjectsPage() {
  const [loading, setLoading] = useState(true);
  const [openPools, setOpenPools] = useState<any[]>([]);
  const [topDonors, setTopDonors] = useState<any[]>([]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const [ideasRes, donorsRes] = await Promise.all([
          apiClient.getProjects({
            type: 'idea',
            poolStatus: 'pool_open',
            limit: 120,
            sortBy: 'votes',
            sortOrder: 'desc',
          } as any),
          apiClient.getTopDonators(30),
        ]);

        if (ideasRes.success && ideasRes.data) {
          setOpenPools(ideasRes.data.filter((i: any) => !!i.governanceTreasuryAddress));
        }
        if (donorsRes.success && donorsRes.data) {
          setTopDonors(donorsRes.data);
        }
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  const trendingPools = useMemo(
    () =>
      [...openPools].sort((a, b) => {
        const sa = (a.votes || 0) * 2 + (a.feedbackCount || 0);
        const sb = (b.votes || 0) * 2 + (b.feedbackCount || 0);
        return sb - sa;
      }),
    [openPools]
  );

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pt-28 px-4 pb-16 relative overflow-hidden">
      <ConstellationBackground opacity={0.22} showShootingStars showGradientOrbs />

      <div className="relative z-10 max-w-5xl mx-auto space-y-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 shadow-[0_0_30px_rgba(147,51,234,0.12)]">
          <div className="flex items-center gap-3">
            <Trophy className="w-7 h-7 text-[#FFD700]" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Leaderboard</h1>
              <p className="text-sm text-gray-400">Open pools only · transparent links to Solscan</p>
              <p className="text-[11px] text-gray-500 mt-1">Ranking = votes + feedback momentum. Donors from canonical pool_supports ledger.</p>
            </div>
          </div>
        </motion.div>

        {loading ? (
          <div className="py-24 flex items-center justify-center text-gray-400 gap-2 rounded-2xl border border-white/10 bg-[#0F0F0F]/70">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading leaderboard...
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Open pools */}
            <section className="xl:col-span-2 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-[#FFD700]" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#FFD700] font-mono">Open Pools</h2>
              </div>
              <div className="space-y-2">
                {openPools.length === 0 ? (
                  <p className="text-sm text-gray-500">No open pools yet.</p>
                ) : (
                  openPools.map((idea, idx) => (
                    <div key={idea.id} className="rounded-xl border border-white/10 bg-black/30 p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs text-gray-500">#{idx + 1}</div>
                        <div className="text-sm font-semibold truncate">{idea.title} Pool</div>
                        <div className="text-xs text-gray-500">Votes: {idea.votes || 0} • Feedback: {idea.feedbackCount || 0}</div>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <Link href={`/idea/${idea.id}`} className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15">
                          View Idea
                        </Link>
                        <a
                          href={`https://solscan.io/account/${idea.governanceTreasuryAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-full bg-blue-600/80 hover:bg-blue-600 inline-flex items-center gap-1"
                        >
                          Solscan <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Donors */}
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-purple-300" />
                <h2 className="text-sm font-bold uppercase tracking-wider font-mono text-[#FFD700]">Donors Ranking</h2>
              </div>
              <div className="space-y-2">
                {topDonors.length === 0 ? (
                  <p className="text-sm text-gray-500">No donor data yet.</p>
                ) : (
                  topDonors.slice(0, 12).map((d: any, idx: number) => (
                    <div key={`${d.wallet}-${idx}`} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-white truncate">#{idx + 1} {d.username || shorten(d.wallet)}</div>
                        <div className="text-gray-500 truncate">{shorten(d.wallet)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-semibold">{Number(d.totalDonated || 0).toFixed(2)} {d.unit || 'USDC'}</div>
                        <div className="text-gray-500">{d.donationCount || 0} tx</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* trending among open pools */}
            <section className="xl:col-span-3 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Flame className="w-4 h-4 text-orange-300" />
                <h2 className="text-sm font-bold uppercase tracking-wider font-mono text-[#FFD700]">Trending Open Pools</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                {trendingPools.slice(0, 12).map((idea: any, idx: number) => (
                  <div key={idea.id} className="rounded-lg border border-white/10 bg-black/30 p-3 text-xs">
                    <div className="text-gray-500">#{idx + 1}</div>
                    <div className="text-sm font-semibold mt-1 line-clamp-2">{idea.title}</div>
                    <div className="mt-1 text-gray-500">Votes: {idea.votes || 0} • Feedback: {idea.feedbackCount || 0}</div>
                    <div className="mt-2 flex items-center gap-2">
                      <Link href={`/idea/${idea.id}`} className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/15">View Idea</Link>
                      <a href={`https://solscan.io/account/${idea.governanceTreasuryAddress}`} target="_blank" rel="noopener noreferrer" className="px-2.5 py-1 rounded-full bg-blue-600/80 hover:bg-blue-600 inline-flex items-center gap-1">
                        Pool <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        <p className="text-[11px] text-gray-500">Last synced: {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
}
