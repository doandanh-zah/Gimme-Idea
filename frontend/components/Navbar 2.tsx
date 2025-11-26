
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Bell, Search, Menu, X, LayoutGrid, Plus, Trophy, BarChart3, User as UserIcon, Trash2, Zap } from 'lucide-react';
import { useAppStore } from '../lib/store';

const Navbar = () => {
  const { 
    walletConnected, 
    openWalletModal, 
    user, 
    disconnectWallet, 
    currentView, 
    setView, 
    searchQuery, 
    setSearchQuery,
    notifications,
    markNotificationRead,
    clearNotifications
  } = useAppStore();
  
  const [isOpen, setIsOpen] = React.useState(false);
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const [showSearch, setShowSearch] = React.useState(false);
  const [showNotifications, setShowNotifications] = React.useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
            setShowNotifications(false);
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
      if (currentView !== 'dashboard') {
          setView('dashboard');
      }
  };

  const handleNotificationClick = () => {
      setShowNotifications(!showNotifications);
      // Mark displayed as read after a delay
      if (!showNotifications && unreadCount > 0) {
          // Optional: Mark all as read on open or handle individual clicks
      }
  };

  const navLinks = [
    { name: 'Explore', view: 'dashboard', icon: LayoutGrid },
    { name: 'Upload', view: 'upload', icon: Plus },
    { name: 'Leaderboard', view: 'landing', icon: BarChart3 }, // Fallback for now
  ];

  return (
    <nav className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <motion.div 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="pointer-events-auto bg-[#0F0F0F]/90 backdrop-blur-xl border border-white/5 rounded-full px-6 py-3 flex items-center justify-between w-full max-w-5xl shadow-2xl shadow-purple-900/10 relative"
      >
        {/* Logo - G Lightbulb Design */}
        <button onClick={() => setView('landing')} className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 flex items-center justify-center">
             {/* Glow Effect */}
             <div className="absolute inset-0 bg-[#FFD700]/20 rounded-full blur-md opacity-50 group-hover:opacity-100 transition-opacity duration-300" />
             
             <svg width="36" height="36" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10">
                <defs>
                    <linearGradient id="g-bulb-gradient" x1="4" y1="4" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                        <stop offset="0" stopColor="#FFD700" />
                        <stop offset="1" stopColor="#FDB931" />
                    </linearGradient>
                    <filter id="logo-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>
                
                {/* The G-Bulb Shape */}
                {/* Start top-right, curve CCW, form base, then horizontal stroke for G */}
                <path 
                    d="M28 11C26 7 22 5 17 5C10.5 5 5 10.5 5 17C5 22 8 26 13 28V31C13 32 13.5 33 15 33H19C20.5 33 21 32 21 31V28C25 26 29 22 29 17" 
                    stroke="url(#g-bulb-gradient)" 
                    strokeWidth="3" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                />
                
                {/* The Filament / G Crossbar */}
                <path 
                    d="M29 17H19" 
                    stroke="url(#g-bulb-gradient)" 
                    strokeWidth="3" 
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                
                {/* Base Detail */}
                <path d="M13 33H21" stroke="#9945FF" strokeWidth="2" strokeLinecap="round" />
                <path d="M14 35H20" stroke="#9945FF" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
            </svg>
          </div>
          <div className="flex flex-col items-start leading-none hidden sm:flex">
            <span className="text-white font-bold text-lg tracking-tight">Gimme</span>
            <span className="text-[10px] font-mono text-[#FFD700] tracking-widest uppercase">Idea</span>
          </div>
        </button>

        {/* Desktop Links */}
        <div className={`hidden md:flex items-center gap-8 ${showSearch ? 'opacity-0 pointer-events-none' : 'opacity-100'} transition-opacity duration-300`}>
          {navLinks.map((link) => (
            <button 
              key={link.name}
              onClick={() => setView(link.view as any)}
              className={`text-sm font-medium transition-colors flex items-center gap-2 ${currentView === link.view ? 'text-white' : 'text-gray-400 hover:text-accent'}`}
            >
              <link.icon className="w-4 h-4" />
              {link.name}
            </button>
          ))}
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
                        placeholder="Search projects, tags..."
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

          {walletConnected && user ? (
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
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 overflow-hidden">
                        {user.avatar && <img src={user.avatar} className="w-full h-full object-cover" />}
                    </div>
                    <span className="text-sm font-mono font-medium hidden sm:block text-gray-300 group-hover:text-white max-w-[100px] truncate">{user.username}</span>
                  </div>

                  {/* Dropdown Menu */}
                  {showUserMenu && (
                     <div className="absolute top-full right-0 mt-2 w-48 bg-[#0F0F0F] border border-white/10 rounded-xl shadow-xl overflow-hidden py-1 z-50">
                        <button 
                             onClick={() => { setView('profile'); setShowUserMenu(false); }}
                             className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2"
                        >
                            <UserIcon className="w-4 h-4" /> My Profile
                        </button>
                        <button 
                             onClick={() => { disconnectWallet(); setShowUserMenu(false); }}
                             className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 border-t border-white/5"
                        >
                            Log Out
                        </button>
                     </div>
                  )}
              </div>
            </div>
          ) : (
            <button 
              onClick={() => openWalletModal()}
              className="flex items-center gap-2 px-6 py-2.5 bg-white text-black rounded-full font-bold text-sm hover:bg-accent hover:scale-105 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.2)] whitespace-nowrap"
            >
              <Wallet className="w-4 h-4" />
              Connect
            </button>
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
          {navLinks.map((link) => (
            <button 
              key={link.name}
              onClick={() => {
                setView(link.view as any);
                setIsOpen(false);
              }}
              className="px-4 py-3 hover:bg-white/5 rounded-xl text-gray-300 text-left flex items-center gap-3"
            >
              <link.icon className="w-5 h-5" />
              {link.name}
            </button>
          ))}
          {user && (
              <button 
                onClick={() => {
                    setView('profile');
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
