'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
   Trophy, Calendar, Users, Clock, ChevronRight,
   Target, MessageSquare, FileText, CheckCircle2,
   AlertCircle, MoreHorizontal, Github, Disc, Link as LinkIcon,
   Monitor, Mic, SwatchBook, Code, ShieldCheck, Smartphone, UserPlus,
   RefreshCw, Lock, Search, Plus, Settings, LogOut, UserMinus,
   LayoutDashboard, Rocket, BookOpen, Menu as MenuIcon, X, Sparkles, Activity, Send, CheckSquare, Globe, Video, Youtube, ThumbsUp, ArrowLeft
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { useSearchParams } from 'next/navigation';
import { format, isBefore, isSameDay } from 'date-fns';
import { HACKATHONS_MOCK_DATA, MY_IDEAS } from '@/lib/mock-hackathons';
import InviteMemberModal from '@/components/InviteMemberModal';
import { useAppStore } from '@/lib/store';

// Map icon names from mock data to Lucide React components
const LucideIconMap: { [key: string]: React.ElementType } = {
   Trophy, Calendar, Users, Clock, ChevronRight,
   Target, MessageSquare, FileText, CheckCircle2,
   AlertCircle, MoreHorizontal, Github, Disc, LinkIcon,
   Monitor, Mic, SwatchBook, Code, ShieldCheck, Smartphone, UserPlus, RefreshCw
};

const DEFAULT_NEW_TEAM = {

   name: 'My New Team',

   tags: ['New', 'Idea'],

   members: [{ id: 'current-user', name: 'You', role: 'Leader', isLeader: true }], // Added id for current user

   maxMembers: 5

};



// Moved SidebarItem definition outside the component
const SidebarItem = ({ id, label, icon: Icon, activeSection, setActiveSection, setIsMobileMenuOpen }:
   { id: string, label: string, icon: any, activeSection: string, setActiveSection: (id: string) => void, setIsMobileMenuOpen: (isOpen: boolean) => void }) => (
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


export default function HackathonDashboard({ params }: { params: { id: string } }) {
   const { id } = params;
   const hackathon = HACKATHONS_MOCK_DATA.find(h => h.id === id);
   const searchParams = useSearchParams();
   const mockDate = searchParams.get('mockDate') || searchParams.get('mockdate');
   const now = mockDate ? new Date(mockDate) : new Date();

   // App Store
   const { openSubmitModal } = useAppStore();

   // Layout State
   const [activeSection, setActiveSection] = useState('overview');
   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

   // Submission State
   const [submissionStep, setSubmissionStep] = useState<'select' | 'details' | 'completed'>('select');
   const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
   const [submissionForm, setSubmissionForm] = useState({ repoUrl: '', videoUrl: '', notes: '' });

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

   // MOCK DATA for inviting users
   const MOCK_AVAILABLE_USERS = [
      { id: 'user-a', name: 'Alice Smith', skills: ['Frontend', 'UI/UX'] },
      { id: 'user-b', name: 'Bob Johnson', skills: ['Backend', 'Database'] },
      { id: 'user-c', name: 'Charlie Brown', skills: ['Solidity', 'Smart Contracts'] },
      { id: 'user-d', name: 'Diana Prince', skills: ['DevOps', 'Cloud'] },
      { id: 'user-e', name: 'Eve Adams', skills: ['Project Management', 'Marketing'] },
      { id: 'user-f', name: 'Frank White', skills: ['AI/ML', 'Data Science'] },
      { id: 'current-user', name: 'Thodium', skills: ['Frontend', 'UI/UX', 'Fullstack'] }, // Add Thodium as a user to receive invites
   ];

   // Team Invite States
   const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
   const [searchInviteUserQuery, setSearchInviteUserQuery] = useState('');
   const [pendingInvitations, setPendingInvitations] = useState<any[]>([]); // New state for incoming invitations

   // Data States
   const [userTeam, setUserTeam] = useState<any>(null);
   const [isCreatingTeam, setIsCreatingTeam] = useState(false);
   const [newTeamData, setNewTeamData] = useState({ name: '' });
   const [isRegistered, setIsRegistered] = useState(false);
   const [countdown, setCountdown] = useState({ text: 'Calculating...', label: 'Loading...' });

   const handleRegister = () => {
      // Mock registration logic
      const confirm = window.confirm("Confirm registration for this Hackathon?");
      if (confirm) {
         setIsRegistered(true);
      }
   };
   // Handle inviting a user (mock functionality)
   const handleInviteUser = (userId: string) => {
      const invitedUser = MOCK_AVAILABLE_USERS.find(user => user.id === userId);
      if (invitedUser && userTeam) {
         console.log(`Inviting user ${invitedUser.name} to team ${userTeam.name}`);
         alert(`Invitation sent to ${invitedUser.name}! (Mock)`);
         // Mock: Add an invitation to the pendingInvitations of the invited user
         // For simplicity, we'll simulate an invitation for 'current-user' (Thodium)
         if (invitedUser.id === 'current-user') {
            setPendingInvitations(prev => [...prev, {
               id: `invite-${Date.now()}`,
               teamName: userTeam.name,
               teamId: 'mock-team-id',
               inviterId: userTeam.members[0].id, // Assuming first member is inviter
               inviterName: userTeam.members[0].name,
            }]);
         }
         setIsInviteModalOpen(false);
         setSearchInviteUserQuery(''); // Clear search query
      }
   };

   // Handle accepting an invitation (mock functionality)
   const handleAcceptInvitation = (inviteId: string) => {
      const invite = pendingInvitations.find(inv => inv.id === inviteId);
      if (invite && userTeam) { // Assuming userTeam is the current user's team
         const inviterUser = MOCK_AVAILABLE_USERS.find(user => user.id === invite.inviterId);
         if (inviterUser) {
            setUserTeam(prev => ({
               ...prev,
               members: [...(prev?.members || []), { id: inviterUser.id, name: inviterUser.name, role: 'Member', isLeader: false }]
            }));
            alert(`You accepted the invitation from ${invite.teamName}!`);
         } else {
            alert(`You accepted the invitation from ${invite.teamName}! (Inviter not found)`);
         }
         setPendingInvitations(prev => prev.filter(inv => inv.id !== inviteId));
      }
   };

   // Handle rejecting an invitation (mock functionality)
   const handleRejectInvitation = (inviteId: string) => {
      setPendingInvitations(prev => prev.filter(inv => inv.id !== inviteId));
      alert('Invitation rejected.');
   };



   // Terminal State
   const [terminalInput, setTerminalInput] = useState('');
   const [terminalHistory, setTerminalHistory] = useState<{ type: 'command' | 'error', content: string }[]>([]);
   const [isTerminalShaking, setIsTerminalShaking] = useState(false);
   const [deniedCount, setDeniedCount] = useState(0);
   const terminalEndRef = useRef<HTMLDivElement>(null);

   const denialMessages = new Map<number, string>([
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

   // Submission State
   const [submission, setSubmission] = useState<{ track?: string }>({});

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
               text: `${String(days).padStart(2, '0')}D : ${String(hours).padStart(2, '0')}H : ${String(minutes).padStart(2, '0')}M : ${String(seconds).padStart(2, '0')}S`,
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



         {/* Mobile Menu Backdrop */}
         {isMobileMenuOpen && (
            <div
               className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm md:hidden"
               onClick={() => setIsMobileMenuOpen(false)}
            />
         )}

         <div className="flex-1 flex overflow-hidden relative pt-20 md:pt-24">
            {/* Sidebar */}
            <aside className={`
            fixed inset-y-0 left-0 z-[70] w-64 bg-[#0a0a0a] border-r border-white/10 flex flex-col transform transition-transform duration-300 md:translate-x-0 md:relative md:bg-transparent md:border-white/5 md:z-auto md:w-56
            ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
               <div className="p-4 flex flex-col gap-6">
                  <Link href="/home" className="flex items-center gap-2 text-gray-500 hover:text-gold transition-colors group">
                     <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                     <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Back to Hub</span>
                  </Link>

                  <div className="hidden md:block">
                     <div className="flex items-center gap-2 text-white font-quantico font-bold text-lg mb-1">
                        <div className="w-8 h-8 bg-gradient-to-br from-gold to-yellow-600 rounded flex items-center justify-center text-black text-xs">H</div>
                        HACKATHON
                     </div>
                     <p className="text-[10px] text-gray-500 uppercase tracking-widest pl-10">Workspace</p>
                  </div>
               </div>
               <nav className="flex-1 px-3 space-y-1 overflow-y-auto pt-4 md:pt-0">
                  <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider px-2 mb-2 mt-2">Menu</div>
                  <SidebarItem id="overview" label="Overview" icon={LayoutDashboard} activeSection={activeSection} setActiveSection={setActiveSection} setIsMobileMenuOpen={setIsMobileMenuOpen} />
                  <SidebarItem id="details" label="Details" icon={FileText} activeSection={activeSection} setActiveSection={setActiveSection} setIsMobileMenuOpen={setIsMobileMenuOpen} />

                  <div className="my-4 border-t border-white/5" />
                  <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider px-2 mb-2">My Zone</div>
                  <SidebarItem id="submission" label="Submission" icon={Send} activeSection={activeSection} setActiveSection={setActiveSection} setIsMobileMenuOpen={setIsMobileMenuOpen} />
                  <SidebarItem id="project" label="Team & Reg" icon={Rocket} activeSection={activeSection} setActiveSection={setActiveSection} setIsMobileMenuOpen={setIsMobileMenuOpen} />
                  <SidebarItem id="resources" label="Resources" icon={BookOpen} activeSection={activeSection} setActiveSection={setActiveSection} setIsMobileMenuOpen={setIsMobileMenuOpen} />
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


               <div className="h-full flex flex-col p-2 md:p-4 space-y-2 md:space-y-4 overflow-y-auto md:overflow-hidden">

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

                           {/* Render content based on activeSection */}
                           {(() => {
                              switch (activeSection) {
                                 case 'overview':
                                    return (
                                       <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">

                                          {/* LEFT COLUMN: Title, Description, Terminal (Span 8) */}
                                          <div className="lg:col-span-8 flex flex-col gap-4 h-full min-h-0">
                                             {/* 1x6 Image Banner */}
                                             {hackathon.image_url && (
                                                <div className="relative w-full aspect-[2/1] md:aspect-[4/1] lg:aspect-[6/1] rounded-b-xl overflow-hidden shadow-2xl border-x border-b border-white/10 shrink-0">
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
                                             <div>
                                                <div className="flex items-center gap-3 mb-2">
                                                   <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${hackathon.status === 'active' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
                                                      {hackathon.status === 'active' ? 'Live Event' : 'Upcoming'}
                                                   </span>
                                                   <span className="text-gray-500 text-xs flex items-center gap-1">
                                                      <Calendar className="w-3 h-3" />
                                                      {eventStartDate && format(new Date(eventStartDate), 'MMM dd')} - {eventEndDate && format(new Date(eventEndDate), 'MMM dd, yyyy')}
                                                   </span>
                                                </div>
                                                <h1 className="text-lg md:text-xl lg:text-2xl font-bold text-white font-quantico leading-tight">
                                                   {hackathon.title}
                                                </h1>
                                                <p className="text-gray-400 max-w-xl text-[10px] leading-relaxed line-clamp-2">
                                                   Build the future of decentralized technology. Join thousands of developers to compete for the grand prize.
                                                </p>
                                             </div>

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

                                          {/* RIGHT COLUMN: Sidebar Widgets (Span 4) */}
                                          <div className="lg:col-span-4 flex flex-col gap-6 h-full overflow-y-auto pr-2 pb-20 md:pb-0">

                                             {/* 0. Quick Action: Submit */}
                                             <div className="bg-gradient-to-br from-gold/20 to-yellow-600/5 border border-gold/30 rounded-xl p-4 shrink-0 shadow-lg shadow-gold/5">
                                                <h3 className="text-xs font-bold text-gold uppercase tracking-wider mb-2 flex items-center gap-2">
                                                   <Send className="w-3 h-3" /> Ready to ship?
                                                </h3>
                                                <p className="text-[10px] text-gray-400 mb-3">Submit your idea details and artifacts for judging.</p>
                                                <button
                                                   onClick={() => setActiveSection('submission')}
                                                   className="w-full py-2 bg-gold text-black font-bold rounded-lg text-xs hover:bg-gold/90 transition-transform active:scale-95 flex items-center justify-center gap-2"
                                                >
                                                   Go to Submission <ChevronRight className="w-3 h-3" />
                                                </button>
                                             </div>

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
                                                                  {step.endDate && isSameDay(new Date(step.startDate), new Date(step.endDate)) ? `on ${format(new Date(step.startDate), 'MMMM dd')}` : `${format(new Date(step.startDate), 'MMM dd')}${step.endDate ? ` - ${format(new Date(step.endDate), 'MMM dd')}` : ''}`}
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
                                    );

                                 case 'details':
                                    return (
                                       <div className="grid lg:grid-cols-3 gap-6 h-full overflow-y-auto pr-2 pb-20 md:pb-0">
                                          <div className="lg:col-span-2 space-y-6">
                                             {/* About Section */}
                                             <div className="bg-surface border border-white/5 rounded-xl p-6">
                                                <h2 className="text-xl font-bold text-white mb-4 font-quantico flex items-center gap-2">
                                                   <FileText className="w-5 h-5 text-gold" />
                                                   About the Event
                                                </h2>
                                                <div className="prose prose-invert prose-sm max-w-none text-gray-300">
                                                   <p className="leading-relaxed mb-4">{hackathon.description}</p>
                                                   <p className="leading-relaxed">
                                                      This hackathon invites developers, designers, and innovators to push the boundaries of what is possible.
                                                      Whether you are a seasoned pro or a first-time hacker, this is your chance to build something impactful,
                                                      connect with a global community, and win amazing prizes.
                                                   </p>
                                                   <h3 className="text-white font-bold mt-6 mb-2">Rules & Requirements</h3>
                                                   <ul className="list-disc pl-5 space-y-1 text-gray-400">
                                                      <li>All code must be written during the hackathon period.</li>
                                                      <li>Teams can have up to {hackathon.teams?.[0]?.maxMembers || 5} members.</li>
                                                      <li>External libraries and frameworks are allowed.</li>
                                                      <li>Projects must include a working demo and a video submission.</li>
                                                   </ul>
                                                </div>
                                             </div>

                                             {/* Focus Areas (Simplified Tracks) */}
                                             <div className="bg-surface border border-white/5 rounded-xl p-6">
                                                <h2 className="text-xl font-bold text-white mb-4 font-quantico flex items-center gap-2">
                                                   <Target className="w-5 h-5 text-gold" />
                                                   Focus Areas
                                                </h2>
                                                <div className="grid sm:grid-cols-2 gap-4">
                                                   {hackathon.tracks?.map((track, i) => (
                                                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
                                                         <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${track.color ? track.color.replace('text-', 'bg-') : 'bg-gold'}`} />
                                                         <div>
                                                            <strong className="text-gray-200 block text-sm">{track.title}</strong>
                                                            <p className="text-xs text-gray-500 mt-1">Innovative solutions for {track.title.toLowerCase()}.</p>
                                                         </div>
                                                      </div>
                                                   ))}
                                                </div>
                                             </div>
                                          </div>

                                          <div className="lg:col-span-1 space-y-6">
                                             <div className="bg-surface border border-white/5 rounded-xl p-6">
                                                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2 font-quantico">
                                                   <Trophy className="w-5 h-5 text-gold" />
                                                   Prizes
                                                </h2>
                                                <div className="space-y-3">
                                                   {hackathon.prizes?.map((prize, i) => (
                                                      <div key={i} className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${i === 0 ? 'bg-gold/10 border-gold/30' : 'bg-black/20 border-white/5'}`}>
                                                         <div className="flex items-center gap-3">
                                                            {i === 0 && <span className="text-xl">👑</span>}
                                                            <span className={`font-medium text-sm ${i === 0 ? 'text-gold' : 'text-white'}`}>{prize.rank}</span>
                                                         </div>
                                                         <span className="text-gold font-mono font-bold text-sm">{prize.reward}</span>
                                                      </div>
                                                   ))}
                                                </div>
                                                <div className="mt-6 pt-6 border-t border-white/5 text-center">
                                                   <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Total Prize Pool</p>
                                                   <p className="text-2xl font-bold text-white font-mono text-glow-gold">{hackathon.prizePool}</p>
                                                </div>
                                             </div>

                                             {/* Judging Criteria (Placeholder) */}
                                             <div className="bg-surface border border-white/5 rounded-xl p-6">
                                                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2 font-quantico">
                                                   <ShieldCheck className="w-5 h-5 text-gold" />
                                                   Judging Criteria
                                                </h2>
                                                <ul className="space-y-3 text-sm text-gray-400">
                                                   <li className="flex justify-between">
                                                      <span>Innovation</span>
                                                      <span className="text-white font-bold">25%</span>
                                                   </li>
                                                   <li className="flex justify-between">
                                                      <span>Technical Complexity</span>
                                                      <span className="text-white font-bold">25%</span>
                                                   </li>
                                                   <li className="flex justify-between">
                                                      <span>Design & UX</span>
                                                      <span className="text-white font-bold">25%</span>
                                                   </li>
                                                   <li className="flex justify-between">
                                                      <span>Viability</span>
                                                      <span className="text-white font-bold">25%</span>
                                                   </li>
                                                </ul>
                                             </div>
                                          </div>
                                       </div>
                                    );



                                 case 'submission':
                                    return (
                                       <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
                                          {/* LEFT COLUMN: Submission Process (Span 8) */}
                                          <div className="lg:col-span-8 flex flex-col h-full overflow-y-auto pr-2 pb-20 md:pb-0">
                                             {submissionStep === 'select' && (
                                                <div className="space-y-6">
                                                   <div className="bg-surface border border-white/5 rounded-xl p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                                                      <div>
                                                         <h2 className="text-xl font-bold text-white mb-1 font-quantico">Submit Your Idea</h2>
                                                         <p className="text-gray-400 text-xs">Choose an existing idea or create a new one for this hackathon.</p>
                                                      </div>
                                                      <button
                                                         onClick={() => openSubmitModal('idea')}
                                                         className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-xs font-bold transition-all flex items-center gap-2 shrink-0"
                                                      >
                                                         <Plus className="w-3 h-3" /> Create New Idea
                                                      </button>
                                                   </div>

                                                   <div className="grid gap-4">
                                                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Your Hackathon Ideas</div>
                                                      {MY_IDEAS.map(idea => (
                                                         <div
                                                            key={idea.id}
                                                            className={`group relative p-5 rounded-xl border transition-all cursor-pointer ${selectedIdeaId === idea.id ? 'bg-gold/10 border-gold shadow-lg shadow-gold/5' : 'bg-black/20 border-white/5 hover:border-white/20 hover:bg-white/5'}`}
                                                            onClick={() => setSelectedIdeaId(idea.id)}
                                                         >
                                                            <div className="flex justify-between items-start mb-3">
                                                               <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[10px] text-gray-400 font-mono">{idea.category}</span>
                                                               <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${selectedIdeaId === idea.id ? 'bg-gold border-gold' : 'border-gray-600 group-hover:border-gray-400'}`}>
                                                                  {selectedIdeaId === idea.id && <CheckCircle2 className="w-3 h-3 text-black" />}
                                                               </div>
                                                            </div>
                                                            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-gold transition-colors">{idea.title}</h3>
                                                            <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed mb-4">{idea.description}</p>
                                                            <div className="flex items-center gap-4 text-[10px] font-bold text-gray-600 uppercase tracking-tighter">
                                                               <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> {idea.votes} Votes</span>
                                                               <span className="text-gray-800">•</span>
                                                               <span>Created 2 days ago</span>
                                                            </div>
                                                         </div>
                                                      ))}
                                                   </div>

                                                   <div className="flex justify-end pt-4 sticky bottom-0 bg-background/80 backdrop-blur-sm pb-4">
                                                      <button
                                                         disabled={!selectedIdeaId}
                                                         onClick={() => setSubmissionStep('details')}
                                                         className={`px-8 py-3 rounded-xl font-bold text-sm uppercase tracking-widest transition-all flex items-center gap-3 ${!selectedIdeaId ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-gold text-black hover:bg-gold/90 shadow-lg shadow-gold/10'}`}
                                                      >
                                                         Finalize Details <ChevronRight className="w-4 h-4" />
                                                      </button>
                                                   </div>
                                                </div>
                                             )}

                                             {submissionStep === 'details' && (
                                                <div className="space-y-6">
                                                   <div className="bg-surface border border-white/5 rounded-xl p-6">
                                                      <button onClick={() => setSubmissionStep('select')} className="text-xs text-gray-500 hover:text-white mb-4 flex items-center gap-1"><ArrowLeft className="w-3 h-3" /> Back</button>
                                                      <h2 className="text-xl font-bold text-white mb-2 font-quantico">Idea Submission Details</h2>
                                                      <p className="text-gray-400 text-sm">Provide additional materials to help judges understand your vision.</p>
                                                   </div>

                                                   <div className="bg-surface border border-white/5 rounded-xl p-6 space-y-4">
                                                      <div>
                                                         <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Pitch Video Link <span className="text-red-400">*</span></label>
                                                         <div className="relative">
                                                            <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                                            <input
                                                               type="text"
                                                               value={submissionForm.videoUrl}
                                                               onChange={e => setSubmissionForm({ ...submissionForm, videoUrl: e.target.value })}
                                                               placeholder="https://youtube.com/watch?v=... or Loom link"
                                                               className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:border-gold/50 outline-none transition-colors"
                                                            />
                                                         </div>
                                                         <p className="text-[10px] text-gray-500 mt-1.5">A short (max 3 min) video explaining the problem and your proposed solution.</p>
                                                      </div>

                                                      <div>
                                                         <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Pitch Deck / Doc Link (Optional)</label>
                                                         <div className="relative">
                                                            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                                            <input
                                                               type="text"
                                                               value={submissionForm.repoUrl} // Reusing repoUrl state for deckUrl to avoid complex state changes
                                                               onChange={e => setSubmissionForm({ ...submissionForm, repoUrl: e.target.value })}
                                                               placeholder="https://docs.google.com/presentation/..."
                                                               className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:border-gold/50 outline-none transition-colors"
                                                            />
                                                         </div>
                                                      </div>

                                                      <div>
                                                         <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Judging Notes</label>
                                                         <textarea
                                                            value={submissionForm.notes}
                                                            onChange={e => setSubmissionForm({ ...submissionForm, notes: e.target.value })}
                                                            placeholder="Anything else the judges should know about your idea?"
                                                            className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-gold/50 outline-none transition-colors min-h-[100px]"
                                                         />
                                                      </div>
                                                   </div>

                                                   <div className="flex justify-end pt-4">
                                                      <button
                                                         disabled={!submissionForm.videoUrl}
                                                         onClick={() => setSubmissionStep('completed')}
                                                         className={`px-8 py-3 rounded-lg font-bold text-sm transition-colors flex items-center gap-2 ${(!submissionForm.videoUrl) ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-gold text-black hover:bg-gold/90'}`}
                                                      >
                                                         <Send className="w-4 h-4" /> Submit Idea
                                                      </button>
                                                   </div>
                                                </div>
                                             )}

                                             {submissionStep === 'completed' && (
                                                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                                                   <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                                                      <CheckCircle2 className="w-10 h-10 text-green-500" />
                                                   </div>
                                                   <h2 className="text-3xl font-bold text-white mb-2 font-quantico">Submission Received!</h2>
                                                   <p className="text-gray-400 max-w-md mb-8">
                                                      Your project has been successfully submitted. You can update your submission until the deadline.
                                                   </p>
                                                   <div className="flex gap-4">
                                                      <button onClick={() => setSubmissionStep('details')} className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-bold transition-colors">
                                                         Edit Submission
                                                      </button>
                                                      <Link href="/dashboard" className="px-6 py-2.5 bg-gold text-black hover:bg-gold/90 rounded-lg text-sm font-bold transition-colors">
                                                         Back to Dashboard
                                                      </Link>
                                                   </div>
                                                </div>
                                             )}
                                          </div>

                                          {/* RIGHT COLUMN: Sidebar Widgets (Span 4) */}
                                          <div className="lg:col-span-4 flex flex-col gap-6 h-full overflow-y-auto pr-2 pb-20 md:pb-0">

                                             {/* Checklist Widget */}
                                             <div className="bg-surface border border-white/5 rounded-xl p-5">
                                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                                   <CheckSquare className="w-4 h-4" /> Submission Checklist
                                                </h3>
                                                <div className="space-y-3">
                                                   <div className={`flex items-center gap-3 text-sm ${selectedIdeaId ? 'text-green-400' : 'text-gray-500'}`}>
                                                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedIdeaId ? 'border-green-400 bg-green-400/20' : 'border-gray-600'}`}>
                                                         {selectedIdeaId && <CheckCircle2 className="w-3 h-3" />}
                                                      </div>
                                                      <span>Select an Idea</span>
                                                   </div>
                                                   <div className={`flex items-center gap-3 text-sm ${submissionForm.videoUrl ? 'text-green-400' : 'text-gray-500'}`}>
                                                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${submissionForm.videoUrl ? 'border-green-400 bg-green-400/20' : 'border-gray-600'}`}>
                                                         {submissionForm.videoUrl && <CheckCircle2 className="w-3 h-3" />}
                                                      </div>
                                                      <span>Pitch Video Link</span>
                                                   </div>
                                                   <div className={`flex items-center gap-3 text-sm ${submissionForm.repoUrl ? 'text-green-400' : 'text-gray-500'}`}>
                                                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${submissionForm.repoUrl ? 'border-green-400 bg-green-400/20' : 'border-gray-600'}`}>
                                                         {submissionForm.repoUrl && <CheckCircle2 className="w-3 h-3" />}
                                                      </div>
                                                      <span>Pitch Deck (Optional)</span>
                                                   </div>
                                                </div>
                                             </div>

                                             {/* Rules Widget */}
                                             <div className="bg-surface border border-white/5 rounded-xl p-5">
                                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                                   <AlertCircle className="w-4 h-4" /> Submission Rules
                                                </h3>
                                                <ul className="space-y-2 text-xs text-gray-400">
                                                   <li className="flex gap-2">
                                                      <span className="text-gold">•</span>
                                                      Video must explain both problem & solution.
                                                   </li>
                                                   <li className="flex gap-2">
                                                      <span className="text-gold">•</span>
                                                      Max video length: 3 minutes.
                                                   </li>
                                                   <li className="flex gap-2">
                                                      <span className="text-gold">•</span>
                                                      Make sure external links are accessible.
                                                   </li>
                                                </ul>
                                             </div>

                                             {/* Deadline Widget */}
                                             <div className="bg-surface border border-white/5 rounded-xl p-5">
                                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Submission Deadline</h3>
                                                <div className="text-xl font-bold text-white font-mono">
                                                   {format(new Date(eventEndDate!), 'MMM dd, HH:mm')}
                                                </div>
                                                <p className="text-[10px] text-red-400 mt-1">Late submissions are not accepted.</p>
                                             </div>

                                          </div>
                                       </div>
                                    );

                                 case 'project':
                                    return (
                                       <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
                                          {/* LEFT COLUMN: Team Management (Span 8) */}
                                          <div className="lg:col-span-8 flex flex-col gap-6 h-full overflow-y-auto pr-2 pb-20 md:pb-0">
                                             {!isRegistered ? (
                                                <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-surface border border-white/5 rounded-xl relative overflow-hidden">
                                                   <div className="absolute inset-0 bg-gradient-to-b from-gold/5 to-transparent pointer-events-none" />
                                                   <div className="relative z-10 max-w-lg">
                                                      <div className="w-20 h-20 mx-auto mb-6 bg-gold/10 rounded-full flex items-center justify-center border border-gold/30">
                                                         <Trophy className="w-10 h-10 text-gold" />
                                                      </div>
                                                      <h2 className="text-3xl font-bold text-white mb-4 font-quantico">Join the Hackathon</h2>
                                                      <p className="text-gray-400 mb-8 leading-relaxed">
                                                         Register now to access team formation, project submission, and compete for the <strong>{hackathon.prizePool}</strong> prize pool.
                                                      </p>
                                                      <button
                                                         onClick={handleRegister}
                                                         className="px-8 py-4 bg-gradient-to-r from-gold to-yellow-600 text-black font-bold text-lg rounded-xl hover:shadow-[0_0_30px_rgba(255,215,0,0.3)] hover:scale-105 transition-all flex items-center justify-center gap-3 w-full sm:w-auto mx-auto"
                                                      >
                                                         <CheckCircle2 className="w-6 h-6" /> Register Now
                                                      </button>
                                                      <p className="text-xs text-gray-500 mt-6">By registering, you agree to the hackathon rules and terms.</p>
                                                   </div>
                                                </div>
                                             ) : (
                                                !userTeam ? (!isCreatingTeam ? (
                                                   <div className="h-full flex flex-col justify-center max-w-4xl mx-auto w-full">
                                                      {/* Pending Invitations */}
                                                      {pendingInvitations.length > 0 && (
                                                         <div className="bg-surface border border-gold/30 rounded-xl p-6 mb-6 relative overflow-hidden animate-in fade-in slide-in-from-top-5">
                                                            <div className="absolute top-0 left-0 w-1 h-full bg-gold" />
                                                            <h3 className="text-lg font-bold text-white mb-4 font-quantico flex items-center gap-2">
                                                               <MessageSquare className="w-5 h-5 text-gold" /> Pending Invitations
                                                            </h3>
                                                            <div className="space-y-3">
                                                               {pendingInvitations.map((invite) => (
                                                                  <div key={invite.id} className="flex flex-col sm:flex-row items-center justify-between bg-white/5 p-4 rounded-lg border border-white/10 gap-4">
                                                                     <div className="flex items-center gap-3">
                                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold/20 to-yellow-600/20 border border-gold/30 flex items-center justify-center">
                                                                           <Users className="w-5 h-5 text-gold" />
                                                                        </div>
                                                                        <div>
                                                                           <p className="text-sm text-gray-300">
                                                                              <span className="text-white font-bold">{invite.inviterName}</span> invited you to join <span className="text-gold font-bold">{invite.teamName}</span>
                                                                           </p>
                                                                           <p className="text-[10px] text-gray-500">Just now</p>
                                                                        </div>
                                                                     </div>
                                                                     <div className="flex gap-2 w-full sm:w-auto">
                                                                        <button
                                                                           onClick={() => handleAcceptInvitation(invite.id)}
                                                                           className="flex-1 sm:flex-none px-4 py-2 bg-gold text-black text-xs font-bold rounded hover:bg-gold/90 transition-colors"
                                                                        >
                                                                           Accept
                                                                        </button>
                                                                        <button
                                                                           onClick={() => handleRejectInvitation(invite.id)}
                                                                           className="flex-1 sm:flex-none px-4 py-2 bg-white/10 text-gray-300 text-xs font-bold rounded hover:bg-white/20 transition-colors"
                                                                        >
                                                                           Reject
                                                                        </button>
                                                                     </div>
                                                                  </div>
                                                               ))}
                                                            </div>
                                                         </div>
                                                      )}

                                                      <div className="flex flex-col items-center justify-center text-center p-8 bg-surface border border-white/5 rounded-xl">
                                                         <Rocket className="w-12 h-12 text-gold mb-6" />
                                                         <h2 className="text-2xl font-bold text-white mb-3 font-quantico">Start Building</h2>
                                                         <p className="text-gray-400 text-sm mb-6 max-w-md">
                                                            Ready to ship? Create a team to collaborate with others, or start solo.
                                                            You'll need a team to submit your project.
                                                         </p>
                                                         <button onClick={() => setIsCreatingTeam(true)} className="bg-gold text-black font-bold px-8 py-3 rounded-lg hover:bg-gold/90 transition-transform hover:scale-105 flex items-center gap-2">
                                                            <Plus className="w-4 h-4" /> Create Team
                                                         </button>
                                                      </div>
                                                   </div>
                                                ) : (
                                                   <div className="h-full flex flex-col justify-center max-w-xl mx-auto w-full">
                                                      <div className="bg-surface border border-white/5 rounded-xl p-8 shadow-2xl relative overflow-hidden">
                                                         <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />

                                                         <div className="flex items-center justify-between mb-8 relative z-10">
                                                            <div className="flex items-center gap-3">
                                                               <div className="w-10 h-10 bg-gold/10 rounded-lg flex items-center justify-center border border-gold/20">
                                                                  <Rocket className="w-5 h-5 text-gold" />
                                                               </div>
                                                               <div>
                                                                  <h2 className="text-xl font-bold text-white font-quantico">Create Team</h2>
                                                                  <p className="text-xs text-gray-500">Initialize your workspace</p>
                                                               </div>
                                                            </div>
                                                         </div>

                                                         <div className="space-y-6 relative z-10">
                                                            <div>
                                                               <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Team Name</label>
                                                               <input
                                                                  type="text"
                                                                  autoFocus
                                                                  value={newTeamData.name}
                                                                  onChange={(e) => setNewTeamData({ name: e.target.value })}
                                                                  placeholder="Enter your team name..."
                                                                  className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-white focus:border-gold/50 focus:outline-none placeholder-gray-700 transition-all font-medium text-base shadow-inner"
                                                               />
                                                            </div>

                                                            <div className="bg-black/20 border border-white/5 rounded-xl p-4 space-y-3">
                                                               <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                                                  <Sparkles className="w-3 h-3 text-gold" /> Guidelines
                                                               </h4>
                                                               <ul className="space-y-2">
                                                                  <li className="flex items-start gap-2 text-xs text-gray-500">
                                                                     <div className="w-1 h-1 rounded-full bg-gold/40 mt-1.5 shrink-0" />
                                                                     <span>Choosing a unique name helps your team stand out.</span>
                                                                  </li>
                                                                  <li className="flex items-start gap-2 text-xs text-gray-500">
                                                                     <div className="w-1 h-1 rounded-full bg-gold/40 mt-1.5 shrink-0" />
                                                                     <span>You can change your team settings later in the workspace.</span>
                                                                  </li>
                                                                  <li className="flex items-start gap-2 text-xs text-gray-500">
                                                                     <div className="w-1 h-1 rounded-full bg-gold/40 mt-1.5 shrink-0" />
                                                                     <span>Once created, you can immediately start inviting members.</span>
                                                                  </li>
                                                               </ul>
                                                            </div>

                                                            <div className="flex gap-3 pt-4 border-t border-white/5">
                                                               <button
                                                                  onClick={() => { setIsCreatingTeam(false); setNewTeamData({ name: '' }); }}
                                                                  className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-colors font-bold text-xs uppercase tracking-widest"
                                                               >
                                                                  Cancel
                                                               </button>
                                                               <button
                                                                  onClick={() => {
                                                                     if (!newTeamData.name) return;
                                                                     setUserTeam({
                                                                        ...DEFAULT_NEW_TEAM,
                                                                        name: newTeamData.name,
                                                                        tags: ['Early Stage']
                                                                     });
                                                                     setIsCreatingTeam(false);
                                                                     setNewTeamData({ name: '' });
                                                                  }}
                                                                  disabled={!newTeamData.name}
                                                                  className={`flex-1 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${!newTeamData.name ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-gold text-black hover:bg-gold/90 shadow-lg shadow-gold/10 hover:scale-[1.02] active:scale-95'}`}
                                                               >
                                                                  Create Team <ChevronRight className="w-4 h-4" />
                                                               </button>
                                                            </div>
                                                         </div>
                                                      </div>
                                                   </div>
                                                )
                                                ) : (
                                                   <div className="space-y-6">
                                                      {/* Team Header */}
                                                      <div className="bg-surface border border-white/5 rounded-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                                         <div>
                                                            <div className="flex items-center gap-3 mb-1">
                                                               <h2 className="text-2xl font-bold text-white font-quantico">{userTeam.name}</h2>
                                                               <span className="bg-gold/20 text-gold text-[10px] px-2 py-0.5 rounded border border-gold/20 uppercase font-bold">Leader</span>
                                                            </div>
                                                            <p className="text-gray-400 text-xs">Team ID: #8823 • Created just now</p>
                                                         </div>
                                                         <div className="flex gap-2">
                                                            <button className="p-2 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors" title="Settings">
                                                               <Settings className="w-4 h-4" />
                                                            </button>
                                                            <button onClick={() => setUserTeam(null)} className="p-2 rounded hover:bg-red-500/10 text-red-500 transition-colors" title="Leave Team">
                                                               <LogOut className="w-4 h-4" />
                                                            </button>
                                                         </div>
                                                      </div>

                                                      <div className="grid md:grid-cols-2 gap-6">
                                                         {/* Members */}
                                                         <div className="bg-surface border border-white/5 rounded-xl p-6">
                                                            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-wider">
                                                               <Users className="w-4 h-4 text-gold" /> Team Members
                                                            </h3>
                                                            <div className="space-y-3">
                                                               {userTeam.members.map((member: any, i: number) => (
                                                                  <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                                                                     <div className="flex items-center gap-3">
                                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white">
                                                                           {member.name.charAt(0)}
                                                                        </div>
                                                                        <div>
                                                                           <p className="text-sm font-bold text-white leading-none mb-1">{member.name}</p>
                                                                           <p className="text-[10px] text-gray-400">{member.role}</p>
                                                                        </div>
                                                                     </div>
                                                                     {member.isLeader && <Trophy className="w-3 h-3 text-gold" />}
                                                                  </div>
                                                               ))}
                                                               <button onClick={() => setIsInviteModalOpen(true)} className="w-full py-3 border border-dashed border-white/10 rounded-lg flex items-center justify-center text-gray-500 text-xs gap-2 hover:border-gold/30 hover:text-gold transition-all">
                                                                  <Plus className="w-3 h-3" /> Invite Member
                                                               </button>
                                                            </div>
                                                         </div>

                                                         {/* Chat Placeholder */}
                                                         <div className="bg-surface border border-white/5 rounded-xl p-6 flex flex-col">
                                                            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-wider">
                                                               <MessageSquare className="w-4 h-4 text-blue-400" /> Team Chat
                                                            </h3>
                                                            <div className="flex-1 bg-black/20 rounded-lg flex items-center justify-center text-gray-600 text-xs italic border border-white/5 min-h-[150px]">
                                                               Chat feature coming soon...
                                                            </div>
                                                         </div>
                                                      </div>
                                                   </div>
                                                )
                                             )}
                                          </div>

                                          {/* RIGHT COLUMN: Sidebar Widgets (Span 4) */}
                                          <div className="lg:col-span-4 flex flex-col gap-6 h-full overflow-y-auto pr-2 pb-20 md:pb-0">

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
                                                                  {step.endDate && isSameDay(new Date(step.startDate), new Date(step.endDate)) ? `on ${format(new Date(step.startDate), 'MMMM dd')}` : `${format(new Date(step.startDate), 'MMM dd')}${step.endDate ? ` - ${format(new Date(step.endDate), 'MMM dd')}` : ''}`}
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
                                    );

                                 case 'resources':
                                    return (
                                       <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 h-full overflow-y-auto pr-2 pb-20 md:pb-0">
                                          {hackathon.resources?.map((res, i) => (
                                             <a key={i} href={res.link} target="_blank" className="bg-surface border border-white/5 p-4 rounded-xl hover:bg-white/5 transition-all block">
                                                <h3 className="font-bold text-white mb-1 text-sm">{res.name}</h3>
                                                <p className="text-[10px] text-gray-500">External Link</p>
                                             </a>
                                          ))}
                                       </div>
                                    );

                                 default:
                                    return <div className="text-center text-gray-500 pt-10">Select a section from the sidebar.</div>;
                              }
                           })()}

                        </motion.div>
                     </AnimatePresence>
                  </div>

               </div>
            </main>
         </div>
         {/* Invite Member Modal */}
         <InviteMemberModal
            isOpen={isInviteModalOpen}
            onClose={() => setIsInviteModalOpen(false)}
            availableUsers={MOCK_AVAILABLE_USERS}
            searchQuery={searchInviteUserQuery}
            onSearchQueryChange={setSearchInviteUserQuery}
            onInvite={handleInviteUser}
            teamMembers={userTeam ? userTeam.members : []}
         />
      </div>
   );
}