'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    ExternalLink,
    Search,
    Pin,
    PinOff,
    Loader2,
    Globe,
    User,
    Plus,
    Sparkles,
    Link as LinkIcon,
    AlertCircle,
    Trash2,
} from 'lucide-react';
import { apiClient } from '../lib/api-client';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface RelatedProject {
    id?: string;
    title: string;
    url: string;
    snippet: string;
    source: string;
    score: number;
    isPinned?: boolean;
    createdAt?: string;
}

interface UserPinnedProject {
    id: string;
    title: string;
    url: string;
    description?: string;
    pinnedBy: string;
    createdAt: string;
    user?: {
        username: string;
        avatar?: string;
    };
}

interface RelatedProjectsModalProps {
    isOpen: boolean;
    onClose: () => void;
    ideaId: string;
    ideaTitle: string;
    ideaProblem?: string;
    ideaSolution?: string;
}

export const RelatedProjectsModal: React.FC<RelatedProjectsModalProps> = ({
    isOpen,
    onClose,
    ideaId,
    ideaTitle,
    ideaProblem = '',
    ideaSolution = '',
}) => {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [isSearching, setIsSearching] = useState(false);
    const [aiDetected, setAiDetected] = useState<RelatedProject[]>([]);
    const [userPinned, setUserPinned] = useState<UserPinnedProject[]>([]);
    const [showPinForm, setShowPinForm] = useState(false);
    const [pinFormData, setPinFormData] = useState({
        title: '',
        url: '',
        description: '',
    });
    const [isPinning, setIsPinning] = useState(false);

    // Fetch related projects on mount
    useEffect(() => {
        if (isOpen && ideaId) {
            fetchRelatedProjects();
        }
    }, [isOpen, ideaId]);

    const fetchRelatedProjects = async () => {
        setIsLoading(true);
        try {
            const response = await apiClient.getRelatedProjects(ideaId);
            if (response.success && response.data) {
                const aiResults = response.data.aiDetected || [];
                const userResults = response.data.userPinned || [];

                setAiDetected(aiResults);
                setUserPinned(userResults);

                // If no AI-detected results exist, trigger a search automatically
                if (aiResults.length === 0 && ideaTitle && ideaProblem && ideaSolution) {
                    console.log('No AI results found, triggering automatic search...');
                    await searchForRelatedProjects();
                }
            }
        } catch (error) {
            console.error('Failed to fetch related projects:', error);
            toast.error('Failed to load related projects');
        } finally {
            setIsLoading(false);
        }
    };

    const searchForRelatedProjects = async () => {
        console.log('=== STARTING SEARCH FOR RELATED PROJECTS ===');
        console.log('Idea ID:', ideaId);
        console.log('Title:', ideaTitle);
        console.log('Problem:', ideaProblem?.substring(0, 100) + '...');
        console.log('Solution:', ideaSolution?.substring(0, 100) + '...');

        setIsSearching(true);
        try {
            console.log('Calling API client searchRelatedProjects...');
            const searchResponse = await apiClient.searchRelatedProjects({
                ideaId,
                title: ideaTitle,
                problem: ideaProblem,
                solution: ideaSolution,
            });

            console.log('API Response:', searchResponse);

            if (searchResponse.success && searchResponse.data) {
                const results = searchResponse.data.results || [];
                console.log(`✅ Found ${results.length} results`);
                console.log('Results:', results);
                setAiDetected(results);

                if (searchResponse.data.quotaInfo) {
                    const { remaining, used, max } = searchResponse.data.quotaInfo;
                    console.log(`📊 Search quota: ${used}/${max} used, ${remaining} remaining`);
                    toast.success(`Found ${results.length} related projects!`);
                } else {
                    toast.success(`Found ${results.length} related projects!`);
                }
            } else {
                console.error('❌ Search failed:', searchResponse.error);
                if (searchResponse.error?.includes('Daily search limit')) {
                    toast.error('Daily search limit reached (5 searches per day)');
                } else if (searchResponse.error?.includes('quota')) {
                    toast.error('Search quota exceeded. Try again tomorrow.');
                } else {
                    toast.error(searchResponse.error || 'Failed to search for related projects');
                }
            }
        } catch (error) {
            console.error('💥 Exception during search:', error);
            toast.error('Failed to search for related projects');
        } finally {
            setIsSearching(false);
            console.log('=== SEARCH COMPLETED ===');
        }
    };

    const handlePinProject = async () => {
        if (!pinFormData.title.trim() || !pinFormData.url.trim()) {
            toast.error('Please fill in project title and URL');
            return;
        }

        // Validate URL
        try {
            new URL(pinFormData.url);
        } catch {
            toast.error('Please enter a valid URL');
            return;
        }

        setIsPinning(true);
        try {
            const response = await apiClient.pinProject({
                ideaId,
                projectTitle: pinFormData.title,
                projectUrl: pinFormData.url,
                projectDescription: pinFormData.description || undefined,
            });

            if (response.success) {
                toast.success('Your project has been pinned!');
                setPinFormData({ title: '', url: '', description: '' });
                setShowPinForm(false);
                fetchRelatedProjects(); // Refresh the list
            } else {
                toast.error(response.error || 'Failed to pin project');
            }
        } catch (error) {
            toast.error('Failed to pin project');
        } finally {
            setIsPinning(false);
        }
    };

    const handleUnpinProject = async () => {
        try {
            const response = await apiClient.unpinProject(ideaId);
            if (response.success) {
                toast.success('Project unpinned');
                fetchRelatedProjects();
            } else {
                toast.error(response.error || 'Failed to unpin project');
            }
        } catch (error) {
            toast.error('Failed to unpin project');
        }
    };

    const handleClearProjects = async () => {
        if (!confirm('⚠️ Clear all AI-detected projects for this idea?\n\nThis will delete all search results but keep user-pinned projects.')) {
            return;
        }

        try {
            const response = await apiClient.clearRelatedProjects(ideaId);
            if (response.success) {
                toast.success(`🗑️ Cleared ${response.data.deletedCount} AI-detected projects`);
                await fetchRelatedProjects(); // Refresh the list
            } else {
                toast.error(response.error || 'Failed to clear projects');
            }
        } catch (error) {
            console.error('Failed to clear projects:', error);
            toast.error('Failed to clear projects');
        }
    };

    // Check if current user has already pinned a project
    const userHasPinned = userPinned.some((p) => p.pinnedBy === user?.id);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ duration: 0.2 }}
                    className="w-full max-w-2xl max-h-[85vh] bg-gradient-to-b from-[#1a1a2e] to-[#12131a] rounded-2xl border border-white/10 overflow-hidden shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-6 border-b border-white/10 bg-gradient-to-r from-purple-500/10 to-blue-500/10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-500/20 rounded-lg">
                                    <Sparkles className="w-5 h-5 text-purple-400" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">Related Projects</h2>
                                    <p className="text-sm text-gray-400 mt-0.5">
                                        Similar projects discovered for "{ideaTitle}"
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {/* Clear AI Results Button */}
                                <button
                                    onClick={handleClearProjects}
                                    disabled={aiDetected.length === 0}
                                    className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 disabled:bg-gray-500/10 disabled:text-gray-600 disabled:cursor-not-allowed text-red-400 rounded-lg transition-colors flex items-center gap-1.5 text-sm font-medium"
                                    title="Clear all AI-detected projects"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Clear AI Results
                                </button>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto max-h-[calc(85vh-120px)] custom-scrollbar">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-3">
                                <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                                <p className="text-gray-400">Loading related projects...</p>
                            </div>
                        ) : (
                            <>
                                {/* AI Detected Projects Section */}
                                <div className="mb-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Search className="w-4 h-4 text-purple-400" />
                                        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                                            AI Detected ({aiDetected.length})
                                        </h3>
                                    </div>

                                    {isSearching ? (
                                        <div className="flex flex-col items-center justify-center py-8 bg-purple-500/5 rounded-xl border border-purple-500/20">
                                            <Loader2 className="w-8 h-8 text-purple-400 animate-spin mb-3" />
                                            <p className="text-purple-300 font-semibold">Searching the internet...</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Using AI to find similar projects
                                            </p>
                                        </div>
                                    ) : aiDetected.length === 0 ? (
                                        <div className="text-center py-8 bg-white/5 rounded-xl border border-white/5">
                                            <Globe className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                                            <p className="text-gray-500">No related projects found</p>
                                            <p className="text-xs text-gray-600 mt-1">
                                                AI couldn't find similar projects on the internet
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {aiDetected.map((project, index) => (
                                                <motion.a
                                                    key={project.id || index}
                                                    href={project.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    className="block p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 hover:border-purple-500/30 transition-all group"
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex-grow min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="font-semibold text-white truncate group-hover:text-purple-300 transition-colors">
                                                                    {project.title}
                                                                </h4>
                                                                <ExternalLink className="w-3.5 h-3.5 text-gray-500 group-hover:text-purple-400 flex-shrink-0 transition-colors" />
                                                            </div>
                                                            <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                                                                {project.snippet}
                                                            </p>
                                                            <div className="flex items-center gap-3 mt-2">
                                                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                                                    <Globe className="w-3 h-3" />
                                                                    {project.source}
                                                                </span>
                                                                {project.score > 0 && (
                                                                    <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-full">
                                                                        {Math.round(project.score * 100)}% match
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.a>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* User Pinned Projects Section */}
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <Pin className="w-4 h-4 text-[#FFD700]" />
                                            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                                                Community Pinned ({userPinned.length})
                                            </h3>
                                        </div>
                                        {user && !userHasPinned && !showPinForm && (
                                            <button
                                                onClick={() => setShowPinForm(true)}
                                                className="flex items-center gap-1.5 text-xs text-[#FFD700] hover:text-[#FFD700]/80 transition-colors"
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                                Pin Your Project
                                            </button>
                                        )}
                                    </div>

                                    {/* Pin Form */}
                                    <AnimatePresence>
                                        {showPinForm && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="mb-4 p-4 bg-[#FFD700]/10 rounded-xl border border-[#FFD700]/20"
                                            >
                                                <h4 className="text-sm font-semibold text-[#FFD700] mb-3 flex items-center gap-2">
                                                    <LinkIcon className="w-4 h-4" />
                                                    Pin Your Related Project
                                                </h4>
                                                <div className="space-y-3">
                                                    <div>
                                                        <input
                                                            type="text"
                                                            placeholder="Project Title"
                                                            value={pinFormData.title}
                                                            onChange={(e) =>
                                                                setPinFormData({ ...pinFormData, title: e.target.value })
                                                            }
                                                            className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white text-sm placeholder:text-gray-500 focus:border-[#FFD700]/50 focus:outline-none"
                                                        />
                                                    </div>
                                                    <div>
                                                        <input
                                                            type="url"
                                                            placeholder="Project URL (https://...)"
                                                            value={pinFormData.url}
                                                            onChange={(e) =>
                                                                setPinFormData({ ...pinFormData, url: e.target.value })
                                                            }
                                                            className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white text-sm placeholder:text-gray-500 focus:border-[#FFD700]/50 focus:outline-none"
                                                        />
                                                    </div>
                                                    <div>
                                                        <textarea
                                                            placeholder="Brief description (optional)"
                                                            value={pinFormData.description}
                                                            onChange={(e) =>
                                                                setPinFormData({ ...pinFormData, description: e.target.value })
                                                            }
                                                            rows={2}
                                                            className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white text-sm placeholder:text-gray-500 focus:border-[#FFD700]/50 focus:outline-none resize-none"
                                                        />
                                                    </div>
                                                    <div className="flex gap-2 justify-end">
                                                        <button
                                                            onClick={() => {
                                                                setShowPinForm(false);
                                                                setPinFormData({ title: '', url: '', description: '' });
                                                            }}
                                                            className="px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={handlePinProject}
                                                            disabled={isPinning}
                                                            className="px-4 py-1.5 text-xs bg-[#FFD700] text-black font-semibold rounded-lg hover:bg-[#FFD700]/90 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                                                        >
                                                            {isPinning ? (
                                                                <>
                                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                                    Pinning...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Pin className="w-3 h-3" />
                                                                    Pin Project
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                                <p className="text-[10px] text-gray-500 mt-2 flex items-start gap-1">
                                                    <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                                    Pin a project you've built that's related to this idea. Each user can pin one project per idea.
                                                </p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {userPinned.length === 0 && !showPinForm ? (
                                        <div className="text-center py-8 bg-white/5 rounded-xl border border-white/5">
                                            <Pin className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                                            <p className="text-gray-500">No community projects pinned yet</p>
                                            {user && (
                                                <button
                                                    onClick={() => setShowPinForm(true)}
                                                    className="mt-3 text-xs text-[#FFD700] hover:underline"
                                                >
                                                    Be the first to pin your project
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {userPinned.map((project, index) => (
                                                <motion.div
                                                    key={project.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    className="p-4 bg-[#FFD700]/5 rounded-xl border border-[#FFD700]/10 hover:border-[#FFD700]/30 transition-all"
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex-grow min-w-0">
                                                            <a
                                                                href={project.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-2 group"
                                                            >
                                                                <h4 className="font-semibold text-white truncate group-hover:text-[#FFD700] transition-colors">
                                                                    {project.title}
                                                                </h4>
                                                                <ExternalLink className="w-3.5 h-3.5 text-gray-500 group-hover:text-[#FFD700] flex-shrink-0 transition-colors" />
                                                            </a>
                                                            {project.description && (
                                                                <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                                                                    {project.description}
                                                                </p>
                                                            )}
                                                            <div className="flex items-center gap-2 mt-2">
                                                                {project.user && (
                                                                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                                        {project.user.avatar ? (
                                                                            <img
                                                                                src={project.user.avatar}
                                                                                alt=""
                                                                                className="w-4 h-4 rounded-full"
                                                                            />
                                                                        ) : (
                                                                            <User className="w-3 h-3" />
                                                                        )}
                                                                        <span>by {project.user.username}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {project.pinnedBy === user?.id && (
                                                            <button
                                                                onClick={handleUnpinProject}
                                                                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-red-400"
                                                                title="Unpin your project"
                                                            >
                                                                <PinOff className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default RelatedProjectsModal;
