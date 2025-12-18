'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, UserPlus, Loader2, Star } from 'lucide-react';
import Image from 'next/image';
import { apiClient } from '@/lib/api-client';

interface SearchedUser {
    id: string;
    username: string;
    avatar?: string;
    bio?: string;
    reputationScore: number;
}

interface InviteMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    onInvite: (userId: string) => void;
    teamMembers: Array<{ id?: string; userId?: string; username?: string }>;
    hackathonId?: string;
}

const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
    isOpen,
    onClose,
    onInvite,
    teamMembers,
    hackathonId
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchedUser[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [invitingUserId, setInvitingUserId] = useState<string | null>(null);

    // Get team member IDs to exclude from search
    const teamMemberIds = teamMembers.map(m => m.userId || m.id).filter(Boolean) as string[];

    // Debounced search
    const searchUsers = useCallback(async (query: string) => {
        if (!query || query.trim().length < 2) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const response = await apiClient.searchUsers(query.trim(), teamMemberIds, 10);
            if (response.success && response.data) {
                setSearchResults(response.data);
            } else {
                setSearchResults([]);
            }
        } catch (err) {
            console.error('Search users error:', err);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    }, [teamMemberIds]);

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            searchUsers(searchQuery);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, searchUsers]);

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setSearchQuery('');
            setSearchResults([]);
            setInvitingUserId(null);
        }
    }, [isOpen]);

    const handleInvite = async (userId: string) => {
        setInvitingUserId(userId);
        try {
            await onInvite(userId);
            // Remove invited user from results
            setSearchResults(prev => prev.filter(u => u.id !== userId));
        } finally {
            setInvitingUserId(null);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 50 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 50 }}
                        className="bg-surface border border-white/10 rounded-xl shadow-lg w-full max-w-lg relative overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-white/10">
                            <h2 className="text-lg font-bold text-white font-quantico flex items-center gap-2">
                                <UserPlus className="w-5 h-5 text-gold" /> Invite Member
                            </h2>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Search Input */}
                        <div className="p-4 border-b border-white/5">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="Search by username (min 2 characters)..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    autoFocus
                                    className="w-full bg-black/30 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-sm text-white focus:border-gold/50 focus:outline-none placeholder-gray-500"
                                />
                                {isSearching && (
                                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold animate-spin" />
                                )}
                            </div>
                        </div>

                        {/* Search Results */}
                        <div className="p-4 max-h-[350px] overflow-y-auto">
                            {searchQuery.length < 2 ? (
                                <div className="text-center py-8 text-gray-500 text-sm">
                                    <Search className="w-8 h-8 mx-auto mb-3 opacity-30" />
                                    <p>Type at least 2 characters to search</p>
                                </div>
                            ) : isSearching ? (
                                <div className="text-center py-8 text-gray-500 text-sm">
                                    <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-gold" />
                                    <p>Searching...</p>
                                </div>
                            ) : searchResults.length === 0 ? (
                                <div className="text-center py-8 text-gray-500 text-sm">
                                    <UserPlus className="w-8 h-8 mx-auto mb-3 opacity-30" />
                                    <p>No users found for &quot;{searchQuery}&quot;</p>
                                    <p className="text-xs mt-1 text-gray-600">Try a different search term</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {searchResults.map((user) => (
                                        <div
                                            key={user.id}
                                            className="flex items-center justify-between bg-black/20 border border-white/5 p-3 rounded-lg hover:border-white/10 transition-colors"
                                        >
                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                {user.avatar ? (
                                                    <Image
                                                        src={user.avatar}
                                                        alt={user.username}
                                                        width={40}
                                                        height={40}
                                                        className="rounded-full shrink-0"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-sm font-bold text-white shrink-0">
                                                        {user.username.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-bold text-white truncate">{user.username}</p>
                                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                                        <Star className="w-3 h-3 text-gold" />
                                                        <span>{user.reputationScore} rep</span>
                                                        {user.bio && (
                                                            <>
                                                                <span>•</span>
                                                                <span className="truncate">{user.bio.slice(0, 30)}{user.bio.length > 30 ? '...' : ''}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleInvite(user.id)}
                                                disabled={invitingUserId === user.id}
                                                className="shrink-0 ml-3 bg-gold text-black text-xs font-bold px-4 py-2 rounded-lg hover:bg-gold/90 transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {invitingUserId === user.id ? (
                                                    <>
                                                        <Loader2 className="w-3 h-3 animate-spin" />
                                                        Inviting...
                                                    </>
                                                ) : (
                                                    <>
                                                        <UserPlus className="w-3 h-3" />
                                                        Invite
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer hint */}
                        <div className="px-4 py-3 bg-black/20 border-t border-white/5">
                            <p className="text-[10px] text-gray-500 text-center">
                                Invited users will receive a notification and can accept or decline.
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default InviteMemberModal;