'use client';

import type { ComponentType } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  AlertCircle,
  Bookmark,
  ChevronDown,
  Copy,
  ExternalLink,
  Gem,
  Globe,
  Link2,
  Lock,
  Plus,
  RefreshCw,
  Rss,
  Share2,
  Sparkles,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { CreateFeedModal } from '@/components/CreateFeedModal';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';
import { Feed } from '@/lib/types';

const FEED_TYPE_CONFIG = {
  trending: { icon: TrendingUp, label: 'Trending', accent: 'text-[#FFD700]', tone: 'border-[#FFD700]/35 bg-[#FFD700]/10' },
  staff_picks: { icon: Star, label: 'Staff Picks', accent: 'text-[#FFD700]', tone: 'border-[#FFD700]/35 bg-[#FFD700]/10' },
  ai_top: { icon: Sparkles, label: 'AI Top Rated', accent: 'text-cyan-200', tone: 'border-cyan-300/25 bg-cyan-300/10' },
  hidden_gems: { icon: Gem, label: 'Hidden Gems', accent: 'text-emerald-200', tone: 'border-emerald-300/25 bg-emerald-300/10' },
  custom: { icon: Bookmark, label: 'Custom', accent: 'text-white', tone: 'border-white/15 bg-white/[0.04]' },
} as const;

const VISIBILITY_CONFIG = {
  public: { icon: Globe, label: 'Public' },
  unlisted: { icon: Link2, label: 'Unlisted' },
  private: { icon: Lock, label: 'Private' },
} as const;

function getFeedHref(feed: Feed) {
  return `/feeds/${feed.slug || feed.id}`;
}

function SectionHeader({
  title,
  subtitle,
  icon: Icon,
  action,
}: {
  title: string;
  subtitle: string;
  icon: ComponentType<{ className?: string }>;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="ui-eyebrow">{subtitle}</p>
        <h2 className="mt-2 flex items-center gap-2 text-xl font-semibold tracking-tight text-white">
          <Icon className="h-5 w-5 text-[#FFD700]" />
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}

function FeedSkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="min-h-[260px] border border-white/10 bg-white/[0.03] p-5">
          <div className="h-10 w-10 animate-pulse bg-white/10" />
          <div className="mt-6 h-5 w-2/3 animate-pulse bg-white/10" />
          <div className="mt-3 h-4 w-full animate-pulse bg-white/10" />
          <div className="mt-2 h-4 w-3/4 animate-pulse bg-white/10" />
          <div className="mt-8 h-px bg-white/10" />
          <div className="mt-4 flex items-center justify-between">
            <div className="h-4 w-24 animate-pulse bg-white/10" />
            <div className="h-8 w-20 animate-pulse bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="border border-white/10 bg-black/20 px-6 py-12 text-center">
      <Icon className="mx-auto h-9 w-9 text-[#FFD700]" />
      <h3 className="mt-4 text-lg font-semibold text-white">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-400">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

function ShareDropdown({ feed, className = '' }: { feed: Feed; className?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const feedUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}${getFeedHref(feed)}`;

  const handleShareToX = () => {
    const summary = feed.description ? `${feed.description.substring(0, 80)}...` : '';
    const tweetText = `Check out "${feed.name}" feed on Gimme Idea.\n\n${summary}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(feedUrl)}`;
    window.open(twitterUrl, '_blank', 'width=550,height=420,noreferrer');
    setIsOpen(false);
    toast.success('Opening X...');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(feedUrl);
      toast.success('Link copied');
    } catch {
      toast.error('Could not copy link');
    } finally {
      setIsOpen(false);
    }
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        aria-label={`Share ${feed.name}`}
        aria-expanded={isOpen}
        className="flex min-h-[40px] min-w-[40px] items-center justify-center border border-white/10 bg-white/[0.03] text-gray-300 transition hover:border-[#FFD700]/35 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700]"
      >
        <Share2 className="h-4 w-4" />
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-44 border border-white/10 bg-[#101014] shadow-2xl">
          <button
            type="button"
            onClick={handleShareToX}
            className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-gray-300 transition hover:bg-white/[0.06] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#FFD700]"
          >
            <ExternalLink className="h-4 w-4" />
            Share on X
          </button>
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex w-full items-center gap-2 border-t border-white/10 px-4 py-3 text-left text-sm text-gray-300 transition hover:bg-white/[0.06] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#FFD700]"
          >
            <Copy className="h-4 w-4" />
            Copy link
          </button>
        </div>
      ) : null}
    </div>
  );
}

function FeedCard({
  feed,
  onFollow,
  showFollowButton = true,
  showVisibility = false,
  currentUserId,
}: {
  feed: Feed;
  onFollow: (feedId: string, isFollowing: boolean) => void;
  showFollowButton?: boolean;
  showVisibility?: boolean;
  currentUserId?: string;
}) {
  const config = FEED_TYPE_CONFIG[feed.feedType] || FEED_TYPE_CONFIG.custom;
  const visibility = VISIBILITY_CONFIG[feed.visibility] || VISIBILITY_CONFIG.public;
  const Icon = config.icon;
  const VisibilityIcon = visibility.icon;
  const isOwner = Boolean(currentUserId && feed.creatorId === currentUserId);

  return (
    <article className="group relative flex min-h-[300px] flex-col overflow-hidden border border-white/10 bg-white/[0.03] transition hover:border-[#FFD700]/35 hover:bg-white/[0.05]">
      {feed.coverImage ? (
        <Link
          href={getFeedHref(feed)}
          className="relative block aspect-[16/7] overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#FFD700]"
          aria-label={`Open ${feed.name}`}
        >
          <Image src={feed.coverImage} alt="" fill className="object-cover transition duration-500 group-hover:scale-[1.03]" sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 100vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        </Link>
      ) : null}

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className={`flex h-11 w-11 items-center justify-center border ${config.tone}`}>
            <Icon className={`h-5 w-5 ${config.accent}`} />
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            {showVisibility ? (
              <span className="inline-flex min-h-[28px] items-center gap-1 border border-white/10 bg-black/20 px-2 text-[11px] font-medium uppercase tracking-[0.12em] text-gray-400">
                <VisibilityIcon className="h-3 w-3" />
                {visibility.label}
              </span>
            ) : null}
            {feed.isFeatured ? (
              <span className="inline-flex min-h-[28px] items-center border border-[#FFD700]/35 bg-[#FFD700]/10 px-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#FFD700]">
                Featured
              </span>
            ) : null}
          </div>
        </div>

        <Link
          href={getFeedHref(feed)}
          className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FFD700]"
        >
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-gray-500">{config.label}</p>
          <h3 className="mt-2 line-clamp-2 text-lg font-semibold leading-snug text-white transition group-hover:text-[#FFD700]">
            {feed.name}
          </h3>
        </Link>

        {feed.description ? (
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-400">{feed.description}</p>
        ) : (
          <p className="mt-3 text-sm leading-6 text-gray-500">No description yet.</p>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <Bookmark className="h-3.5 w-3.5" />
            {feed.itemsCount ?? 0} ideas
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            {feed.followersCount ?? 0} followers
          </span>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-white/10 pt-4">
          <div className="min-w-0">
            {feed.creator ? (
              <div className="flex min-w-0 items-center gap-2">
                {feed.creator.avatar ? (
                  <Image
                    src={feed.creator.avatar}
                    alt=""
                    width={24}
                    height={24}
                    className="h-6 w-6 border border-white/10 object-cover"
                  />
                ) : (
                  <div className="h-6 w-6 border border-white/10 bg-white/10" />
                )}
                <span className="truncate text-xs text-gray-400">@{feed.creator.username}</span>
              </div>
            ) : (
              <span className="text-xs text-gray-500">Curated feed</span>
            )}
          </div>

          <div className="flex flex-shrink-0 items-center gap-2">
            <ShareDropdown feed={feed} />
            {showFollowButton && !isOwner ? (
              <button
                type="button"
                onClick={() => onFollow(feed.id, Boolean(feed.isFollowing))}
                className={`min-h-[40px] border px-3 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700] ${
                  feed.isFollowing
                    ? 'border-white/10 bg-white/[0.04] text-white hover:border-red-300/40 hover:text-red-200'
                    : 'border-[#FFD700]/35 bg-[#FFD700]/10 text-[#FFD700] hover:bg-[#FFD700]/15'
                }`}
              >
                {feed.isFollowing ? 'Following' : 'Follow'}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

function FeedSection({
  title,
  subtitle,
  icon,
  feeds,
  empty,
  onFollow,
  showFollowButton,
  showVisibility,
  currentUserId,
  action,
}: {
  title: string;
  subtitle: string;
  icon: ComponentType<{ className?: string }>;
  feeds: Feed[];
  empty: React.ReactNode;
  onFollow: (feedId: string, isFollowing: boolean) => void;
  showFollowButton?: boolean;
  showVisibility?: boolean;
  currentUserId?: string;
  action?: React.ReactNode;
}) {
  return (
    <section className="mb-12">
      <SectionHeader title={title} subtitle={subtitle} icon={icon} action={action} />
      {feeds.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {feeds.map((feed) => (
            <FeedCard
              key={feed.id}
              feed={feed}
              onFollow={onFollow}
              showFollowButton={showFollowButton}
              showVisibility={showVisibility}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      ) : (
        empty
      )}
    </section>
  );
}

export default function FeedsPage() {
  const { user } = useAuth();

  const [discoverFeeds, setDiscoverFeeds] = useState<Feed[]>([]);
  const [allPublicFeeds, setAllPublicFeeds] = useState<Feed[]>([]);
  const [myFeeds, setMyFeeds] = useState<Feed[]>([]);
  const [followingFeeds, setFollowingFeeds] = useState<Feed[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAllPublicFeeds, setShowAllPublicFeeds] = useState(false);

  const loadFeeds = async () => {
    setIsLoading(true);
    setError('');

    try {
      const requests: Promise<any>[] = [apiClient.getFeeds({ limit: 50 })];

      if (user) {
        requests.push(apiClient.getMyFeeds(), apiClient.getFollowingFeeds());
      }

      const results = await Promise.all(requests);
      const publicRes = results[0];

      if (!publicRes.success || !Array.isArray(publicRes.data)) {
        throw new Error(publicRes.error || 'Could not load public feeds.');
      }

      setAllPublicFeeds(publicRes.data);
      setDiscoverFeeds(publicRes.data.slice(0, 3));

      if (user) {
        const myRes = results[1];
        const followingRes = results[2];

        setMyFeeds(myRes?.success && Array.isArray(myRes.data) ? myRes.data : []);
        setFollowingFeeds(followingRes?.success && Array.isArray(followingRes.data) ? followingRes.data : []);
      } else {
        setMyFeeds([]);
        setFollowingFeeds([]);
      }
    } catch (requestError) {
      console.error('Failed to load feeds:', requestError);
      setError(requestError instanceof Error ? requestError.message : 'Failed to load feeds.');
      setDiscoverFeeds([]);
      setAllPublicFeeds([]);
      setMyFeeds([]);
      setFollowingFeeds([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFeeds();
  }, [user]);

  const visibleDiscoverFeeds = useMemo(
    () => (showAllPublicFeeds ? allPublicFeeds : discoverFeeds),
    [allPublicFeeds, discoverFeeds, showAllPublicFeeds]
  );

  const handleFollowFeed = async (feedId: string, isFollowing: boolean) => {
    if (!user) {
      toast.error('Please login to follow feeds');
      return;
    }

    try {
      if (isFollowing) {
        await apiClient.unfollowFeed(feedId);
        toast.success('Unfollowed feed');
      } else {
        await apiClient.followFeed(feedId);
        toast.success('Following feed');
      }
      await loadFeeds();
    } catch {
      toast.error('Failed to update follow status');
    }
  };

  const handleFeedCreated = (newFeed: Feed) => {
    setMyFeeds((previous) => [newFeed, ...previous]);

    if (newFeed.visibility === 'public') {
      setAllPublicFeeds((previous) => [newFeed, ...previous]);
      setDiscoverFeeds((previous) => [newFeed, ...previous].slice(0, 3));
    }

    setShowCreateModal(false);
    toast.success('Feed created successfully');
  };

  return (
    <main className="relative min-h-screen pb-20 text-gray-300">

      <div className="mx-auto max-w-7xl px-4 pt-28 sm:px-6 lg:px-8">
        <header className="mb-10 flex flex-col gap-5 border-b border-white/10 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="ui-eyebrow">Curated collections</p>
            <h1 className="mt-4 flex items-center gap-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              <Rss className="h-8 w-8 text-[#FFD700]" />
              GmiFeeds
            </h1>
            <p className="mt-3 text-base leading-7 text-gray-400">
              Follow hand-picked idea streams, track themes, and build your own research feed.
            </p>
          </div>

          {user ? (
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="btn-primary w-fit"
            >
              <Plus className="h-4 w-4" />
              Create Feed
            </button>
          ) : null}
        </header>

        {isLoading ? (
          <FeedSkeletonGrid />
        ) : error ? (
          <EmptyState
            icon={AlertCircle}
            title="Feeds could not load"
            description={error}
            action={
              <button type="button" onClick={loadFeeds} className="btn-ghost mx-auto">
                <RefreshCw className="h-4 w-4" />
                Try again
              </button>
            }
          />
        ) : (
          <>
            <FeedSection
              title="Discover New Feeds"
              subtitle="Public signal"
              icon={Star}
              feeds={visibleDiscoverFeeds}
              onFollow={handleFollowFeed}
              currentUserId={user?.id}
              empty={
                <EmptyState
                  icon={Rss}
                  title="No public feeds yet"
                  description="Create the first public feed to make a curated collection visible here."
                  action={
                    user ? (
                      <button type="button" onClick={() => setShowCreateModal(true)} className="btn-primary mx-auto">
                        <Plus className="h-4 w-4" />
                        Create Feed
                      </button>
                    ) : null
                  }
                />
              }
              action={
                allPublicFeeds.length > 3 ? (
                  <button
                    type="button"
                    onClick={() => setShowAllPublicFeeds((value) => !value)}
                    className="btn-ghost min-h-[40px] px-3 py-2 text-xs"
                  >
                    {showAllPublicFeeds ? 'Show less' : `More (${allPublicFeeds.length - 3})`}
                    <ChevronDown className={`h-4 w-4 transition ${showAllPublicFeeds ? 'rotate-180' : ''}`} />
                  </button>
                ) : null
              }
            />

            {user ? (
              <>
                <FeedSection
                  title="My Feeds"
                  subtitle="Owned collections"
                  icon={Bookmark}
                  feeds={myFeeds}
                  onFollow={handleFollowFeed}
                  showFollowButton={false}
                  showVisibility
                  currentUserId={user.id}
                  empty={
                    <EmptyState
                      icon={Bookmark}
                      title="You have not created a feed"
                      description="Start a collection for ideas you want to track, share, or revisit."
                      action={
                        <button type="button" onClick={() => setShowCreateModal(true)} className="btn-primary mx-auto">
                          <Plus className="h-4 w-4" />
                          Create Feed
                        </button>
                      }
                    />
                  }
                />

                <FeedSection
                  title="Following"
                  subtitle="Saved streams"
                  icon={Users}
                  feeds={followingFeeds}
                  onFollow={handleFollowFeed}
                  currentUserId={user.id}
                  empty={
                    <EmptyState
                      icon={Users}
                      title="No followed feeds"
                      description="Follow public feeds from the discovery section to keep them here."
                    />
                  }
                />
              </>
            ) : (
              <EmptyState
                icon={Lock}
                title="Sign in to create and follow feeds"
                description="Public feeds are visible to everyone. Creating, following, and sharing collections requires an account."
                action={
                  <Link href="/" className="btn-ghost mx-auto">
                    Explore ideas
                  </Link>
                }
              />
            )}
          </>
        )}
      </div>

      <CreateFeedModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handleFeedCreated}
      />
    </main>
  );
}
