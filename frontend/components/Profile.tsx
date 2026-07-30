'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../lib/store';
import { useAuth } from '../contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { useSelectAndConnect } from '@/hooks/useSelectAndConnect';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Save, AtSign, Code2, Globe, Send, Pencil, Trash2, ArrowLeft, Wallet, Check, Loader2, Lightbulb, MessageSquare, Star, Calendar, Link as LinkIcon, ImageIcon, TrendingUp, Users, Rss, Bookmark, AlertTriangle } from 'lucide-react';
import { ProjectCard } from './ProjectCard';
import { WalletReminderBadge } from './WalletReminderBadge';
import { WalletRequiredModal } from './WalletRequiredModal';
import { EditProjectModal } from './EditProjectModal';
import { ImageCropper } from './ImageCropper';
import { FollowButton } from './FollowButton';
import { FollowListModal } from './FollowListModal';
import { LoadingSpinner } from './LoadingSpinner';
import toast from 'react-hot-toast';
import { Project, Feed } from '../lib/types';
import { apiClient } from '../lib/api-client';
import { uploadAvatar, uploadCoverImage } from '../lib/imgbb';
import { createUsernameSlug } from '../lib/slug-utils';

interface UserStats {
  reputation: number;
  ideasCount: number;
  projectsCount: number;
  feedbackCount: number;
  tipsReceived: number;
  likesReceived: number;
  votesReceived: number;
}

export const Profile = () => {
  const user = useAppStore((state) => state.user);
  const viewedUser = useAppStore((state) => state.viewedUser);
  const updateUserProfile = useAppStore((state) => state.updateUserProfile);
  const updateProject = useAppStore((state) => state.updateProject);
  const deleteProject = useAppStore((state) => state.deleteProject);
  const openSubmitModal = useAppStore((state) => state.openSubmitModal);
  const setViewedUser = useAppStore((state) => state.setViewedUser);
  const { setShowWalletPopup, refreshUser, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { connected, publicKey, disconnect } = useWallet();
  const { selectAndConnect } = useSelectAndConnect();
  const [isEditing, setIsEditing] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletModalMode, setWalletModalMode] = useState<'reconnect' | 'connect' | 'change'>('reconnect');
  const [activeTab, setActiveTab] = useState<'ideas' | 'feeds'>('ideas');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  
  // Image cropper states
  const [showAvatarCropper, setShowAvatarCropper] = useState(false);
  const [showCoverCropper, setShowCoverCropper] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  
  // Follow system state
  const [showFollowModal, setShowFollowModal] = useState(false);
  const [followModalTab, setFollowModalTab] = useState<'followers' | 'following'>('followers');
  const [localFollowersCount, setLocalFollowersCount] = useState(0);
  const [localFollowingCount, setLocalFollowingCount] = useState(0);
  
  // Feeds state
  const [userFeeds, setUserFeeds] = useState<Feed[]>([]);
  const [isLoadingFeeds, setIsLoadingFeeds] = useState(false);
  
  // User's ideas state (fetched directly, not from global store)
  const [userIdeas, setUserIdeas] = useState<Project[]>([]);
  const [isLoadingIdeas, setIsLoadingIdeas] = useState(false);
  const [ideaPendingDelete, setIdeaPendingDelete] = useState<Project | null>(null);
  const [isDeletingIdea, setIsDeletingIdea] = useState(false);
  const [deletingIdeaIds, setDeletingIdeaIds] = useState<Set<string>>(new Set());

  // Determine if this is the "My Profile" page (not viewing someone else)
  const isMyProfilePage = pathname === '/profile';
  
  // If on My Profile page, always show current user. Otherwise show viewedUser or fallback to user.
  const displayUser = isMyProfilePage ? user : (viewedUser || user);
  const isOwnProfile = user && displayUser && user.username === displayUser.username;

  // Clear viewedUser when entering My Profile page
  useEffect(() => {
    if (isMyProfilePage && viewedUser) {
      setViewedUser(null);
    }
  }, [isMyProfilePage, viewedUser, setViewedUser]);

  const [editForm, setEditForm] = useState({
      username: '',
      bio: '',
      twitter: '',
      github: '',
      telegram: '',
      facebook: '',
      avatar: '',
      coverImage: ''
  });

  useEffect(() => {
      if (displayUser) {
          setEditForm({
            username: displayUser.username,
            bio: displayUser.bio || '',
            twitter: displayUser.socials?.twitter || '',
            github: displayUser.socials?.github || '',
            telegram: displayUser.socials?.telegram || '',
            facebook: displayUser.socials?.facebook || '',
            avatar: displayUser.avatar || '',
            coverImage: displayUser.coverImage || ''
          });
      }
  }, [displayUser]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!displayUser?.username) return;
      
      setIsLoadingStats(true);
      try {
        const response = await apiClient.getUserStats(displayUser.username);
        if (response.success && response.data) {
          setUserStats(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch user stats:', error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchStats();
  }, [displayUser?.username]);

  // Fetch follow stats for displayUser
  useEffect(() => {
    const fetchFollowStats = async () => {
      if (!displayUser?.id) return;
      
      try {
        const response = await apiClient.getFollowStats(displayUser.id);
        if (response.success && response.data) {
          setLocalFollowersCount(response.data.followersCount);
          setLocalFollowingCount(response.data.followingCount);
        }
      } catch (error) {
        console.error('Failed to fetch follow stats:', error);
      }
    };

    fetchFollowStats();
  }, [displayUser?.id]);

  // Fetch user's ideas/projects directly from API
  useEffect(() => {
    const fetchUserIdeas = async () => {
      if (!displayUser?.username) return;
      
      setIsLoadingIdeas(true);
      try {
        const response = await apiClient.getUserProjects(displayUser.username, {
          type: 'idea',
          limit: 24,
        });
        if (response.success && response.data) {
          // Map data for card compatibility. The API already filters to ideas.
          const ideas = response.data
            .map((p: any) => ({
              ...p,
              image: p.imageUrl || p.image,
            }));
          setUserIdeas(ideas);
        }
      } catch (error) {
        console.error('Failed to fetch user ideas:', error);
      } finally {
        setIsLoadingIdeas(false);
      }
    };

    fetchUserIdeas();
  }, [displayUser?.username]);

  // Fetch user's public feeds
  useEffect(() => {
    const fetchUserFeeds = async () => {
      if (!displayUser?.id) return;
      
      setIsLoadingFeeds(true);
      try {
        // If own profile, get all feeds; otherwise get public feeds only
        if (isOwnProfile) {
          const response = await apiClient.getMyFeeds();
          if (response.success && response.data) {
            setUserFeeds(response.data);
          }
        } else {
          const response = await apiClient.getUserFeeds(displayUser.id);
          if (response.success && response.data) {
            setUserFeeds(response.data);
          }
        }
      } catch (error) {
        console.error('Failed to fetch user feeds:', error);
      } finally {
        setIsLoadingFeeds(false);
      }
    };

    fetchUserFeeds();
  }, [displayUser?.id, isOwnProfile]);

  // Handler for when follow status changes
  const handleFollowChange = (isFollowing: boolean) => {
    setLocalFollowersCount(prev => isFollowing ? prev + 1 : Math.max(0, prev - 1));
  };

  const isWalletConnected = connected && publicKey && displayUser?.wallet && 
    publicKey.toBase58() === displayUser.wallet;

  // Handle reconnect wallet
  const handleReconnectWallet = async () => {
    if (!displayUser?.wallet) {
      setShowWalletPopup(true);
      return;
    }

    setIsReconnecting(true);
    try {
      // Prefer Phantom, then Solflare — Standard wallets appear once they inject.
      let selected;
      try {
        selected = await selectAndConnect({ walletName: 'Phantom' });
      } catch {
        selected = await selectAndConnect({ walletName: 'Solflare' });
      }

      // Read the key from the adapter we just connected (hook publicKey may lag a render).
      const connectedKey = selected.adapter.publicKey?.toBase58();
      if (connectedKey && connectedKey === displayUser.wallet) {
        toast.success('Wallet reconnected successfully!');
      } else if (connectedKey) {
        toast.error('Connected wallet does not match your profile. Please use the correct wallet.');
        await disconnect();
      }
    } catch (error: any) {
      console.error('Reconnect wallet error:', error);
      if (error.message?.includes('not found')) {
        toast.error('No wallet extension found. Please install Phantom or Solflare.');
      } else if (!error.message?.includes('User rejected') && !error.message?.includes('cancelled')) {
        toast.error('Failed to reconnect wallet');
      }
    } finally {
      setIsReconnecting(false);
    }
  };

  // Show loading while auth is initializing
  if (authLoading) {
      return (
          <div className="min-h-screen flex items-center justify-center pt-20">
              <LoadingSpinner isLoading={true} size="lg" text="Loading profile..." />
          </div>
      );
  }

  if (!displayUser) {
      return (
          <div className="min-h-screen flex items-center justify-center pt-20">
              <div className="text-center">
                  <h2 className="text-2xl font-bold mb-4">Profile Not Found</h2>
                  <button onClick={() => router.push('/home')} className="text-accent underline">Go Home</button>
              </div>
          </div>
      );
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        toast.error('Please upload JPEG, PNG, GIF, or WebP image.');
        return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
        toast.error('Image size must be less than 5MB');
        return;
    }

    // Open cropper instead of direct upload
    setAvatarFile(file);
    setShowAvatarCropper(true);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAvatarCropComplete = async (croppedDataUrl: string) => {
    setIsUploadingAvatar(true);
    try {
        // Convert data URL to File
        const response = await fetch(croppedDataUrl);
        const blob = await response.blob();
        const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
        
        const imageUrl = await uploadAvatar(file);
        setEditForm({ ...editForm, avatar: imageUrl });
        toast.success('Avatar uploaded! Remember to save your profile.');
    } catch (error: any) {
        console.error('Avatar upload error:', error);
        toast.error(error.message || 'Failed to upload avatar. Please try again.');
    } finally {
        setIsUploadingAvatar(false);
        setAvatarFile(null);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        toast.error('Please upload JPEG, PNG, GIF, or WebP image.');
        return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB for cover
    if (file.size > maxSize) {
        toast.error('Image size must be less than 10MB');
        return;
    }

    // Open cropper instead of direct upload
    setCoverFile(file);
    setShowCoverCropper(true);
    // Reset input
    if (coverInputRef.current) coverInputRef.current.value = '';
  };

  const handleCoverCropComplete = async (croppedDataUrl: string) => {
    setIsUploadingCover(true);
    try {
        // Convert data URL to File
        const response = await fetch(croppedDataUrl);
        const blob = await response.blob();
        const file = new File([blob], 'cover.jpg', { type: 'image/jpeg' });
        
        // Use uploadCoverImage for higher quality cover images
        const imageUrl = await uploadCoverImage(file);
        setEditForm({ ...editForm, coverImage: imageUrl });
        toast.success('Cover uploaded! Remember to save your profile.');
    } catch (error: any) {
        console.error('Cover upload error:', error);
        toast.error(error.message || 'Failed to upload cover. Please try again.');
    } finally {
        setIsUploadingCover(false);
        setCoverFile(null);
    }
  };

  const handleSaveProfile = async () => {
      if (!isOwnProfile) return;
      try {
          await updateUserProfile({
              username: editForm.username,
              bio: editForm.bio,
              avatar: editForm.avatar,
              coverImage: editForm.coverImage,
              socialLinks: {
                  twitter: editForm.twitter,
                  github: editForm.github,
                  telegram: editForm.telegram,
                  facebook: editForm.facebook
              }
          } as any);
          
          await refreshUser();
          setIsEditing(false);
          toast.success("Profile Updated!");
      } catch (error) {
          toast.error("Failed to update profile. Please try again.");
      }
  };

  const handleCancelProfile = () => {
      if (!user) return;
      setEditForm({
        username: user.username,
        bio: user.bio || '',
        twitter: user.socials?.twitter || '',
        github: user.socials?.github || '',
        telegram: user.socials?.telegram || '',
        facebook: user.socials?.facebook || '',
        avatar: user.avatar || '',
        coverImage: user.coverImage || ''
      });
      setIsEditing(false);
  };

  const startEditingProject = (project: Project) => {
      setEditingProject(project);
  };

  const handleDeleteProject = async () => {
      if (!ideaPendingDelete?.id) return;

      const deletingId = ideaPendingDelete.id;
      setIsDeletingIdea(true);
      setDeletingIdeaIds(prev => new Set(prev).add(deletingId));
      try {
          await deleteProject(deletingId);
          // Keep a short delay so the "deleting" animation is visible/responsive.
          await new Promise(resolve => setTimeout(resolve, 180));
          setUserIdeas(prev => prev.filter(p => p.id !== deletingId));
          toast.success("Idea deleted");
          setIdeaPendingDelete(null);
      } catch (error) {
          setDeletingIdeaIds(prev => {
              const next = new Set(prev);
              next.delete(deletingId);
              return next;
          });
          toast.error("Failed to delete idea. Please try again.");
      } finally {
          setIsDeletingIdea(false);
      }
  };

  const hasSocialLinks = displayUser.socials?.twitter || displayUser.socials?.github || 
    displayUser.socials?.telegram || displayUser.socials?.facebook;
  const avatarSrc = isEditing ? editForm.avatar : displayUser.avatar;
  const coverSrc = isEditing ? editForm.coverImage : displayUser.coverImage;
  const avatarInitial = displayUser.username?.slice(0, 1).toUpperCase() || 'G';

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen page-top pb-24"
    >
      <div className="page-shell">
        {!isOwnProfile && (
          <button
            type="button"
            onClick={() => router.back()}
            className="mb-5 inline-flex min-h-[40px] items-center gap-2 text-sm text-gray-400 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back
          </button>
        )}

        {isOwnProfile && displayUser.needsWalletConnect && (
          <div className="mb-5">
            <WalletReminderBadge onConnect={() => setShowWalletPopup(true)} />
          </div>
        )}

        <section className="overflow-hidden border border-white/10 bg-[#0A0A0A]">
          <div className="relative h-40 overflow-hidden border-b border-white/10 bg-[#111] sm:h-52">
            {coverSrc ? (
              <img
                src={coverSrc}
                alt={`${displayUser.username} cover`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-[linear-gradient(135deg,#141414_0%,#0a0a0a_58%,rgba(255,215,0,0.08)_100%)]">
                <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:32px_32px]" />
              </div>
            )}

            <input
              type="file"
              ref={coverInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleCoverUpload}
              disabled={isUploadingCover}
            />

            {isEditing && (
              <button
                type="button"
                onClick={() => !isUploadingCover && coverInputRef.current?.click()}
                disabled={isUploadingCover}
                aria-busy={isUploadingCover}
                className="btn-ghost absolute bottom-3 right-3 z-10 !min-h-[40px] !bg-black/65 !px-3 !text-xs"
              >
                {isUploadingCover ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Uploading
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-4 w-4" aria-hidden="true" />
                    {editForm.coverImage ? 'Change cover' : 'Add cover'}
                  </>
                )}
              </button>
            )}
          </div>

          <div className="px-4 pb-5 sm:px-6 sm:pb-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="relative -mt-10 h-24 w-24 flex-shrink-0 bg-[#111] sm:-mt-14 sm:h-28 sm:w-28">
                <div className="h-full w-full overflow-hidden border-4 border-[#050505] bg-[#111]">
                  {avatarSrc ? (
                    <img src={avatarSrc} alt={`${displayUser.username} avatar`} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[#161616] font-display text-4xl font-bold text-[#FFD700]">
                      {avatarInitial}
                    </div>
                  )}
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUploadingAvatar}
                />

                {isEditing && (
                  <button
                    type="button"
                    onClick={() => !isUploadingAvatar && fileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    aria-label="Change avatar"
                    aria-busy={isUploadingAvatar}
                    className="absolute inset-1 flex items-center justify-center bg-black/65 text-white opacity-100 transition hover:bg-black/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700] sm:opacity-0 sm:hover:opacity-100 sm:focus-visible:opacity-100"
                  >
                    {isUploadingAvatar ? (
                      <Loader2 className="h-7 w-7 animate-spin" aria-hidden="true" />
                    ) : (
                      <Camera className="h-7 w-7" aria-hidden="true" />
                    )}
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    const profileSlug = displayUser.slug || createUsernameSlug(displayUser.username);
                    const profileUrl = `${window.location.origin}/profile/${profileSlug}`;
                    navigator.clipboard.writeText(profileUrl);
                    toast.success('Profile link copied');
                  }}
                  className="btn-ghost !min-h-[40px] !px-3 !text-xs"
                >
                  <LinkIcon className="h-4 w-4" aria-hidden="true" />
                  Share
                </button>

                {isOwnProfile && !isEditing && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="btn-ghost !min-h-[40px] !px-3 !text-xs"
                  >
                    Edit profile
                  </button>
                )}

                {!isOwnProfile && displayUser?.id && (
                  <FollowButton
                    targetUserId={displayUser.id}
                    targetUsername={displayUser.username}
                    onFollowChange={handleFollowChange}
                    className="!min-h-[40px] !px-4 !text-xs"
                  />
                )}
              </div>
            </div>

            <div className="mt-4 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
              <div className="min-w-0">
                {isEditing ? (
                  <input
                    value={editForm.username}
                    onChange={e => setEditForm({ ...editForm, username: e.target.value })}
                    className="w-full max-w-sm border border-white/15 bg-white/[0.04] px-3 py-2 text-xl font-bold text-white outline-none transition focus:border-[#FFD700]/60 focus-visible:ring-1 focus-visible:ring-[#FFD700]"
                  />
                ) : (
                  <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                    {displayUser.username}
                  </h1>
                )}
                {displayUser.email && (
                  <p className="mt-1 text-sm text-gray-500">{displayUser.email}</p>
                )}

                {isEditing ? (
                  <textarea
                    value={editForm.bio}
                    onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
                    placeholder="Write something about yourself..."
                    className="mt-4 h-24 w-full resize-none border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-[#FFD700]/60 focus-visible:ring-1 focus-visible:ring-[#FFD700]"
                  />
                ) : displayUser.bio ? (
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-300">
                    {displayUser.bio}
                  </p>
                ) : isOwnProfile ? (
                  <p className="mt-3 text-sm text-gray-500">Add a bio to tell people about yourself.</p>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setFollowModalTab('followers');
                    setShowFollowModal(true);
                  }}
                  className="inline-flex min-h-[40px] items-baseline gap-1.5 border border-white/10 bg-white/[0.03] px-3 py-2 text-left transition hover:border-[#FFD700]/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700]"
                >
                  <span className="font-mono text-base font-bold text-white">{localFollowersCount}</span>
                  <span className="text-xs uppercase tracking-[0.1em] text-gray-500">Followers</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFollowModalTab('following');
                    setShowFollowModal(true);
                  }}
                  className="inline-flex min-h-[40px] items-baseline gap-1.5 border border-white/10 bg-white/[0.03] px-3 py-2 text-left transition hover:border-[#FFD700]/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700]"
                >
                  <span className="font-mono text-base font-bold text-white">{localFollowingCount}</span>
                  <span className="text-xs uppercase tracking-[0.1em] text-gray-500">Following</span>
                </button>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2 text-sm text-gray-500">
              {displayUser.wallet && (
                <div className="inline-flex min-h-[32px] items-center gap-2 border border-white/10 bg-white/[0.03] px-2.5 font-mono text-xs">
                  <Wallet className="h-4 w-4 text-[#FFD700]" aria-hidden="true" />
                  {displayUser.wallet.slice(0, 4)}...{displayUser.wallet.slice(-4)}
                  {isOwnProfile && (
                    <>
                      {isWalletConnected ? (
                        <span className="inline-flex items-center border border-[#14F195]/30 bg-[#14F195]/10 px-1.5 py-0.5 text-[10px] text-[#14F195]">
                          <Check className="h-3 w-3" aria-hidden="true" />
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setWalletModalMode('reconnect');
                            setShowWalletModal(true);
                          }}
                          className="ml-1 text-[10px] text-[#FFD700] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700]"
                        >
                          Reconnect
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}

              <div className="inline-flex min-h-[32px] items-center gap-2 border border-white/10 bg-white/[0.03] px-2.5 text-xs">
                <Calendar className="h-4 w-4 text-[#FFD700]" aria-hidden="true" />
                Gimme Idea Member
              </div>
            </div>

            {!isEditing && hasSocialLinks && (
              <div className="mt-4 flex flex-wrap gap-2">
                {displayUser.socials?.twitter && (
                  <a href={displayUser.socials.twitter} target="_blank" rel="noopener noreferrer" aria-label="Twitter profile" className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center border border-white/10 bg-white/[0.03] text-gray-400 transition hover:border-[#FFD700]/35 hover:text-[#FFD700] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700]">
                    <AtSign className="h-4 w-4" aria-hidden="true" />
                  </a>
                )}
                {displayUser.socials?.github && (
                  <a href={displayUser.socials.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub profile" className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center border border-white/10 bg-white/[0.03] text-gray-400 transition hover:border-[#FFD700]/35 hover:text-[#FFD700] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700]">
                    <Code2 className="h-4 w-4" aria-hidden="true" />
                  </a>
                )}
                {displayUser.socials?.telegram && (
                  <a href={displayUser.socials.telegram} target="_blank" rel="noopener noreferrer" aria-label="Telegram profile" className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center border border-white/10 bg-white/[0.03] text-gray-400 transition hover:border-[#FFD700]/35 hover:text-[#FFD700] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700]">
                    <Send className="h-4 w-4" aria-hidden="true" />
                  </a>
                )}
                {displayUser.socials?.facebook && (
                  <a href={displayUser.socials.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook profile" className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center border border-white/10 bg-white/[0.03] text-gray-400 transition hover:border-[#FFD700]/35 hover:text-[#FFD700] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700]">
                    <Globe className="h-4 w-4" aria-hidden="true" />
                  </a>
                )}
              </div>
            )}

            {isEditing && (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <label className="relative block">
                  <AtSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" aria-hidden="true" />
                  <input
                    value={editForm.twitter}
                    onChange={e => setEditForm({ ...editForm, twitter: e.target.value })}
                    className="w-full border border-white/15 bg-white/[0.04] py-2 pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-[#FFD700]/60 focus-visible:ring-1 focus-visible:ring-[#FFD700]"
                    placeholder="Twitter URL"
                  />
                </label>
                <label className="relative block">
                  <Code2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" aria-hidden="true" />
                  <input
                    value={editForm.github}
                    onChange={e => setEditForm({ ...editForm, github: e.target.value })}
                    className="w-full border border-white/15 bg-white/[0.04] py-2 pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-[#FFD700]/60 focus-visible:ring-1 focus-visible:ring-[#FFD700]"
                    placeholder="GitHub URL"
                  />
                </label>
                <label className="relative block">
                  <Send className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" aria-hidden="true" />
                  <input
                    value={editForm.telegram}
                    onChange={e => setEditForm({ ...editForm, telegram: e.target.value })}
                    className="w-full border border-white/15 bg-white/[0.04] py-2 pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-[#FFD700]/60 focus-visible:ring-1 focus-visible:ring-[#FFD700]"
                    placeholder="Telegram URL"
                  />
                </label>
                <label className="relative block">
                  <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" aria-hidden="true" />
                  <input
                    value={editForm.facebook}
                    onChange={e => setEditForm({ ...editForm, facebook: e.target.value })}
                    className="w-full border border-white/15 bg-white/[0.04] py-2 pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-[#FFD700]/60 focus-visible:ring-1 focus-visible:ring-[#FFD700]"
                    placeholder="Facebook URL"
                  />
                </label>
              </div>
            )}

            {isOwnProfile && !displayUser.wallet && !isEditing && (
              <button
                type="button"
                onClick={() => {
                  setWalletModalMode('connect');
                  setShowWalletModal(true);
                }}
                className="btn-ghost mt-5 !min-h-[40px] !px-3 !text-xs"
              >
                <Wallet className="h-4 w-4 text-[#FFD700]" aria-hidden="true" />
                Connect wallet to receive tips
              </button>
            )}

            {isEditing && (
              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button type="button" onClick={handleCancelProfile} className="btn-ghost">
                  Cancel
                </button>
                <button type="button" onClick={handleSaveProfile} className="btn-primary">
                  <Save className="h-4 w-4" aria-hidden="true" />
                  Save profile
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 border-t border-white/10 sm:grid-cols-4">
            {[
              { label: 'Ideas', value: userStats?.ideasCount ?? 0, icon: Lightbulb },
              { label: 'Comments', value: userStats?.feedbackCount ?? 0, icon: MessageSquare },
              { label: 'Votes', value: userStats?.votesReceived ?? 0, icon: TrendingUp },
              { label: 'Rep', value: userStats?.reputation ?? 0, icon: Star },
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className={`min-h-[86px] px-4 py-4 ${index % 2 ? 'border-l border-white/10' : ''} ${index > 1 ? 'border-t border-white/10 sm:border-t-0' : ''} ${index > 0 ? 'sm:border-l sm:border-white/10' : ''}`}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="font-mono text-2xl font-bold text-white">
                      {isLoadingStats ? '-' : stat.value}
                    </div>
                    <Icon className="h-4 w-4 text-[#FFD700]" aria-hidden="true" />
                  </div>
                  <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-gray-500">
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="mt-6 flex overflow-x-auto border-b border-white/10 scrollbar-hide">
          <button
            type="button"
            onClick={() => setActiveTab('ideas')}
            className={`ui-tab ${activeTab === 'ideas' ? 'ui-tab-active' : ''}`}
          >
            Ideas
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('feeds')}
            className={`ui-tab ${activeTab === 'feeds' ? 'ui-tab-active' : ''}`}
          >
            {isOwnProfile ? 'Your Feeds' : 'Feeds'}
          </button>
        </div>

        <section className="mt-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-widest text-gray-600">
              {activeTab === 'ideas'
                ? isLoadingIdeas ? 'Loading ideas' : `${userIdeas.length} ideas`
                : isLoadingFeeds ? 'Loading feeds' : `${userFeeds.length} feeds`}
            </span>
          </div>

          {activeTab === 'ideas' ? (
            <>
              {isLoadingIdeas ? (
                <div className="flex min-h-[180px] items-center justify-center border border-white/10 bg-white/[0.03] text-sm text-gray-400">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin text-[#FFD700]" aria-hidden="true" />
                  Loading ideas
                </div>
              ) : userIdeas.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <AnimatePresence mode="popLayout">
                    {userIdeas.map(project => (
                      <motion.div
                        key={project.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={
                          deletingIdeaIds.has(project.id)
                            ? { opacity: 0.45, scale: 0.98, y: 4 }
                            : { opacity: 1, scale: 1, y: 0 }
                        }
                        exit={{ opacity: 0, scale: 0.9, y: 24 }}
                        transition={{ duration: 0.22, ease: 'easeOut' }}
                        className="group relative"
                      >
                        <ProjectCard project={project} hideIdeaStageBadge={true} />
                        {isOwnProfile && (
                          <div className="absolute right-3 top-3 z-20 flex gap-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditingProject(project);
                              }}
                              className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center border border-white/15 bg-black/80 text-white transition hover:border-[#FFD700]/40 hover:text-[#FFD700] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700]"
                              aria-label="Edit idea"
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIdeaPendingDelete(project);
                              }}
                              className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center border border-white/15 bg-black/80 text-red-300 transition hover:border-red-400/50 hover:text-red-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300"
                              aria-label="Delete idea"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                            </button>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="border border-dashed border-white/10 bg-white/[0.03] px-4 py-14 text-center">
                  <Lightbulb className="mx-auto mb-4 h-10 w-10 text-[#FFD700]" aria-hidden="true" />
                  <p className="mb-4 text-sm text-gray-500">No ideas shared yet</p>
                  {isOwnProfile && (
                    <button type="button" onClick={() => openSubmitModal('idea')} className="btn-primary">
                      Share your first idea
                    </button>
                  )}
                </div>
              )}
            </>
          ) : (
            <div>
              {isLoadingFeeds ? (
                <div className="flex min-h-[180px] items-center justify-center border border-white/10 bg-white/[0.03] text-sm text-gray-400">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin text-[#FFD700]" aria-hidden="true" />
                  Loading feeds
                </div>
              ) : userFeeds.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {userFeeds.map(feed => (
                    <button
                      type="button"
                      key={feed.id}
                      onClick={() => router.push(`/feeds/${feed.slug || feed.id}`)}
                      className="group w-full border border-white/10 bg-white/[0.03] p-5 text-left transition hover:border-[#FFD700]/35 hover:bg-white/[0.05] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700]"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center border border-[#FFD700]/25 bg-[#FFD700]/10">
                          <Rss className="h-5 w-5 text-[#FFD700]" aria-hidden="true" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate font-semibold text-white transition group-hover:text-[#FFD700]">
                            {feed.name}
                          </h3>
                          {feed.description && (
                            <p className="mt-1 line-clamp-2 text-sm text-gray-400">
                              {feed.description}
                            </p>
                          )}
                          <div className="mt-3 flex flex-wrap items-center gap-4 font-mono text-[10px] uppercase tracking-[0.1em] text-gray-500">
                            <span className="flex items-center gap-1">
                              <Bookmark className="h-3.5 w-3.5" aria-hidden="true" />
                              {feed.itemsCount} ideas
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3.5 w-3.5" aria-hidden="true" />
                              {feed.followersCount} followers
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="border border-dashed border-white/10 bg-white/[0.03] px-4 py-14 text-center">
                  <Rss className="mx-auto mb-4 h-10 w-10 text-[#FFD700]" aria-hidden="true" />
                  <p className="mb-4 text-sm text-gray-500">
                    {isOwnProfile ? "You haven't created any feeds yet" : 'No public feeds'}
                  </p>
                  {isOwnProfile && (
                    <button type="button" onClick={() => router.push('/feeds')} className="btn-primary">
                      Create your first feed
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      </div>

        {/* Edit Project Modal */}
        <EditProjectModal
          project={editingProject}
          isOpen={!!editingProject}
          onClose={() => setEditingProject(null)}
          onSave={(updatedData) => {
            if (editingProject) {
              updateProject({
                id: editingProject.id,
                ...updatedData
              });
              setEditingProject(null);
            }
          }}
        />

        {/* Delete Idea Confirmation Modal */}
        <AnimatePresence>
          {ideaPendingDelete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="modal-overlay fixed inset-0 z-[220] flex items-center justify-center p-4"
              onClick={() => !isDeletingIdea && setIdeaPendingDelete(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 8 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 8 }}
                onClick={(e) => e.stopPropagation()}
                className="modal-panel w-full max-w-md p-5 sm:p-6"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 border border-red-500/25 bg-red-500/15 p-2">
                    <AlertTriangle className="w-5 h-5 text-red-400" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Delete idea?</h3>
                    <p className="text-sm text-gray-400 mt-1">This action cannot be undone.</p>
                  </div>
                </div>

                <div className="mt-4 border border-white/10 bg-white/[0.04] p-3">
                  <p className="text-sm text-gray-300 line-clamp-2">{ideaPendingDelete.title}</p>
                </div>

                <div className="mt-5 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setIdeaPendingDelete(null)}
                    disabled={isDeletingIdea}
                    className="btn-ghost"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteProject}
                    disabled={isDeletingIdea}
                    className="inline-flex min-h-[44px] items-center justify-center gap-2 border border-red-500 bg-red-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isDeletingIdea ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                        Delete idea
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Wallet Required Modal */}
        <WalletRequiredModal
          isOpen={showWalletModal}
          onClose={() => setShowWalletModal(false)}
          mode={walletModalMode}
          onSuccess={() => {
            setShowWalletModal(false);
            refreshUser();
          }}
        />

        {/* Avatar Cropper Modal */}
        {avatarFile && (
          <ImageCropper
            isOpen={showAvatarCropper}
            onClose={() => {
              setShowAvatarCropper(false);
              setAvatarFile(null);
            }}
            imageFile={avatarFile}
            aspectRatio={1}
            onCropComplete={handleAvatarCropComplete}
            title="Crop Avatar"
          />
        )}

        {/* Cover Cropper Modal */}
        {coverFile && (
          <ImageCropper
            isOpen={showCoverCropper}
            onClose={() => {
              setShowCoverCropper(false);
              setCoverFile(null);
            }}
            imageFile={coverFile}
            aspectRatio={3}
            onCropComplete={handleCoverCropComplete}
            title="Crop Cover Image"
          />
        )}

        {/* Follow List Modal */}
        {displayUser?.id && (
          <FollowListModal
            isOpen={showFollowModal}
            onClose={() => setShowFollowModal(false)}
            userId={displayUser.id}
            username={displayUser.username}
            initialTab={followModalTab}
          />
        )}
    </motion.main>
  );
};
