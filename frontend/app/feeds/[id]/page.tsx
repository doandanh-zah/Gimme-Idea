'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  Bookmark,
  Copy,
  Edit2,
  ExternalLink,
  Gem,
  Globe,
  Link as LinkIcon,
  Loader2,
  Lock,
  MoreHorizontal,
  RefreshCw,
  Share2,
  ShieldOff,
  Sparkles,
  Star,
  Trash2,
  TrendingUp,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { EditFeedModal } from '@/components/EditFeedModal';
import { ProjectCard } from '@/components/ProjectCard';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';
import { createUsernameSlug } from '@/lib/slug-utils';
import { Feed, FeedItem, Project } from '@/lib/types';

const FEED_TYPE_CONFIG = {
  trending: { icon: TrendingUp, label: 'Trending', tone: 'border-[#FFD700]/35 bg-[#FFD700]/10 text-[#FFD700]' },
  staff_picks: { icon: Star, label: 'Staff Picks', tone: 'border-[#FFD700]/35 bg-[#FFD700]/10 text-[#FFD700]' },
  ai_top: { icon: Sparkles, label: 'AI Top Rated', tone: 'border-cyan-300/25 bg-cyan-300/10 text-cyan-200' },
  hidden_gems: { icon: Gem, label: 'Hidden Gems', tone: 'border-emerald-300/25 bg-emerald-300/10 text-emerald-200' },
  custom: { icon: Bookmark, label: 'Custom', tone: 'border-white/15 bg-white/[0.04] text-white' },
} as const;

const VISIBILITY_CONFIG = {
  public: { icon: Globe, label: 'Public', tone: 'border-emerald-300/25 bg-emerald-300/10 text-emerald-200' },
  unlisted: { icon: LinkIcon, label: 'Unlisted', tone: 'border-cyan-300/25 bg-cyan-300/10 text-cyan-200' },
  private: { icon: Lock, label: 'Private', tone: 'border-white/15 bg-white/[0.04] text-gray-300' },
} as const;

function FeedDetailSkeleton() {
  return (
    <main className="min-h-screen px-4 pb-20 pt-28 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="h-10 w-36 animate-pulse bg-white/10" />
        <div className="mt-6 border border-white/10 bg-white/[0.03] p-6">
          <div className="h-14 w-14 animate-pulse bg-white/10" />
          <div className="mt-6 h-8 w-2/3 animate-pulse bg-white/10" />
          <div className="mt-4 h-4 w-full max-w-xl animate-pulse bg-white/10" />
          <div className="mt-2 h-4 w-3/4 animate-pulse bg-white/10" />
        </div>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="min-h-[260px] animate-pulse border border-white/10 bg-white/[0.03]" />
          ))}
        </div>
      </div>
    </main>
  );
}

export default function FeedDetailPage() {
  const router = useRouter();
  const params = useParams();
  const feedId = String(params.id);
  const { user } = useAuth();

  const [feed, setFeed] = useState<Feed | null>(null);
  const [items, setItems] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const shareMenuRef = useRef<HTMLDivElement>(null);
  const ownerMenuRef = useRef<HTMLDivElement>(null);

  const loadFeed = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [feedRes, itemsRes] = await Promise.all([
        apiClient.getFeed(feedId),
        apiClient.getFeedItems(feedId),
      ]);

      if (!feedRes.success || !feedRes.data) {
        throw new Error(feedRes.error || 'This feed may be private or unavailable.');
      }

      setFeed(feedRes.data);
      setIsFollowing(Boolean(feedRes.data.isFollowing));
      setItems(itemsRes.success && Array.isArray(itemsRes.data) ? itemsRes.data : []);
    } catch (requestError) {
      console.error('Failed to load feed:', requestError);
      setError(requestError instanceof Error ? requestError.message : 'Failed to load feed.');
      setFeed(null);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [feedId]);

  useEffect(() => {
    if (feedId) {
      void loadFeed();
    }
  }, [feedId, user?.id, loadFeed]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
        setShowShareMenu(false);
      }
      if (ownerMenuRef.current && !ownerMenuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowShareMenu(false);
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleFollow = async () => {
    if (!user || !feed) {
      toast.error('Please login to follow feeds');
      return;
    }

    try {
      if (isFollowing) {
        await apiClient.unfollowFeed(feed.id);
        setIsFollowing(false);
        setFeed((previous) => previous ? { ...previous, followersCount: Math.max(0, previous.followersCount - 1) } : null);
        toast.success('Unfollowed feed');
      } else {
        await apiClient.followFeed(feed.id);
        setIsFollowing(true);
        setFeed((previous) => previous ? { ...previous, followersCount: previous.followersCount + 1 } : null);
        toast.success('Following feed');
      }
    } catch {
      toast.error('Failed to update follow status');
    }
  };

  const handleShareToX = () => {
    if (!feed) return;
    const summary = feed.description ? `${feed.description.substring(0, 80)}...` : '';
    const tweetText = `Check out "${feed.name}" feed on Gimme Idea.\n\n${summary}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(window.location.href)}`;
    window.open(twitterUrl, '_blank', 'width=550,height=420,noreferrer');
    setShowShareMenu(false);
    toast.success('Opening X...');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied');
    } catch {
      toast.error('Failed to copy link');
    } finally {
      setShowShareMenu(false);
    }
  };

  const handleDeleteFeed = async () => {
    if (!feed) return;

    setIsDeleting(true);
    try {
      const response = await apiClient.deleteFeed(feed.id);
      if (response.success) {
        toast.success('Feed deleted');
        router.push('/feeds');
      } else {
        toast.error(response.error || 'Failed to delete feed');
      }
    } catch {
      toast.error('Failed to delete feed');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!feed) return;
    try {
      const response = await apiClient.removeItemFromFeed(feed.id, itemId);
      if (response.success) {
        setItems((previous) => previous.filter((item) => item.id !== itemId));
        setFeed((previous) => previous ? { ...previous, itemsCount: Math.max(0, previous.itemsCount - 1) } : null);
        toast.success('Idea removed from feed');
      } else {
        toast.error(response.error || 'Failed to remove idea');
      }
    } catch {
      toast.error('Failed to remove idea');
    }
  };

  if (isLoading) {
    return <FeedDetailSkeleton />;
  }

  if (!feed) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-20 text-gray-300 sm:px-6">
        <section className="w-full max-w-lg border border-white/10 bg-white/[0.03] p-6 text-center">
          <ShieldOff className="mx-auto h-12 w-12 text-red-300" />
          <h1 className="mt-4 text-2xl font-semibold text-white">Feed not available</h1>
          <p className="mt-2 text-sm leading-6 text-gray-400">{error || 'This feed may be private or does not exist.'}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <button type="button" onClick={() => router.push('/feeds')} className="btn-ghost">
              <ArrowLeft className="h-4 w-4" />
              Back to GmiFeeds
            </button>
            <button type="button" onClick={() => void loadFeed()} className="btn-primary">
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        </section>
      </main>
    );
  }

  const isOwner = Boolean(user && feed.creatorId === user.id);
  const config = FEED_TYPE_CONFIG[feed.feedType] || FEED_TYPE_CONFIG.custom;
  const visibility = VISIBILITY_CONFIG[feed.visibility] || VISIBILITY_CONFIG.public;
  const IconComponent = config.icon;
  const VisibilityIcon = visibility.icon;

  return (
    <main className="min-h-screen px-4 pb-20 pt-28 text-gray-300 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <button
          type="button"
          onClick={() => router.push('/feeds')}
          className="mb-8 inline-flex min-h-[40px] items-center gap-2 text-sm text-gray-400 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to GmiFeeds
        </button>

        <section className="overflow-hidden border border-white/10 bg-white/[0.03]">
          {feed.coverImage ? (
            <div className="relative aspect-[3/1] min-h-[180px] w-full">
              <Image
                src={feed.coverImage}
                alt=""
                fill
                className="object-cover"
                sizes="(min-width: 1280px) 1280px, 100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
            </div>
          ) : null}

          <div className="p-5 sm:p-7">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <div className={`flex h-14 w-14 items-center justify-center border ${config.tone}`}>
                    <IconComponent className="h-7 w-7" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-gray-500">{config.label}</p>
                    <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{feed.name}</h1>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className={`inline-flex min-h-[28px] items-center gap-1 border px-2 text-[11px] font-semibold uppercase tracking-[0.12em] ${visibility.tone}`}>
                    <VisibilityIcon className="h-3 w-3" />
                    {visibility.label}
                  </span>
                  {feed.isFeatured ? (
                    <span className="inline-flex min-h-[28px] items-center border border-[#FFD700]/35 bg-[#FFD700]/10 px-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#FFD700]">
                      Featured
                    </span>
                  ) : null}
                </div>

                {feed.description ? (
                  <p className="mt-5 max-w-3xl text-base leading-7 text-gray-400">{feed.description}</p>
                ) : null}

                <div className="mt-5 flex flex-wrap gap-5 text-sm text-gray-400">
                  <span className="inline-flex items-center gap-2">
                    <Bookmark className="h-4 w-4 text-[#FFD700]" />
                    <span className="font-semibold text-white">{feed.itemsCount}</span> ideas
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Users className="h-4 w-4 text-[#FFD700]" />
                    <span className="font-semibold text-white">{feed.followersCount}</span> followers
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                {!isOwner ? (
                  <button
                    type="button"
                    onClick={handleFollow}
                    className={isFollowing ? 'btn-ghost' : 'btn-primary'}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                ) : null}

                <div ref={shareMenuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setShowShareMenu((value) => !value)}
                    aria-label={`Share ${feed.name}`}
                    aria-expanded={showShareMenu}
                    className="flex min-h-[44px] min-w-[44px] items-center justify-center border border-white/10 bg-white/[0.03] text-gray-300 transition hover:border-[#FFD700]/35 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700]"
                  >
                    <Share2 className="h-5 w-5" />
                  </button>

                  {showShareMenu ? (
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

                {isOwner ? (
                  <div ref={ownerMenuRef} className="relative">
                    <button
                      type="button"
                      onClick={() => setShowMenu((value) => !value)}
                      aria-label="Open feed menu"
                      aria-expanded={showMenu}
                      className="flex min-h-[44px] min-w-[44px] items-center justify-center border border-white/10 bg-white/[0.03] text-gray-300 transition hover:border-[#FFD700]/35 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700]"
                    >
                      <MoreHorizontal className="h-5 w-5" />
                    </button>

                    {showMenu ? (
                      <div className="absolute right-0 top-full z-50 mt-2 w-48 border border-white/10 bg-[#101014] shadow-2xl">
                        <button
                          type="button"
                          onClick={() => {
                            setShowMenu(false);
                            setShowEditModal(true);
                          }}
                          className="flex w-full items-center gap-2 px-4 py-3 text-sm text-gray-300 transition hover:bg-white/[0.06] hover:text-white"
                        >
                          <Edit2 className="h-4 w-4" />
                          Edit Feed
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowMenu(false);
                            setShowDeleteModal(true);
                          }}
                          className="flex w-full items-center gap-2 border-t border-white/10 px-4 py-3 text-sm text-red-200 transition hover:bg-red-400/10"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete Feed
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>

            {feed.creator ? (
              <div className="mt-6 flex items-center gap-2 border-t border-white/10 pt-5">
                <span className="text-xs text-gray-500">Created by</span>
                <button
                  type="button"
                  onClick={() => router.push(`/profile/${createUsernameSlug(feed.creator?.username || '')}`)}
                  className="inline-flex min-h-[40px] items-center gap-2 text-sm text-[#FFD700] transition hover:text-[#FDB931] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700]"
                >
                  {feed.creator.avatar ? (
                    <Image
                      src={feed.creator.avatar}
                      alt=""
                      width={24}
                      height={24}
                      className="h-6 w-6 border border-white/10 object-cover"
                    />
                  ) : (
                    <span className="h-6 w-6 border border-white/10 bg-white/10" />
                  )}
                  @{feed.creator.username}
                </button>
              </div>
            ) : null}
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-4 flex flex-col gap-2 border-b border-white/10 pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="ui-eyebrow">Feed items</p>
              <h2 className="mt-2 text-xl font-semibold text-white">Ideas in this feed ({feed.itemsCount})</h2>
            </div>
          </div>

          {items.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <div key={item.id} className="relative">
                  {item.project ? (
                    <ProjectCard
                      project={{
                        ...item.project,
                        type: item.project.type || 'idea',
                      } as Project}
                    />
                  ) : null}

                  {(isOwner || (user && item.addedBy === user.id)) ? (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      aria-label="Remove idea from feed"
                      className="absolute right-2 top-2 flex min-h-[40px] min-w-[40px] items-center justify-center border border-red-400/30 bg-red-400/80 text-white transition hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}

                  {item.note ? (
                    <div className="mt-2 border border-white/10 bg-white/[0.03] px-3 py-2">
                      <p className="text-xs italic text-gray-400">&quot;{item.note}&quot;</p>
                      {item.addedByUser ? (
                        <p className="mt-1 text-[11px] text-gray-500">@{item.addedByUser.username}</p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-white/10 bg-black/20 px-6 py-14 text-center">
              <Bookmark className="mx-auto h-10 w-10 text-gray-600" />
              <h3 className="mt-4 text-lg font-semibold text-white">No ideas yet</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-400">
                {isOwner
                  ? 'Start adding ideas to this feed by bookmarking them from idea pages.'
                  : 'This feed is empty.'}
              </p>
            </div>
          )}
        </section>
      </div>

      <EditFeedModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        feed={feed}
        onUpdate={(updatedFeed) => setFeed(updatedFeed)}
      />

      {showDeleteModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="delete-feed-title">
          <button
            type="button"
            aria-label="Cancel feed deletion"
            className="absolute inset-0 bg-black/75"
            onClick={() => !isDeleting && setShowDeleteModal(false)}
          />
          <div className="relative w-full max-w-md border border-white/10 bg-[#0D0D12] p-6 shadow-2xl">
            <AlertTriangle className="mx-auto h-10 w-10 text-red-300" />
            <h3 id="delete-feed-title" className="mt-4 text-center text-xl font-semibold text-white">Delete Feed?</h3>
            <p className="mt-2 text-center text-sm leading-6 text-gray-400">
              Are you sure you want to delete <span className="font-medium text-white">&quot;{feed.name}&quot;</span>?
            </p>
            <p className="mt-2 text-center text-sm text-red-300">This action cannot be undone.</p>

            <div className="mt-6 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="btn-ghost"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteFeed}
                disabled={isDeleting}
                aria-busy={isDeleting}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 border border-red-400/30 bg-red-400/10 px-5 text-sm font-semibold text-red-100 transition hover:bg-red-400/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
