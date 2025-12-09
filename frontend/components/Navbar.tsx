
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Bell, Search, Menu, X, LayoutGrid, Plus, Trophy, BarChart3, User as UserIcon, Lightbulb, Heart, Rocket, LogOut, AlertCircle, MoreHorizontal, Info, Mail } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { useAuth } from '../contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { LoginButton } from './LoginButton';

const Navbar = () => {
  const {
    openConnectReminder,
    searchQuery,
    setSearchQuery,
    notifications,
    markNotificationRead,
    clearNotifications,
    setView,
    setSelectedProject
  } = useAppStore();

  const { user, signOut, setShowWalletPopup } = useAuth();

  const router = useRouter();
  const pathname = usePathname();

  const [isOpen, setIsOpen] = React.useState(false);
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const [showSearch, setShowSearch] = React.useState(false);
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [showMoreMenu, setShowMoreMenu] = React.useState(false); // New state for 'More' menu

  const searchInputRef = useRef<HTMLInputElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null); // Ref for 'More' menu

  const unreadCount = notifications.filter(n => !n.read).length;

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
    { name: 'IDEA', route: '/idea', icon: Lightbulb },
    { name: 'PROJECT', route: '/projects', icon: Rocket },
    { name: 'Donate me', route: '/donate', icon: Heart },
    { name: 'Leaderboard', route: '/home', icon: BarChart3 },
    { name: 'More', isDropdown: true, icon: MoreHorizontal } // New 'More' entry
  ];

  const moreLinks = [ // Links for the 'More' dropdown
    { name: 'Hackathon', route: '/hackathon', icon: Trophy },
    { name: 'About Us', route: '/about', icon: Info },
    { name: 'Contact', route: '/contact', icon: Mail },
  ];

  return (
    <nav className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <motion.div 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="pointer-events-auto bg-[#0F0F0F]/90 backdrop-blur-xl border border-white/5 rounded-full px-6 py-3 flex items-center justify-between w-full max-w-5xl shadow-2xl shadow-purple-900/10 relative"
      >
        {/* Logo */}
        <button onClick={() => { setView('landing'); setSelectedProject(null); router.push('/home'); }} className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 flex items-center justify-center">
             <div className="absolute inset-0 bg-[#FFD700]/20 rounded-full blur-md opacity-50 group-hover:opacity-100 transition-opacity duration-300" />
             <Image
               src="/asset/logo-gmi.png"
               alt="Gimme Idea Logo"
               width={36}
               height={36}
               className="relative z-10 object-contain"
               priority
             />
          </div>
          <div className="flex flex-col items-start leading-none hidden sm:flex">
            <span className="text-white font-bold text-lg tracking-tight">Gimme</span>
            <span className="text-[10px] font-mono text-[#FFD700] tracking-widest uppercase">Idea</span>
          </div>
        </button>

        {/* Desktop Links */}
        <div className={`hidden md:flex items-center gap-6 lg:gap-8 ${showSearch ? 'opacity-0 pointer-events-none' : 'opacity-100'} transition-opacity duration-300`}>
          {navLinks.map((link) => {
            if (link.isDropdown) {
              return (
                <div key={link.name} className="relative" ref={moreMenuRef}>
                  <button
                    onClick={handleMoreMenuClick}
                    className={`text-sm font-medium transition-all duration-300 flex items-center gap-2 group
                      ${showMoreMenu ? 'text-white font-bold' : 'text-gray-400'}`}
                  >
                    <link.icon className={`w-4 h-4 transition-colors duration-300 ${
                        showMoreMenu ? 'text-white' : 'group-hover:text-[#FFD700]'
                    }`} />
                    <span className={`bg-clip-text transition-all duration-300 ${
                        showMoreMenu
                        ? 'text-white'
                        : 'text-gray-400 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-[#FFD700]'
                    }`}>
                      {link.name}
                    </span>
                  </button>
                  <AnimatePresence>
                    {showMoreMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-48 bg-[#0F0F0F] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 py-1"
                      >
                        {moreLinks.map((subLink) => (
                          <button
                            key={subLink.name}
                            onClick={() => {
                              router.push(subLink.route);
                              setShowMoreMenu(false);
                            }}
                            className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2"
                          >
                            <subLink.icon className="w-4 h-4" /> {subLink.name}
                          </button>
                        ))}
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
                onClick={() => router.push(link.route)}
                className={`text-sm font-medium transition-all duration-300 flex items-center gap-2 group
                  ${isActive ? 'text-white font-bold' : 'text-gray-400'}`}
              >
                <link.icon className={`w-4 h-4 transition-colors duration-300 ${
                    isActive ? 'text-white' : 'group-hover:text-[#FFD700]'
                }`} />

                <span className={`bg-clip-text transition-all duration-300 ${
                    isActive
                    ? 'text-white'
                    : 'text-gray-400 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-[#FFD700]'
                }`}>
                  {link.name}
                </span>
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
             onClick={() => setShowSearch(!showSearch)}
             className={`p-2 transition-colors ${showSearch ? 'text-accent' : 'text-gray-400 hover:text-white'}`}
          >
            {showSearch ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
          </button>

        {user ? (
            <div className="flex items-center gap-3 relative">
              {/* Notifications */}
              <div className="relative" ref={notificationRef}>
                  <button 
                      onClick={handleNotificationClick}
                      className={`p-2 transition-colors relative ${showNotifications ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full animate-pulse" />
                    )}
                  </button>

                  <AnimatePresence>
                      {showNotifications && (
                          <motion.div 
                             initial={{ opacity: 0, y: 10, scale: 0.95 }}
                             animate={{ opacity: 1, y: 0, scale: 1 }}
                             exit={{ opacity: 0, y: 10, scale: 0.95 }}
                             className="absolute top-full right-0 mt-4 w-80 bg-[#0F0F0F] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                          >
                             <div className="p-3 border-b border-white/5 flex justify-between items-center">
                                 <span className="text-xs font-bold text-gray-400 uppercase">Notifications</span>
                                 {notifications.length > 0 && (
                                     <button onClick={clearNotifications} className="text-xs text-red-400 hover:text-red-300">Clear All</button>
                                 )}
                             </div>
                             <div className="max-h-64 overflow-y-auto">
                                {notifications.length > 0 ? (
                                    notifications.map(notif => (
                                        <div 
                                            key={notif.id} 
                                            className={`p-3 border-b border-white/5 hover:bg-white/5 transition-colors ${!notif.read ? 'bg-white/[0.02]' : ''}`}
                                            onClick={() => markNotificationRead(notif.id)}
                                        >
                                            <p className="text-sm text-gray-200 mb-1">{notif.message}</p>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] text-gray-500 font-mono">{notif.timestamp}</span>
                                                {!notif.read && <span className="w-1.5 h-1.5 bg-accent rounded-full" />}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-6 text-center text-gray-500 text-sm">
                                        No new notifications
                                    </div>
                                )}
                             </div>
                          </motion.div>
                      )}
                  </AnimatePresence>
              </div>
              
              {/* User Menu */}
              <div className="relative group">
                  <div
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 px-1 pr-4 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full cursor-pointer transition-all"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 overflow-hidden relative">
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
                    <div className="hidden sm:flex flex-col items-start">
                      <span className="text-sm font-mono font-medium text-gray-300 group-hover:text-white max-w-[100px] truncate">{user.username}</span>
                      {user.needsWalletConnect && (
                        <span className="text-[10px] text-yellow-400 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> No wallet
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Dropdown Menu */}
                  {showUserMenu && (
                     <div className="absolute top-full right-0 mt-2 w-56 bg-[#0F0F0F] border border-white/10 rounded-xl shadow-xl overflow-hidden py-1 z-50">
                        <div className="px-4 py-3 border-b border-white/5">
                          <p className="text-sm font-medium text-white truncate">{user.username}</p>
                          <p className="text-xs text-gray-400 truncate">{user.email || user.wallet}</p>
                        </div>
                        <button
                             onClick={() => { router.push('/profile'); setShowUserMenu(false); }}
                             className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2"
                        >
                            <UserIcon className="w-4 h-4" /> My Profile
                        </button>
                        {user.needsWalletConnect && (
                          <button
                               onClick={() => { setShowWalletPopup(true); setShowUserMenu(false); }}
                               className="w-full text-left px-4 py-3 text-sm text-yellow-400 hover:bg-yellow-500/10 flex items-center gap-2"
                          >
                              <Wallet className="w-4 h-4" /> Connect Wallet
                          </button>
                        )}
                        <button
                             onClick={() => { signOut(); setShowUserMenu(false); router.push('/home'); }}
                             className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 border-t border-white/5"
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
          <button onClick={() => setIsOpen(!isOpen)} className="md:hidden text-white">
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>
      </motion.div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="pointer-events-auto absolute top-20 left-4 right-4 bg-[#0F0F0F] border border-white/10 rounded-2xl p-4 flex flex-col gap-4 md:hidden shadow-2xl z-50"
        >
          {navLinks.map((link) => {
            if (link.isDropdown) {
              return (
                <div key={link.name}>
                  <button
                    onClick={() => setShowMoreMenu(!showMoreMenu)}
                    className="px-4 py-3 hover:bg-white/5 rounded-xl text-gray-300 text-left flex items-center gap-3"
                  >
                    <link.icon className="w-5 h-5" />
                    {link.name}
                  </button>
                  <AnimatePresence>
                    {showMoreMenu && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        {moreLinks.map((subLink) => (
                          <button
                            key={subLink.name}
                            onClick={() => {
                              router.push(subLink.route);
                              setIsOpen(false);
                              setShowMoreMenu(false);
                            }}
                            className="w-full text-left pl-10 pr-4 py-3 text-sm text-gray-400 hover:bg-white/5 rounded-xl flex items-center gap-3"
                          >
                            <subLink.icon className="w-4 h-4" />
                            {subLink.name}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            }
            return (
              <button
                key={link.name}
                onClick={() => {
                  router.push(link.route);
                  setIsOpen(false);
                }}
                className="px-4 py-3 hover:bg-white/5 rounded-xl text-gray-300 text-left flex items-center gap-3"
              >
                <link.icon className="w-5 h-5" />
                {link.name}
              </button>
            );
          })}
          {user && (
              <button
                onClick={() => {
                    router.push('/profile');
                    setIsOpen(false);
                }}
                className="px-4 py-3 hover:bg-white/5 rounded-xl text-gray-300 text-left flex items-center gap-3 border-t border-white/5"
              >
                  <UserIcon className="w-5 h-5" /> My Profile
              </button>
          )}
        </motion.div>
      )}
    </nav>
  );
};

export default Navbar;
