'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Trophy, ExternalLink, Loader2, Sparkles } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

function shorten(addr?: string) {
  if (!addr) return '—';
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

export default function ProjectsPage() {
  const [loading, setLoading] = useState(true);
  const [openPools, setOpenPools] = useState<any[]>([]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const ideasRes = await apiClient.getProjects({
          type: 'idea',
          poolStatus: 'pool_open',
          limit: 100,
          sortBy: 'votes',
          sortOrder: 'desc',
        } as any);

        if (ideasRes.success && ideasRes.data) {
          const pools = ideasRes.data.filter((i: any) => !!i.governanceTreasuryAddress);
          setOpenPools(pools);
        }
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  const ranked = useMemo(
    () =>
      [...openPools].sort((a, b) => {
        const sa = (a.votes || 0) * 2 + (a.feedbackCount || 0);
        const sb = (b.votes || 0) * 2 + (b.feedbackCount || 0);
        return sb - sa;
      }),
    [openPools]
  );

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pt-28 px-4 pb-16">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center gap-3">
            <Trophy className="w-7 h-7 text-[#FFD700]" />
            <div>
              <h1 className="text-2xl font-bold">Leaderboard</h1>
              <p className="text-sm text-gray-400">Only ideas with open pools (transparent on Solscan)</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex items-center justify-center text-gray-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading open pools...
          </div>
        ) : (
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-[#FFD700]" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#FFD700]">Open Pools Ranking</h2>
            </div>

            <div className="space-y-2">
              {ranked.length === 0 ? (
                <p className="text-sm text-gray-500">No open pools yet.</p>
              ) : (
                ranked.map((idea, idx) => (
                  <div
                    key={idea.id}
                    className="rounded-xl border border-white/10 bg-black/30 p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="text-xs text-gray-500">#{idx + 1}</div>
                      <div className="text-sm font-semibold truncate">{idea.title} Pool</div>
                      <div className="text-xs text-gray-500">
                        Votes: {idea.votes || 0} • Feedback: {idea.feedbackCount || 0} • Pool: {shorten(idea.governanceTreasuryAddress)}
                      </div>
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
        )}

        <p className="text-[11px] text-gray-500">Last synced: {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
}
