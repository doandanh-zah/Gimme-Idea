'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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

    // Memoize team member IDs to prevent unnecessary re-renders
    const teamMemberIds = useMemo(() =>
        teamMembers.map(m => m.userId || m.id).filter(Boolean) as string[],
        [teamMembers]
    );

    // Use ref to store latest teamMemberIds to avoid dependency issues
    const teamMemberIdsRef = useRef(teamMemberIds);
    teamMemberIdsRef.current = teamMemberIds;

    // Debounce search input
    useEffect(() => {
        if (!searchQuery || searchQuery.trim().length < 2) {
            setSearchResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const response = await apiClient.searchUsers(searchQuery.trim(), teamMemberIdsRef.current, 10);
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
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

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
                    className="fixed inset-0 z-50 flex items-center justify-center px-4"
                    onClick={onClose}
                >
                    <div className="absolute inset-0 modal-overlay" aria-hidden="true" />
                    <motion.div
                        initial={{ scale: 0.9, y: 50 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 50 }}
                        className="modal-frame max-w-lg"
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="invite-member-title"
                    >
                        {/* Header */}
                        <div className="modal-header">
                            <div className="flex items-start gap-3">
                                <div className="modal-icon">
                                    <UserPlus className="w-5 h-5" aria-hidden="true" />
                                </div>
                                <div>
                                    <p className="ui-eyebrow mb-2">Team</p>
                                    <h2 id="invite-member-title" className="modal-title">Invite Member</h2>
                                    <p className="modal-description">Search a username and invite them to join.</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="modal-close"
                                aria-label="Close invite member dialog"
                            >
                                <X className="w-5 h-5" aria-hidden="true" />
                            </button>
                        </div>

                        {/* Search Input */}
                        <div className="border-b border-white/10 p-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    aria-label="Search username"
                                    type="text"
                                    placeholder="Search by username (min 2 characters)..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    autoFocus
                                    className="field-input pl-10"
                                />
                                {isSearching && (
                                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold animate-spin" />
                                )}
                            </div>
                        </div>

                        {/* Search Results */}
                        <div className="modal-body max-h-[350px] overflow-y-auto">
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
                                            className="flex items-center justify-between border border-white/10 bg-black/20 p-3 transition-colors hover:border-white/20"
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
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-white/10 bg-[#111] text-sm font-bold text-[#FFD700]">
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
                                                type="button"
                                                onClick={() => handleInvite(user.id)}
                                                disabled={invitingUserId === user.id}
                                                className="btn-primary ml-3 min-h-[40px] shrink-0 px-3 py-2 text-xs disabled:cursor-not-allowed"
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
                        <div className="modal-footer block">
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
