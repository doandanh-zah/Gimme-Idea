
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Bell, Search, Menu, X, LayoutGrid, Plus, BarChart3, User as UserIcon, Lightbulb, Heart, Rocket, LogOut, AlertCircle, MoreHorizontal, Info, Mail, Lock, UserPlus, MessageCircle, Sparkles, ThumbsUp, DollarSign, Map, Rss, Users, KeyRound } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { useAuth } from '../contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { LoginButton } from './LoginButton';
import { useNotifications } from '../hooks/useNotifications';
import { useTeamInvites } from '../hooks/useTeamInvites';

const Navbar = () => {
  const openConnectReminder = useAppStore((state) => state.openConnectReminder);
  const openSubmitModal = useAppStore((state) => state.openSubmitModal);
  const searchQuery = useAppStore((state) => state.searchQuery);
  const setSearchQuery = useAppStore((state) => state.setSearchQuery);
  const setView = useAppStore((state) => state.setView);
  const setSelectedProject = useAppStore((state) => state.setSelectedProject);

  const { user, signOut, setShowWalletPopup } = useAuth();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
    getNotificationPath
  } = useNotifications();
  const {
    invites: teamInvites,
    inviteCount: teamInviteCount,
    acceptInvite,
    rejectInvite
  } = useTeamInvites();

  const router = useRouter();
  const pathname = usePathname();

  // Total notification count (notifications + team invites)
  const totalUnreadCount = unreadCount + teamInviteCount;

  const [isOpen, setIsOpen] = React.useState(false);
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const [showSearch, setShowSearch] = React.useState(false);
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [showMoreMenu, setShowMoreMenu] = React.useState(false); // New state for 'More' menu
  const [respondingInviteId, setRespondingInviteId] = React.useState<string | null>(null);

  // Dynamic Menu State
  const [moreLinks, setMoreLinks] = useState([
    // Hackathon is intentionally hidden for end-user focus on Idea + GTM monetization.

    {
      name: 'Challenge',
      route: '/challenge',
      icon: Sparkles,
      status: 'open',
      id: 'challenge',
      isActive: true,
    },
    {
      name: 'Agents',
      route: '/agents',
      icon: KeyRound,
      status: 'open',
      id: 'agents',
      isActive: true,
    },
    {
      name: 'Donate',
      route: '/donate',
      icon: Heart,
      status: 'open',
      id: 'donate',
      isActive: true,
    },
    {
      name: 'Docs',
      route: '/docs',
      icon: Info,
      status: 'open',
      id: 'docs',
      isActive: true,
    },
    {
      name: 'Contact',
      route: '/contact',
      icon: Mail,
      status: 'open',
      id: 'contact',
      isActive: true,
    },
  ]);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null); // Ref for 'More' menu

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      // Handle click outside for 'More' menu
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    setShowMoreMenu(false); // Close other menus
  };

  const handleMoreMenuClick = () => {
    setShowMoreMenu(!showMoreMenu);
    setShowNotifications(false); // Close other menus
  };

  const navLinks = [
    { name: 'HOME', route: '/home', icon: LayoutGrid },
    { name: 'IDEA', route: '/idea', icon: Lightbulb },
    { name: 'LEADERBOARD', route: '/leaderboard', icon: Rocket },
    { name: 'GmiFeeds', route: '/feeds', icon: Rss },
    { name: 'More', isDropdown: true, icon: MoreHorizontal }
  ];


  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#050505]/95">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between relative">
          {/* Logo - links to landing page */}
          <button
            type="button"
            onClick={() => {
              setView('landing');
              setSelectedProject(null);
              router.push('/landing');
            }}
            className="flex items-center gap-2 group shrink-0"
          >
            <div className="relative w-8 h-8 flex items-center justify-center">
              <Image
                src="/asset/logo-gmi.png"
                alt="Gimme Idea Logo"
                width={32}
                height={32}
                className="object-contain w-7 h-7"
                priority
              />
            </div>
            <span className="font-quantico font-bold text-lg tracking-wide">
              <span className="text-white">Gimme</span>
              <span className="text-[#FFD700]">Idea</span>
            </span>
          </button>

          {/* Desktop Links — editorial mono */}
          <div className={`hidden md:flex items-center gap-1 ${showSearch ? 'opacity-0 pointer-events-none' : 'opacity-100'} transition-opacity duration-200`}>
            {navLinks.map((link) => {
              if (link.isDropdown) {
                return (
                  <div key={link.name} className="relative" ref={moreMenuRef}>
                    <button
                      type="button"
                      onClick={handleMoreMenuClick}
                      className={`flex min-h-[40px] items-center gap-1.5 px-3 py-2 text-[11px] font-mono uppercase tracking-[0.12em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700]
                      ${showMoreMenu ? 'text-[#FFD700]' : 'text-gray-400 hover:text-white'}`}
                    >
                      <span>{link.name}</span>
                    </button>
                    <AnimatePresence>
                      {showMoreMenu && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute top-full left-0 mt-0 w-48 bg-[#0a0a0a] border border-white/10 overflow-hidden z-50 py-1"
                        >
                          {moreLinks.map((subLink: any) => {
                            const isLocked = subLink.status === 'locked';
                            const style = subLink.highlight || {};

                            return (
                              <button
                                type="button"
                                key={subLink.id || subLink.name}
                                onClick={() => {
                                  if (!isLocked) {
                                    router.push(subLink.route);
                                    setShowMoreMenu(false);
                                  }
                                }}
                                disabled={isLocked}
                                style={{
                                  borderColor: style.borderColor || 'transparent',
                                  boxShadow: style.glow && style.borderColor ? `0 0 10px ${style.borderColor}40` : 'none'
                                }}
                                className={`flex min-h-[40px] w-full items-center justify-between gap-2 border-l-2 px-4 py-3 text-left text-sm transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#FFD700]
                              ${isLocked
                                    ? 'text-gray-500 cursor-not-allowed bg-white/[0.02]'
                                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                                  }`}
                              >
                                <div className="flex items-center gap-2">
                                  <subLink.icon className={`w-4 h-4 ${style.textColor ? '' : ''}`} style={{ color: style.textColor }} />
                                  <span style={{ color: style.textColor }}>{subLink.name}</span>
                                </div>

                                {isLocked ? (
                                  <Lock className="w-3 h-3 text-gray-600" />
                                ) : (
                                  style.badge && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/10 font-bold border border-white/10"
                                      style={{
                                        color: style.borderColor || 'white',
                                        borderColor: style.borderColor || 'rgba(255,255,255,0.1)'
                                      }}>
                                      {style.badge}
                                    </span>
                                  )
                                )}
                              </button>
                            )
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              }

              const isActive = pathname === link.route || (link.route !== '/' && pathname?.startsWith(link.route));
              return (
                <button
                  key={link.name}
                  type="button"
                  onClick={() => router.push(link.route)}
                  className={`relative px-3 py-2 text-[11px] font-mono uppercase tracking-[0.12em] transition-colors
                  ${isActive ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  {link.name}
                  {isActive && (
                    <span className="absolute left-3 right-3 -bottom-[13px] h-0.5 bg-[#FFD700]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Search Bar Overlay */}
          <AnimatePresence>
            {showSearch && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="absolute left-16 right-40 md:left-48 md:right-48 flex items-center"
              >
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search ideas, projects..."
                  className="w-full bg-transparent border-b border-white/20 text-white px-2 py-1 outline-none focus:border-accent font-mono text-sm"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="flex items-center gap-4 relative">
            <button
              type="button"
              aria-label={showSearch ? 'Close search' : 'Open search'}
              onClick={() => setShowSearch(!showSearch)}
              className={`min-h-[40px] min-w-[40px] p-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700] ${showSearch ? 'text-accent' : 'text-gray-400 hover:text-white'}`}
            >
              {showSearch ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
            </button>

            {user ? (
              <div className="flex items-center gap-3 relative">
                {/* Notifications */}
                <div className="relative" ref={notificationRef}>
                  <button
                    type="button"
                    aria-label="Open notifications"
                    onClick={handleNotificationClick}
                    className={`relative min-h-[40px] min-w-[40px] p-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700] ${showNotifications ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                  >
                    <Bell className="w-5 h-5" />
                    {totalUnreadCount > 0 && (
                      <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full animate-pulse" />
                    )}
                  </button>

                  <AnimatePresence>
                    {showNotifications && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="fixed sm:absolute top-20 sm:top-full inset-x-0 mx-auto sm:inset-x-auto sm:mx-0 sm:right-0 mt-0 sm:mt-4 w-[90vw] sm:w-96 max-w-[400px] bg-[#0F0F0F] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                      >
                        <div className="p-3 border-b border-white/5 flex justify-between items-center">
                          <span className="text-xs font-bold text-gray-400 uppercase">Notifications</span>
                          {notifications.length > 0 && (
                            <div className="flex items-center gap-2">
                              {unreadCount > 0 && (
                                <button type="button" onClick={markAllAsRead} className="min-h-[32px] text-xs text-blue-400 hover:text-blue-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700]">Read All</button>
                              )}
                              <button type="button" onClick={clearAll} className="min-h-[32px] text-xs text-red-400 hover:text-red-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700]">Clear All</button>
                            </div>
                          )}
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                          {/* Team Invites Section */}
                          {teamInvites.length > 0 && (
                            <div className="border-b border-gold/20">
                              <div className="px-3 py-2 bg-gold/5">
                                <span className="text-[10px] font-bold text-gold uppercase tracking-wider flex items-center gap-1">
                                  <Users className="w-3 h-3" /> Team Invitations ({teamInvites.length})
                                </span>
                              </div>
                              {teamInvites.map(invite => (
                                <div
                                  key={invite.id}
                                  className="p-3 border-b border-white/5 bg-gold/5 hover:bg-gold/10 transition-colors"
                                >
                                  <div className="flex items-start gap-3">
                                    {invite.inviterAvatar ? (
                                      <Image
                                        src={invite.inviterAvatar}
                                        alt=""
                                        width={32}
                                        height={32}
                                        className="w-8 h-8 rounded-full flex-shrink-0"
                                      />
                                    ) : (
                                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold to-yellow-600 flex items-center justify-center flex-shrink-0">
                                        <Users className="w-4 h-4 text-black" />
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm text-gray-200">
                                        <span className="text-white font-semibold">{invite.inviterName}</span> invited you to join <span className="text-gold font-semibold">{invite.teamName}</span>
                                      </p>
                                      <span className="text-[10px] text-gray-500 font-mono">
                                        {new Date(invite.createdAt).toLocaleDateString('en-US', {
                                          month: 'short',
                                          day: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </span>
                                      <div className="flex gap-2 mt-2">
                                        <button
                                          type="button"
                                          onClick={async () => {
                                            setRespondingInviteId(invite.id);
                                            const result = await acceptInvite(invite.id, invite.hackathonId);
                                            setRespondingInviteId(null);
                                            if (result.success) {
                                              setShowNotifications(false);
                                              router.push(`/hackathons/${invite.hackathonSlug || invite.hackathonId}`);
                                            }
                                          }}
                                          disabled={respondingInviteId === invite.id}
                                          className="min-h-[36px] px-3 py-1.5 bg-gold text-black text-xs font-bold rounded hover:bg-gold/90 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700] disabled:opacity-50"
                                        >
                                          {respondingInviteId === invite.id ? '...' : 'Accept'}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={async () => {
                                            setRespondingInviteId(invite.id);
                                            await rejectInvite(invite.id, invite.hackathonId);
                                            setRespondingInviteId(null);
                                          }}
                                          disabled={respondingInviteId === invite.id}
                                          className="min-h-[36px] px-3 py-1.5 bg-white/10 text-gray-300 text-xs font-bold rounded hover:bg-white/20 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700] disabled:opacity-50"
                                        >
                                          Decline
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Regular Notifications */}
                          {notifications.length > 0 ? (
                            notifications.map(notif => {
                              const NotifIcon = notif.type === 'follow' ? UserPlus
                                : notif.type === 'new_post' ? Sparkles
                                  : notif.type === 'comment' || notif.type === 'comment_reply' ? MessageCircle
                                    : notif.type === 'like' || notif.type === 'comment_like' ? ThumbsUp
                                      : notif.type === 'donation' ? DollarSign
                                        : Bell;

                              const iconBgColor = notif.type === 'donation'
                                ? 'from-green-500 to-emerald-500'
                                : notif.type === 'like' || notif.type === 'comment_like'
                                  ? 'from-pink-500 to-red-500'
                                  : 'from-purple-500 to-blue-500';

                              return (
                                <button
                                  type="button"
                                  key={notif.id}
                                  className={`w-full border-b border-white/5 p-3 text-left transition-colors hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#FFD700] ${!notif.read ? 'bg-purple-500/5' : ''}`}
                                  onClick={() => {
                                    markAsRead(notif.id);
                                    const path = getNotificationPath(notif);
                                    if (path !== '/') {
                                      router.push(path);
                                      setShowNotifications(false);
                                    }
                                  }}
                                >
                                  <div className="flex items-start gap-3">
                                    {notif.actorAvatar ? (
                                      <Image
                                        src={notif.actorAvatar}
                                        alt=""
                                        width={32}
                                        height={32}
                                        className="w-8 h-8 rounded-full flex-shrink-0"
                                      />
                                    ) : (
                                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${iconBgColor} flex items-center justify-center flex-shrink-0`}>
                                        <NotifIcon className="w-4 h-4 text-white" />
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm text-gray-200 line-clamp-2">{notif.message}</p>
                                      <div className="flex justify-between items-center mt-1">
                                        <span className="text-[10px] text-gray-500 font-mono">
                                          {new Date(notif.createdAt).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })}
                                        </span>
                                        {!notif.read && <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />}
                                      </div>
                                    </div>
                                  </div>
                                </button>
                              );
                            })
                          ) : teamInvites.length === 0 && (
                            <div className="p-8 text-center">
                              <Bell className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                              <p className="text-gray-500 text-sm">No notifications yet</p>
                              <p className="text-gray-600 text-xs mt-1">When someone follows you or comments on your ideas, you&apos;ll see it here</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* User Menu */}
                <div className="relative group">
                  <button
                    type="button"
                    aria-label="Open user menu"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex min-h-[40px] items-center gap-1 rounded-full border border-white/10 bg-white/5 px-1 py-1 transition-all hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700] sm:gap-2 sm:pr-3"
                  >
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 overflow-hidden relative flex-shrink-0">
                      {user.avatar && (
                        <Image
                          src={user.avatar}
                          alt={user.username}
                          width={32}
                          height={32}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="hidden sm:flex flex-col items-start min-w-0">
                      <span className="text-xs sm:text-sm font-mono font-medium text-gray-300 group-hover:text-white max-w-[80px] sm:max-w-[100px] truncate">{user.username}</span>
                      {user.needsWalletConnect && (
                        <span className="text-[9px] sm:text-[10px] text-yellow-400 flex items-center gap-1">
                          <AlertCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> No wallet
                        </span>
                      )}
                    </div>
                  </button>

                  {/* Dropdown Menu */}
                  {showUserMenu && (
                    <div className="absolute top-full right-0 mt-2 w-48 sm:w-56 bg-[#0F0F0F] border border-white/10 rounded-xl shadow-xl overflow-hidden py-1 z-50">
                      <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-white/5">
                        <p className="text-xs sm:text-sm font-medium text-white truncate">{user.username}</p>
                        <p className="text-[10px] sm:text-xs text-gray-400 truncate">{user.email || user.wallet}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => { router.push('/profile'); setShowUserMenu(false); }}
                        className="w-full text-left px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2"
                      >
                        <UserIcon className="w-4 h-4" /> My Profile
                      </button>

                      <button
                        type="button"
                        onClick={() => { router.push('/settings/tokens'); setShowUserMenu(false); }}
                        className="w-full text-left px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2"
                      >
                        <Lock className="w-4 h-4" /> API Tokens
                      </button>
                      {user.needsWalletConnect && (
                        <button
                          type="button"
                          onClick={() => { setShowWalletPopup(true); setShowUserMenu(false); }}
                          className="w-full text-left px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-yellow-400 hover:bg-yellow-500/10 flex items-center gap-2"
                        >
                          <Wallet className="w-4 h-4" /> Connect Wallet
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => { signOut(); setShowUserMenu(false); router.push('/landing'); }}
                        className="w-full text-left px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 border-t border-white/5"
                      >
                        <LogOut className="w-4 h-4" /> Log Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <LoginButton />
            )}

            {/* Mobile Menu Toggle */}
            <button type="button" aria-label={isOpen ? 'Close menu' : 'Open menu'} onClick={() => setIsOpen(!isOpen)} className="md:hidden min-h-[40px] min-w-[40px] text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700]">
              {isOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isOpen && (
          <div className="md:hidden border-t border-white/10 bg-[#050505] px-4 py-3 flex flex-col gap-1">
            {navLinks.map((link) => {
              if (link.isDropdown) {
                return (
                  <div key={link.name}>
                    <button
                      type="button"
                      onClick={() => setShowMoreMenu(!showMoreMenu)}
                      className="w-full px-3 py-3 hover:bg-white/5 text-gray-300 text-left flex items-center gap-3 font-mono text-xs uppercase tracking-wider"
                    >
                      <link.icon className="w-4 h-4" />
                      {link.name}
                    </button>
                    {showMoreMenu && (
                      <div>
                        {moreLinks.map((subLink) => (
                          <button
                            type="button"
                            key={subLink.name}
                            onClick={() => {
                              router.push(subLink.route);
                              setIsOpen(false);
                              setShowMoreMenu(false);
                            }}
                            className="w-full text-left pl-10 pr-3 py-2.5 text-xs text-gray-400 hover:bg-white/5 flex items-center gap-3 font-mono uppercase tracking-wider"
                          >
                            <subLink.icon className="w-3.5 h-3.5" />
                            {subLink.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
              return (
                <button
                  type="button"
                  key={link.name}
                  onClick={() => {
                    router.push(link.route);
                    setIsOpen(false);
                  }}
                  className="w-full px-3 py-3 hover:bg-white/5 text-gray-300 text-left flex items-center gap-3 font-mono text-xs uppercase tracking-wider"
                >
                  <link.icon className="w-4 h-4" />
                  {link.name}
                </button>
              );
            })}
            {user && (
              <button
                type="button"
                onClick={() => {
                  router.push('/profile');
                  setIsOpen(false);
                }}
                className="w-full px-3 py-3 hover:bg-white/5 text-gray-300 text-left flex items-center gap-3 border-t border-white/10 font-mono text-xs uppercase tracking-wider"
              >
                <UserIcon className="w-4 h-4" /> My Profile
              </button>
            )}
          </div>
        )}
      </nav>

      {/* Mobile Bottom Tab Bar — flat dock */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#050505]">
        <div className="grid grid-cols-5 items-center px-2 py-2 safe-area-pb">
          <button
            type="button"
            onClick={() => router.push('/home')}
            className={`flex flex-col items-center gap-0.5 min-h-[44px] justify-center text-[9px] font-mono uppercase tracking-wider ${pathname?.startsWith('/home') ? 'text-[#FFD700]' : 'text-gray-500'}`}
          >
            <LayoutGrid className="w-5 h-5" />
            Home
          </button>
          <button
            type="button"
            onClick={() => router.push('/idea')}
            className={`flex flex-col items-center gap-0.5 min-h-[44px] justify-center text-[9px] font-mono uppercase tracking-wider ${pathname?.startsWith('/idea') ? 'text-[#FFD700]' : 'text-gray-500'}`}
          >
            <Lightbulb className="w-5 h-5" />
            Ideas
          </button>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => openSubmitModal('idea')}
              className="w-11 h-11 rounded-sm bg-[#FFD700] text-black flex items-center justify-center"
              aria-label="Create idea"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => router.push('/feeds')}
            className={`flex flex-col items-center gap-0.5 min-h-[44px] justify-center text-[9px] font-mono uppercase tracking-wider ${pathname?.startsWith('/feeds') ? 'text-[#FFD700]' : 'text-gray-500'}`}
          >
            <Rss className="w-5 h-5" />
            Feeds
          </button>
          <button
            type="button"
            onClick={() => (user ? router.push('/profile') : openConnectReminder())}
            className={`flex flex-col items-center gap-0.5 min-h-[44px] justify-center text-[9px] font-mono uppercase tracking-wider ${pathname?.startsWith('/profile') ? 'text-[#FFD700]' : 'text-gray-500'}`}
          >
            <UserIcon className="w-5 h-5" />
            You
          </button>
        </div>
      </div>
    </>
  );
};

export default Navbar;
