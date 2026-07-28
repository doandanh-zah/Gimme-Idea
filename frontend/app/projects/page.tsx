'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, ExternalLink, Flame, RefreshCw, Trophy, Users } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { createUniqueSlug } from '@/lib/slug-utils';

function shorten(addr?: string) {
  if (!addr) return '-';
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

function formatNumber(value: unknown) {
  return Number(value || 0).toLocaleString();
}

function ideaHref(idea: any) {
  return `/idea/${idea.slug || createUniqueSlug(idea.title || 'idea', idea.id)}`;
}

function SectionHeader({
  icon: Icon,
  eyebrow,
  title,
}: {
  icon: React.ElementType;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
      <div>
        <p className="ui-eyebrow">{eyebrow}</p>
        <h2 className="mt-3 text-xl sm:text-2xl font-semibold text-white tracking-tight">{title}</h2>
      </div>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-white/10 bg-[#111]">
        <Icon className="h-4 w-4 text-[#FFD700]" aria-hidden="true" />
      </div>
    </div>
  );
}

function LoadingRows() {
  return (
    <div className="divide-y divide-white/10" aria-busy="true">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="grid gap-3 py-4 sm:grid-cols-[56px_1fr_auto] sm:items-center">
          <div className="h-8 w-12 animate-pulse bg-white/10" />
          <div className="space-y-2">
            <div className="h-4 w-2/3 animate-pulse bg-white/10" />
            <div className="h-3 w-1/2 animate-pulse bg-white/10" />
          </div>
          <div className="h-9 w-28 animate-pulse bg-white/10" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ title, body, actionHref }: { title: string; body: string; actionHref?: string }) {
  return (
    <div className="flex min-h-[220px] flex-col items-start justify-center border border-dashed border-white/15 bg-white/[0.02] p-6">
      <p className="font-semibold text-white">{title}</p>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-gray-400">{body}</p>
      {actionHref && (
        <Link href={actionHref} className="btn-ghost mt-5">
          Explore ideas
        </Link>
      )}
    </div>
  );
}

function PoolRow({ idea, rank }: { idea: any; rank: number }) {
  return (
    <div className="grid gap-3 border-b border-white/10 py-4 last:border-b-0 sm:grid-cols-[56px_1fr_auto] sm:items-center">
      <div className="font-mono text-xs uppercase tracking-wider text-gray-500">#{rank}</div>
      <div className="min-w-0">
        <Link href={ideaHref(idea)} className="block truncate font-semibold text-white hover:text-[#FFD700]">
          {idea.title}
        </Link>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[11px] uppercase tracking-wider text-gray-500">
          <span>{formatNumber(idea.votes)} votes</span>
          <span>{formatNumber(idea.feedbackCount)} feedback</span>
          <span>{shorten(idea.governanceTreasuryAddress)}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Link href={ideaHref(idea)} className="btn-ghost min-h-[40px] px-3 py-2 text-xs">
          View
        </Link>
        <a
          href={`https://solscan.io/account/${idea.governanceTreasuryAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-ghost min-h-[40px] px-3 py-2 text-xs"
        >
          Solscan <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}

function DonorRow({ donor, rank }: { donor: any; rank: number }) {
  return (
    <div className="grid grid-cols-[40px_1fr_auto] items-center gap-3 border-b border-white/10 py-3 last:border-b-0">
      <div className="font-mono text-xs text-gray-500">#{rank}</div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-white">{donor.username || shorten(donor.wallet)}</p>
        <p className="mt-1 truncate font-mono text-[11px] text-gray-500">{shorten(donor.wallet)}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-white">
          {Number(donor.totalDonated || 0).toFixed(2)} {donor.unit || 'USDC'}
        </p>
        <p className="mt-1 font-mono text-[11px] text-gray-500">{formatNumber(donor.donationCount)} tx</p>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [openPools, setOpenPools] = useState<any[]>([]);
  const [topDonors, setTopDonors] = useState<any[]>([]);

  const loadLeaderboard = async () => {
    setLoading(true);
    setError('');
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

      if (!ideasRes.success) {
        throw new Error(ideasRes.error || 'Could not load open pools.');
      }

      setOpenPools((ideasRes.data || []).filter((idea: any) => !!idea.governanceTreasuryAddress));
      setTopDonors(donorsRes.success && donorsRes.data ? donorsRes.data : []);
      setLastSyncedAt(new Date());
    } catch (err: any) {
      setError(err?.message || 'Could not load leaderboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const trendingPools = useMemo(
    () =>
      [...openPools].sort((a, b) => {
        const scoreA = (a.votes || 0) * 2 + (a.feedbackCount || 0);
        const scoreB = (b.votes || 0) * 2 + (b.feedbackCount || 0);
        return scoreB - scoreA;
      }),
    [openPools]
  );

  return (
    <main className="relative min-h-screen overflow-hidden px-4 pb-20 pt-24 sm:px-6 sm:pt-28">

      <div className="mx-auto max-w-6xl">
        <header className="border-b border-white/10 pb-8">
          <p className="ui-eyebrow">Capital signal</p>
          <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <h1 className="font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">
                Pool leaderboard
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-gray-400 sm:text-base">
                Track idea pools with real treasury addresses, visible Solscan links, and donor
                activity from the pool support ledger.
              </p>
            </div>
            <button
              type="button"
              onClick={loadLeaderboard}
              disabled={loading}
              className="btn-ghost self-start lg:self-auto"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
              Refresh
            </button>
          </div>
        </header>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_360px]">
          <section className="border border-white/10 bg-[#0a0a0a] p-4 sm:p-6">
            <SectionHeader icon={Trophy} eyebrow="Open pools" title="Pools with treasury addresses" />

            {error ? (
              <div className="mt-5 border border-red-500/25 bg-red-500/10 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-300" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold text-red-100">Could not load leaderboard</p>
                    <p className="mt-1 text-sm text-red-100/75">{error}</p>
                    <button type="button" onClick={loadLeaderboard} className="btn-ghost mt-4">
                      Try again
                    </button>
                  </div>
                </div>
              </div>
            ) : loading ? (
              <div className="mt-3">
                <LoadingRows />
              </div>
            ) : openPools.length === 0 ? (
              <div className="mt-5">
                <EmptyState
                  title="No open pools yet"
                  body="Ideas need an active governance treasury before they appear here."
                  actionHref="/idea"
                />
              </div>
            ) : (
              <div className="mt-3">
                {openPools.map((idea, index) => (
                  <PoolRow key={idea.id} idea={idea} rank={index + 1} />
                ))}
              </div>
            )}
          </section>

          <aside className="space-y-6">
            <section className="border border-white/10 bg-[#0a0a0a] p-4 sm:p-5">
              <SectionHeader icon={Users} eyebrow="Donors" title="Top supporters" />
              <div className="mt-3">
                {loading ? (
                  <LoadingRows />
                ) : topDonors.length === 0 ? (
                  <EmptyState title="No donor data" body="Support activity will appear here after pool deposits settle." />
                ) : (
                  topDonors.slice(0, 12).map((donor: any, index: number) => (
                    <DonorRow key={`${donor.wallet}-${index}`} donor={donor} rank={index + 1} />
                  ))
                )}
              </div>
            </section>

            <section className="border border-white/10 bg-[#0a0a0a] p-4 sm:p-5">
              <SectionHeader icon={Flame} eyebrow="Momentum" title="Trending pools" />
              <div className="mt-3 space-y-3">
                {loading ? (
                  <LoadingRows />
                ) : trendingPools.length === 0 ? (
                  <EmptyState title="No momentum yet" body="Open pools will be ranked by votes and feedback once available." />
                ) : (
                  trendingPools.slice(0, 6).map((idea: any, index: number) => (
                    <Link
                      key={idea.id}
                      href={ideaHref(idea)}
                      className="block border border-white/10 bg-white/[0.02] p-3 hover:border-[#FFD700]/40 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#FFD700]"
                    >
                      <p className="font-mono text-[11px] uppercase tracking-wider text-gray-500">#{index + 1}</p>
                      <p className="mt-1 line-clamp-2 text-sm font-semibold text-white">{idea.title}</p>
                      <p className="mt-2 font-mono text-[11px] uppercase tracking-wider text-gray-500">
                        {formatNumber(idea.votes)} votes / {formatNumber(idea.feedbackCount)} feedback
                      </p>
                    </Link>
                  ))
                )}
              </div>
            </section>
          </aside>
        </div>

        <p className="mt-6 font-mono text-[11px] uppercase tracking-wider text-gray-500">
          Last synced: {lastSyncedAt ? lastSyncedAt.toLocaleString() : 'Not synced yet'}
        </p>
      </div>
    </main>
  );
}
