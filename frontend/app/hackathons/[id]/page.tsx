'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Calendar, Users, Clock, ChevronRight,
  Target, Zap, MessageSquare, FileText, CheckCircle2,
  AlertCircle, MoreHorizontal, Github, Disc, Link as LinkIcon,
  Monitor, Mic, SwatchBook, Code, ShieldCheck, Smartphone, UserPlus, 
  RefreshCw, Lock, Search, Plus, Settings, LogOut, UserMinus,
  LayoutDashboard, Rocket, BookOpen, Menu, Sparkles
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { format, isBefore } from 'date-fns';
import { HACKATHONS_MOCK_DATA } from '@/lib/mock-hackathons';

// Map icon names from mock data to Lucide React components
const LucideIconMap: { [key: string]: React.ElementType } = {
  Trophy, Calendar, Users, Clock, ChevronRight,
  Target, Zap, MessageSquare, FileText, CheckCircle2,
  AlertCircle, MoreHorizontal, Github, Disc, LinkIcon,
  Monitor, Mic, SwatchBook, Code, ShieldCheck, Smartphone, UserPlus, RefreshCw
};

const DEFAULT_NEW_TEAM = {
  name: 'My New Team',
  tags: ['New', 'Idea'],
  members: [{ name: 'You', role: 'Leader', isLeader: true }],
  maxMembers: 5
};

const MOCK_USER_IDEAS = [
  { id: 'idea-1', title: 'Decentralized Uber', description: 'A peer-to-peer ride sharing protocol on Solana. Eliminating middlemen fees.', category: 'DePIN', tags: ['Mobility', 'Solana'], date: '2 days ago' },
  { id: 'idea-2', title: 'NFT Ticketing', description: 'Eliminating scalpers using dynamic NFTs for event access with verifiable ownership.', category: 'NFT', tags: ['Events', 'Utility'], date: '1 week ago' },
  { id: 'idea-3', title: 'DAO Governance Tool', description: 'AI-powered proposal summarizer for DAOs to increase voter participation.', category: 'DAO', tags: ['AI', 'Governance'], date: '2 weeks ago' },
];

export default function HackathonDashboard({ params }: { params: { id: string } }) {
  const { id } = params;
  const hackathon = HACKATHONS_MOCK_DATA.find(h => h.id === id);
  const searchParams = useSearchParams();
  const mockDate = searchParams.get('mockDate') || searchParams.get('mockdate');
  const now = mockDate ? new Date(mockDate) : new Date();

  // Layout State
  const [activeSection, setActiveSection] = useState('overview');

  // Background Stars
  const [stars, setStars] = useState<{ id: number; top: string; left: string; size: number; duration: string; opacity: number }[]>([]);
  useEffect(() => {
    const newStars = Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: Math.random() * 2 + 1,
      duration: `${Math.random() * 3 + 2}s`,
      opacity: Math.random()
    }));
    setStars(newStars);
  }, []);

  // Timeline Logic
  const dynamicTimeline = hackathon?.timeline.map((step, index) => {
    const start = new Date(step.startDate);
    const end = step.endDate ? new Date(step.endDate) : null;
    const nextStart = hackathon.timeline[index + 1] ? new Date(hackathon.timeline[index + 1].startDate) : null;

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
  }) || [];

  // Data States
  const [userTeam, setUserTeam] = useState<any>(null);
  const [teamTabMode, setTeamTabMode] = useState<'teams' | 'teammates'>('teams');
  const [searchTeamQuery, setSearchTeamQuery] = useState('');
  const [countdown, setCountdown] = useState({ text: 'Calculating...', label: 'Loading...' });

  // Submission State
  const [submission, setSubmission] = useState({
    title: '',
    description: '',
    projectUrl: '',
    videoUrl: '',
    track: '',
    selectedIdeaId: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [projectSubTab, setProjectSubTab] = useState<'dashboard' | 'submit'>('dashboard');

  // Terminal State
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalHistory, setTerminalHistory] = useState<{ type: 'command' | 'error', content: string }[]>([]);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Derive start/end dates from timeline to avoid type errors
  const eventStartDate = hackathon?.timeline?.[0]?.startDate;
  const lastTimelineItem = hackathon?.timeline?.[(hackathon?.timeline?.length || 0) - 1];
  const eventEndDate = lastTimelineItem?.endDate || lastTimelineItem?.startDate;

  // Auto-set single track
  useEffect(() => {
    if (hackathon?.tracks && hackathon.tracks.length === 1) {
      setSubmission(prev => ({ ...prev, track: hackathon.tracks![0].title }));
    }
  }, [hackathon?.tracks]);

  // Timer Logic
  useEffect(() => {
    if (!hackathon) return;
    const updateTimer = () => {
      const currentNow = mockDate ? new Date(mockDate) : new Date();
      const milestones: { date: Date; title: string }[] = [];
      hackathon.timeline.forEach(step => {
        milestones.push({ date: new Date(step.startDate), title: `Start: ${step.title}` });
        if (step.endDate) milestones.push({ date: new Date(step.endDate), title: `End: ${step.title}` });
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
            text: `${String(days).padStart(2, '0')}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`,
            label: `Next: ${nextStep.title}`
        });
      } else {
        setCountdown({ text: 'Event Ended', label: 'Status' });
      }
    };
    updateTimer();
    if (!mockDate) {
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [hackathon, mockDate]);

  const handleSubmissionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      // Stub
  };
  
  const handleSubmitProject = (e: React.FormEvent) => {
    e.preventDefault();
    setTimeout(() => setIsSubmitted(true), 1000);
  };

  const handleTerminalSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const command = terminalInput.trim();
      if (!command) return;
      setTerminalHistory(prev => [...prev, { type: 'command', content: command }]);
      if (command === 'help') {
         setTerminalHistory(prev => [...prev, { type: 'error', content: 'Available commands: help, status, clear' }]);
      } else if (command === 'clear') {
         setTerminalHistory([]);
      } else {
         setTerminalHistory(prev => [...prev, { type: 'error', content: `Command not found: ${command}` }]);
      }
      setTerminalInput('');
    }
  };

  if (!hackathon) return <div className="min-h-screen pt-32 text-center text-white">Hackathon Not Found</div>;

  const SidebarItem = ({ id, label, icon: Icon }: { id: string, label: string, icon: any }) => (
    <button
      onClick={() => setActiveSection(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
        ${activeSection === id 
          ? 'bg-gold/10 text-gold border border-gold/20' 
          : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
        }`}
    >
      <Icon className={`w-4 h-4 ${activeSection === id ? 'text-gold' : 'text-gray-500'}`} />
      {label}
    </button>
  );

  return (
    <div className="min-h-screen text-gray-300 font-sans text-sm relative selection:bg-gold/30">
      
      {/* --- BACKGROUND LAYERS --- */}
      <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden bg-[#0a0a0a]">
        <div className="bg-grid opacity-20"></div>
        <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-[#2e1065] rounded-full blur-[150px] opacity-20 mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-[#422006] rounded-full blur-[150px] opacity-20 mix-blend-screen" />
        <div className="stars-container">
          {stars.map((star) => (
            <div key={star.id} className="star" style={{
                top: star.top, left: star.left, width: `${star.size}px`, height: `${star.size}px`,
                '--duration': star.duration, '--opacity': star.opacity
              } as React.CSSProperties} />
          ))}
        </div>
      </div>

      <div className="flex pt-20 h-screen overflow-hidden">
        
        {/* --- LEFT SIDEBAR (Fixed) --- */}
        <aside className="w-64 bg-surface/50 border-r border-white/5 flex flex-col shrink-0 backdrop-blur-sm z-20">
          <div className="p-6">
             <div className="flex items-center gap-2 text-white font-quantico font-bold text-lg mb-1">
                <div className="w-8 h-8 bg-gradient-to-br from-gold to-yellow-600 rounded flex items-center justify-center text-black text-xs">
                   H
                </div>
                HackHub
             </div>
             <p className="text-[10px] text-gray-500 uppercase tracking-widest pl-10">Workspace</p>
          </div>

          <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider px-2 mb-2 mt-2">Menu</div>
            <SidebarItem id="overview" label="Overview" icon={LayoutDashboard} />
            <SidebarItem id="tracks" label="Tracks & Prizes" icon={Target} />
            <SidebarItem id="participants" label="Find Squad" icon={Users} />
            
            <div className="my-4 border-t border-white/5" />
            
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider px-2 mb-2">My Zone</div>
            <SidebarItem id="project" label="My Project" icon={Rocket} />
            <SidebarItem id="resources" label="Resources" icon={BookOpen} />
          </nav>

          <div className="p-4 border-t border-white/5 bg-black/20">
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden relative">
                   {/* Avatar Placeholder */}
                   <div className="absolute inset-0 bg-gradient-to-tr from-purple-500 to-blue-500 opacity-80"></div>
                </div>
                <div className="flex-1 min-w-0">
                   <p className="text-white text-xs font-bold truncate">Thodium</p>
                   <p className="text-[10px] text-gray-500 truncate">Explorer</p>
                </div>
                <Settings className="w-4 h-4 text-gray-500 cursor-pointer hover:text-white" />
             </div>
          </div>
        </aside>


        {/* --- MAIN CONTENT AREA (Fluid) --- */}
        <main className="flex-1 overflow-y-auto relative scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          
          <div className="max-w-6xl mx-auto p-8 pb-20 space-y-8">
            
            {/* --- PAGE HEADER --- */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
              <div className="space-y-4 flex-1">
                 <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${hackathon.status === 'active' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
                       {hackathon.status === 'active' ? 'Live Event' : 'Upcoming'}
                    </span>
                    <span className="text-gray-500 text-xs flex items-center gap-1">
                       <Calendar className="w-3 h-3" /> 
                       {eventStartDate && format(new Date(eventStartDate), 'MMM dd')} - {eventEndDate && format(new Date(eventEndDate), 'MMM dd, yyyy')}
                    </span>
                 </div>
                 <h1 className="text-4xl md:text-5xl font-bold text-white font-quantico leading-tight">
                    {hackathon.title}
                 </h1>
                 <p className="text-gray-400 max-w-2xl text-sm leading-relaxed">
                   Build the future of decentralized technology. Join thousands of developers to compete for the grand prize.
                 </p>
              </div>

              <div className="flex items-center gap-4 bg-surface border border-white/5 p-4 rounded-xl min-w-[280px]">
                 <div className="p-3 bg-gold/10 rounded-lg text-gold">
                    <Clock className="w-6 h-6" />
                 </div>
                 <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">{countdown.label}</p>
                    <p className="text-xl font-mono font-bold text-white tracking-wide">{countdown.text}</p>
                 </div>
              </div>
            </header>


            {/* --- DYNAMIC CONTENT VIEW --- */}
            <div className="min-h-[500px]">
               <AnimatePresence mode="wait">
                  <motion.div
                    key={activeSection}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    
                    {/* === VIEW: OVERVIEW === */}
                    {activeSection === 'overview' && (
                       <div className="space-y-8">
                          
                          {/* Horizontal Timeline */}
                          <div className="bg-surface border border-white/5 rounded-xl p-8 overflow-x-auto">
                             <div className="flex justify-between items-center relative min-w-[600px]">
                                {/* Connecting Line */}
                                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/10 -z-0 -translate-y-1/2" />
                                
                                {dynamicTimeline.map((step, idx) => (
                                   <div key={step.id} className="relative z-10 flex flex-col items-center gap-3">
                                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-500
                                         ${step.status === 'active' ? 'bg-gold border-gold scale-125 shadow-[0_0_15px_var(--color-gold)]' : 
                                           step.status === 'done' ? 'bg-green-500 border-green-500' : 'bg-surface border-gray-600'}
                                      `}>
                                         {step.status === 'done' && <CheckCircle2 className="w-3 h-3 text-black" />}
                                      </div>
                                      <div className="text-center">
                                         <p className={`text-xs font-bold ${step.status === 'active' ? 'text-white' : 'text-gray-500'}`}>{step.title}</p>
                                         <p className="text-[10px] text-gray-600 font-mono mt-1">{format(new Date(step.startDate), 'MMM dd')}</p>
                                      </div>
                                   </div>
                                ))}
                             </div>
                          </div>

                          <div className="grid lg:grid-cols-3 gap-6">
                             {/* Terminal / Announcements (Span 2) */}
                             <div className="lg:col-span-2 bg-black border border-green-500/20 rounded-xl p-1 overflow-hidden shadow-[0_0_30px_rgba(34,197,94,0.05)]">
                                <div className="bg-[#0c0c0c] rounded-lg p-4 h-[300px] flex flex-col font-mono text-xs">
                                   <div className="flex justify-between items-center mb-3 pb-2 border-b border-white/5 text-gray-500">
                                      <div className="flex gap-1.5">
                                         <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"/>
                                         <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"/>
                                         <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"/>
                                      </div>
                                      <span>system_announcements.log</span>
                                   </div>
                                   
                                   <div className="flex-1 overflow-y-auto space-y-2 text-green-300/80 scrollbar-thin scrollbar-thumb-green-500/20 pr-2">
                                      {hackathon.announcements?.map((log: any) => (
                                         <div key={log.id}>
                                            <span className="opacity-50 mr-2">[{format(new Date(log.date), 'HH:mm')}]</span>
                                            <span className={log.type === 'warning' ? 'text-yellow-400' : 'text-gray-300'}>
                                               {log.message}
                                            </span>
                                         </div>
                                      ))}
                                      {terminalHistory.map((item, i) => (
                                         <div key={i} className={item.type === 'error' ? 'text-red-400' : 'text-gray-400'}>
                                            {item.type === 'command' ? `$ ${item.content}` : item.content}
                                         </div>
                                      ))}
                                      <div ref={terminalEndRef} />
                                   </div>
                                   
                                   <div className="mt-2 flex items-center gap-2 pt-2 border-t border-white/5">
                                      <span className="text-green-500">$</span>
                                      <input 
                                         type="text" 
                                         value={terminalInput}
                                         onChange={e => setTerminalInput(e.target.value)}
                                         onKeyDown={handleTerminalSubmit}
                                         className="bg-transparent outline-none text-green-500 w-full placeholder-green-500/30"
                                         placeholder="Type 'help'..."
                                      />
                                   </div>
                                </div>
                             </div>

                             {/* Quick Stats (Span 1) */}
                             <div className="space-y-4">
                                <div className="bg-gradient-to-br from-surface to-surfaceHighlight border border-white/5 rounded-xl p-6">
                                   <h3 className="text-gray-400 text-xs uppercase tracking-wider mb-4">Total Prizes</h3>
                                   <div className="text-4xl font-bold text-gold font-quantico">$150,000</div>
                                   <p className="text-xs text-gray-500 mt-2">Paid in USDC & Sponsor Tokens</p>
                                </div>
                                
                                <div className="bg-surface border border-white/5 rounded-xl p-6">
                                   <h3 className="text-gray-400 text-xs uppercase tracking-wider mb-4">Participation</h3>
                                   <div className="flex items-center justify-between mb-2">
                                      <span className="text-white font-bold text-lg">1,240</span>
                                      <span className="text-xs text-gray-500">Builders</span>
                                   </div>
                                   <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                      <div className="h-full bg-blue-500 w-[65%]" />
                                   </div>
                                   
                                   <div className="flex items-center justify-between mt-4 mb-2">
                                      <span className="text-white font-bold text-lg">342</span>
                                      <span className="text-xs text-gray-500">Projects</span>
                                   </div>
                                   <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                      <div className="h-full bg-purple-500 w-[40%]" />
                                   </div>
                                </div>
                             </div>
                          </div>
                       </div>
                    )}


                    {/* === VIEW: TRACKS & PRIZES === */}
                    {activeSection === 'tracks' && (
                       <div className="grid lg:grid-cols-3 gap-8">
                          {/* Left: Tracks (2/3) */}
                          <div className="lg:col-span-2 space-y-6">
                             <h2 className="text-xl font-bold text-white font-quantico flex items-center gap-2">
                                <Target className="w-5 h-5 text-gold" /> Tracks
                             </h2>
                             <div className="grid md:grid-cols-2 gap-4">
                                {hackathon.tracks?.map((track, i) => {
                                   const TrackIcon = LucideIconMap[track.icon as keyof typeof LucideIconMap] || Target;
                                   return (
                                      <div key={i} className="group bg-surface border border-white/5 p-6 rounded-xl hover:border-gold/30 transition-all cursor-default">
                                         <div className={`w-10 h-10 rounded-lg bg-black/40 ${track.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                            <TrackIcon className="w-5 h-5" />
                                         </div>
                                         <h3 className="text-lg font-bold text-white mb-2">{track.title}</h3>
                                         <p className="text-sm text-gray-400 leading-relaxed">
                                            Build innovative solutions focusing on {track.title}. Judges look for utility and seamless UX.
                                         </p>
                                      </div>
                                   )
                                })}
                             </div>
                          </div>

                          {/* Right: Prizes (1/3) */}
                          <div className="space-y-6">
                             <h2 className="text-xl font-bold text-white font-quantico flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-gold" /> Prizes
                             </h2>
                             <div className="bg-surface border border-white/5 rounded-xl overflow-hidden">
                                {hackathon.prizes?.map((prize, i) => (
                                   <div key={i} className="flex items-center justify-between p-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                                      <div className="flex items-center gap-4">
                                         <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                                            ${i === 0 ? 'bg-gold text-black shadow-[0_0_10px_var(--color-gold)]' : 
                                              i === 1 ? 'bg-gray-300 text-black' : 
                                              i === 2 ? 'bg-amber-700 text-white' : 'bg-white/5 text-gray-500'}
                                         `}>
                                            {i < 3 ? i + 1 : '-'}
                                         </div>
                                         <span className={i < 3 ? 'text-white font-medium' : 'text-gray-400'}>{prize.rank}</span>
                                      </div>
                                      <span className="text-gold font-mono font-bold">{prize.reward}</span>
                                   </div>
                                ))}
                             </div>
                          </div>
                       </div>
                    )}


                    {/* === VIEW: PARTICIPANTS (FIND SQUAD) === */}
                    {activeSection === 'participants' && (
                       <div className="space-y-6">
                          {/* Search & Filter Bar */}
                          <div className="flex flex-col md:flex-row justify-between gap-4">
                             <div className="relative flex-1 max-w-lg">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input 
                                   type="text" 
                                   placeholder="Search teams, ideas, or hackers..."
                                   value={searchTeamQuery}
                                   onChange={e => setSearchTeamQuery(e.target.value)}
                                   className="w-full bg-surface border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-gold/50 transition-colors"
                                />
                             </div>
                             <div className="flex bg-surface border border-white/10 rounded-lg p-1 shrink-0">
                                <button
                                  onClick={() => setTeamTabMode('teams')}
                                  className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${teamTabMode === 'teams' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                                >
                                  Looking for Members
                                </button>
                                <button
                                  onClick={() => setTeamTabMode('teammates')}
                                  className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${teamTabMode === 'teammates' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                                >
                                  Looking for Team
                                </button>
                             </div>
                          </div>

                          {/* Grid Content */}
                          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                             {teamTabMode === 'teams' ? (
                                (hackathon.teams || []).filter((t: any) => t.name.toLowerCase().includes(searchTeamQuery.toLowerCase())).map((team: any) => (
                                   <div key={team.id} className="bg-surface border border-white/5 rounded-xl p-6 hover:border-gold/30 transition-all group flex flex-col h-full">
                                      <div className="flex justify-between items-start mb-4">
                                         <h3 className="text-lg font-bold text-white group-hover:text-gold transition-colors">{team.name}</h3>
                                         <span className="text-xs bg-white/5 px-2 py-1 rounded text-gray-400">{team.members}/{team.maxMembers}</span>
                                      </div>
                                      <div className="flex flex-wrap gap-2 mb-6 flex-1 content-start">
                                         {team.tags.map((tag: string) => <span key={tag} className="text-[10px] bg-black/40 text-gray-400 px-2 py-1 rounded border border-white/5">{tag}</span>)}
                                      </div>
                                      <button className="w-full py-2 bg-white/5 hover:bg-gold hover:text-black text-gray-300 font-bold text-xs rounded-lg transition-colors mt-auto">
                                         Request to Join
                                      </button>
                                   </div>
                                ))
                             ) : (
                                (hackathon.participants || []).filter((u: any) => u.name.toLowerCase().includes(searchTeamQuery.toLowerCase())).map((user: any) => (
                                   <div key={user.id} className="bg-surface border border-white/5 rounded-xl p-5 hover:border-blue-500/30 transition-all flex items-center gap-4">
                                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                                         {user.name.charAt(0)}
                                      </div>
                                      <div>
                                         <h4 className="text-white font-bold">{user.name}</h4>
                                         <p className="text-xs text-gray-500">{user.role}</p>
                                      </div>
                                      <button className="ml-auto p-2 bg-white/5 rounded-full hover:text-white text-gray-500 transition-colors">
                                         <MessageSquare className="w-4 h-4" />
                                      </button>
                                   </div>
                                ))
                             )}
                          </div>
                       </div>
                    )}


                    {/* === VIEW: MY PROJECT (TEAM + SUBMISSION) === */}
                    {activeSection === 'project' && (
                       <div className="space-y-8">
                          
                          {/* State: No Team */}
                          {!userTeam && (
                             <div className="text-center py-16 bg-surface border border-white/5 rounded-xl">
                                <div className="w-20 h-20 bg-gold/10 text-gold rounded-full flex items-center justify-center mx-auto mb-6">
                                   <Rocket className="w-10 h-10" />
                                </div>
                                <h2 className="text-3xl font-bold text-white font-quantico mb-3">Start Building</h2>
                                <p className="text-gray-400 max-w-md mx-auto mb-8">
                                   You haven't joined a team yet. Create your own team to submit a project, or join an existing squad.
                                </p>
                                <div className="flex justify-center gap-4">
                                   <button 
                                      onClick={() => setUserTeam(DEFAULT_NEW_TEAM)}
                                      className="bg-gold text-black font-bold px-6 py-3 rounded-lg hover:bg-gold/90 transition-transform hover:scale-105"
                                   >
                                      Create a Team
                                   </button>
                                   <button 
                                      onClick={() => setActiveSection('participants')}
                                      className="bg-white/5 text-white font-bold px-6 py-3 rounded-lg hover:bg-white/10 transition-colors"
                                   >
                                      Find a Team
                                   </button>
                                </div>
                             </div>
                          )}

                          {/* State: Has Team */}
                          {userTeam && (
                             <>
                                {/* Project/Team Header */}
                                <div className="bg-surface border border-white/5 rounded-xl p-6 flex justify-between items-center">
                                   <div className="flex items-center gap-4">
                                      <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                                         {userTeam.name.charAt(0)}
                                      </div>
                                      <div>
                                         <h2 className="text-2xl font-bold text-white">{userTeam.name}</h2>
                                         <div className="flex gap-2 mt-1">
                                            <span className="text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">Ready to Ship</span>
                                            {userTeam.tags.map((t: string) => <span key={t} className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded">{t}</span>)}
                                         </div>
                                      </div>
                                   </div>
                                   <div className="flex gap-2">
                                      <button className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                                         <Settings className="w-5 h-5" />
                                      </button>
                                      <button onClick={() => setUserTeam(null)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                                         <LogOut className="w-5 h-5" />
                                      </button>
                                   </div>
                                </div>

                                {/* Sub-Tabs for Project */}
                                <div className="flex border-b border-white/10">
                                   <button 
                                      onClick={() => setProjectSubTab('dashboard')}
                                      className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${projectSubTab === 'dashboard' ? 'border-gold text-gold' : 'border-transparent text-gray-500 hover:text-white'}`}
                                   >
                                      Team Dashboard
                                   </button>
                                   <button 
                                      onClick={() => setProjectSubTab('submit')}
                                      className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${projectSubTab === 'submit' ? 'border-gold text-gold' : 'border-transparent text-gray-500 hover:text-white'}`}
                                   >
                                      Submission
                                   </button>
                                </div>

                                {/* Dashboard Sub-Content */}
                                {projectSubTab === 'dashboard' && (
                                   <div className="grid md:grid-cols-2 gap-6">
                                      {/* Members Card */}
                                      <div className="bg-surface border border-white/5 rounded-xl p-6">
                                         <div className="flex justify-between items-center mb-6">
                                            <h3 className="font-bold text-white flex items-center gap-2">
                                               <Users className="w-4 h-4 text-gold" /> Members
                                            </h3>
                                            <button className="text-[10px] bg-white/5 hover:bg-white/10 text-white px-2 py-1 rounded flex items-center gap-1">
                                               <Plus className="w-3 h-3" /> Invite
                                            </button>
                                         </div>
                                         <div className="space-y-3">
                                            {userTeam.members.map((m: any, i: number) => (
                                               <div key={i} className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                                                  <div className="flex items-center gap-3">
                                                     <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-white">{m.name.charAt(0)}</div>
                                                     <div>
                                                        <p className="text-sm font-bold text-white">{m.name}</p>
                                                        <p className="text-[10px] text-gray-500">{m.role}</p>
                                                     </div>
                                                  </div>
                                                  {m.isLeader && <Trophy className="w-3 h-3 text-gold" />}
                                               </div>
                                            ))}
                                         </div>
                                      </div>
                                      
                                      {/* Tasks / Chat Placeholder */}
                                      <div className="bg-surface border border-white/5 rounded-xl p-6 flex flex-col items-center justify-center text-center">
                                         <MessageSquare className="w-8 h-8 text-gray-600 mb-2" />
                                         <h4 className="text-gray-400 font-bold">Team Chat</h4>
                                         <p className="text-xs text-gray-600 mt-1">Connect Discord to enable team chat.</p>
                                         <button className="mt-4 text-xs bg-indigo-500/20 text-indigo-400 border border-indigo-500/50 px-3 py-1.5 rounded hover:bg-indigo-500/30 transition-colors">
                                            Connect Discord
                                         </button>
                                      </div>
                                   </div>
                                )}

                                {/* Submission Sub-Content */}
                                {projectSubTab === 'submit' && (
                                   <div className="max-w-2xl mx-auto">
                                      {!isSubmitted ? (
                                         <form onSubmit={handleSubmitProject} className="bg-surface border border-white/5 rounded-xl p-8 space-y-6">
                                            <div>
                                               <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Project Name</label>
                                               <input type="text" className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-gold/50 outline-none" placeholder="Enter project name..." defaultValue={userTeam.name} />
                                            </div>
                                            <div>
                                               <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Track</label>
                                               <select className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-gold/50 outline-none appearance-none">
                                                  {hackathon.tracks?.map((t, index) => <option key={index}>{t.title}</option>)}
                                               </select>
                                            </div>
                                            <div>
                                               <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Demo Video URL</label>
                                               <input type="text" className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-gold/50 outline-none" placeholder="https://youtube.com/..." />
                                            </div>
                                            <div>
                                               <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Github Repo</label>
                                               <input type="text" className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-gold/50 outline-none" placeholder="https://github.com/..." />
                                            </div>
                                            <button type="submit" className="w-full bg-gold text-black font-bold py-4 rounded-lg hover:bg-gold/90 transition-colors mt-4">
                                               Submit Project
                                            </button>
                                         </form>
                                      ) : (
                                         <div className="text-center py-10 bg-green-500/10 border border-green-500/30 rounded-xl">
                                            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                                            <h3 className="text-2xl font-bold text-white font-quantico">Submitted!</h3>
                                            <p className="text-gray-400 mt-2">Your project is now under review by the judges.</p>
                                            <button onClick={() => setIsSubmitted(false)} className="text-sm text-gray-500 hover:text-white underline mt-6">Edit Submission</button>
                                         </div>
                                      )}
                                   </div>
                                )}
                             </>
                          )}
                       </div>
                    )}

                    {/* === VIEW: RESOURCES === */}
                    {activeSection === 'resources' && (
                       <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {hackathon.resources?.map((res, i) => {
                              const ResIcon = LucideIconMap[res.icon as keyof typeof LucideIconMap] || LinkIcon;
                              return (
                                 <a key={i} href={res.link} target="_blank" rel="noopener noreferrer" className="bg-surface border border-white/5 p-6 rounded-xl hover:bg-white/5 transition-colors group">
                                    <ResIcon className="w-8 h-8 text-gray-500 group-hover:text-gold mb-4 transition-colors" />
                                    <h3 className="font-bold text-white mb-1">{res.name}</h3>
                                    <p className="text-xs text-gray-500">External Link <ChevronRight className="w-3 h-3 inline ml-1" /></p>
                                 </a>
                              )
                          })}
                       </div>
                    )}

                  </motion.div>
               </AnimatePresence>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}