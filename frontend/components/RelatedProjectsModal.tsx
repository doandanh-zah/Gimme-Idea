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
    RefreshCw,
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
    ideaCategory?: string;
    ideaTags?: string[];
}

export const RelatedProjectsModal: React.FC<RelatedProjectsModalProps> = ({
    isOpen,
    onClose,
    ideaId,
    ideaTitle,
    ideaProblem = '',
    ideaSolution = '',
    ideaCategory,
    ideaTags,
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
    const [aiSummary, setAiSummary] = useState<string>('');
    const [sourceFilter, setSourceFilter] = useState<string>('all');

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

                // Restore cached AI summary if available
                try {
                    const cached = localStorage.getItem(`aiSummary_${ideaId}`);
                    if (cached) setAiSummary(cached);
                } catch { /* ignore */ }

                // If no AI-detected results exist, trigger a search automatically
                if (aiResults.length === 0 && ideaTitle && ideaProblem && ideaSolution) {
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
        setIsSearching(true);
        try {
            const searchResponse = await apiClient.searchRelatedProjects({
                ideaId,
                title: ideaTitle,
                problem: ideaProblem,
                solution: ideaSolution,
                category: ideaCategory,
                tags: ideaTags,
            });

            if (searchResponse.success && searchResponse.data) {
                const results = searchResponse.data.results || [];
                setAiDetected(results);

                // Store AI summary
                if (searchResponse.data.aiSummary) {
                    setAiSummary(searchResponse.data.aiSummary);
                    try { localStorage.setItem(`aiSummary_${ideaId}`, searchResponse.data.aiSummary); } catch { /* ignore */ }
                }

                if (searchResponse.data.quotaInfo) {
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

    const sourceCounts = aiDetected.reduce<Record<string, number>>((acc, project) => {
        acc[project.source] = (acc[project.source] || 0) + 1;
        return acc;
    }, {});

    const sourceFilters = Object.entries(sourceCounts)
        .sort((a, b) => Number(b[1]) - Number(a[1]))
        .slice(0, 6);

    const filteredAiDetected = sourceFilter === 'all'
        ? aiDetected
        : aiDetected.filter((project) => project.source === sourceFilter);

    const rankedAiProjects = [...filteredAiDetected].sort((a, b) => b.score - a.score);
    const totalProjects = aiDetected.length + userPinned.length;

    const getSourceBadgeClasses = (source: string) => {
        if (['producthunt.com', 'crunchbase.com', 'g2.com', 'ycombinator.com', 'betalist.com'].includes(source)) {
            return 'bg-emerald-500/10 text-emerald-300 border-emerald-400/20';
        }

        if (source === 'github.com') {
            return 'bg-slate-400/10 text-slate-200 border-slate-300/20';
        }

        return 'bg-cyan-500/10 text-cyan-300 border-cyan-400/20';
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ duration: 0.2 }}
                    className="w-full max-w-4xl max-h-[92vh] overflow-hidden rounded-[28px] border border-white/10 bg-[#0D1118] shadow-2xl"
                    style={{ boxShadow: '0 28px 90px rgba(6, 182, 212, 0.12)' }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="relative border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_34%),radial-gradient(circle_at_top_right,rgba(250,204,21,0.1),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0))]">
                        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.04),transparent_35%,transparent_65%,rgba(255,255,255,0.02))]" />
                        <div className="relative z-10 px-6 py-6 sm:px-8 sm:py-7">
                            <div className="flex items-start gap-4">
                                <div className="hidden h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 sm:flex">
                                    <Search className="h-7 w-7 text-cyan-200" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200">
                                        <Sparkles className="h-3.5 w-3.5" />
                                        Related Projects
                                    </div>
                                    <h2 className="mt-4 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                                        Similar products around this idea
                                    </h2>
                                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 sm:text-[15px]">
                                        Quick market context for
                                        <span className="mx-1 font-semibold text-white">{ideaTitle}</span>
                                        with AI-discovered references and community submissions.
                                    </p>
                                    <div className="mt-4 flex flex-wrap items-center gap-2">
                                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
                                            {totalProjects} total
                                        </span>
                                        <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-100">
                                            {aiDetected.length} AI matches
                                        </span>
                                        <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs font-semibold text-amber-100">
                                            {userPinned.length} community pins
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex flex-wrap items-center gap-2">
                                {user && !userHasPinned && !showPinForm && (
                                    <button
                                        onClick={() => setShowPinForm(true)}
                                        className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-sm font-medium text-amber-50 transition-all hover:bg-amber-300/15"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Pin Your Project
                                    </button>
                                )}
                                <button
                                    onClick={handleClearProjects}
                                    disabled={aiDetected.length === 0}
                                    className="inline-flex items-center gap-2 rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-sm font-medium text-red-200 transition-all hover:bg-red-400/15 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-slate-500"
                                    title="Clear all AI-detected projects"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Clear AI Results
                                </button>
                                <button
                                    onClick={searchForRelatedProjects}
                                    disabled={isSearching}
                                    className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-100 transition-all hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                    Refresh Search
                                </button>
                                <button
                                    onClick={onClose}
                                    className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 transition-colors hover:bg-white/10"
                                >
                                    <X className="h-5 w-5 text-slate-300" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div
                        className="max-h-[calc(92vh-188px)] overflow-y-auto"
                        style={{
                            scrollbarWidth: 'thin',
                            scrollbarColor: '#22D3EE40 transparent',
                        }}
                    >
                        {isLoading ? (
                            <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 px-6 py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-cyan-300" />
                                <p className="text-slate-300">Loading related projects...</p>
                            </div>
                        ) : (
                            <div className="space-y-6 px-6 py-6 sm:px-8 sm:py-8">
                                {aiSummary && (
                                    <div className="rounded-3xl border border-cyan-400/15 bg-cyan-400/10 p-5">
                                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200/80">
                                            <Sparkles className="h-3.5 w-3.5" />
                                            AI Summary
                                        </div>
                                        <p className="mt-3 text-sm leading-7 text-slate-100 sm:text-[15px]">
                                            {aiSummary}
                                        </p>
                                    </div>
                                )}

                                <AnimatePresence>
                                    {showPinForm && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 8 }}
                                            className="rounded-3xl border border-amber-300/20 bg-amber-300/10 p-4"
                                        >
                                            <h4 className="flex items-center gap-2 text-sm font-semibold text-amber-50">
                                                <LinkIcon className="h-4 w-4" />
                                                Pin your related project
                                            </h4>
                                            <div className="mt-3 space-y-3">
                                                <input
                                                    type="text"
                                                    placeholder="Project title"
                                                    value={pinFormData.title}
                                                    onChange={(e) => setPinFormData({ ...pinFormData, title: e.target.value })}
                                                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-amber-300/40 focus:outline-none"
                                                />
                                                <input
                                                    type="url"
                                                    placeholder="https://project-url.com"
                                                    value={pinFormData.url}
                                                    onChange={(e) => setPinFormData({ ...pinFormData, url: e.target.value })}
                                                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-amber-300/40 focus:outline-none"
                                                />
                                                <textarea
                                                    placeholder="Short description"
                                                    value={pinFormData.description}
                                                    onChange={(e) => setPinFormData({ ...pinFormData, description: e.target.value })}
                                                    rows={3}
                                                    className="w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-amber-300/40 focus:outline-none"
                                                />
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setShowPinForm(false);
                                                            setPinFormData({ title: '', url: '', description: '' });
                                                        }}
                                                        className="px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:text-white"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={handlePinProject}
                                                        disabled={isPinning}
                                                        className="inline-flex items-center gap-2 rounded-full bg-amber-300 px-4 py-2 text-xs font-semibold text-black transition-colors hover:bg-amber-200 disabled:opacity-50"
                                                    >
                                                        {isPinning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Pin className="h-3.5 w-3.5" />}
                                                        {isPinning ? 'Pinning...' : 'Pin Project'}
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-5 text-amber-50/75">
                                                <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                                                Each user can pin one project per idea.
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {isSearching && (
                                    <div className="relative overflow-hidden rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-6">
                                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_right,rgba(34,211,238,0.18),transparent_30%)]" />
                                        <div className="relative flex items-center gap-4">
                                            <Loader2 className="h-9 w-9 animate-spin text-cyan-200" />
                                            <div>
                                                <p className="text-lg font-semibold text-white">Refreshing the market scan</p>
                                                <p className="mt-1 text-sm text-cyan-100/80">
                                                    Looking for similar products, startups, and repositories tied to this idea.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <section className="space-y-4">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10">
                                                <Search className="h-4 w-4 text-cyan-200" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-white">AI matches</h3>
                                                <p className="text-sm text-slate-400">Clean, ranked references from the current search.</p>
                                            </div>
                                        </div>
                                        <span className="w-fit rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-100">
                                            {rankedAiProjects.length} visible
                                        </span>
                                    </div>

                                    {sourceFilters.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                onClick={() => setSourceFilter('all')}
                                                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${sourceFilter === 'all'
                                                    ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-100'
                                                    : 'border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]'
                                                    }`}
                                            >
                                                All sources
                                            </button>
                                            {sourceFilters.map(([source, count]) => (
                                                <button
                                                    key={source}
                                                    onClick={() => setSourceFilter(source)}
                                                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${sourceFilter === source
                                                        ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-100'
                                                        : 'border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]'
                                                        }`}
                                                >
                                                    {source} · {count}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {rankedAiProjects.length === 0 ? (
                                        <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-6 py-12 text-center">
                                            <Globe className="mx-auto h-12 w-12 text-slate-600" />
                                            <p className="mt-4 text-base font-medium text-slate-200">No AI matches in this view</p>
                                            <p className="mt-2 text-sm text-slate-500">
                                                Try another source filter or run a fresh search.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {rankedAiProjects.map((project, index) => (
                                                <motion.a
                                                    key={project.id || `${project.url}-${index}`}
                                                    href={project.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.03 }}
                                                    className="group block rounded-3xl border border-white/10 bg-white/[0.04] p-5 transition-all hover:border-cyan-400/20 hover:bg-white/[0.06]"
                                                    whileHover={{ scale: 1.01 }}
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="truncate text-base font-semibold text-white transition-colors group-hover:text-cyan-100">
                                                                    {project.title}
                                                                </h4>
                                                                <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 text-slate-500 transition-colors group-hover:text-cyan-200" />
                                                            </div>
                                                            <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-400">
                                                                {project.snippet}
                                                            </p>
                                                            <div className="mt-4 flex flex-wrap items-center gap-2">
                                                                <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${getSourceBadgeClasses(project.source)}`}>
                                                                    <Globe className="h-3.5 w-3.5" />
                                                                    {project.source}
                                                                </span>
                                                                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
                                                                    {Math.round(project.score * 100)}% match
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.a>
                                            ))}
                                        </div>
                                    )}
                                </section>

                                <section className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-300/10">
                                            <Pin className="h-4 w-4 text-amber-100" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-white">Community pinned</h3>
                                            <p className="text-sm text-slate-400">Projects shared by builders who are actually shipping.</p>
                                        </div>
                                    </div>

                                    {userPinned.length === 0 ? (
                                        <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-6 py-12 text-center">
                                            <Pin className="mx-auto h-12 w-12 text-slate-600" />
                                            <p className="mt-4 text-base font-medium text-slate-200">No community projects pinned yet</p>
                                            <p className="mt-2 text-sm text-slate-500">
                                                Add the first real-world example related to this idea.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {userPinned.map((project, index) => (
                                                <motion.div
                                                    key={project.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.03 }}
                                                    className="rounded-3xl border border-amber-300/15 bg-amber-300/10 p-5 transition-all hover:border-amber-300/25"
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="min-w-0 flex-1">
                                                            <a
                                                                href={project.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="group flex items-center gap-2"
                                                            >
                                                                <h4 className="truncate text-base font-semibold text-white transition-colors group-hover:text-amber-100">
                                                                    {project.title}
                                                                </h4>
                                                                <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 text-slate-500 transition-colors group-hover:text-amber-100" />
                                                            </a>
                                                            {project.description && (
                                                                <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-300">
                                                                    {project.description}
                                                                </p>
                                                            )}
                                                            {project.user && (
                                                                <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300">
                                                                    {project.user.avatar ? (
                                                                        <img
                                                                            src={project.user.avatar}
                                                                            alt=""
                                                                            className="h-5 w-5 rounded-full"
                                                                        />
                                                                    ) : (
                                                                        <User className="h-3.5 w-3.5" />
                                                                    )}
                                                                    by {project.user.username}
                                                                </div>
                                                            )}
                                                        </div>
                                                        {project.pinnedBy === user?.id && (
                                                            <button
                                                                onClick={handleUnpinProject}
                                                                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400 transition-colors hover:border-red-400/20 hover:bg-red-400/10 hover:text-red-200"
                                                                title="Unpin your project"
                                                            >
                                                                <PinOff className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}
                                </section>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default RelatedProjectsModal;
