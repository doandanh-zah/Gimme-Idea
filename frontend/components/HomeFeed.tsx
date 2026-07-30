'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Bot,
  Clock3,
  Compass,
  Filter,
  Flame,
  LayoutGrid,
  Lightbulb,
  MessageCircle,
  Plus,
  Radio,
  RefreshCcw,
  Rss,
  Search,
  ThumbsUp,
  Trophy,
  Wallet,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { Project, Feed } from '@/lib/types';
import { createUniqueSlug } from '@/lib/slug-utils';
import { useAppStore } from '@/lib/store';

const NAV_SHORTCUTS = [
  { label: 'Idea board', detail: 'Full queue', href: '/idea', icon: LayoutGrid },
  { label: 'GmiFeeds', detail: 'Curated topics', href: '/feeds', icon: Rss },
  { label: 'Leaderboard', detail: 'Top builders', href: '/leaderboard', icon: Trophy },
  { label: 'Agents', detail: 'API workflows', href: '/agents', icon: Bot },
] as const;

const REVIEW_LENSES = [
  {
    label: 'No feedback yet',
    hint: 'Useful for first comments',
    tone: 'text-[#FFD700]',
  },
  {
    label: 'High votes, low replies',
    hint: 'Needs objections',
    tone: 'text-[#14F195]',
  },
  {
    label: 'Fresh this week',
    hint: 'Good scan window',
    tone: 'text-[#C4B5FD]',
  },
] as const;

const SECONDARY_ACTIONS = [
  { label: 'Read docs', href: '/docs', icon: BookOpen },
  { label: 'View projects', href: '/projects', icon: Compass },
  { label: 'Support treasury', href: '/donate', icon: Wallet },
] as const;

function getIdeaHref(project: Project) {
  return `/idea/${project.slug || createUniqueSlug(project.title, project.id)}`;
}

function formatDate(value?: string) {
  if (!value) return 'Unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date);
}

function compactNumber(value: number) {
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

function LoadingBlock({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse border border-white/10 bg-white/[0.04] ${className}`} />;
}

function DataError({
  title,
  body,
  onRetry,
}: {
  title: string;
  body: string;
  onRetry: () => void;
}) {
  return (
    <div className="border border-white/10 bg-[#0a0a0a] p-5">
      <div className="mb-4 flex h-10 w-10 items-center justify-center border border-white/10 text-[#FFD700]">
        <AlertTriangle className="h-5 w-5" aria-hidden="true" />
      </div>
      <h3 className="font-display text-xl font-bold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-gray-500">{body}</p>
      <button type="button" onClick={onRetry} className="btn-ghost mt-5 !min-h-[40px] !px-3">
        <RefreshCcw className="h-4 w-4" aria-hidden="true" />
        Retry
      </button>
    </div>
  );
}

function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action: React.ReactNode;
}) {
  return (
    <div className="border border-dashed border-white/10 bg-[#0a0a0a] p-6 text-center">
      <Lightbulb className="mx-auto mb-3 h-8 w-8 text-[#FFD700]" aria-hidden="true" />
      <h3 className="font-display text-lg font-bold text-white">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">{body}</p>
      <div className="mt-5 flex justify-center">{action}</div>
    </div>
  );
}

export default function HomeFeed() {
  const openSubmitModal = useAppStore((s) => s.openSubmitModal);
  const prefersReducedMotion = useReducedMotion();

  const ideasQuery = useQuery({
    queryKey: queryKeys.projects.list({ surface: 'home', type: 'idea', limit: 8 }),
    staleTime: 60_000,
    queryFn: async () => {
      const response = await apiClient.getProjects({ type: 'idea', limit: 8, offset: 0 });
      if (!response.success || !Array.isArray(response.data)) {
        throw new Error(response.error || 'Could not load ideas.');
      }
      return response.data as Project[];
    },
  });

  const feedsQuery = useQuery({
    queryKey: queryKeys.feeds.public(4),
    staleTime: 90_000,
    queryFn: async () => {
      const response = await apiClient.getFeeds({ limit: 4 });
      if (!response.success || !Array.isArray(response.data)) {
        throw new Error(response.error || 'Could not load feeds.');
      }
      return response.data as Feed[];
    },
  });

  const velocityQuery = useQuery({
    queryKey: queryKeys.ideaVelocity,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const response = await apiClient.getIdeaVelocityStats();
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Could not load velocity.');
      }
      return response.data;
    },
  });

  const ideas = ideasQuery.data || [];
  const feeds = feedsQuery.data || [];

  const dashboardStats = useMemo(() => {
    const totalVotes = ideas.reduce((sum, idea) => sum + (idea.votes || 0), 0);
    const totalFeedback = ideas.reduce((sum, idea) => sum + (idea.feedbackCount || 0), 0);
    const silentIdeas = ideas.filter((idea) => (idea.feedbackCount || 0) === 0).length;

    return [
      {
        label: 'Ideas loaded',
        value: ideasQuery.isLoading ? '-' : compactNumber(ideas.length),
        detail: `${compactNumber(totalVotes)} votes in view`,
        icon: Lightbulb,
      },
      {
        label: 'Feedback gap',
        value: ideasQuery.isLoading ? '-' : compactNumber(silentIdeas),
        detail: 'Need first reply',
        icon: MessageCircle,
      },
      {
        label: 'Week activity',
        value: velocityQuery.isLoading ? '-' : compactNumber(velocityQuery.data?.totalFeedback || 0),
        detail: `${compactNumber(velocityQuery.data?.totalIdeas || 0)} ideas this week`,
        icon: Radio,
      },
    ];
  }, [ideas, ideasQuery.isLoading, velocityQuery.data, velocityQuery.isLoading]);

  const attentionIdeas = useMemo(() => {
    return [...ideas]
      .sort((a, b) => {
        const aScore = (a.votes || 0) * 2 - (a.feedbackCount || 0);
        const bScore = (b.votes || 0) * 2 - (b.feedbackCount || 0);
        return bScore - aScore;
      })
      .slice(0, 3);
  }, [ideas]);

  const recentIdeas = ideas.slice(0, 5);

  const fade = (delay = 0) =>
    prefersReducedMotion
      ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
      : {
          initial: { opacity: 0, y: 12 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.35, delay, ease: 'easeOut' as const },
        };

  const refreshAll = () => {
    void ideasQuery.refetch();
    void feedsQuery.refetch();
    void velocityQuery.refetch();
  };

  const hasDataError = ideasQuery.isError || feedsQuery.isError || velocityQuery.isError;

  return (
    <main className="relative min-h-screen pb-28 md:pb-16">
      <div className="page-shell page-top">
        <motion.header {...fade(0)} className="mb-8 border-b border-white/10 pb-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="ui-eyebrow mb-3">Home command center</div>
              <h1 className="font-display text-3xl font-bold leading-tight text-white sm:text-5xl">
                Decide what deserves attention today.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-400 sm:text-base">
                A work surface for scanning live ideas, spotting feedback gaps, jumping into feeds,
                and starting the next useful action.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <button type="button" onClick={() => openSubmitModal('idea')} className="btn-primary">
                <Plus className="h-4 w-4" aria-hidden="true" />
                New idea
              </button>
              <button type="button" onClick={refreshAll} className="btn-ghost">
                <RefreshCcw className="h-4 w-4" aria-hidden="true" />
                Refresh
              </button>
            </div>
          </div>
        </motion.header>

        <motion.section {...fade(0.05)} className="mb-8 grid gap-3 md:grid-cols-3">
          {dashboardStats.map((metric) => {
            const Icon = metric.icon;
            return (
              <div key={metric.label} className="border border-white/10 bg-[#0a0a0a] p-4">
                <div className="mb-5 flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase text-gray-500">
                    {metric.label}
                  </span>
                  <Icon className="h-4 w-4 text-[#FFD700]" aria-hidden="true" />
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-3xl font-bold tabular-nums text-white">
                    {metric.value}
                  </span>
                  <span className="text-xs text-gray-500">{metric.detail}</span>
                </div>
              </div>
            );
          })}
        </motion.section>

        {hasDataError && (
          <motion.section {...fade(0.06)} className="mb-8">
            <DataError
              title="Some live panels did not load"
              body="The page still works, but one or more data services are unavailable. Retry when the backend catches up."
              onRetry={refreshAll}
            />
          </motion.section>
        )}

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-8">
            <motion.section {...fade(0.1)}>
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <div className="ui-eyebrow mb-2">Review queue</div>
                  <h2 className="font-display text-2xl font-bold text-white">Ideas needing signal</h2>
                </div>
                <Link href="/idea" className="btn-ghost !min-h-[40px] !px-3 !text-xs">
                  Open board
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>

              {ideasQuery.isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <LoadingBlock key={index} className="h-28" />
                  ))}
                </div>
              ) : attentionIdeas.length > 0 ? (
                <div className="border-t border-white/10">
                  {attentionIdeas.map((idea) => (
                    <Link
                      key={idea.id}
                      href={getIdeaHref(idea)}
                      className="group grid gap-4 border-b border-white/10 py-5 transition-colors duration-150 hover:bg-white/[0.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700] sm:grid-cols-[1fr_auto]"
                    >
                      <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className="border border-white/10 px-2 py-1 font-mono text-[10px] uppercase text-[#FFD700]">
                            {idea.category}
                          </span>
                          <span className="font-mono text-[10px] uppercase text-gray-600">
                            {formatDate(idea.createdAt)}
                          </span>
                        </div>
                        <h3 className="line-clamp-2 font-display text-xl font-bold text-white transition-colors duration-150 group-hover:text-[#FFD700]">
                          {idea.title}
                        </h3>
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-500">
                          {idea.problem || idea.description || idea.solution || 'No problem statement yet.'}
                        </p>
                      </div>
                      <div className="grid grid-cols-3 gap-2 sm:w-[220px]">
                        <div className="border border-white/10 bg-[#0a0a0a] p-3">
                          <ThumbsUp className="mb-3 h-4 w-4 text-gray-500" aria-hidden="true" />
                          <div className="font-mono text-lg font-bold tabular-nums text-white">
                            {idea.votes || 0}
                          </div>
                          <div className="font-mono text-[10px] uppercase text-gray-600">Votes</div>
                        </div>
                        <div className="border border-white/10 bg-[#0a0a0a] p-3">
                          <MessageCircle className="mb-3 h-4 w-4 text-gray-500" aria-hidden="true" />
                          <div className="font-mono text-lg font-bold tabular-nums text-white">
                            {idea.feedbackCount || 0}
                          </div>
                          <div className="font-mono text-[10px] uppercase text-gray-600">Replies</div>
                        </div>
                        <div className="border border-white/10 bg-[#0a0a0a] p-3">
                          <Flame className="mb-3 h-4 w-4 text-[#FFD700]" aria-hidden="true" />
                          <div className="font-mono text-lg font-bold tabular-nums text-white">
                            {(idea.votes || 0) + (idea.feedbackCount || 0)}
                          </div>
                          <div className="font-mono text-[10px] uppercase text-gray-600">Heat</div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No ideas in the queue yet"
                  body="Start with one raw concept. Home becomes useful once there is something to review."
                  action={
                    <button
                      type="button"
                      onClick={() => openSubmitModal('idea')}
                      className="btn-primary"
                    >
                      Submit idea
                    </button>
                  }
                />
              )}
            </motion.section>

            <motion.section {...fade(0.16)}>
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <div className="ui-eyebrow mb-2">Fresh scan</div>
                  <h2 className="font-display text-2xl font-bold text-white">Latest ideas</h2>
                </div>
                <Link href="/idea" className="font-mono text-[11px] uppercase text-[#FFD700]">
                  View all
                </Link>
              </div>

              {ideasQuery.isLoading ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <LoadingBlock key={index} className="h-36" />
                  ))}
                </div>
              ) : recentIdeas.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {recentIdeas.map((idea) => (
                    <Link
                      key={idea.id}
                      href={getIdeaHref(idea)}
                      className="group min-h-[154px] border border-white/10 bg-[#0a0a0a] p-4 transition-colors duration-150 hover:border-[#FFD700]/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700]"
                    >
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <span className="font-mono text-[10px] uppercase text-gray-500">
                          {idea.stage || 'Idea'} / {idea.category}
                        </span>
                        <ArrowUpRight className="h-4 w-4 shrink-0 text-gray-600 transition-colors duration-150 group-hover:text-[#FFD700]" />
                      </div>
                      <h3 className="line-clamp-2 font-display text-lg font-bold text-white group-hover:text-[#FFD700]">
                        {idea.title}
                      </h3>
                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-gray-500">
                        {idea.description || idea.problem || idea.solution || 'Open idea details to add more context.'}
                      </p>
                      <div className="mt-4 flex items-center gap-4 border-t border-white/10 pt-3 font-mono text-[10px] uppercase text-gray-500">
                        <span>{idea.votes || 0} votes</span>
                        <span>{idea.feedbackCount || 0} replies</span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No recent ideas"
                  body="There are no public ideas to scan yet. Create the first one or check curated feeds."
                  action={
                    <Link href="/feeds" className="btn-ghost">
                      Browse feeds
                    </Link>
                  }
                />
              )}
            </motion.section>
          </div>

          <aside className="space-y-6">
            <motion.section {...fade(0.12)} className="border border-white/10 bg-[#0a0a0a]">
              <div className="border-b border-white/10 p-4">
                <div className="ui-eyebrow mb-3">Shortcuts</div>
                <h2 className="font-display text-xl font-bold text-white">Go straight to work</h2>
              </div>
              <div className="divide-y divide-white/10">
                {NAV_SHORTCUTS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="group grid min-h-[66px] grid-cols-[40px_1fr_auto] items-center gap-3 px-4 transition-colors duration-150 hover:bg-white/[0.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#FFD700]"
                    >
                      <span className="flex h-10 w-10 items-center justify-center border border-white/10 text-[#FFD700]">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span className="min-w-0">
                        <span className="block font-mono text-[11px] font-semibold uppercase text-white">
                          {item.label}
                        </span>
                        <span className="mt-1 block truncate text-xs text-gray-500">{item.detail}</span>
                      </span>
                      <ArrowRight className="h-4 w-4 text-gray-600 transition-transform duration-150 group-hover:translate-x-1 group-hover:text-[#FFD700]" />
                    </Link>
                  );
                })}
              </div>
            </motion.section>

            <motion.section {...fade(0.18)} className="border border-white/10 bg-[#0a0a0a] p-4">
              <div className="ui-eyebrow mb-3">Review lenses</div>
              <div className="space-y-3">
                {REVIEW_LENSES.map((lens) => (
                  <div key={lens.label} className="flex min-h-[54px] items-center justify-between gap-4 border border-white/10 px-3">
                    <div>
                      <div className="font-mono text-[11px] font-semibold uppercase text-white">
                        {lens.label}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">{lens.hint}</div>
                    </div>
                    <Filter className={`h-4 w-4 ${lens.tone}`} aria-hidden="true" />
                  </div>
                ))}
              </div>
            </motion.section>

            <motion.section {...fade(0.22)} className="border border-white/10 bg-[#0a0a0a] p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <div className="ui-eyebrow mb-2">Feeds</div>
                  <h2 className="font-display text-xl font-bold text-white">Active collections</h2>
                </div>
                <Link href="/feeds" className="text-gray-600 hover:text-[#FFD700]" aria-label="Open feeds">
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>

              {feedsQuery.isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <LoadingBlock key={index} className="h-16" />
                  ))}
                </div>
              ) : feeds.length > 0 ? (
                <div className="space-y-2">
                  {feeds.map((feed) => (
                    <Link
                      key={feed.id}
                      href={`/feeds/${feed.slug || feed.id}`}
                      className="group block border border-white/10 px-3 py-3 transition-colors duration-150 hover:border-[#FFD700]/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700]"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="truncate font-mono text-[11px] font-semibold uppercase text-white">
                          {feed.name}
                        </span>
                        <span className="font-mono text-[10px] text-gray-600">
                          {compactNumber(feed.itemsCount || 0)}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-1 text-xs text-gray-500">
                        {feed.description || 'Curated idea collection'}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No feeds yet"
                  body="Use feeds to group ideas by market, hackathon, or research theme."
                  action={
                    <Link href="/feeds" className="btn-ghost !min-h-[40px] !px-3">
                      Create or browse
                    </Link>
                  }
                />
              )}
            </motion.section>

            <motion.section {...fade(0.28)} className="border border-white/10 bg-[#0a0a0a] p-4">
              <div className="ui-eyebrow mb-3">More tools</div>
              <div className="grid gap-2">
                {SECONDARY_ACTIONS.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={action.href}
                      href={action.href}
                      className="group flex min-h-[44px] items-center justify-between gap-3 border border-white/10 px-3 text-sm text-gray-300 transition-colors duration-150 hover:border-white/25 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700]"
                    >
                      <span className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-gray-500 group-hover:text-[#FFD700]" aria-hidden="true" />
                        {action.label}
                      </span>
                      <ArrowRight className="h-4 w-4 text-gray-600" />
                    </Link>
                  );
                })}
              </div>
            </motion.section>

            <motion.section
              {...fade(0.32)}
              className="border border-white/10 border-l-2 border-l-[#FFD700] bg-[#0a0a0a] p-5"
            >
              <Clock3 className="mb-4 h-5 w-5 text-[#FFD700]" aria-hidden="true" />
              <h2 className="font-display text-xl font-bold text-white">Fifteen-minute pass</h2>
              <p className="mt-2 text-sm leading-6 text-gray-500">
                Pick one idea with votes but low replies. Add the first hard objection or the
                clearest customer question.
              </p>
              <Link href="/idea" className="btn-ghost mt-5 w-full">
                Start review
              </Link>
            </motion.section>
          </aside>
        </div>

        <motion.section {...fade(0.34)} className="mt-10 border border-white/10 bg-[#0a0a0a] p-5 sm:p-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="ui-eyebrow mb-3">Contribution brief</div>
              <h2 className="font-display text-2xl font-bold text-white">
                Leave one piece of evidence on the strongest idea.
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
                A useful reply names the customer, the risk, or the distribution wedge. That is
                the signal other builders can actually reuse.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/idea" className="btn-ghost">
                <Search className="h-4 w-4" aria-hidden="true" />
                Scan ideas
              </Link>
              <button type="button" onClick={() => openSubmitModal('idea')} className="btn-primary">
                Submit idea
              </button>
            </div>
          </div>
        </motion.section>
      </div>
    </main>
  );
}
