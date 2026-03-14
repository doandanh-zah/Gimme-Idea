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
    const [activeView, setActiveView] = useState<'all' | 'ai' | 'community'>('all');
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
                category: ideaCategory,
                tags: ideaTags,
            });

            console.log('API Response:', searchResponse);

            if (searchResponse.success && searchResponse.data) {
                const results = searchResponse.data.results || [];
                console.log(`✅ Found ${results.length} results`);
                console.log('Results:', results);
                setAiDetected(results);

                // Store AI summary
                if (searchResponse.data.aiSummary) {
                    setAiSummary(searchResponse.data.aiSummary);
                    try { localStorage.setItem(`aiSummary_${ideaId}`, searchResponse.data.aiSummary); } catch { /* ignore */ }
                }

                if (searchResponse.data.searchMeta) {
                    const meta = searchResponse.data.searchMeta;
                    console.log(`📊 Search meta: query="${meta.query}", fallback=${meta.fallbackUsed}, raw=${meta.rawCount}`);
                }

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
    const featuredProject = rankedAiProjects[0];
    const remainingAiProjects = rankedAiProjects.slice(1);
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
                    className="w-full max-w-6xl max-h-[92vh] bg-[#091018] rounded-[28px] border border-white/10 overflow-hidden shadow-2xl"
                    style={{ boxShadow: '0 28px 90px rgba(6, 182, 212, 0.12)' }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="relative border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_34%),radial-gradient(circle_at_top_right,rgba(250,204,21,0.1),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0))]">
                        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.04),transparent_35%,transparent_65%,rgba(255,255,255,0.02))]" />
                        <div className="relative z-10 px-6 py-6 sm:px-8 sm:py-7">
                            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                                <div className="min-w-0">
                                    <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-200">
                                        <Sparkles className="h-3.5 w-3.5" />
                                        Discovery Board
                                    </div>
                                    <div className="mt-4 flex items-start gap-4">
                                        <div className="hidden h-14 w-14 rounded-2xl border border-cyan-300/20 bg-cyan-400/10 sm:flex sm:items-center sm:justify-center">
                                            <Search className="h-7 w-7 text-cyan-200" />
                                        </div>
                                        <div className="min-w-0">
                                            <h2 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                                                Similar products around this idea
                                            </h2>
                                            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300 sm:text-[15px]">
                                                A research-style view for mapping the market around
                                                <span className="mx-1 font-semibold text-white">{ideaTitle}</span>
                                                with AI matches and community-built references in one place.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                                        <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Total mapped</div>
                                        <div className="mt-1 text-xl font-semibold text-white">{totalProjects}</div>
                                    </div>
                                    <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
                                        <div className="text-[11px] uppercase tracking-[0.22em] text-cyan-300/70">AI matches</div>
                                        <div className="mt-1 text-xl font-semibold text-white">{aiDetected.length}</div>
                                    </div>
                                    <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
                                        <div className="text-[11px] uppercase tracking-[0.22em] text-amber-200/70">Community pins</div>
                                        <div className="mt-1 text-xl font-semibold text-white">{userPinned.length}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex flex-wrap items-center gap-2">
                                <button
                                    onClick={handleClearProjects}
                                    disabled={aiDetected.length === 0}
                                    className="inline-flex items-center gap-2 rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-sm font-medium text-red-200 transition-all hover:bg-red-400/15 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-slate-500"
                                    title="Clear all AI-detected projects"
                                >
                                    <Trash2 className="w-4 h-4" />
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
                                    <X className="w-5 h-5 text-slate-300" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-y-auto max-h-[calc(92vh-188px)]" style={{
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#22D3EE40 transparent'
                    }}>
                        {isLoading ? (
                            <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 px-6 py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-cyan-300" />
                                <p className="text-slate-300">Loading discovery board...</p>
                            </div>
                        ) : (
                            <div className="space-y-6 px-6 py-6 sm:px-8 sm:py-8">
                                <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr_0.8fr]">
                                    <div className="rounded-3xl border border-cyan-400/15 bg-cyan-400/10 p-5">
                                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200/80">
                                            <Sparkles className="h-3.5 w-3.5" />
                                            AI Readout
                                        </div>
                                        <p className="mt-3 text-sm leading-7 text-slate-100 sm:text-[15px]">
                                            {aiSummary || 'The search agent is mapping nearby startups, products, and open-source projects to show where this idea overlaps, differentiates, or can learn from existing execution.'}
                                        </p>
                                    </div>

                                    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                                        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                                            Landscape
                                        </div>
                                        <div className="mt-4 space-y-3">
                                            <div className="flex items-center justify-between text-sm text-slate-300">
                                                <span>Sources indexed</span>
                                                <span className="font-semibold text-white">{Object.keys(sourceCounts).length}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm text-slate-300">
                                                <span>Best match confidence</span>
                                                <span className="font-semibold text-white">{featuredProject ? `${Math.round(featuredProject.score * 100)}%` : 'N/A'}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm text-slate-300">
                                                <span>Community references</span>
                                                <span className="font-semibold text-white">{userPinned.length}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-3xl border border-amber-300/15 bg-amber-300/10 p-5">
                                        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-100/80">
                                            Contribution
                                        </div>
                                        <p className="mt-3 text-sm leading-6 text-amber-50/90">
                                            Add one project your team has built to make the reference set more useful for future founders.
                                        </p>
                                        {user && !userHasPinned && !showPinForm && (
                                            <button
                                                onClick={() => setShowPinForm(true)}
                                                className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/20 px-4 py-2 text-sm font-semibold text-amber-50 transition-all hover:bg-amber-300/25"
                                            >
                                                <Plus className="h-4 w-4" />
                                                Pin Your Project
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
                                    <aside className="space-y-4 lg:sticky lg:top-0 lg:self-start">
                                        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                                            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                                                View
                                            </div>
                                            <div className="mt-3 space-y-2">
                                                {[
                                                    { key: 'all', label: 'All references', count: totalProjects },
                                                    { key: 'ai', label: 'AI matches', count: aiDetected.length },
                                                    { key: 'community', label: 'Community pins', count: userPinned.length },
                                                ].map((item) => (
                                                    <button
                                                        key={item.key}
                                                        onClick={() => setActiveView(item.key as 'all' | 'ai' | 'community')}
                                                        className={`flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left text-sm transition-all ${activeView === item.key
                                                                ? 'border-cyan-400/30 bg-cyan-400/10 text-white'
                                                                : 'border-white/10 bg-transparent text-slate-300 hover:bg-white/[0.03]'
                                                            }`}
                                                    >
                                                        <span>{item.label}</span>
                                                        <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-semibold text-slate-200">{item.count}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                                                    Source Filter
                                                </div>
                                                <button
                                                    onClick={() => setSourceFilter('all')}
                                                    className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500 hover:text-slate-300"
                                                >
                                                    Reset
                                                </button>
                                            </div>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                <button
                                                    onClick={() => setSourceFilter('all')}
                                                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${sourceFilter === 'all'
                                                            ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-100'
                                                            : 'border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]'
                                                        }`}
                                                >
                                                    All
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
                                        </div>

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
                                                            onChange={(e) =>
                                                                setPinFormData({ ...pinFormData, title: e.target.value })
                                                            }
                                                            className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-amber-300/40 focus:outline-none"
                                                        />
                                                        <input
                                                            type="url"
                                                            placeholder="https://project-url.com"
                                                            value={pinFormData.url}
                                                            onChange={(e) =>
                                                                setPinFormData({ ...pinFormData, url: e.target.value })
                                                            }
                                                            className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-amber-300/40 focus:outline-none"
                                                        />
                                                        <textarea
                                                            placeholder="Short description"
                                                            value={pinFormData.description}
                                                            onChange={(e) =>
                                                                setPinFormData({ ...pinFormData, description: e.target.value })
                                                            }
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
                                    </aside>

                                    <div className="space-y-5">
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

                                        {(activeView === 'all' || activeView === 'ai') && (
                                            <section className="space-y-4">
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10">
                                                            <Search className="h-4 w-4 text-cyan-200" />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-lg font-semibold text-white">AI matches</h3>
                                                            <p className="text-sm text-slate-400">Ranked by source confidence and topical overlap.</p>
                                                        </div>
                                                    </div>
                                                    <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-100">
                                                        {filteredAiDetected.length} visible
                                                    </span>
                                                </div>

                                                {filteredAiDetected.length === 0 ? (
                                                    <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-6 py-12 text-center">
                                                        <Globe className="mx-auto h-12 w-12 text-slate-600" />
                                                        <p className="mt-4 text-base font-medium text-slate-200">No AI matches in this view</p>
                                                        <p className="mt-2 text-sm text-slate-500">
                                                            Try another source filter or run a fresh search.
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <>
                                                        {featuredProject && (
                                                            <motion.a
                                                                key={featuredProject.id || featuredProject.url}
                                                                href={featuredProject.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                initial={{ opacity: 0, y: 10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                className="group block overflow-hidden rounded-[28px] border border-cyan-400/20 bg-[linear-gradient(135deg,rgba(34,211,238,0.14),rgba(255,255,255,0.04))] p-6"
                                                                whileHover={{ scale: 1.01 }}
                                                            >
                                                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                                                    <div className="min-w-0 flex-1">
                                                                        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-100">
                                                                            Featured match
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <h4 className="truncate text-2xl font-semibold text-white transition-colors group-hover:text-cyan-100">
                                                                                {featuredProject.title}
                                                                            </h4>
                                                                            <ExternalLink className="h-4 w-4 flex-shrink-0 text-cyan-100/70" />
                                                                        </div>
                                                                        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-200/90">
                                                                            {featuredProject.snippet}
                                                                        </p>
                                                                        <div className="mt-4 flex flex-wrap items-center gap-2">
                                                                            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${getSourceBadgeClasses(featuredProject.source)}`}>
                                                                                <Globe className="h-3.5 w-3.5" />
                                                                                {featuredProject.source}
                                                                            </span>
                                                                            <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                                                                                {Math.round(featuredProject.score * 100)}% confidence
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="w-full max-w-[220px] rounded-3xl border border-white/10 bg-black/20 p-4 lg:ml-6">
                                                                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                                                            Confidence bar
                                                                        </div>
                                                                        <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
                                                                            <div
                                                                                className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-cyan-400 to-emerald-300"
                                                                                style={{ width: `${Math.max(10, Math.round(featuredProject.score * 100))}%` }}
                                                                            />
                                                                        </div>
                                                                        <p className="mt-3 text-sm leading-6 text-slate-300">
                                                                            Best current overlap based on retrieved search evidence.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </motion.a>
                                                        )}

                                                        {remainingAiProjects.length > 0 && (
                                                            <div className="grid gap-3 xl:grid-cols-2">
                                                                {remainingAiProjects.map((project, index) => (
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
                                                                            </div>
                                                                            <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-sm font-semibold text-white">
                                                                                {Math.round(project.score * 100)}%
                                                                            </div>
                                                                        </div>
                                                                        <div className="mt-4 flex flex-wrap items-center gap-2">
                                                                            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${getSourceBadgeClasses(project.source)}`}>
                                                                                <Globe className="h-3.5 w-3.5" />
                                                                                {project.source}
                                                                            </span>
                                                                        </div>
                                                                    </motion.a>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </section>
                                        )}

                                        {(activeView === 'all' || activeView === 'community') && (
                                            <section className="space-y-4">
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-300/10">
                                                            <Pin className="h-4 w-4 text-amber-100" />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-lg font-semibold text-white">Community pinned</h3>
                                                            <p className="text-sm text-slate-400">Real projects shared by builders in the community.</p>
                                                        </div>
                                                    </div>
                                                    {!showPinForm && user && !userHasPinned && (
                                                        <button
                                                            onClick={() => setShowPinForm(true)}
                                                            className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-sm font-medium text-amber-50 transition-all hover:bg-amber-300/15"
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                            Add yours
                                                        </button>
                                                    )}
                                                </div>

                                                {userPinned.length === 0 ? (
                                                    <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-6 py-12 text-center">
                                                        <Pin className="mx-auto h-12 w-12 text-slate-600" />
                                                        <p className="mt-4 text-base font-medium text-slate-200">No community projects pinned yet</p>
                                                        <p className="mt-2 text-sm text-slate-500">
                                                            The board is ready for the first real-world implementation reference.
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="grid gap-3 xl:grid-cols-2">
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
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default RelatedProjectsModal;
