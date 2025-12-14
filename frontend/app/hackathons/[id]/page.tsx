'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
    Trophy, Calendar, Users, Clock, ChevronRight,
    Target, Zap, MessageSquare, FileText, CheckCircle2,
    AlertCircle, MoreHorizontal, Github, Disc, Link as LinkIcon,
    Monitor, Mic, SwatchBook, Code, ShieldCheck, Smartphone, UserPlus, RefreshCw, Lock, Search, Plus, Settings, LogOut, UserMinus,
    Loader2
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { format, isBefore } from 'date-fns';
import { useHackathon } from '@/hooks/useHackathon';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';

// Map icon names to Lucide React components
const LucideIconMap: { [key: string]: React.ElementType } = {
    Trophy, Calendar, Users, Clock, ChevronRight,
    Target, Zap, MessageSquare, FileText, CheckCircle2,
    AlertCircle, MoreHorizontal, Github, Disc, LinkIcon,
    Monitor, Mic, SwatchBook, Code, ShieldCheck, Smartphone, UserPlus, RefreshCw
};

const DEFAULT_NEW_TEAM = {
    name: '',
    description: '',
    tags: [],
    lookingFor: [],
    maxMembers: 5
};

export default function HackathonDashboard({ params }: { params: { id: string } }) {
    const { id } = params;
    const { user } = useAuth();

    // --- REAL DATA HOOK ---
    const { 
        hackathon, 
        announcements, 
        teams, 
        userStatus, 
        isLoading, 
        error, 
        register, 
        createTeam, 
        joinTeam, 
        submitProject 
    } = useHackathon(id);

    const searchParams = useSearchParams();
    const mockDate = searchParams.get('mockDate') || searchParams.get('mockdate');
    const now = mockDate ? new Date(mockDate) : new Date();

    // Stars background
    const [stars, setStars] = useState<{ id: number; top: string; left: string; size: number; duration: string; opacity: number }[]>([]);

    useEffect(() => {
        const newStars = Array.from({ length: 50 }).map((_, i) => ({
            id: i,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            size: Math.random() * 2 + 1,
            duration: `${Math.random() * 3 + 2}s`,
            opacity: Math.random()
        }));
        setStars(newStars);
    }, []);

    // --- TIMELINE LOGIC ---
    // Ensure timeline is an array before mapping
    const timelineData = hackathon?.timeline || [];
    const dynamicTimeline = timelineData.map((step: any, index: number) => {
        const start = new Date(step.startDate);
        const end = step.endDate ? new Date(step.endDate) : null;
        const nextStart = timelineData[index + 1] ? new Date(timelineData[index + 1].startDate) : null;

        let status = 'pending';
        if (isBefore(now, start)) {
            status = 'pending';
        } else if (end) {
            if (isBefore(now, end)) status = 'active';
            else status = 'done';
        } else {
            if (nextStart && !isBefore(now, nextStart)) status = 'done';
            else status = 'active';
        }
        return { ...step, status };
    });

    // --- TAB LOGIC ---
    // Use config from DB or fallback to default tabs
    const allTabs = hackathon?.config?.tabs || [
        { id: 'announcement', label: 'Announcements', stepId: null },
        { id: 'tracks', label: 'Tracks', stepId: null },
        { id: 'register', label: 'Registration', stepId: '1', hideAfterEnd: true },
        { id: 'team', label: 'Team', stepId: '1' },
        { id: 'submission', label: 'Submission', stepId: '2' },
        { id: 'awarding', label: 'Winner Announcement', stepId: '4' },
    ];

    const visibleTabs = allTabs
        .map((tab: any) => {
            const stepIndex = tab.stepId ? dynamicTimeline.findIndex((s: any) => s.id === tab.stepId) : -1;
            const step = stepIndex !== -1 ? dynamicTimeline[stepIndex] : null;

            let unlockDate = new Date(0); 
            let isExpired = false;

            if (step) {
                if (tab.preview && stepIndex > 0) {
                    const prevStep = dynamicTimeline[stepIndex - 1];
                    unlockDate = prevStep.endDate ? new Date(prevStep.endDate) : new Date(prevStep.startDate);
                } else {
                    unlockDate = new Date(step.startDate);
                }

                if (tab.hideAfterEnd && step.endDate) {
                    isExpired = !isBefore(now, new Date(step.endDate));
                }
            }

            // For development/demo, we might want to unlock everything if data is sparse
            // But let's stick to logic. If db data is correct, this works.
            const isLocked = isBefore(now, unlockDate);
            return { ...tab, startDate: unlockDate, isLocked, isExpired };
        })
        .filter((tab: any) => !tab.isLocked && !tab.isExpired)
        .sort((a: any, b: any) => b.startDate.getTime() - a.startDate.getTime());

    // Initialize activeTab
    const [activeTab, setActiveTab] = useState('tracks');
    
    // Auto-select tab when data loads
    useEffect(() => {
        if (!isLoading && hackathon) {
             const defaultTab = visibleTabs.some((tab: any) => tab.id === 'announcement')
                ? 'announcement'
                : visibleTabs[0]?.id || 'tracks';
             setActiveTab(defaultTab);
        }
    }, [isLoading, hackathon]);


    // --- STATE ---
    const [teamTabMode, setTeamTabMode] = useState<'teams' | 'teammates'>('teams');
    const [searchTeamQuery, setSearchTeamQuery] = useState('');
    const [isCreatingTeam, setIsCreatingTeam] = useState(false);
    const [newTeamData, setNewTeamData] = useState(DEFAULT_NEW_TEAM);
    const [expandedTrack, setExpandedTrack] = useState<number | null>(null);
    const [countdown, setCountdown] = useState({ text: 'Calculating...', label: 'Loading...' });

    // Submission State
    const [submissionData, setSubmissionData] = useState({ track: '', selectedIdeaId: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [userProjects, setUserProjects] = useState<any[]>([]);
    const [loadingProjects, setLoadingProjects] = useState(false);

    // Terminal State
    const [terminalInput, setTerminalInput] = useState('');
    const [terminalHistory, setTerminalHistory] = useState<{ type: 'command' | 'error', content: string }[]>([]);
    const [isTerminalShaking, setIsTerminalShaking] = useState(false);
    const [deniedCount, setDeniedCount] = useState(0);
    const terminalEndRef = useRef<HTMLDivElement>(null);

    // --- TERMINAL EASTER EGG LOGIC ---
    const denialMessages = new Map<number, string>([
        [5, "Bro, just give up already."],
        [10, "Did you get lost on the way to the coding IDE?"],
        [13, "Im not your terminal bro"],
        [20, "This denial message looks great, don't you think? Just written for you."],
        [42, "The answer to life, the universe, and everything is not here. Try elsewhere."],
        [100, "Okay, that's enough for today. I'm going to reboot. See you tomorrow (please don't)."],
    ]);

    const handleTerminalSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const command = terminalInput.trim();
            if (!command) return;

            setTerminalHistory(prev => [...prev, { type: 'command', content: command }]);
            setIsTerminalShaking(true);
            setTimeout(() => setIsTerminalShaking(false), 500);

            const newDeniedCount = deniedCount + 1;
            setDeniedCount(newDeniedCount);

            if (newDeniedCount <= 175) {
                const errorMessage = denialMessages.get(newDeniedCount) || "ACCESS DENIED";
                setTerminalHistory(prev => [...prev, { type: 'error', content: errorMessage }]);
            }
            setTerminalInput('');
        }
    };

    // Auto-scroll terminal
    useEffect(() => {
        terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [terminalHistory, announcements]); // Scroll on new history OR new announcements

    // --- COUNTDOWN TIMER ---
    useEffect(() => {
        if (!hackathon) return;
        const updateTimer = () => {
            const currentNow = mockDate ? new Date(mockDate) : new Date();
            const milestones: { date: Date; title: string }[] = [];
            
            // Build milestones from real timeline
            timelineData.forEach((step: any) => {
                milestones.push({ date: new Date(step.startDate), title: `Start: ${step.title}` });
                if (step.endDate) {
                    milestones.push({ date: new Date(step.endDate), title: `End: ${step.title}` });
                }
            });
            milestones.sort((a, b) => a.date.getTime() - b.date.getTime());

            const nextStep = milestones.find(m => m.date > currentNow);

            if (nextStep) {
                const diff = nextStep.date.getTime() - currentNow.getTime();
                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);

                setCountdown({
                    text: `${String(days).padStart(2, '0')}D : ${String(hours).padStart(2, '0')}H : ${String(minutes).padStart(2, '0')}M : ${String(seconds).padStart(2, '0')}S`,
                    label: `Next: ${nextStep.title.replace('Start: ', '').replace('End: ', '')}`
                });
            } else {
                setCountdown({ text: 'Hackathon Ended', label: 'Status' });
            }
        };
        updateTimer();
        if (!mockDate) {
            const interval = setInterval(updateTimer, 1000);
            return () => clearInterval(interval);
        }
    }, [hackathon, mockDate, timelineData]);

    // --- FETCH USER PROJECTS (For Submission) ---
    useEffect(() => {
        if (activeTab === 'submission' && user && userProjects.length === 0) {
           const fetchProjects = async () => {
              setLoadingProjects(true);
              try {
                 const res = await apiClient.getUserProjects(user.username);
                 if (res.success) {
                    setUserProjects(res.data || []);
                 }
              } catch(e) {
                 console.error(e);
              } finally {
                 setLoadingProjects(false);
              }
           };
           fetchProjects();
        }
     }, [activeTab, user, userProjects.length]);

    // --- ACTION HANDLERS ---
    const handleCreateTeam = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!newTeamData.name) return;
        await createTeam(newTeamData);
        setIsCreatingTeam(false);
    };

    const handleJoinTeam = async (teamId: string) => {
        if(!user) return; 
        await joinTeam(teamId);
    };

    const handleSubmitProject = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await submitProject({ 
                projectId: submissionData.selectedIdeaId, 
                track: submissionData.track 
            });
            // Ideally show toast here
        } finally {
            setIsSubmitting(false);
        }
    };


    // --- RENDER ---
    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center pt-20">
                <Loader2 className="w-10 h-10 text-gold animate-spin" />
            </div>
        );
    }

    if (error || !hackathon) {
        return (
            <div className="min-h-screen bg-background text-gray-300 pt-32 pb-10 px-4 font-sans text-sm flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-white font-quantico">404</h1>
                    <p className="text-xl text-gray-400 mt-2">Hackathon Not Found</p>
                    <Link href="/hackathons">
                        <span className="mt-4 inline-flex items-center text-gold hover:underline cursor-pointer">
                            Go to Hackathons List <ChevronRight className="w-4 h-4 ml-1" />
                        </span>
                    </Link>
                </div>
            </div>
        );
    }

    // Determine current active user team from API response
    const userTeam = userStatus.team;

    return (
        <div className="min-h-screen text-gray-300 pt-28 pb-10 px-4 font-sans text-sm relative">
            {/* Background with Stars & Grid */}
            <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
                <div className="bg-grid opacity-40"></div>
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#2e1065] rounded-full blur-[120px] animate-pulse-slow opacity-40 mix-blend-screen" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-[#422006] rounded-full blur-[120px] animate-pulse-slow opacity-40 mix-blend-screen" style={{ animationDelay: '2s' }} />
                <div className="stars-container">
                    {stars.map((star) => (
                        <div key={star.id} className="star" style={{ top: star.top, left: star.left, width: `${star.size}px`, height: `${star.size}px`, '--duration': star.duration, '--opacity': star.opacity } as React.CSSProperties} />
                    ))}
                    <div className="shooting-star" style={{ top: '20%', left: '80%' }} />
                    <div className="shooting-star" style={{ top: '60%', left: '10%', animationDelay: '2s' }} />
                </div>
            </div>

            <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* --- LEFT COLUMN: META & TIMELINE (20%) --- */}
                <aside className="lg:col-span-3 space-y-6">
                    {/* Event Info Card */}
                    <div className="bg-surface border border-white/5 rounded-xl p-4">
                        <h1 className="text-xl font-bold text-white font-quantico break-words">
                            {hackathon.title}
                        </h1>
                        <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">{hackathon.status}</p>
                        <div className="mt-4 space-y-1">
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider">{countdown.label}</p>
                            <div className="flex items-center gap-2 text-gold bg-gold/5 px-3 py-2 rounded-lg border border-gold/10">
                                <Clock className="w-4 h-4" />
                                <span className="font-mono font-bold text-xs md:text-sm">{countdown.text}</span>
                            </div>
                        </div>
                    </div>

                    {/* Slim Vertical Timeline */}
                    {dynamicTimeline.length > 0 && (
                        <div className="bg-surface border border-white/5 rounded-xl p-4">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Timeline</h3>
                            <div className="relative border-l border-white/10 ml-2 space-y-6">
                                {dynamicTimeline.map((step: any) => (
                                    <div key={step.id} className="relative pl-6 group cursor-default">
                                        <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 flex items-center justify-center">
                                            {step.status === 'active' && (
                                                <div className="absolute w-[250%] h-[250%] bg-gold rounded-full animate-ping opacity-50" />
                                            )}
                                            <div className={`relative w-full h-full rounded-full border-2 transition-all z-10
                                        ${step.status === 'done' ? 'bg-green-500 border-green-500' :
                                                    step.status === 'active' ? 'bg-gold border-gold shadow-[0_0_15px_var(--color-gold)] scale-125' :
                                                        'bg-surface border-gray-600'}`}
                                            />
                                        </div>
                                        <div className={`${step.status === 'active' ? 'text-white' : 'text-gray-500'}`}>
                                            <p className="font-medium text-xs md:text-sm">{step.title}</p>
                                            <p className="text-[10px] font-mono opacity-70">
                                                {format(new Date(step.startDate), 'MMM dd')}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tasks */}
                    {(() => {
                        const activeStep = dynamicTimeline.find((step: any) => step.status === 'active');
                        // Use hackathon.tasks from API
                        const currentTasks = hackathon.tasks?.filter((t: any) => t.phaseId === activeStep?.id) || [];

                        if (currentTasks.length === 0) return null;

                        return (
                            <div className="bg-surface border border-white/5 rounded-xl p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex flex-col">
                                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Your Tasks</h3>
                                        {activeStep && <span className="text-[10px] text-gold mt-0.5">{activeStep.title}</span>}
                                    </div>
                                    <span className="text-[10px] bg-green-900/30 text-green-400 px-1.5 py-0.5 rounded">
                                        {currentTasks.filter((t: any) => t.done).length}/{currentTasks.length}
                                    </span>
                                </div>
                                <div className="space-y-3">
                                    {currentTasks.map((task: any) => (
                                        <div key={task.id} className="flex items-start gap-3 group">
                                            <button className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors
                          ${task.done ? 'bg-green-500 border-green-500 text-black' : 'border-gray-600 hover:border-gray-400'}`}>
                                                {task.done && <CheckCircle2 className="w-3 h-3" />}
                                            </button>
                                            <span className={`text-xs ${task.done ? 'text-gray-500 line-through' : 'text-gray-300'}`}>
                                                {task.text}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })()}
                </aside>


                {/* --- CENTER COLUMN: MAIN CONTENT (55%) --- */}
                <main className="lg:col-span-6 space-y-6">

                    {/* Image Banner */}
                    {hackathon.image_url && (
                        <div className="relative w-full aspect-[6/1] rounded-xl overflow-hidden shadow-lg border border-white/5 bg-gradient-to-br from-surfaceHighlight to-background">
                            <Image
                                src={hackathon.image_url}
                                alt={`${hackathon.title} Banner`}
                                layout="fill"
                                objectFit="cover"
                                className="opacity-80 hover:opacity-100 transition-opacity duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />
                        </div>
                    )}

                    {/* Navigation Tabs */}
                    <div className="flex border-b border-white/10 overflow-x-auto">
                        {visibleTabs.map((tab: any) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-6 py-3 text-sm font-medium transition-colors whitespace-nowrap relative ${activeTab === tab.id ? 'text-gold' : 'text-gray-500 hover:text-white'
                                    }`}
                            >
                                {tab.label}
                                {activeTab === tab.id && (
                                    <motion.div layoutId="underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold" />
                                )}
                            </button>
                        ))}
                    </div>
                    
                    {/* Tab Content Area */}
                    <div className="min-h-[400px]">
                        
                        {/* 1. ANNOUNCEMENT (Restored Terminal) */}
                        {activeTab === 'announcement' && (
                            <div className="bg-black border border-green-500/30 rounded-lg p-6 font-mono text-xs shadow-[0_0_20px_rgba(34,197,94,0.1)] h-[500px] flex flex-col">
                                <div className="flex gap-1.5 mb-4">                                                                                                                     
                                    <div className="w-3 h-3 rounded-full bg-red-500/50" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                                    <div className="w-3 h-3 rounded-full bg-green-500/50" />
                                </div>
                                <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
                                    <div className="border-b border-green-500/20 pb-2 flex justify-between shrink-0">
                                        <div><span className="text-green-600">$</span> <span className="text-green-400">cat system_announcements.log</span></div>
                                        <div className="text-xs text-green-800">Connection: SECURE</div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto space-y-3 text-green-300/80 pr-2">
                                        {/* Real Announcements */}
                                        {announcements.length > 0 ? announcements.map((log: any) => (
                                            <div key={log.id} className="group">
                                                <span className="opacity-50 text-xs mr-2">[{format(new Date(log.published_at), 'MM-dd HH:mm')}]</span>
                                                <span className={log.type === 'warning' ? 'text-yellow-400' : log.type === 'success' ? 'text-green-400' : 'text-gray-300'}>
                                                    {log.content}
                                                </span>
                                            </div>
                                        )) : (
                                            <p className="text-gray-500 italic">No system logs initialized.</p>
                                        )}
                                        
                                        {/* User Terminal History */}
                                        {terminalHistory.map((item, idx) => (
                                            <div key={idx} className={`${item.type === 'error' ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                                                {item.type === 'command' ? `$ ${item.content}` : item.content}
                                            </div>
                                        ))}
                                        <div ref={terminalEndRef} />
                                    </div>

                                    {/* Input Line */}
                                    <div className="flex items-center gap-2 pt-2 border-t border-green-500/20 shrink-0">
                                        <span className="text-green-500">$</span>
                                        <div className="relative flex-1">
                                            <motion.input
                                                type="text"
                                                value={terminalInput}
                                                onChange={(e) => setTerminalInput(e.target.value)}
                                                onKeyDown={handleTerminalSubmit}
                                                className={`border outline-none font-mono w-full px-2 py-1 rounded
                                                    ${isTerminalShaking ? 'bg-red-900/20 border-red-500 text-red-500 placeholder-red-500/50' : 'bg-transparent border-transparent text-green-500'}
                                                `}
                                                animate={isTerminalShaking ? { x: [-10, 10, -10, 10, 0], y: [-5, 5, -5, 5, 0] } : {}}
                                                transition={{ duration: 0.4 }}
                                                spellCheck={false}
                                                autoComplete="off"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}                       
                        
                        {/* 2. TRACKS */}
                        {activeTab === 'tracks' && (
                            <div className="space-y-4">
                            {hackathon.tracks?.map((track: any, i: number) => {
                                const TrackIcon = LucideIconMap[track.icon as keyof typeof LucideIconMap] || Target;
                                const isExpanded = expandedTrack === i;

                                return (
                                    <div
                                        key={i}
                                        onClick={() => setExpandedTrack(isExpanded ? null : i)}
                                        className={`relative w-full overflow-hidden rounded-xl border border-white/5 bg-surface cursor-pointer transition-all duration-500 ease-out group ${isExpanded ? 'h-64' : 'h-32'}`}
                                    >
                                        <div className="absolute inset-0 flex">
                                            <div className="flex-1 p-6 flex flex-col justify-center relative z-10 max-w-[65%]">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className={`p-2 rounded-lg bg-black/40 ${track.color}`}>
                                                        <TrackIcon className="w-5 h-5" />
                                                    </div>
                                                    <h3 className="text-xl font-bold text-white font-quantico">{track.title}</h3>
                                                </div>
                                                {isExpanded && (
                                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 text-gray-400 text-sm">
                                                        <p>{track.description}</p>
                                                    </motion.div>
                                                )}
                                            </div>
                                            <div className="w-[45%] relative h-full -ml-12">
                                                <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-surface via-surface/90 to-transparent z-10 pointer-events-none" />
                                                {track.image ? (
                                                    <Image src={track.image} alt={track.title} layout="fill" objectFit="cover" className="transition-transform duration-700" />
                                                ) : (
                                                    <div className={`w-full h-full bg-gradient-to-br from-gray-800 to-black`} />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        )}

                        {/* 3. REGISTER */}
                        {activeTab === 'register' && (
                            <div className="bg-surface border border-white/5 rounded-xl p-8 text-center space-y-6">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="bg-green-500/20 text-green-500 p-3 rounded-full mb-2">
                                        <CheckCircle2 className="w-8 h-8" />
                                    </div>
                                    <h2 className="text-3xl font-bold text-white font-quantico">Registration is Open</h2>
                                    <p className="text-gray-400 max-w-lg mx-auto">
                                        Join thousands of builders in the DSUC Hackathon. Secure your spot now to access resources, find a team, and submit your project.
                                    </p>
                                </div>

                                <div className="grid md:grid-cols-3 gap-4 max-w-2xl mx-auto py-6">
                                    <div className="bg-white/5 p-4 rounded-lg">
                                        <h4 className="font-bold text-white mb-1">Create Account</h4>
                                        <p className="text-xs text-gray-500">Sign up with your wallet or email.</p>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-lg">
                                        <h4 className="font-bold text-white mb-1">Complete Profile</h4>
                                        <p className="text-xs text-gray-500">Tell us about your skills and interests.</p>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-lg">
                                        <h4 className="font-bold text-white mb-1">Join Discord</h4>
                                        <p className="text-xs text-gray-500">Connect with the community.</p>
                                    </div>
                                </div>

                                {userStatus.participant ? (
                                    <div className="bg-green-900/20 text-green-400 px-6 py-3 rounded-lg font-bold">You have registered!</div>
                                ) : (
                                    <button 
                                        onClick={register}
                                        className="bg-gold text-black text-lg font-bold px-8 py-3 rounded-lg hover:bg-gold/90 transition-transform hover:scale-105"
                                    >
                                        Register Now
                                    </button>
                                )}
                            </div>
                        )}

                        {/* 4. TEAMS */}
                        {activeTab === 'team' && (
                            <div className="space-y-6">
                                {userTeam && !isCreatingTeam ? (
                                    // --- MY TEAM DASHBOARD ---
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-start bg-surface border border-white/5 rounded-xl p-6">
                                            <div>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h2 className="text-3xl font-bold text-white font-quantico">{userTeam.name}</h2>
                                                    {/* Check if user is leader */}
                                                    <span className="bg-gold/20 text-gold text-xs px-2 py-0.5 rounded border border-gold/20">Member</span>
                                                </div>
                                                <p className="text-gray-400 text-sm">{userTeam.description}</p>
                                                <div className="flex gap-2 mt-4">
                                                    {userTeam.tags?.map((tag: string) => <span key={tag} className="text-xs bg-white/5 px-2 py-1 rounded text-gray-300">{tag}</span>)}
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button className="p-2 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                                                    <Settings className="w-5 h-5" />
                                                </button>
                                                {/* Add leave team logic later */}
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-6">
                                            {/* Members */}
                                            <div className="bg-surface border border-white/5 rounded-xl p-6">
                                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                                    <Users className="w-4 h-4 text-gold" /> Team Members
                                                </h3>
                                                <div className="space-y-3">
                                                    {userTeam.members.map((member: any, i: number) => (
                                                        <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white">
                                                                    {member.user?.username?.charAt(0)}
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-bold text-white">{member.user?.username}</p>
                                                                    <p className="text-[10px] text-gray-400">{member.role}</p>
                                                                </div>
                                                            </div>
                                                            {member.is_leader && <Trophy className="w-3 h-3 text-gold" />}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Requests / Chat Placeholder */}
                                            <div className="bg-surface border border-white/5 rounded-xl p-6">
                                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                                    <MessageSquare className="w-4 h-4 text-blue-400" /> Team Chat
                                                </h3>
                                                <div className="h-40 flex items-center justify-center text-gray-600 text-sm italic bg-black/20 rounded-lg">
                                                    Chat feature coming soon...
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : isCreatingTeam ? (
                                    // --- CREATE TEAM FORM ---
                                    <form onSubmit={handleCreateTeam} className="bg-surface border border-white/5 rounded-xl p-6 space-y-4">
                                        <h3 className="text-xl font-bold text-white">Create New Team</h3>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-1">Team Name</label>
                                            <input 
                                                type="text" 
                                                className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-white"
                                                value={newTeamData.name}
                                                onChange={e => setNewTeamData({...newTeamData, name: e.target.value})}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-1">Description</label>
                                            <textarea 
                                                className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-white"
                                                value={newTeamData.description}
                                                onChange={e => setNewTeamData({...newTeamData, description: e.target.value})}
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <button type="button" onClick={() => setIsCreatingTeam(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
                                            <button type="submit" className="px-6 py-2 bg-gold text-black font-bold rounded">Create Team</button>
                                        </div>
                                    </form>
                                ) : (
                                    // --- FIND TEAMS / TEAMMATES ---
                                    <div className="space-y-6">
                                        <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                                            <div>
                                                <h2 className="text-2xl font-bold text-white font-quantico">Find your Squad</h2>
                                                <p className="text-gray-400 text-sm">Join an existing team or find talent for your idea.</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => setIsCreatingTeam(true)}
                                                    className="flex items-center gap-2 bg-gold text-black font-bold text-xs px-4 py-2 rounded hover:bg-gold/90 transition-colors"
                                                >
                                                    <Plus className="w-3.5 h-3.5" /> Create Team
                                                </button>
                                                {/* Tab toggle logic here if needed */}
                                            </div>
                                        </div>

                                        <div className="grid gap-4">
                                            {teams.map((team: any) => (
                                                <div key={team.id} className="bg-surface border border-white/5 rounded-xl p-5 hover:border-gold/30 transition-all group">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h3 className="text-lg font-bold text-white group-hover:text-gold transition-colors">{team.name}</h3>
                                                            <div className="flex gap-2 mt-2">
                                                                {team.tags?.map((tag: any) => <span key={tag} className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-gray-400">{tag}</span>)}
                                                            </div>
                                                        </div>
                                                        <button 
                                                            onClick={() => handleJoinTeam(team.id)}
                                                            className="bg-gold text-black text-xs font-bold px-4 py-2 rounded hover:bg-gold/90 transition-colors"
                                                        >
                                                            Join Request
                                                        </button>
                                                    </div>
                                                    <div className="mt-4 flex items-center gap-6 text-xs text-gray-500">
                                                        <div className="flex items-center gap-1">
                                                            <Users className="w-3.5 h-3.5" />
                                                            {team.members.length}/{team.max_members} Members
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {teams.length === 0 && <p className="text-center text-gray-500 py-4">No teams created yet.</p>}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 5. SUBMISSION */}
                        {activeTab === 'submission' && (
                            <div className="max-w-3xl mx-auto">
                                {!isSubmitted ? (
                                    <form onSubmit={handleSubmitProject} className="bg-surface border border-white/5 rounded-xl p-8 space-y-6">
                                        <div className="text-center mb-8">
                                            <h2 className="text-2xl font-bold text-white font-quantico mb-2">Submit Your Idea</h2>
                                            <p className="text-gray-400">Select an existing idea from your profile to enter the hackathon.</p>
                                        </div>

                                        <div className="space-y-6">
                                            {/* Select Idea Grid (Fetched from User Projects) */}
                                            <div>
                                                <div className="flex justify-between items-center mb-4">
                                                    <label className="text-xs font-bold text-gray-500 uppercase">Select Idea</label>
                                                    <Link href="/idea" className="text-xs text-gold hover:underline flex items-center gap-1">
                                                        <Plus className="w-3 h-3" /> Create New Idea
                                                    </Link>
                                                </div>
                                                
                                                {loadingProjects ? (
                                                    <div className="text-center py-4"><Loader2 className="w-6 h-6 animate-spin mx-auto"/></div>
                                                ) : userProjects.length > 0 ? (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {userProjects.map(idea => {
                                                            const isSelected = submissionData.selectedIdeaId === idea.id;
                                                            return (
                                                                <div
                                                                    key={idea.id}
                                                                    onClick={() => setSubmissionData(prev => ({ 
                                                                        ...prev, 
                                                                        selectedIdeaId: idea.id,
                                                                    }))}
                                                                    className={`
                                                                        relative p-5 rounded-xl border cursor-pointer transition-all group
                                                                        ${isSelected ? 'bg-gold/5 border-gold shadow-[0_0_15px_rgba(255,215,0,0.1)]' : 'bg-black/20 border-white/10 hover:border-white/30 hover:bg-white/5'}
                                                                    `}
                                                                >
                                                                    <div className="flex justify-between items-start mb-2">
                                                                        <div className="bg-white/10 px-2 py-0.5 rounded text-[10px] text-gray-300">{idea.category}</div>
                                                                        {isSelected && <CheckCircle2 className="w-4 h-4 text-gold" />}
                                                                    </div>
                                                                    <h4 className={`font-bold mb-1 ${isSelected ? 'text-white' : 'text-gray-200'}`}>{idea.title}</h4>
                                                                    <p className="text-xs text-gray-500 line-clamp-2">{idea.description}</p>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <div className="text-center border border-dashed border-gray-700 rounded-lg p-6">
                                                        <p className="text-gray-500">You don't have any projects.</p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Track Selection */}
                                            {hackathon.tracks && hackathon.tracks.length > 1 && (
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-3">Select Track</label>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                        {hackathon.tracks?.map((track: any, i: number) => {
                                                            const TrackIcon = LucideIconMap[track.icon as keyof typeof LucideIconMap] || Target;
                                                            const isSelected = submissionData.track === track.title;

                                                            return (
                                                                <div
                                                                    key={i}
                                                                    onClick={() => setSubmissionData(prev => ({ ...prev, track: track.title }))}
                                                                    className={`
                                                                        relative cursor-pointer rounded-xl p-4 border transition-all duration-300 group
                                                                        ${isSelected
                                                                            ? 'bg-gold/10 border-gold shadow-[0_0_15px_rgba(255,215,0,0.1)]'
                                                                            : 'bg-black/20 border-white/10 hover:border-white/30 hover:bg-white/5'
                                                                        }
                                                                    `}
                                                                >
                                                                    <div className="flex flex-col items-center text-center gap-3">
                                                                        <div className={`p-2 rounded-lg bg-black/40 transition-colors ${isSelected ? 'text-gold' : track.color}`}>
                                                                            <TrackIcon className="w-6 h-6" />
                                                                        </div>
                                                                        <div>
                                                                            <h4 className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                                                                                {track.title}
                                                                            </h4>
                                                                        </div>
                                                                    </div>
                                                                    {/* Selection Indicator */}
                                                                    <div className={`absolute top-3 right-3 w-4 h-4 rounded-full border flex items-center justify-center transition-all
                                                                        ${isSelected ? 'bg-gold border-gold scale-100' : 'border-white/10 bg-black/40 scale-90 opacity-50'}
                                                                    `}>
                                                                        {isSelected && <CheckCircle2 className="w-3 h-3 text-black" />}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="pt-4 flex items-center justify-between border-t border-white/5 mt-6">
                                            <p className="text-xs text-gray-500">
                                                By submitting, you agree to the hackathon rules and terms.
                                            </p>
                                            <button
                                                type="submit"
                                                disabled={!submissionData.selectedIdeaId || !submissionData.track || isSubmitting}
                                                className={`font-bold px-8 py-3 rounded-lg transition-all flex items-center gap-2
                                                    ${(!submissionData.selectedIdeaId || !submissionData.track)
                                                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                                        : 'bg-gold text-black hover:bg-gold/90 hover:scale-105'}
                                                `}
                                            >
                                                <Zap className="w-4 h-4" /> {isSubmitting ? 'Submitting...' : 'Submit Idea'}
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="bg-surface border border-green-500/30 rounded-xl p-12 text-center space-y-6 animate-in fade-in zoom-in duration-300">
                                        <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto">
                                            <CheckCircle2 className="w-10 h-10" />
                                        </div>
                                        <div>
                                            <h2 className="text-3xl font-bold text-white font-quantico">Submission Received!</h2>
                                            <p className="text-gray-400 mt-2">Your project has been successfully submitted.</p>
                                        </div>
                                        <button onClick={() => setIsSubmitted(false)} className="text-gray-500 hover:text-white text-sm underline mt-4">Edit Submission</button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 6. AWARDING */}
                        {activeTab === 'awarding' && (
                            <div className="text-center py-10 text-gray-500">
                                <Trophy className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p>Winner announced.</p>
                            </div>
                        )}
                    </div>
                </main>


                {/* --- RIGHT COLUMN: PERSONAL DASHBOARD (25%) --- */}
                <aside className="lg:col-span-3 space-y-6">

                    {/* Compact Ticket */}
                    {hackathon.projectTicket && (
                        <div className="bg-gradient-to-b from-surfaceHighlight to-surface border border-white/10 rounded-xl p-0 overflow-hidden shadow-lg relative group">
                            {/* Decorative Top Line */}
                            <div className="h-1 w-full bg-gradient-to-r from-purple-500 via-blue-500 to-green-500" />
                            <div className="p-4">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded bg-white/10 flex items-center justify-center">
                                        <Image src="/asset/logo-gmi.png" width={24} height={24} alt="Team" className="opacity-80" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-white font-bold truncate">{hackathon.projectTicket.name}</h4>
                                        <p className="text-[10px] text-gray-500 uppercase">ID: {hackathon.projectTicket.id}</p>
                                    </div>
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                </div>
                                <div className="flex items-center justify-between text-xs text-gray-400 border-t border-white/5 pt-3">
                                    <span>Team: <span className="text-white">{hackathon.projectTicket.team}</span></span>
                                    <span className="bg-white/5 px-1.5 py-0.5 rounded text-[10px]">{hackathon.projectTicket.status}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Prizes Section */}
                    {hackathon.prizes && hackathon.prizes.length > 0 && (
                        <div className="bg-surface border border-white/5 rounded-xl p-4 space-y-3">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Prizes</h3>
                            <div className="space-y-2">
                                {hackathon.prizes.map((prize: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 transition-colors hover:bg-white/10">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-gold text-black' :
                                                i === 1 ? 'bg-gray-300 text-black' :
                                                    i === 2 ? 'bg-amber-700 text-white' : 'bg-surfaceHighlight text-gray-500 border border-white/10'
                                                }`}>
                                                {i < 3 ? i + 1 : '-'}
                                            </div>
                                            <span className={`text-sm font-medium ${i < 3 ? 'text-white' : 'text-gray-400'}`}>{prize.rank}</span>
                                        </div>
                                        <span className="text-gold font-mono text-sm">{prize.reward}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Resources */}
                    {hackathon.resources && hackathon.resources.length > 0 && (
                        <div className="bg-surface border border-white/5 rounded-xl p-4 space-y-2">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Resources</h3>
                            {hackathon.resources.map((resource: any, i: number) => {
                                const ResourceIcon = LucideIconMap[resource.icon as keyof typeof LucideIconMap] || LinkIcon;
                                return (
                                    <a href={resource.link} target="_blank" rel="noopener noreferrer" key={i} className="w-full text-left flex items-center gap-2 px-3 py-2 rounded hover:bg-white/5 text-xs transition-colors">
                                        <ResourceIcon className="w-3.5 h-3.5" /> {resource.name}
                                    </a>
                                )
                            })}
                        </div>
                    )}

                </aside>

            </div>
        </div>
    );
}