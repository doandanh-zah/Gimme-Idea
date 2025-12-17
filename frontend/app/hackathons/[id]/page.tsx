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

const MOCK_USER_IDEAS = [
  { id: 'idea-1', title: 'Decentralized Uber', description: 'A peer-to-peer ride sharing protocol on Solana. Eliminating middlemen fees.', category: 'DePIN', tags: ['Mobility', 'Solana'], date: '2 days ago', author: 'Alex' },
  { id: 'idea-2', title: 'NFT Ticketing', description: 'Eliminating scalpers using dynamic NFTs for event access with verifiable ownership.', category: 'NFT', tags: ['Events', 'Utility'], date: '1 week ago', author: 'Sarah' },
  { id: 'idea-3', title: 'DAO Governance Tool', description: 'AI-powered proposal summarizer for DAOs to increase voter participation.', category: 'DAO', tags: ['AI', 'Governance'], date: '2 weeks ago', author: 'Mike' },
];

const MOCK_ACTIVITY = [
   { user: 'David', action: 'joined the hackathon', time: '2m ago' },
   { user: 'Team Alpha', action: 'submitted a project', time: '15m ago' },
   { user: 'Elena', action: 'is looking for a team', time: '1h ago' },
   { user: 'System', action: 'released new track details', time: '3h ago' },
];

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

  // Terminal State (Original Logic)
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

      // Add command to history
      setTerminalHistory(prev => [...prev, { type: 'command', content: command }]);

      // Trigger error effect
      setIsTerminalShaking(true);
      setTimeout(() => setIsTerminalShaking(false), 500); // Reset shake

      const newDeniedCount = deniedCount + 1;
      setDeniedCount(newDeniedCount);

      if (newDeniedCount <= 175) {
        const errorMessage = denialMessages.get(newDeniedCount) || "ACCESS DENIED";
        // Add error message to history
        setTerminalHistory(prev => [...prev, { type: 'error', content: errorMessage }]);
      }

      setTerminalInput('');
    }
  };

  // Auto-scroll terminal
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

      {/* --- MOBILE HEADER & TOGGLE --- */}
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
        
        {/* --- LEFT SIDEBAR (Desktop Fixed / Mobile Drawer) --- */}
        <aside className={`
            fixed inset-y-0 left-0 z-40 w-64 bg-surface/95 backdrop-blur-md border-r border-white/5 flex flex-col transform transition-transform duration-300 md:translate-x-0 md:relative md:bg-transparent md:backdrop-blur-none
            ${isMobileMenuOpen ? 'translate-x-0 pt-20' : '-translate-x-full md:pt-0'}
        `}>
          <div className="p-6 hidden md:block">
             <div className="flex items-center gap-2 text-white font-quantico font-bold text-lg mb-1">
                <div className="w-8 h-8 bg-gradient-to-br from-gold to-yellow-600 rounded flex items-center justify-center text-black text-xs">
                   H
                </div>
                HackHub
             </div>
             <p className="text-[10px] text-gray-500 uppercase tracking-widest pl-10">Workspace</p>
          </div>

          <nav className="flex-1 px-4 space-y-2 overflow-y-auto pt-4 md:pt-0">
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


        {/* --- MAIN CONTENT AREA (Fluid & Compact) --- */}
        <main className="flex-1 overflow-hidden flex flex-col relative w-full">
          
          <div className="h-full flex flex-col p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 overflow-y-auto md:overflow-hidden">
            
            {/* --- COMPACT PAGE HEADER --- */}
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

              <div className="flex items-center gap-3 bg-surface border border-white/5 p-3 rounded-xl min-w-[200px] shrink-0">
                 <div className="p-2 bg-gold/10 rounded-lg text-gold">
                    <Clock className="w-5 h-5" />
                 </div>
                 <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">{countdown.label}</p>
                    <p className="text-lg font-mono font-bold text-white tracking-wide leading-none">{countdown.text}</p>
                 </div>
              </div>
            </header>


            {/* --- DYNAMIC CONTENT VIEW (Flex 1 to fill space) --- */}
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
                    
                    {/* === VIEW: OVERVIEW (Compact Grid) === */}
                    {activeSection === 'overview' && (
                       <div className="flex flex-col h-full gap-4 md:gap-6">
                          
                          {/* Slim Horizontal Timeline */}
                          <div className="bg-surface border border-white/5 rounded-xl p-4 md:p-6 overflow-x-auto shrink-0">
                             <div className="flex justify-between items-center relative min-w-[500px]">
                                {/* Connecting Line */}
                                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/10 -z-0 -translate-y-1/2" />
                                
                                {dynamicTimeline.map((step, idx) => (
                                   <div key={step.id} className="relative z-10 flex flex-col items-center gap-2 group">
                                      <div className={`w-3 h-3 rounded-full border-2 flex items-center justify-center transition-all duration-500
                                         ${step.status === 'active' ? 'bg-gold border-gold scale-150 shadow-[0_0_10px_var(--color-gold)]' : 
                                           step.status === 'done' ? 'bg-gold border-gold' : 'bg-surface border-gray-600'}
                                      `}>
                                      </div>
                                      <div className="text-center bg-background/50 backdrop-blur-sm px-2 rounded">
                                         <p className={`text-[10px] md:text-xs font-bold ${step.status === 'active' ? 'text-white' : 'text-gray-500'}`}>{step.title}</p>
                                         <p className="text-[9px] text-gray-600 font-mono">{format(new Date(step.startDate), 'MMM dd')}</p>
                                      </div>
                                   </div>
                                ))}
                             </div>
                          </div>

                          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
                             {/* Terminal (Span 7) - Reduced width */}
                             <div className="lg:col-span-7 flex flex-col bg-black border border-gold/30 rounded-xl p-4 md:p-6 font-mono text-xs shadow-[0_0_20px_rgba(255,215,0,0.1)] overflow-hidden min-h-[300px]">
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
                                      {hackathon.announcements?.map((log: any) => {
                                         let effectClass = '';
                                         if (log.config?.effect === 'pulse') effectClass = 'animate-pulse font-bold';
                                         if (log.config?.effect === 'typewriter') effectClass = 'border-r-2 border-gold pr-1 animate-pulse';
                                         if (log.config?.effect === 'glitch') effectClass = 'text-shadow-glitch';
                                
                                         let widgetContent = null;
                                         if (log.config?.widget?.type === 'countdown') {
                                            const target = new Date(log.config.widget.target);
                                            const diff = target.getTime() - now.getTime();
                                            if (diff > 0) {
                                               const hrs = Math.floor(diff / (1000 * 60 * 60));
                                               const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                                               const secs = Math.floor((diff % (1000 * 60)) / 1000);
                                               widgetContent = <span className="ml-2 text-red-500 font-bold bg-red-900/20 px-1 rounded">{String(hrs).padStart(2, '0')}:{String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}</span>;
                                            } else {
                                               widgetContent = <span className="ml-2 text-gray-500">[EXPIRED]</span>;
                                            }
                                         }
                                
                                         return (
                                           <div key={log.id} className="group">
                                               <span className="opacity-50 text-[10px] mr-2">[{format(new Date(log.date), 'HH:mm')}]</span>
                                               <span className={`
                                                   ${log.type === 'warning' ? 'text-yellow-400' : log.type === 'success' ? 'text-gold' : 'text-gray-300'}
                                                   ${effectClass}
                                               `}
                                               style={log.config?.effect === 'glitch' ? { textShadow: '2px 0 red, -2px 0 blue' } : {}}
                                               >
                                                 {log.message}
                                               </span>
                                               {widgetContent}
                                           </div>
                                         );
                                       })}
                                       {terminalHistory.map((item, idx) => (
                                         <div key={idx} className={`${item.type === 'error' ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                                           {item.type === 'command' ? `$ ${item.content}` : item.content}
                                         </div>
                                       ))}
                                       <div ref={terminalEndRef} />
                                   </div>
           
                                   {/* Input Line */}
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
                                           placeholder=""
                                         />
                                      </div>
                                   </div>
                                </div>
                             </div>

                             {/* Right Column: Tasks & Activity (Span 5) */}
                             <div className="lg:col-span-5 flex flex-col gap-4 min-h-0 overflow-y-auto md:overflow-hidden">
                                
                                {/* Your Tasks (Dynamic based on phase) */}
                                <div className="flex-1 bg-surface border border-white/5 rounded-xl p-4 flex flex-col min-h-0">
                                   {(() => {
                                      const activeStep = dynamicTimeline.find(step => step.status === 'active');
                                      const currentTasks = hackathon?.tasks?.filter(t => t.phaseId === activeStep?.id) || [];
                                      
                                      return (
                                         <>
                                            <div className="flex justify-between items-center mb-3">
                                               <h3 className="text-gray-400 text-xs uppercase tracking-wider flex items-center gap-2">
                                                  <CheckCircle2 className="w-3 h-3 text-gold" /> Your Tasks
                                               </h3>
                                               {activeStep && <span className="text-[10px] text-gold bg-gold/10 px-2 py-0.5 rounded border border-gold/20">{activeStep.title}</span>}
                                            </div>
                                            
                                            {currentTasks.length > 0 ? (
                                               <div className="space-y-2 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10">
                                                  {currentTasks.map((task) => (
                                                     <div key={task.id} className="flex items-start gap-3 p-3 bg-white/5 border border-white/5 rounded-lg group hover:border-gold/30 transition-colors">
                                                        <button className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors
                                                           ${task.done ? 'bg-green-500 border-green-500 text-black' : 'border-gray-600 hover:border-gray-400'}`}>
                                                           {task.done && <CheckCircle2 className="w-3 h-3" />}
                                                        </button>
                                                        <span className={`text-xs ${task.done ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
                                                           {task.text}
                                                        </span>
                                                     </div>
                                                  ))}
                                               </div>
                                            ) : (
                                               <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500">
                                                  <CheckCircle2 className="w-8 h-8 mb-2 opacity-20" />
                                                  <p className="text-xs">All tasks completed for this phase!</p>
                                               </div>
                                            )}
                                         </>
                                      );
                                   })()}
                                </div>

                                {/* Live Activity */}
                                <div className="bg-surface border border-white/5 rounded-xl p-4 h-1/3 flex flex-col shrink-0">
                                   <h3 className="text-gray-400 text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
                                      <Activity className="w-3 h-3 text-green-400" /> Live Activity
                                   </h3>
                                   <div className="space-y-3 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10">
                                      {MOCK_ACTIVITY.map((act, i) => (
                                         <div key={i} className="flex items-center gap-2 text-xs">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0" />
                                            <p className="text-gray-400 truncate">
                                               <span className="text-white font-bold">{act.user}</span> {act.action}
                                            </p>
                                            <span className="text-[10px] text-gray-600 ml-auto whitespace-nowrap">{act.time}</span>
                                         </div>
                                      ))}
                                   </div>
                                </div>

                             </div>
                          </div>
                       </div>
                    )}


                    {/* === VIEW: TRACKS & PRIZES (Scrollable on Overflow) === */}
                    {activeSection === 'tracks' && (
                       <div className="grid lg:grid-cols-3 gap-6 h-full overflow-y-auto pr-2 pb-20 md:pb-0">
                          {/* Left: Tracks (2/3) */}
                          <div className="lg:col-span-2 space-y-4">
                             <h2 className="text-lg font-bold text-white font-quantico flex items-center gap-2 sticky top-0 bg-[#0a0a0a] z-10 py-2">
                                <Target className="w-4 h-4 text-gold" /> Tracks
                             </h2>
                             <div className="grid md:grid-cols-2 gap-4">
                                {hackathon.tracks?.map((track, i) => {
                                   const TrackIcon = LucideIconMap[track.icon as keyof typeof LucideIconMap] || Target;
                                   return (
                                      <div key={i} className="group bg-surface border border-white/5 p-4 rounded-xl hover:border-gold/30 transition-all cursor-default">
                                         <div className={`w-8 h-8 rounded-lg bg-black/40 ${track.color} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                                            <TrackIcon className="w-4 h-4" />
                                         </div>
                                         <h3 className="font-bold text-white mb-1">{track.title}</h3>
                                         <p className="text-xs text-gray-400 leading-relaxed line-clamp-3">
                                            Build innovative solutions focusing on {track.title}.
                                         </p>
                                      </div>
                                   )
                                })}
                             </div>
                          </div>

                          {/* Right: Prizes (1/3) */}
                          <div className="space-y-4">
                             <h2 className="text-lg font-bold text-white font-quantico flex items-center gap-2 sticky top-0 bg-[#0a0a0a] z-10 py-2">
                                <Trophy className="w-4 h-4 text-gold" /> Prizes
                             </h2>
                             <div className="bg-surface border border-white/5 rounded-xl overflow-hidden">
                                {hackathon.prizes?.map((prize, i) => (
                                   <div key={i} className="flex items-center justify-between p-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                                      <div className="flex items-center gap-3">
                                         <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs
                                            ${i === 0 ? 'bg-gold text-black shadow-[0_0_10px_var(--color-gold)]' : 
                                              i === 1 ? 'bg-gray-300 text-black' : 
                                              i === 2 ? 'bg-amber-700 text-white' : 'bg-white/5 text-gray-500'}
                                         `}>
                                            {i < 3 ? i + 1 : '-'}
                                         </div>
                                         <span className={`text-xs ${i < 3 ? 'text-white font-medium' : 'text-gray-400'}`}>{prize.rank}</span>
                                      </div>
                                      <span className="text-gold font-mono font-bold text-xs">{prize.reward}</span>
                                   </div>
                                ))}
                             </div>
                          </div>
                       </div>
                    )}


                    {/* === VIEW: PARTICIPANTS (Scrollable) === */}
                    {activeSection === 'participants' && (
                       <div className="flex flex-col h-full gap-4 pb-20 md:pb-0">
                          {/* Search & Filter Bar */}
                          <div className="flex flex-col md:flex-row justify-between gap-3 shrink-0">
                             <div className="relative flex-1 max-w-lg">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input 
                                   type="text" 
                                   placeholder="Search..."
                                   value={searchTeamQuery}
                                   onChange={e => setSearchTeamQuery(e.target.value)}
                                   className="w-full bg-surface border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-gold/50 transition-colors"
                                />
                             </div>
                             <div className="flex bg-surface border border-white/10 rounded-lg p-1 shrink-0 self-start md:self-auto">
                                <button
                                  onClick={() => setTeamTabMode('teams')}
                                  className={`px-3 py-1.5 text-[10px] md:text-xs font-bold rounded-md transition-all ${teamTabMode === 'teams' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                                >
                                  Find Teams
                                </button>
                                <button
                                  onClick={() => setTeamTabMode('teammates')}
                                  className={`px-3 py-1.5 text-[10px] md:text-xs font-bold rounded-md transition-all ${teamTabMode === 'teammates' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                                >
                                  Find Talent
                                </button>
                             </div>
                          </div>

                          {/* Grid Content */}
                          <div className="flex-1 overflow-y-auto min-h-0 pr-2">
                             <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {teamTabMode === 'teams' ? (
                                   (hackathon.teams || []).filter((t: any) => t.name.toLowerCase().includes(searchTeamQuery.toLowerCase())).map((team: any) => (
                                      <div key={team.id} className="bg-surface border border-white/5 rounded-xl p-4 hover:border-gold/30 transition-all group flex flex-col h-full">
                                         <div className="flex justify-between items-start mb-2">
                                            <h3 className="text-sm font-bold text-white group-hover:text-gold transition-colors truncate">{team.name}</h3>
                                            <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-gray-400 shrink-0">{team.members}/{team.maxMembers}</span>
                                         </div>
                                         <div className="flex flex-wrap gap-1 mb-4 flex-1 content-start">
                                            {team.tags.map((tag: string) => <span key={tag} className="text-[9px] bg-black/40 text-gray-400 px-1.5 py-0.5 rounded border border-white/5">{tag}</span>)}
                                         </div>
                                         <button className="w-full py-2 bg-white/5 hover:bg-gold hover:text-black text-gray-300 font-bold text-xs rounded-lg transition-colors mt-auto">
                                            Request to Join
                                         </button>
                                      </div>
                                   ))
                                ) : (
                                   (hackathon.participants || []).filter((u: any) => u.name.toLowerCase().includes(searchTeamQuery.toLowerCase())).map((user: any) => (
                                      <div key={user.id} className="bg-surface border border-white/5 rounded-xl p-4 hover:border-blue-500/30 transition-all flex items-center gap-3">
                                         <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                                            {user.name.charAt(0)}
                                         </div>
                                         <div className="min-w-0 flex-1">
                                            <h4 className="text-white font-bold text-sm truncate">{user.name}</h4>
                                            <p className="text-[10px] text-gray-500 truncate">{user.role}</p>
                                         </div>
                                         <button className="p-2 bg-white/5 rounded-full hover:text-white text-gray-500 transition-colors shrink-0">
                                            <MessageSquare className="w-3.5 h-3.5" />
                                         </button>
                                      </div>
                                   ))
                                )}
                             </div>
                          </div>
                       </div>
                    )}


                    {/* === VIEW: MY PROJECT (Scrollable) === */}
                    {activeSection === 'project' && (
                       <div className="h-full overflow-y-auto pb-20 md:pb-0 pr-2">
                          
                          {/* State: No Team */}
                          {!userTeam && (
                             <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-surface border border-white/5 rounded-xl">
                                <div className="w-16 h-16 bg-gold/10 text-gold rounded-full flex items-center justify-center mb-4">
                                   <Rocket className="w-8 h-8" />
                                </div>
                                <h2 className="text-2xl font-bold text-white font-quantico mb-2">Start Building</h2>
                                <p className="text-gray-400 max-w-sm mx-auto mb-6 text-sm">
                                   Create your own team to submit a project, or join an existing squad.
                                </p>
                                <div className="flex justify-center gap-3">
                                   <button 
                                      onClick={() => setUserTeam(DEFAULT_NEW_TEAM)}
                                      className="bg-gold text-black font-bold px-5 py-2.5 rounded-lg hover:bg-gold/90 transition-transform hover:scale-105 text-xs"
                                   >
                                      Create Team
                                   </button>
                                   <button 
                                      onClick={() => setActiveSection('participants')}
                                      className="bg-white/5 text-white font-bold px-5 py-2.5 rounded-lg hover:bg-white/10 transition-colors text-xs"
                                   >
                                      Find Team
                                   </button>
                                </div>
                             </div>
                          )}

                          {/* State: Has Team */}
                          {userTeam && (
                             <div className="space-y-6">
                                {/* Project/Team Header */}
                                <div className="bg-surface border border-white/5 rounded-xl p-4 md:p-6 flex justify-between items-center">
                                   <div className="flex items-center gap-3">
                                      <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center text-xl font-bold text-white shadow-lg shrink-0">
                                         {userTeam.name.charAt(0)}
                                      </div>
                                      <div className="min-w-0">
                                         <h2 className="text-lg md:text-xl font-bold text-white truncate">{userTeam.name}</h2>
                                         <div className="flex flex-wrap gap-1 mt-1">
                                            <span className="text-[10px] text-gold bg-gold/10 px-1.5 py-0.5 rounded border border-gold/20 shrink-0">Ready</span>
                                            {userTeam.tags.map((t: string) => <span key={t} className="text-[10px] text-gray-500 bg-white/5 px-1.5 py-0.5 rounded shrink-0">{t}</span>)}
                                         </div>
                                      </div>
                                   </div>
                                   <div className="flex gap-1 shrink-0">
                                      <button className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                                         <Settings className="w-4 h-4" />
                                      </button>
                                      <button onClick={() => setUserTeam(null)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                                         <LogOut className="w-4 h-4" />
                                      </button>
                                   </div>
                                </div>

                                {/* Sub-Tabs */}
                                <div className="flex border-b border-white/10">
                                   <button 
                                      onClick={() => setProjectSubTab('dashboard')}
                                      className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${projectSubTab === 'dashboard' ? 'border-gold text-gold' : 'border-transparent text-gray-500 hover:text-white'}`}
                                   >
                                      Dashboard
                                   </button>
                                   <button 
                                      onClick={() => setProjectSubTab('submit')}
                                      className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${projectSubTab === 'submit' ? 'border-gold text-gold' : 'border-transparent text-gray-500 hover:text-white'}`}
                                   >
                                      Submission
                                   </button>
                                </div>

                                {/* Dashboard Content */}
                                {projectSubTab === 'dashboard' && (
                                   <div className="grid md:grid-cols-2 gap-4">
                                      <div className="bg-surface border border-white/5 rounded-xl p-4">
                                         <div className="flex justify-between items-center mb-4">
                                            <h3 className="font-bold text-white text-sm flex items-center gap-2">
                                               <Users className="w-3.5 h-3.5 text-gold" /> Members
                                            </h3>
                                            <button className="text-[10px] bg-white/5 hover:bg-white/10 text-white px-2 py-1 rounded flex items-center gap-1">
                                               <Plus className="w-3 h-3" /> Invite
                                            </button>
                                         </div>
                                         <div className="space-y-2">
                                            {userTeam.members.map((m: any, i: number) => (
                                               <div key={i} className="flex items-center justify-between p-2 bg-black/20 rounded-lg">
                                                  <div className="flex items-center gap-2">
                                                     <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-[10px] font-bold text-white">{m.name.charAt(0)}</div>
                                                     <div>
                                                        <p className="text-xs font-bold text-white">{m.name}</p>
                                                        <p className="text-[9px] text-gray-500">{m.role}</p>
                                                     </div>
                                                  </div>
                                                  {m.isLeader && <Trophy className="w-3 h-3 text-gold" />}
                                               </div>
                                            ))}
                                         </div>
                                      </div>
                                      
                                      <div className="bg-surface border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center text-center min-h-[150px]">
                                         <MessageSquare className="w-6 h-6 text-gray-600 mb-2" />
                                         <h4 className="text-gray-400 font-bold text-sm">Team Chat</h4>
                                         <p className="text-[10px] text-gray-600 mt-1">Connect Discord to enable chat.</p>
                                         <button className="mt-3 text-[10px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/50 px-3 py-1 rounded hover:bg-indigo-500/30 transition-colors">
                                            Connect
                                         </button>
                                      </div>
                                   </div>
                                )}

                                {/* Submission Form */}
                                {projectSubTab === 'submit' && (
                                   <div className="max-w-2xl mx-auto">
                                      {!isSubmitted ? (
                                         <form onSubmit={handleSubmitProject} className="bg-surface border border-white/5 rounded-xl p-6 space-y-4">
                                            <div>
                                               <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Project Name</label>
                                               <input type="text" className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-gold/50 outline-none" defaultValue={userTeam.name} />
                                            </div>
                                            <div>
                                               <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Track</label>
                                               <select className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-gold/50 outline-none appearance-none">
                                                  {hackathon.tracks?.map((t, index) => <option key={index}>{t.title}</option>)}
                                               </select>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                               <div>
                                                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Demo Video</label>
                                                  <input type="text" className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-gold/50 outline-none" placeholder="YouTube URL" />
                                               </div>
                                               <div>
                                                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Github</label>
                                                  <input type="text" className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-gold/50 outline-none" placeholder="Repo URL" />
                                               </div>
                                            </div>
                                            <button type="submit" className="w-full bg-gold text-black font-bold py-3 rounded-lg hover:bg-gold/90 transition-colors mt-2 text-sm">
                                               Submit Project
                                            </button>
                                         </form>
                                      ) : (
                                         <div className="text-center py-10 bg-gold/10 border border-gold/30 rounded-xl">
                                            <CheckCircle2 className="w-10 h-10 text-gold mx-auto mb-3" />
                                            <h3 className="text-xl font-bold text-white font-quantico">Submitted!</h3>
                                            <button onClick={() => setIsSubmitted(false)} className="text-xs text-gray-500 hover:text-white underline mt-4">Edit Submission</button>
                                         </div>
                                      )}
                                   </div>
                                )}
                             </div>
                          )}
                       </div>
                    )}

                    {/* === VIEW: RESOURCES (Scrollable) === */}
                    {activeSection === 'resources' && (
                       <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 h-full overflow-y-auto pb-20 md:pb-0">
                          {hackathon.resources?.map((res, i) => {
                              const ResIcon = LucideIconMap[res.icon as keyof typeof LucideIconMap] || LinkIcon;
                              return (
                                 <a key={i} href={res.link} target="_blank" rel="noopener noreferrer" className="bg-surface border border-white/5 p-4 rounded-xl hover:bg-white/5 transition-colors group flex flex-col h-auto max-h-32">
                                    <ResIcon className="w-6 h-6 text-gray-500 group-hover:text-gold mb-3 transition-colors" />
                                    <h3 className="font-bold text-white mb-1 text-sm">{res.name}</h3>
                                    <p className="text-[10px] text-gray-500">External Link <ChevronRight className="w-3 h-3 inline ml-1" /></p>
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