
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../lib/store';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { motion } from 'framer-motion';
import { Camera, Edit2, Save, X, Github, Twitter, Facebook, Send, Pencil, Trash2, ArrowLeft, Wallet, AlertCircle, RefreshCw, Check, Repeat, Loader2 } from 'lucide-react';
import { ProjectCard } from './ProjectCard';
import { WalletReminderBadge } from './WalletReminderBadge';
import { WalletRequiredModal } from './WalletRequiredModal';
import { EditProjectModal } from './EditProjectModal';
import toast from 'react-hot-toast';
import { Project } from '../lib/types';
import { apiClient } from '../lib/api-client';
import { uploadAvatar } from '../lib/imgbb';

interface UserStats {
  reputation: number;
  ideasCount: number;
  projectsCount: number;
  feedbackCount: number;
  tipsReceived: number;
  likesReceived: number;
}

export const Profile = () => {
  const { user, viewedUser, projects, updateUserProfile, updateProject, deleteProject, openSubmitModal } = useAppStore();
  const { setShowWalletPopup, refreshUser } = useAuth();
  const router = useRouter();
  const { connected, publicKey, connect, select, wallets, disconnect } = useWallet();
  const [isEditing, setIsEditing] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletModalMode, setWalletModalMode] = useState<'reconnect' | 'connect' | 'change'>('reconnect');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Determine which profile to show: the viewedUser (from clicking an author) or the logged-in user
  const displayUser = viewedUser || user;
  const isOwnProfile = user && displayUser && user.username === displayUser.username;

  // Profile Edit Form State
  const [editForm, setEditForm] = useState({
      username: '',
      bio: '',
      twitter: '',
      github: '',
      telegram: '',
      facebook: '',
      avatar: ''
  });

  // Initialize form when displayUser changes
  useEffect(() => {
      if (displayUser) {
          setEditForm({
            username: displayUser.username,
            bio: displayUser.bio || '',
            twitter: displayUser.socials?.twitter || '',
            github: displayUser.socials?.github || '',
            telegram: displayUser.socials?.telegram || '',
            facebook: displayUser.socials?.facebook || '',
            avatar: displayUser.avatar || ''
          });
      }
  }, [displayUser]);

  // Fetch user stats when displayUser changes
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

  // Check if wallet is connected and matches user's wallet
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

  // Filter only ideas (type='idea') for the user
  const userIdeas = projects.filter(p => p.author.username === displayUser.username && p.type === 'idea');

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        toast.error('Please upload JPEG, PNG, GIF, or WebP image.');
        return;
    }

    // Check file size (max 2MB)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
        toast.error('Image size must be less than 2MB');
        return;
    }

    setIsUploadingAvatar(true);
    try {
        // Upload to imgBB instead of storing base64
        const imageUrl = await uploadAvatar(file);
        setEditForm({ ...editForm, avatar: imageUrl });
        toast.success('Avatar uploaded! Remember to save your profile.');
    } catch (error: any) {
        console.error('Avatar upload error:', error);
        toast.error(error.message || 'Failed to upload avatar. Please try again.');
    } finally {
        setIsUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
      if (!isOwnProfile) return;
      try {
          // API expects socialLinks but User type has socials, so we send the correct format to API
          await updateUserProfile({
              username: editForm.username,
              bio: editForm.bio,
              avatar: editForm.avatar,
              socialLinks: {
                  twitter: editForm.twitter,
                  github: editForm.github,
                  telegram: editForm.telegram,
                  facebook: editForm.facebook
              }
          } as any); // Type assertion needed due to API/User type mismatch
          
          // Refresh user from AuthContext to sync state
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
        avatar: user.avatar || ''
      });
      setIsEditing(false);
  };

  const startEditingProject = (project: Project) => {
      setEditingProject(project);
  };

  const handleDeleteProject = (id: string) => {
      if (window.confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
          deleteProject(id);
          toast.success("Project deleted");
      }
  };

  return (
    <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }}
        className="min-h-screen pt-20 pb-20 relative"
    >
        {/* Fixed Background */}
        <div className="fixed inset-0 z-[-1] bg-black bg-[radial-gradient(circle_at_50%_0%,#2e1065_0%,transparent_50%),radial-gradient(circle_at_100%_100%,#422006_0%,transparent_50%)]" />

        {/* Banner - Updated Gradient (Purple to Gold) */}
        <div className="h-64 w-full bg-gradient-to-r from-[#9945FF]/40 via-purple-900/40 to-[#FFD700]/20 relative">
            <div className="absolute inset-0 bg-black/20" />
            {/* Back Button if viewing another profile */}
            {!isOwnProfile && (
                <button
                    onClick={() => router.back()}
                    className="absolute top-8 left-8 z-20 bg-black/50 backdrop-blur-md p-2 rounded-full border border-white/10 hover:bg-black/70 transition-colors text-white"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
            )}
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative -mt-20">
            {/* Wallet Reminder Badge for users without wallet */}
            {isOwnProfile && displayUser.needsWalletConnect && (
              <WalletReminderBadge onConnect={() => setShowWalletPopup(true)} />
            )}

            {/* Header / Info Card */}
            <div className="bg-[#0A0A0A]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-8 shadow-2xl relative">
                <div className="flex flex-col md:flex-row gap-4 sm:gap-8 items-center md:items-start">
                    
                    {/* Avatar */}
                    <div className="relative group flex-shrink-0">
                        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-[#0A0A0A] overflow-hidden bg-gray-800 shadow-lg">
                            <img src={isEditing ? editForm.avatar : displayUser.avatar} alt="Profile" className="w-full h-full object-cover" />
                        </div>
                        
                        {/* Hidden File Input */}
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
                                className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed"
                            >
                                {isUploadingAvatar ? (
                                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                                ) : (
                                    <Camera className="w-8 h-8 text-white" />
                                )}
                            </button>
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex-grow w-full min-w-0">
                        <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start gap-4">
                            <div className="w-full min-w-0 text-center sm:text-left">
                                {isEditing ? (
                                    <div className="space-y-4 max-w-lg mx-auto sm:mx-0">
                                        <div>
                                            <label className="text-xs text-gray-500 uppercase">Username</label>
                                            <input 
                                                value={editForm.username}
                                                onChange={e => setEditForm({...editForm, username: e.target.value})}
                                                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 mt-1 focus:border-accent outline-none text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 uppercase">Bio</label>
                                            <textarea 
                                                value={editForm.bio}
                                                onChange={e => setEditForm({...editForm, bio: e.target.value})}
                                                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 mt-1 focus:border-accent outline-none text-white h-24 resize-none"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <h1 className="text-2xl sm:text-3xl font-bold font-display mb-2 break-words">{displayUser.username}</h1>
                                        {displayUser.email && (
                                          <p className="text-gray-500 text-sm mb-2 truncate">{displayUser.email}</p>
                                        )}
                                        {displayUser.wallet ? (
                                          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-4">
                                            <p className="text-gray-400 font-mono text-xs sm:text-sm bg-white/5 inline-block px-2 py-1 rounded">
                                              <Wallet className="w-3 h-3 inline mr-1" />
                                              {displayUser.wallet.slice(0, 6)}...{displayUser.wallet.slice(-4)}
                                            </p>
                                            {isOwnProfile && (
                                              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                                                {isWalletConnected ? (
                                                  <span className="text-green-400 text-xs flex items-center gap-1 bg-green-500/10 px-2 py-1 rounded">
                                                    <Check className="w-3 h-3" /> Connected
                                                  </span>
                                                ) : (
                                                  <button
                                                    onClick={() => {
                                                      setWalletModalMode('reconnect');
                                                      setShowWalletModal(true);
                                                    }}
                                                    disabled={isReconnecting}
                                                    className="text-purple-400 text-xs flex items-center gap-1 bg-purple-500/10 hover:bg-purple-500/20 px-2 py-1 rounded transition-colors disabled:opacity-50"
                                                  >
                                                    <RefreshCw className={`w-3 h-3 ${isReconnecting ? 'animate-spin' : ''}`} />
                                                    {isReconnecting ? 'Connecting...' : 'Reconnect'}
                                                  </button>
                                                )}
                                                <button
                                                  onClick={() => {
                                                    setWalletModalMode('change');
                                                    setShowWalletModal(true);
                                                  }}
                                                  className="text-yellow-400 text-xs flex items-center gap-1 bg-yellow-500/10 hover:bg-yellow-500/20 px-2 py-1 rounded transition-colors"
                                                >
                                                  <Repeat className="w-3 h-3" />
                                                  Change
                                                </button>
                                              </div>
                                            )}
                                          </div>
                                        ) : isOwnProfile ? (
                                          <button
                                            onClick={() => {
                                              setWalletModalMode('connect');
                                              setShowWalletModal(true);
                                            }}
                                            className="text-yellow-400 font-medium text-sm mb-4 bg-yellow-500/10 hover:bg-yellow-500/20 inline-flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
                                          >
                                            <Wallet className="w-4 h-4" />
                                            <span className="hidden sm:inline">Connect Wallet to Receive Tips</span>
                                            <span className="sm:hidden">Connect Wallet</span>
                                          </button>
                                        ) : (
                                          <p className="text-gray-500 font-mono text-sm mb-4 bg-white/5 inline-block px-2 py-1 rounded">
                                            No wallet connected
                                          </p>
                                        )}
                                        <p className="text-gray-300 leading-relaxed max-w-2xl mb-6 text-sm sm:text-base">{displayUser.bio || "No bio yet."}</p>
                                    </>
                                )}
                            </div>

                            {isOwnProfile && !isEditing && (
                                <button 
                                    onClick={() => setIsEditing(true)}
                                    className="px-3 sm:px-4 py-2 border border-white/10 hover:bg-white/5 rounded-full flex items-center gap-2 text-sm transition-colors flex-shrink-0 whitespace-nowrap"
                                >
                                    <Edit2 className="w-4 h-4" /> <span className="hidden sm:inline">Edit Profile</span><span className="sm:hidden">Edit</span>
                                </button>
                            )}
                        </div>

                        {/* Social Links Editing */}
                        {isEditing && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 max-w-2xl">
                                <div>
                                    <label className="text-xs text-gray-500 uppercase flex items-center gap-2"><Twitter className="w-3 h-3" /> X (Twitter)</label>
                                    <input 
                                        value={editForm.twitter}
                                        onChange={e => setEditForm({...editForm, twitter: e.target.value})}
                                        className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 mt-1 focus:border-accent outline-none text-white text-sm"
                                        placeholder="https://x.com/..."
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase flex items-center gap-2"><Github className="w-3 h-3" /> GitHub</label>
                                    <input 
                                        value={editForm.github}
                                        onChange={e => setEditForm({...editForm, github: e.target.value})}
                                        className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 mt-1 focus:border-accent outline-none text-white text-sm"
                                        placeholder="https://github.com/..."
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase flex items-center gap-2"><Send className="w-3 h-3" /> Telegram</label>
                                    <input 
                                        value={editForm.telegram}
                                        onChange={e => setEditForm({...editForm, telegram: e.target.value})}
                                        className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 mt-1 focus:border-accent outline-none text-white text-sm"
                                        placeholder="t.me/..."
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase flex items-center gap-2"><Facebook className="w-3 h-3" /> Facebook</label>
                                    <input 
                                        value={editForm.facebook}
                                        onChange={e => setEditForm({...editForm, facebook: e.target.value})}
                                        className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 mt-1 focus:border-accent outline-none text-white text-sm"
                                        placeholder="facebook.com/..."
                                    />
                                </div>
                            </div>
                        )}

                        {/* Social Links Display */}
                        {!isEditing && (
                            <div className="flex gap-3 sm:gap-4 mt-2 justify-center sm:justify-start">
                                {displayUser.socials?.twitter && (
                                    <a href={displayUser.socials.twitter} target="_blank" className="p-2 bg-white/5 rounded-full hover:bg-blue-400/20 hover:text-blue-400 transition-colors">
                                        <Twitter className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </a>
                                )}
                                {displayUser.socials?.github && (
                                    <a href={displayUser.socials.github} target="_blank" className="p-2 bg-white/5 rounded-full hover:bg-gray-500/20 hover:text-white transition-colors">
                                        <Github className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </a>
                                )}
                                {displayUser.socials?.telegram && (
                                    <a href={displayUser.socials.telegram} target="_blank" className="p-2 bg-white/5 rounded-full hover:bg-blue-500/20 hover:text-blue-500 transition-colors">
                                        <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </a>
                                )}
                                {displayUser.socials?.facebook && (
                                    <a href={displayUser.socials.facebook} target="_blank" className="p-2 bg-white/5 rounded-full hover:bg-blue-600/20 hover:text-blue-600 transition-colors">
                                        <Facebook className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </a>
                                )}
                            </div>
                        )}

                        {isEditing && (
                            <div className="flex flex-col sm:flex-row gap-3 mt-8">
                                <button 
                                    onClick={handleSaveProfile}
                                    className="px-6 sm:px-8 py-3 bg-[#ffd700] hover:bg-[#ffed4a] text-black rounded-full font-bold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,215,0,0.3)] hover:scale-105 transition-all"
                                >
                                    <Save className="w-4 h-4" /> Save
                                </button>
                                <button 
                                    onClick={handleCancelProfile}
                                    className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-gray-300 flex items-center justify-center gap-2 transition-colors"
                                >
                                    <X className="w-4 h-4" /> Cancel
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-white/5">
                    <div className="text-center">
                        <div className="text-xl sm:text-2xl font-bold text-white">
                          {isLoadingStats ? '...' : (userStats?.reputation ?? 0)}
                        </div>
                        <div className="text-[10px] sm:text-xs text-gray-500 uppercase">Reputation</div>
                    </div>
                    <div className="text-center">
                        <div className="text-xl sm:text-2xl font-bold text-purple-400">
                          {isLoadingStats ? '...' : (userStats?.ideasCount ?? 0)}
                        </div>
                        <div className="text-[10px] sm:text-xs text-gray-500 uppercase">Ideas</div>
                    </div>
                    <div className="text-center">
                        <div className="text-xl sm:text-2xl font-bold text-gold">
                          {isLoadingStats ? '...' : (userStats?.projectsCount ?? 0)}
                        </div>
                        <div className="text-[10px] sm:text-xs text-gray-500 uppercase">Projects</div>
                    </div>
                    <div className="text-center">
                        <div className="text-xl sm:text-2xl font-bold text-green-400">
                          {isLoadingStats ? '...' : (userStats?.feedbackCount ?? 0)}
                        </div>
                        <div className="text-[10px] sm:text-xs text-gray-500 uppercase">Feedback</div>
                    </div>
                </div>
            </div>

            {/* My Ideas / User Ideas */}
            <div className="mt-8 sm:mt-12">
                <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">{isOwnProfile ? "My Ideas" : `${displayUser.username}'s Ideas`}</h2>
                {userIdeas.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        {userIdeas.map(project => (
                            <div key={project.id} className="relative group">
                                <ProjectCard project={project} />
                                {/* Actions Overlay - Positioned at top right corner of the card */}
                                {isOwnProfile && (
                                    <div className="absolute top-3 right-3 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                startEditingProject(project);
                                            }}
                                            className="p-1.5 bg-black/60 hover:bg-black/90 text-white rounded-full border border-white/20 hover:border-accent transition-all shadow-lg backdrop-blur-sm"
                                            title="Edit"
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteProject(project.id);
                                            }}
                                            className="p-1.5 bg-black/60 hover:bg-red-900/80 text-white rounded-full border border-white/20 hover:border-red-500 transition-all shadow-lg backdrop-blur-sm"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-3.5 h-3.5 text-red-400 hover:text-white" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-white/5 rounded-xl border border-dashed border-white/10">
                        <p className="text-gray-500 mb-4">No ideas shared yet.</p>
                        {isOwnProfile && (
                            <button onClick={() => openSubmitModal('idea')} className="text-accent font-bold hover:underline">Share Your First Idea</button>
                        )}
                    </div>
                )}
            </div>
        </div>

        {/* Edit Project Modal - Full Featured */}
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
    </motion.div>
  );
};
