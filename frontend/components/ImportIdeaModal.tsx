'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, CheckCircle2, ThumbsUp, Loader2, AlertCircle, FileUp } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Project } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';

interface ImportIdeaModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectIdea: (idea: Project) => void;
}

export default function ImportIdeaModal({ isOpen, onClose, onSelectIdea }: ImportIdeaModalProps) {
    const { user } = useAuth();
    const [ideas, setIdeas] = useState<Project[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIdea, setSelectedIdea] = useState<Project | null>(null);

    // Fetch user's ideas from the platform
    useEffect(() => {
        if (isOpen && user) {
            fetchUserIdeas();
        }
    }, [isOpen, user]);

    const fetchUserIdeas = async () => {
        if (!user) return;

        setLoading(true);
        setError(null);

        try {
            const response = await apiClient.getProjects({ type: 'idea' });

            if (response.success && response.data) {
                // Filter only ideas belonging to the current user
                const userIdeas = response.data.filter(
                    (project: Project) => project.author?.username === user.username
                );
                setIdeas(userIdeas);
            } else {
                setError('Failed to load your ideas');
            }
        } catch (err) {
            setError('Failed to load your ideas');
            console.error('Error fetching ideas:', err);
        } finally {
            setLoading(false);
        }
    };

    // Filter ideas based on search query
    const filteredIdeas = ideas.filter(idea =>
        idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        idea.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        idea.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSelectIdea = (idea: Project) => {
        setSelectedIdea(idea);
    };

    const handleConfirmImport = () => {
        if (selectedIdea) {
            onSelectIdea(selectedIdea);
            onClose();
            setSelectedIdea(null);
            setSearchQuery('');
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 modal-overlay"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className="modal-frame z-[101] max-w-2xl max-h-[82vh] flex flex-col"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="import-idea-title"
                    >
                        {/* Header */}
                        <div className="modal-header">
                            <div className="flex items-center gap-3">
                                <div className="modal-icon">
                                    <FileUp className="w-5 h-5" aria-hidden="true" />
                                </div>
                                <div>
                                    <p className="ui-eyebrow mb-2">Hackathon</p>
                                    <h2 id="import-idea-title" className="modal-title">Import Your Idea</h2>
                                    <p className="modal-description">Select an idea from your Gimme Idea submissions.</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="modal-close"
                                aria-label="Close import idea dialog"
                            >
                                <X className="w-5 h-5" aria-hidden="true" />
                            </button>
                        </div>

                        {/* Search Bar */}
                        <div className="border-b border-white/10 p-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    aria-label="Search ideas"
                                    type="text"
                                    placeholder="Search your ideas..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="field-input pl-10"
                                />
                            </div>
                        </div>

                        {/* Ideas List */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-12 gap-3">
                                    <Loader2 className="w-8 h-8 text-gold animate-spin" />
                                    <p className="text-sm text-gray-400">Loading your ideas...</p>
                                </div>
                            ) : error ? (
                                <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                                    <AlertCircle className="w-8 h-8 text-red-400" />
                                    <p className="text-sm text-gray-400">{error}</p>
                                    <button
                                        type="button"
                                        onClick={fetchUserIdeas}
                                        className="text-xs text-gold hover:underline"
                                    >
                                        Try again
                                    </button>
                                </div>
                            ) : filteredIdeas.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center">
                                        <FileUp className="w-8 h-8 text-gray-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400 mb-1">
                                            {searchQuery ? 'No ideas match your search' : 'You don\'t have any ideas yet'}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {searchQuery ? 'Try a different search term' : 'Create ideas on GimmeIdea first to import them here'}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid gap-3">
                                    {filteredIdeas.map((idea) => (
                                        <button
                                            type="button"
                                            key={idea.id}
                                            onClick={() => handleSelectIdea(idea)}
                                            className={`group relative border p-4 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700] ${selectedIdea?.id === idea.id
                                                ? 'border-gold bg-gold/10'
                                                : 'border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/5'
                                                }`}
                                            aria-pressed={selectedIdea?.id === idea.id}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[10px] text-gray-400 font-mono">
                                                    {idea.category}
                                                </span>
                                                <div
                                                    className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${selectedIdea?.id === idea.id
                                                        ? 'bg-gold border-gold'
                                                        : 'border-gray-600 group-hover:border-gray-400'
                                                        }`}
                                                >
                                                    {selectedIdea?.id === idea.id && (
                                                        <CheckCircle2 className="w-3 h-3 text-black" />
                                                    )}
                                                </div>
                                            </div>
                                            <h3 className="text-base font-bold text-white mb-1.5 group-hover:text-gold transition-colors line-clamp-1">
                                                {idea.title}
                                            </h3>
                                            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-3">
                                                {idea.description}
                                            </p>
                                            <div className="flex items-center gap-4 text-[10px] font-bold text-gray-600 uppercase tracking-tighter">
                                                <span className="flex items-center gap-1">
                                                    <ThumbsUp className="w-3 h-3" /> {idea.votes} Votes
                                                </span>
                                                <span className="text-gray-800">•</span>
                                                <span>{idea.stage}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="modal-footer items-center justify-between">
                            <div className="flex w-full items-center justify-between gap-4">
                                <p className="text-xs text-gray-500">
                                    {filteredIdeas.length} idea{filteredIdeas.length !== 1 ? 's' : ''} available
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="btn-ghost min-h-[40px] px-3 py-2 text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleConfirmImport}
                                        disabled={!selectedIdea}
                                        className="btn-primary min-h-[40px] px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <FileUp className="w-4 h-4" />
                                        Import Idea
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
