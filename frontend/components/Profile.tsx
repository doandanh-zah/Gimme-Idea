'use client';

import React, { useState, useRef, useEffect, CSSProperties } from 'react';
import { useAppStore } from '../lib/store';
import { useAuth } from '../contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { motion } from 'framer-motion';
import { Camera, Edit2, Save, X, Github, Twitter, Facebook, Send, Pencil, Trash2, ArrowLeft, Wallet, Check, Repeat, Loader2, Lightbulb, MessageSquare, Heart, Star, Calendar, Link as LinkIcon, ImageIcon, ThumbsUp, TrendingUp, Users, Rss, Bookmark } from 'lucide-react';
import { ProjectCard } from './ProjectCard';
import { WalletReminderBadge } from './WalletReminderBadge';
import { WalletRequiredModal } from './WalletRequiredModal';
import { EditProjectModal } from './EditProjectModal';
import { ImageCropper } from './ImageCropper';
import { FollowButton, FollowStats } from './FollowButton';
import { FollowListModal } from './FollowListModal';
import { LoadingSpinner } from './LoadingSpinner';
import { useFollow } from '../hooks/useFollow';
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
  const { user, viewedUser, projects, updateUserProfile, updateProject, deleteProject, openSubmitModal, setViewedUser } = useAppStore();
  const { setShowWalletPopup, refreshUser, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { connected, publicKey, connect, select, wallets, disconnect } = useWallet();
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
          const data = response.data as any;
          setUserStats({
            ...response.data,
            votesReceived: data.votesReceived ?? 0,
          });
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
        const response = await apiClient.getUserProjects(displayUser.username);
        if (response.success && response.data) {
          // Filter to only show ideas and map data
          const ideas = response.data
            .filter((p: any) => p.type === 'idea')
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
      // Find the wallet that matches user's saved wallet
      // Try to connect to any available wallet
      const availableWallet = wallets.find(w => 
        w.readyState === 'Installed' || w.readyState === 'Loadable'
      );
      
      if (!availableWallet) {
        toast.error('No wallet extension found. Please install Phantom or Solflare.');
        return;
      }

      select(availableWallet.adapter.name);
      await connect();
      
      // Check if connected wallet matches
      if (publicKey && publicKey.toBase58() === displayUser.wallet) {
        toast.success('Wallet reconnected successfully!');
      } else if (publicKey) {
        toast.error('Connected wallet does not match your profile. Please use the correct wallet.');
        await disconnect();
      }
    } catch (error: any) {
      console.error('Reconnect wallet error:', error);
      if (!error.message?.includes('User rejected')) {
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

  const handleDeleteProject = async (id: string) => {
      if (window.confirm("Are you sure you want to delete this idea?")) {
          await deleteProject(id);
          // Also remove from local state
          setUserIdeas(prev => prev.filter(p => p.id !== id));
          toast.success("Idea deleted");
      }
  };

  const hasSocialLinks = displayUser.socials?.twitter || displayUser.socials?.github || 
    displayUser.socials?.telegram || displayUser.socials?.facebook;

  return (
    <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }}
        className="min-h-screen pt-20 sm:pt-24 pb-20 px-4 sm:px-6"
    >
        <div className="max-w-5xl mx-auto">
            {/* Back Button */}
            {!isOwnProfile && (
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 text-sm"
                >
                    <ArrowLeft className="w-4 h-4" /> Back
                </button>
            )}

            {/* Wallet Reminder */}
            {isOwnProfile && displayUser.needsWalletConnect && (
              <WalletReminderBadge onConnect={() => setShowWalletPopup(true)} />
            )}

            {/* Profile Header Card */}
            <div className="bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
                {/* Cover Image - taller for X/Twitter style */}
                <div className="relative h-36 sm:h-48 bg-gradient-to-br from-purple-900/50 via-blue-900/30 to-pink-900/30 overflow-hidden">
                    {(isEditing ? editForm.coverImage : displayUser.coverImage) ? (
                        <img 
                            src={isEditing ? editForm.coverImage : displayUser.coverImage} 
                            alt="Cover" 
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 via-blue-900/30 to-pink-900/30">
                            <div className="absolute inset-0 opacity-30">
                                <div className="absolute top-4 left-8 w-2 h-2 bg-white rounded-full animate-pulse" />
                                <div className="absolute top-12 left-1/4 w-1 h-1 bg-white/60 rounded-full" />
                                <div className="absolute top-6 right-1/3 w-1.5 h-1.5 bg-white/80 rounded-full animate-pulse" />
                                <div className="absolute bottom-8 right-12 w-1 h-1 bg-white/50 rounded-full" />
                                <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-purple-300/50 rounded-full animate-pulse" />
                            </div>
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
                            onClick={() => !isUploadingCover && coverInputRef.current?.click()}
                            disabled={isUploadingCover}
                            className="absolute bottom-3 right-3 z-10 flex items-center gap-2 px-3 py-1.5 bg-black/60 hover:bg-black/80 rounded-full text-sm text-white transition-colors border border-white/20 cursor-pointer"
                        >
                            {isUploadingCover ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Uploading...</span>
                                </>
                            ) : (
                                <>
                                    <ImageIcon className="w-4 h-4" />
                                    <span>{editForm.coverImage ? 'Change' : 'Add'} cover</span>
                                </>
                            )}
                        </button>
                    )}
                </div>

                {/* Profile Section - X/Twitter Style Layout */}
                <div className="relative px-4 sm:px-6">
                    {/* Avatar Row - Avatar overlaps cover, Edit button on right */}
                    <div className="flex justify-between items-end -mt-12 sm:-mt-16 mb-3">
                        {/* Avatar */}
                        <div className="relative group flex-shrink-0">
                            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-[#0a0a0a] overflow-hidden bg-gray-800 shadow-xl">
                                <img 
                                    src={isEditing ? editForm.avatar : displayUser.avatar} 
                                    alt="Profile" 
                                    className="w-full h-full object-cover" 
                                />
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
                                    onClick={() => !isUploadingAvatar && fileInputRef.current?.click()}
                                    disabled={isUploadingAvatar}
                                    className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    {isUploadingAvatar ? (
                                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                                    ) : (
                                        <Camera className="w-8 h-8 text-white" />
                                    )}
                                </button>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                            {/* Share Profile Button - shows on ALL profiles */}
                            <button 
                                onClick={() => {
                                    const profileSlug = displayUser.slug || createUsernameSlug(displayUser.username);
                                    const profileUrl = `${window.location.origin}/profile/${profileSlug}`;
                                    navigator.clipboard.writeText(profileUrl);
                                    // Show toast notification
                                    const toast = document.createElement('div');
                                    toast.className = 'fixed bottom-4 right-4 bg-yellow-500 text-black px-4 py-2 rounded-full font-semibold shadow-lg z-50 animate-pulse';
                                    toast.textContent = 'Profile link copied!';
                                    document.body.appendChild(toast);
                                    setTimeout(() => toast.remove(), 2000);
                                }}
                                className="px-5 py-2.5 bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-500 hover:from-yellow-500 hover:via-yellow-600 hover:to-amber-600 text-black rounded-full text-sm font-bold transition-all shadow-lg shadow-yellow-500/25 flex items-center gap-2"
                            >
                                <LinkIcon className="w-4 h-4" />
                                Share Profile
                            </button>
                            
                            {/* Edit Profile Button - only for own profile */}
                            {isOwnProfile && !isEditing && (
                                <button 
                                    onClick={() => setIsEditing(true)}
                                    className="px-5 py-2.5 border border-white/30 hover:bg-white/10 rounded-full text-sm font-bold transition-colors"
                                >
                                    Edit profile
                                </button>
                            )}
                            
                            {/* Follow Button - for other profiles */}
                            {!isOwnProfile && displayUser?.id && (
                                <FollowButton
                                    targetUserId={displayUser.id}
                                    targetUsername={displayUser.username}
                                    onFollowChange={handleFollowChange}
                                />
                            )}
                        </div>
                    </div>

                    {/* Name & Info Section - Below Avatar */}
                    <div className="pb-4">
                        {/* Username & Email */}
                        <div className="mb-3">
                            {isEditing ? (
                                <input 
                                    value={editForm.username}
                                    onChange={e => setEditForm({...editForm, username: e.target.value})}
                                    className="bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-xl font-bold focus:border-purple-500 outline-none text-white w-full max-w-[250px]"
                                />
                            ) : (
                                <h1 className="text-xl sm:text-2xl font-bold">{displayUser.username}</h1>
                            )}
                            {displayUser.email && (
                                <p className="text-gray-500 text-sm mt-0.5">{displayUser.email}</p>
                            )}
                        </div>

                    {/* Bio */}
                        {isEditing ? (
                            <textarea 
                                value={editForm.bio}
                                onChange={e => setEditForm({...editForm, bio: e.target.value})}
                                placeholder="Write something about yourself..."
                                className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 focus:border-purple-500 outline-none text-white resize-none h-20 text-sm mb-4"
                            />
                        ) : displayUser.bio ? (
                            <p className="text-gray-300 text-sm leading-relaxed mb-4">
                                {displayUser.bio}
                            </p>
                        ) : isOwnProfile ? (
                            <p className="text-gray-500 text-sm mb-4">Add a bio to tell people about yourself.</p>
                        ) : null}

                    {/* Followers/Following Stats */}
                    <div className="flex items-center gap-4 mb-4">
                        <button
                            onClick={() => {
                                setFollowModalTab('followers');
                                setShowFollowModal(true);
                            }}
                            className="flex items-center gap-1.5 hover:text-purple-400 transition-colors group"
                        >
                            <span className="font-bold text-white group-hover:text-purple-400">
                                {localFollowersCount}
                            </span>
                            <span className="text-gray-400 text-sm">Followers</span>
                        </button>
                        <button
                            onClick={() => {
                                setFollowModalTab('following');
                                setShowFollowModal(true);
                            }}
                            className="flex items-center gap-1.5 hover:text-purple-400 transition-colors group"
                        >
                            <span className="font-bold text-white group-hover:text-purple-400">
                                {localFollowingCount}
                            </span>
                            <span className="text-gray-400 text-sm">Following</span>
                        </button>
                    </div>

                    {/* Meta Info */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 text-sm text-gray-500">
                        {/* Wallet */}
                        {displayUser.wallet && (
                            <div className="flex items-center gap-1.5">
                                <Wallet className="w-4 h-4" />
                                <span className="font-mono text-xs">
                                    {displayUser.wallet.slice(0, 4)}...{displayUser.wallet.slice(-4)}
                                </span>
                                {isOwnProfile && (
                                    <>
                                        {isWalletConnected ? (
                                            <span className="text-green-400 text-[10px] bg-green-500/10 px-1.5 py-0.5 rounded">
                                                <Check className="w-3 h-3 inline" />
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    setWalletModalMode('reconnect');
                                                    setShowWalletModal(true);
                                                }}
                                                className="text-purple-400 text-[10px] bg-purple-500/10 hover:bg-purple-500/20 px-1.5 py-0.5 rounded transition-colors"
                                            >
                                                Reconnect
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        {/* Join Date - Placeholder since createdAt not in User type */}
                        <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            <span>Gimme Idea Member</span>
                        </div>
                    </div>

                    {/* Social Links - Display */}
                    {!isEditing && hasSocialLinks && (
                        <div className="flex gap-2 mt-4">
                            {displayUser.socials?.twitter && (
                                <a href={displayUser.socials.twitter} target="_blank" rel="noopener noreferrer" 
                                   className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                                    <Twitter className="w-4 h-4 text-gray-400 hover:text-[#1DA1F2]" />
                                </a>
                            )}
                            {displayUser.socials?.github && (
                                <a href={displayUser.socials.github} target="_blank" rel="noopener noreferrer"
                                   className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                                    <Github className="w-4 h-4 text-gray-400 hover:text-white" />
                                </a>
                            )}
                            {displayUser.socials?.telegram && (
                                <a href={displayUser.socials.telegram} target="_blank" rel="noopener noreferrer"
                                   className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                                    <Send className="w-4 h-4 text-gray-400 hover:text-[#0088cc]" />
                                </a>
                            )}
                            {displayUser.socials?.facebook && (
                                <a href={displayUser.socials.facebook} target="_blank" rel="noopener noreferrer"
                                   className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                                    <Facebook className="w-4 h-4 text-gray-400 hover:text-[#4267B2]" />
                                </a>
                            )}
                        </div>
                    )}

                    {/* Social Links - Edit */}
                    {isEditing && (
                        <div className="grid grid-cols-2 gap-3 mt-4">
                            <div className="relative">
                                <Twitter className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input 
                                    value={editForm.twitter}
                                    onChange={e => setEditForm({...editForm, twitter: e.target.value})}
                                    className="w-full bg-white/5 border border-white/20 rounded-lg pl-10 pr-3 py-2 focus:border-purple-500 outline-none text-white text-sm"
                                    placeholder="Twitter URL"
                                />
                            </div>
                            <div className="relative">
                                <Github className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input 
                                    value={editForm.github}
                                    onChange={e => setEditForm({...editForm, github: e.target.value})}
                                    className="w-full bg-white/5 border border-white/20 rounded-lg pl-10 pr-3 py-2 focus:border-purple-500 outline-none text-white text-sm"
                                    placeholder="GitHub URL"
                                />
                            </div>
                            <div className="relative">
                                <Send className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input 
                                    value={editForm.telegram}
                                    onChange={e => setEditForm({...editForm, telegram: e.target.value})}
                                    className="w-full bg-white/5 border border-white/20 rounded-lg pl-10 pr-3 py-2 focus:border-purple-500 outline-none text-white text-sm"
                                    placeholder="Telegram URL"
                                />
                            </div>
                            <div className="relative">
                                <Facebook className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input 
                                    value={editForm.facebook}
                                    onChange={e => setEditForm({...editForm, facebook: e.target.value})}
                                    className="w-full bg-white/5 border border-white/20 rounded-lg pl-10 pr-3 py-2 focus:border-purple-500 outline-none text-white text-sm"
                                    placeholder="Facebook URL"
                                />
                            </div>
                        </div>
                    )}

                    {/* Wallet Connect Button */}
                    {isOwnProfile && !displayUser.wallet && !isEditing && (
                        <button
                            onClick={() => {
                                setWalletModalMode('connect');
                                setShowWalletModal(true);
                            }}
                            className="mt-4 text-sm text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 px-4 py-2 rounded-full transition-colors flex items-center gap-2"
                        >
                            <Wallet className="w-4 h-4" /> Connect wallet to receive tips
                        </button>
                    )}

                    {/* Edit Actions */}
                    {isEditing && (
                        <div className="flex gap-3 mt-6">
                            <button 
                                onClick={handleSaveProfile}
                                className="flex-1 py-2.5 bg-white text-black rounded-full font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                            >
                                <Save className="w-4 h-4" /> Save
                            </button>
                            <button 
                                onClick={handleCancelProfile}
                                className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/20 rounded-full transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                    </div>
                </div>

                {/* Stats Bar */}
                <div className="grid grid-cols-4 border-t border-white/10">
                    <div className="py-4 text-center hover:bg-white/5 transition-colors cursor-default">
                        <div className="text-lg sm:text-xl font-bold">
                            {isLoadingStats ? '—' : (userStats?.ideasCount ?? 0)}
                        </div>
                        <div className="text-[10px] sm:text-xs text-gray-500 uppercase flex items-center justify-center gap-1">
                            <Lightbulb className="w-3 h-3" /> Ideas
                        </div>
                    </div>
                    <div className="py-4 text-center hover:bg-white/5 transition-colors cursor-default border-l border-white/10">
                        <div className="text-lg sm:text-xl font-bold text-purple-400">
                            {isLoadingStats ? '—' : (userStats?.feedbackCount ?? 0)}
                        </div>
                        <div className="text-[10px] sm:text-xs text-gray-500 uppercase flex items-center justify-center gap-1">
                            <MessageSquare className="w-3 h-3" /> Comments
                        </div>
                    </div>
                    <div className="py-4 text-center hover:bg-white/5 transition-colors cursor-default border-l border-white/10">
                        <div className="text-lg sm:text-xl font-bold text-green-400">
                            {isLoadingStats ? '—' : (userStats?.votesReceived ?? 0)}
                        </div>
                        <div className="text-[10px] sm:text-xs text-gray-500 uppercase flex items-center justify-center gap-1">
                            <TrendingUp className="w-3 h-3" /> Votes
                        </div>
                    </div>
                    <div className="py-4 text-center hover:bg-white/5 transition-colors cursor-default border-l border-white/10">
                        <div className="text-lg sm:text-xl font-bold text-yellow-400">
                            {isLoadingStats ? '—' : (userStats?.reputation ?? 0)}
                        </div>
                        <div className="text-[10px] sm:text-xs text-gray-500 uppercase flex items-center justify-center gap-1">
                            <Star className="w-3 h-3" /> Rep
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-t border-white/10">
                    <button
                        onClick={() => setActiveTab('ideas')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
                            activeTab === 'ideas' ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                        }`}
                    >
                        Ideas
                        {activeTab === 'ideas' && (
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-purple-500 rounded-full" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('feeds')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors relative border-l border-white/10 ${
                            activeTab === 'feeds' ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                        }`}
                    >
                        {isOwnProfile ? 'Your Feeds' : 'Feeds'}
                        {activeTab === 'feeds' && (
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-purple-500 rounded-full" />
                        )}
                    </button>
                </div>
            </div>

            {/* Tab Content */}
            <div className="mt-4">
                {activeTab === 'ideas' ? (
                    <>
                        {isLoadingIdeas ? (
                            <LoadingSpinner isLoading={true} size="md" text="Loading ideas..." />
                        ) : userIdeas.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {userIdeas.map(project => (
                                    <div key={project.id} className="relative group">
                                        <ProjectCard project={project} />
                                        {isOwnProfile && (
                                            <div className="absolute top-3 right-3 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        startEditingProject(project);
                                                    }}
                                                    className="p-2 bg-black/80 hover:bg-purple-900/80 text-white rounded-full border border-white/20 transition-all"
                                                    title="Edit"
                                                >
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </button>
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteProject(project.id);
                                                    }}
                                                    className="p-2 bg-black/80 hover:bg-red-900/80 text-white rounded-full border border-white/20 transition-all"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16 bg-white/5 border border-dashed border-white/10 rounded-2xl">
                                <Lightbulb className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                                <p className="text-gray-500 mb-4">No ideas shared yet</p>
                                {isOwnProfile && (
                                    <button 
                                        onClick={() => openSubmitModal('idea')} 
                                        className="text-purple-400 font-medium hover:text-purple-300 transition-colors"
                                    >
                                        Share your first idea →
                                    </button>
                                )}
                            </div>
                        )}
                    </>
                ) : (
                    /* Feeds Tab */
                    <div>
                        {isLoadingFeeds ? (
                            <LoadingSpinner isLoading={true} size="md" text="Loading feeds..." />
                        ) : userFeeds.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {userFeeds.map(feed => (
                                    <div
                                        key={feed.id}
                                        onClick={() => router.push(`/feeds/${feed.slug || feed.id}`)}
                                        className="bg-white/5 border border-white/10 rounded-2xl p-5 cursor-pointer hover:bg-white/[0.08] hover:border-white/20 transition-all group"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-[#FFD700]/20 flex items-center justify-center flex-shrink-0">
                                                <Rss className="w-6 h-6 text-[#FFD700]" />
                                            </div>
                                            <div className="flex-grow min-w-0">
                                                <h3 className="font-bold text-white group-hover:text-[#FFD700] transition-colors truncate">
                                                    {feed.name}
                                                </h3>
                                                {feed.description && (
                                                    <p className="text-sm text-gray-400 line-clamp-2 mt-1">
                                                        {feed.description}
                                                    </p>
                                                )}
                                                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        <Bookmark className="w-3.5 h-3.5" />
                                                        {feed.itemsCount} ideas
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Users className="w-3.5 h-3.5" />
                                                        {feed.followersCount} followers
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16 bg-white/5 border border-dashed border-white/10 rounded-2xl">
                                <Rss className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                                <p className="text-gray-500 mb-4">
                                    {isOwnProfile ? "You haven't created any feeds yet" : "No public feeds"}
                                </p>
                                {isOwnProfile && (
                                    <button 
                                        onClick={() => router.push('/feeds')} 
                                        className="text-[#FFD700] font-medium hover:text-[#FFD700]/80 transition-colors"
                                    >
                                        Create your first feed →
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
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
    </motion.div>
  );
};
