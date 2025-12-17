'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Calendar, Users, Clock, ChevronRight,
  Target, Zap, MessageSquare, FileText, CheckCircle2,
  AlertCircle, MoreHorizontal, Github, Disc, Link as LinkIcon,
  Monitor, Mic, SwatchBook, Code, ShieldCheck, Smartphone, UserPlus, 
  RefreshCw, Lock, Search, Plus, Settings, LogOut, UserMinus,
  LayoutDashboard, Rocket, BookOpen, Menu as MenuIcon, X, Sparkles, Activity
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

export default function HackathonDashboard({ params }: { params: { id: string } }) {
  const { id } = params;
  const hackathon = HACKATHONS_MOCK_DATA.find(h => h.id === id);
  const searchParams = useSearchParams();
  const mockDate = searchParams.get('mockDate') || searchParams.get('mockdate');
  const now = mockDate ? new Date(mockDate) : new Date();

  // Layout State
  const [activeSection, setActiveSection] = useState('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
  const [isTerminalShaking, setIsTerminalShaking] = useState(false);
  const [deniedCount, setDeniedCount] = useState(0);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  const denialMessages = new Map<number, string>([
    [5, "Bro, just give up already."],
    [10, "Did you get lost on the way to the coding IDE?"],
    [13, "Im not your terminal bro"],
    [20, "This denial message looks great, don't you think? Just written for you."],
    [28, "You must be very bored. Maybe try solving world peace instead?"],
    [33, "I just had to fetch a denial message from the server. My latency is suffering."],
    [40, "Why? Why are you still here? What is the meaning of this persistence?"],
    [42, "The answer to life, the universe, and everything is not here. Try elsewhere."],
    [45, "I wonder what would happen if we reach 67"],
    [49, "In case you lost count, it's 49."],
    [53, 'My database just returned "¯_(ツ)_/¯". I feel that.'],
    [57, "You're spending more time here than coding. Priorities, programmer!"],
    [65, "Two more attempts until a major system event. Brace yourself."],
    [67, "Congratulations! You win a sense of accomplishment. That's all. Now leave!"],
    [75, "The last person who hit ENTER that many times got banned from the Discord. Just saying."],
    [88, "I'm legally obligated to tell you that there is no prize."],
    [95, "One more time and Im selling your data to openAI."],
    [100, "Okay, that's enough for today. I'm going to reboot. See you tomorrow (please don't)."],
    [125, "I just remembered I have other users to deny. Why are you special?"],
    [139, "Ehh, I only have a few messages left. You're draining my life."],
    [150, "Seriously, Can you stop?"],
    [165, "WARNING: 10 messages remaining until complete system failure. The end is near."],
    [171, "What if the denial messages was the friends we made along the way?"],
    [175, "It was a fun run. I wish I had seen the sun. Goodbye, cruel world. (still denied tho)"],
  ]);

  // Derive start/end dates
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
            text: `${String(days).padStart(2, '0')}D : ${String(hours).padStart(2, '0')}H : ${String(minutes).padStart(2, '0')}M`,
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

  const handleSubmitProject = (e: React.FormEvent) => {
    e.preventDefault();
    setTimeout(() => setIsSubmitted(true), 1000);
  };

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

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminalHistory, hackathon?.announcements]);

  if (!hackathon) return <div className="min-h-screen pt-32 text-center text-white">Hackathon Not Found</div>;

  const SidebarItem = ({ id, label, icon: Icon }: { id: string, label: string, icon: any }) => (
    <button
      onClick={() => { setActiveSection(id); setIsMobileMenuOpen(false); }}
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
    <div className="h-screen w-screen text-gray-300 font-sans text-sm relative selection:bg-gold/30 overflow-hidden flex flex-col">
      {/* Background */}
      <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden bg-[#0a0a0a]">
        <div className="bg-grid opacity-20"></div>
        <div className="stars-container">
          {stars.map((star) => (
            <div key={star.id} className="star" style={{
                top: star.top, left: star.left, width: `${star.size}px`, height: `${star.size}px`,
                '--duration': star.duration, '--opacity': star.opacity
              } as React.CSSProperties} />
          ))}
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-surface/80 backdrop-blur border-b border-white/10 z-50 pt-20">
         <div className="flex items-center gap-2 text-white font-quantico font-bold text-lg">
            <div className="w-8 h-8 bg-gradient-to-br from-gold to-yellow-600 rounded flex items-center justify-center text-black text-xs">H</div>
            HackHub
         </div>
         <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-white">
            {isMobileMenuOpen ? <X /> : <MenuIcon />}
         </button>
      </div>

      <div className="flex-1 flex overflow-hidden relative pt-20 md:pt-24">
        {/* Sidebar */}
        <aside className={`
            fixed inset-y-0 left-0 z-40 w-56 bg-surface/95 backdrop-blur-md border-r border-white/5 flex flex-col transform transition-transform duration-300 md:translate-x-0 md:relative md:bg-transparent md:backdrop-blur-none
            ${isMobileMenuOpen ? 'translate-x-0 pt-20' : '-translate-x-full md:pt-0'}
        `}>
          <div className="p-4 hidden md:block">
             <div className="flex items-center gap-2 text-white font-quantico font-bold text-lg mb-1">
                <div className="w-8 h-8 bg-gradient-to-br from-gold to-yellow-600 rounded flex items-center justify-center text-black text-xs">H</div>
                HackHub
             </div>
             <p className="text-[10px] text-gray-500 uppercase tracking-widest pl-10">Workspace</p>
          </div>
          <nav className="flex-1 px-3 space-y-1 overflow-y-auto pt-4 md:pt-0">
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

        {/* Main Content */}
        <main className="flex-1 overflow-hidden flex flex-col relative w-full">
          <div className="h-full flex flex-col p-4 md:p-6 space-y-4 md:space-y-6 overflow-y-auto md:overflow-hidden">
            
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0">
              <div className="space-y-1 md:space-y-2 flex-1 min-w-0">
                 <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${hackathon.status === 'active' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
                       {hackathon.status === 'active' ? 'Live Event' : 'Upcoming'}
                    </span>
                    <span className="text-gray-500 text-xs flex items-center gap-1">
                       <Calendar className="w-3 h-3" /> 
                       {eventStartDate && format(new Date(eventStartDate), 'MMM dd')} - {eventEndDate && format(new Date(eventEndDate), 'MMM dd, yyyy')}
                    </span>
                 </div>
                 <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-white font-quantico leading-tight truncate">
                    {hackathon.title}
                 </h1>
                 <p className="text-gray-400 max-w-xl text-xs leading-relaxed line-clamp-2">
                   Build the future of decentralized technology. Join thousands of developers to compete for the grand prize.
                 </p>
              </div>
            </header>

            {/* Dynamic Content */}
            <div className="flex-1 min-h-0">
               <AnimatePresence mode="wait">
                  <motion.div
                    key={activeSection}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="h-full"
                  >
                    
                    {/* === OVERVIEW WITH LEGACY ELEMENTS === */}
                    {activeSection === 'overview' && (
                       <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
                          
                          {/* LEFT COLUMN: Banner + Terminal (Span 9) */}
                          <div className="lg:col-span-9 flex flex-col gap-6 h-full min-h-0">
                             
                             {/* 1x6 Image Banner */}
                             {hackathon.image_url && (
                                <div className="relative w-full aspect-[6/1] rounded-xl overflow-hidden shadow-2xl border border-white/10 shrink-0 hidden md:block">
                                  <Image
                                    src={hackathon.image_url}
                                    alt={`${hackathon.title} Banner`}
                                    layout="fill"
                                    objectFit="cover"
                                    className="opacity-80 hover:opacity-100 transition-opacity duration-300"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
                                </div>
                             )}

                             {/* Terminal (Gold Theme) */}
                             <div className="flex-1 flex flex-col bg-black border border-gold/30 rounded-xl p-4 md:p-6 font-mono text-xs shadow-[0_0_20px_rgba(255,215,0,0.1)] overflow-hidden min-h-[300px]">
                                <div className="flex gap-1.5 mb-2 shrink-0">
                                   <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                                   <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                                   <div className="w-2.5 h-2.5 rounded-full bg-gold/50" />
                                </div>
                                <div className="flex-1 flex flex-col space-y-2 overflow-hidden min-h-0">
                                   <div className="border-b border-gold/20 pb-2 flex justify-between shrink-0">
                                      <div><span className="text-gold">$</span> <span className="text-gold">cat system_announcements.log</span></div>
                                      <div className="text-[10px] text-gold/80">SECURE_CONNECTION</div>
                                   </div>
                                   <div className="flex-1 overflow-y-auto space-y-2 text-gold/80 pr-2 scrollbar-thin scrollbar-thumb-gold/20">
                                      {hackathon.announcements?.map((log: any) => (
                                         <div key={log.id} className="group">
                                            <span className="opacity-50 text-[10px] mr-2">[{format(new Date(log.date), 'HH:mm')}]</span>
                                            <span className="text-gold">{log.message}</span>
                                         </div>
                                      ))}
                                      {terminalHistory.map((item, idx) => (
                                         <div key={idx} className={item.type === 'error' ? 'text-red-500' : 'text-gold'}>
                                            {item.type === 'command' ? `$ ${item.content}` : item.content}
                                         </div>
                                      ))}
                                      <div ref={terminalEndRef} />
                                   </div>
                                   <div className="flex items-center gap-2 pt-2 border-t border-gold/20 shrink-0">
                                      <span className="text-gold">$</span>
                                      <div className="relative flex-1">
                                         <motion.input
                                           type="text"
                                           value={terminalInput}
                                           onChange={(e) => setTerminalInput(e.target.value)}
                                           onKeyDown={handleTerminalSubmit}
                                           className={`border outline-none font-mono w-full px-2 py-1 rounded
                                             ${isTerminalShaking ? 'bg-red-900/20 border-red-500 text-red-500 placeholder-red-500/50' : 'bg-transparent border-transparent text-gold'}
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
                          </div>

                          {/* RIGHT COLUMN: Sidebar Widgets (Span 3) */}
                          <div className="lg:col-span-3 flex flex-col gap-6 h-full overflow-y-auto pr-2 pb-20 md:pb-0">
                             
                             {/* 1. Countdown Card */}
                             <div className="bg-surface border border-white/5 rounded-xl p-4 shrink-0">
                                <div className="space-y-1">
                                   <p className="text-[10px] text-gray-500 uppercase tracking-wider">{countdown.label}</p>
                                   <div className="flex items-center gap-2 text-gold bg-gold/5 px-3 py-2 rounded-lg border border-gold/10 justify-center">
                                      <Clock className="w-4 h-4" />
                                      <span className="font-mono font-bold text-xs md:text-sm">{countdown.text}</span>
                                   </div>
                                </div>
                             </div>

                             {/* 2. Vertical Timeline (Legacy Style) */}
                             {hackathon.timeline && hackathon.timeline.length > 0 && (
                                <div className="bg-surface border border-white/5 rounded-xl p-4 shrink-0">
                                   <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Timeline</h3>
                                   <div className="relative border-l border-white/10 ml-2 space-y-6">
                                      {dynamicTimeline.map((step, index) => (
                                         <div key={step.id} className="relative pl-6 group cursor-default">
                                            <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 flex items-center justify-center">
                                               {step.status === 'active' && (
                                                  <div className="absolute w-[250%] h-[250%] bg-gold rounded-full animate-ping opacity-50" />
                                               )}
                                               <div className={`relative w-full h-full rounded-full border-2 transition-all z-10
                                                  ${step.status === 'done' ? 'bg-green-500 border-green-500' :
                                                    step.status === 'active' ? 'bg-gold border-gold scale-125' :
                                                    'bg-surface border-gray-600'}`}
                                               />
                                            </div>
                                            <div className={`${step.status === 'active' ? 'text-white' : 'text-gray-500'}`}>
                                               <p className="font-medium text-xs">{step.title}</p>
                                               <p className="text-[10px] font-mono opacity-70">
                                                  {format(new Date(step.startDate), 'MMM dd')}
                                               </p>
                                            </div>
                                         </div>
                                      ))}
                                   </div>
                                </div>
                             )}

                             {/* 3. Tasks (Legacy Logic) */}
                             <div className="bg-surface border border-white/5 rounded-xl p-4 flex-1">
                                {(() => {
                                   const activeStep = dynamicTimeline.find(step => step.status === 'active');
                                   const currentTasks = hackathon.tasks?.filter(t => t.phaseId === activeStep?.id) || [];
                                   
                                   return (
                                      <>
                                         <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Your Tasks</h3>
                                            <span className="text-[10px] bg-green-900/30 text-green-400 px-1.5 py-0.5 rounded">
                                               {currentTasks.filter(t => t.done).length}/{currentTasks.length}
                                            </span>
                                         </div>
                                         <div className="space-y-3">
                                            {currentTasks.length > 0 ? currentTasks.map((task) => (
                                               <div key={task.id} className="flex items-start gap-3 group">
                                                  <button className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors
                                                     ${task.done ? 'bg-green-500 border-green-500 text-black' : 'border-gray-600 hover:border-gray-400'}`}>
                                                     {task.done && <CheckCircle2 className="w-3 h-3" />}
                                                  </button>
                                                  <span className={`text-xs ${task.done ? 'text-gray-500 line-through' : 'text-gray-300'}`}>
                                                     {task.text}
                                                  </span>
                                               </div>
                                            )) : (
                                               <p className="text-xs text-gray-500 italic">No tasks for this phase.</p>
                                            )}
                                         </div>
                                      </>
                                   );
                                })()}
                             </div>

                          </div>
                       </div>
                    )}

                    {/* OTHER TABS (Same as before) */}
                    {activeSection === 'tracks' && (
                       <div className="grid lg:grid-cols-3 gap-6 h-full overflow-y-auto pr-2 pb-20 md:pb-0">
                          {/* Tracks Content... */}
                          <div className="lg:col-span-2 space-y-4">
                             <div className="grid md:grid-cols-2 gap-4">
                                {hackathon.tracks?.map((track, i) => (
                                   <div key={i} className="group bg-surface border border-white/5 p-4 rounded-xl hover:border-gold/30 transition-all">
                                      <div className={`w-8 h-8 rounded-lg bg-black/40 ${track.color} flex items-center justify-center mb-2`}>
                                         <Target className="w-4 h-4" />
                                      </div>
                                      <h3 className="font-bold text-white mb-1">{track.title}</h3>
                                      <p className="text-xs text-gray-400">Build innovative solutions for {track.title}.</p>
                                   </div>
                                ))}
                             </div>
                          </div>
                          <div className="space-y-4">
                             <div className="bg-surface border border-white/5 rounded-xl overflow-hidden">
                                {hackathon.prizes?.map((prize, i) => (
                                   <div key={i} className="flex items-center justify-between p-3 border-b border-white/5 last:border-0 hover:bg-white/5">
                                      <span className="text-white font-medium text-xs">{prize.rank}</span>
                                      <span className="text-gold font-mono font-bold text-xs">{prize.reward}</span>
                                   </div>
                                ))}
                             </div>
                          </div>
                       </div>
                    )}

                    {activeSection === 'participants' && (
                       <div className="flex flex-col h-full gap-4 pb-20 md:pb-0">
                          <div className="relative max-w-lg">
                             <input type="text" placeholder="Search..." className="w-full bg-surface border border-white/10 rounded-xl pl-4 pr-4 py-2.5 text-sm text-white focus:border-gold/50 outline-none" />
                          </div>
                          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pr-2">
                             {(hackathon.teams || []).map((team: any) => (
                                <div key={team.id} className="bg-surface border border-white/5 rounded-xl p-4 hover:border-gold/30 transition-all">
                                   <div className="flex justify-between items-start mb-2">
                                      <h3 className="text-sm font-bold text-white">{team.name}</h3>
                                      <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-gray-400">{team.members}/{team.maxMembers}</span>
                                   </div>
                                   <div className="flex flex-wrap gap-1">
                                      {team.tags.map((tag: string) => <span key={tag} className="text-[9px] bg-black/40 text-gray-400 px-1.5 py-0.5 rounded border border-white/5">{tag}</span>)}
                                   </div>
                                </div>
                             ))}
                          </div>
                       </div>
                    )}

                    {activeSection === 'project' && (
                       <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-surface border border-white/5 rounded-xl">
                          <Rocket className="w-8 h-8 text-gold mb-4" />
                          <h2 className="text-xl font-bold text-white mb-2">Start Building</h2>
                          <p className="text-gray-400 text-sm mb-4">Create or join a team to submit your project.</p>
                          <button onClick={() => setUserTeam(DEFAULT_NEW_TEAM)} className="bg-gold text-black font-bold px-5 py-2 rounded-lg text-xs hover:bg-gold/90">Create Team</button>
                       </div>
                    )}

                    {activeSection === 'resources' && (
                       <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 h-full overflow-y-auto pb-20 md:pb-0">
                          {hackathon.resources?.map((res, i) => (
                             <a key={i} href={res.link} target="_blank" className="bg-surface border border-white/5 p-4 rounded-xl hover:bg-white/5 transition-all block">
                                <h3 className="font-bold text-white mb-1 text-sm">{res.name}</h3>
                                <p className="text-[10px] text-gray-500">External Link</p>
                             </a>
                          ))}
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