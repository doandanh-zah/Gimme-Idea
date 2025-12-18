'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
   Trophy, Calendar, Users, Clock, ChevronRight,
   Target, MessageSquare, FileText, CheckCircle2,
   AlertCircle, MoreHorizontal, Github, Disc, Link as LinkIcon,
   Monitor, Mic, SwatchBook, Code, ShieldCheck, Smartphone, UserPlus,
   RefreshCw, Lock, Search, Plus, Settings, LogOut, UserMinus,
   LayoutDashboard, Rocket, BookOpen, Menu as MenuIcon, X, Sparkles, Activity, Send, CheckSquare, Globe, Video, Youtube, ThumbsUp, ArrowLeft, FileUp, Lightbulb, Edit3, Trash2, Filter, SortDesc
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { useSearchParams } from 'next/navigation';
import { format, isBefore, isSameDay } from 'date-fns';
import { HACKATHONS_MOCK_DATA } from '@/lib/mock-hackathons';
import InviteMemberModal from '@/components/InviteMemberModal';
import ImportIdeaModal from '@/components/ImportIdeaModal';
import { EditProjectModal } from '@/components/EditProjectModal';
import { useAppStore } from '@/lib/store';
import { Project } from '@/lib/types';
import { apiClient } from '@/lib/api-client';

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
   const [submissionStep, setSubmissionStep] = useState<'list' | 'view' | 'new'>('list');
   const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
   const [isImportModalOpen, setIsImportModalOpen] = useState(false);
   const [importedIdeas, setImportedIdeas] = useState<Project[]>([]);
   const [editingSubmission, setEditingSubmission] = useState<Project | null>(null);
   // API-connected submission state
   const [mySubmissions, setMySubmissions] = useState<any[]>([]);
   const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
   const [submissionError, setSubmissionError] = useState<string | null>(null);
   const [isSubmitting, setIsSubmitting] = useState(false);

   // Ideas List State
   const [ideasSearchQuery, setIdeasSearchQuery] = useState('');
   const [ideasCategoryFilter, setIdeasCategoryFilter] = useState('all');
   const [ideasSortBy, setIdeasSortBy] = useState<'newest' | 'votes' | 'comments'>('newest');
   const [showMyIdeasOnly, setShowMyIdeasOnly] = useState(false);
   const [editingIdeaId, setEditingIdeaId] = useState<string | null>(null);

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

   // Load my submissions from API
   const loadMySubmissions = async () => {
      if (!id) return;
      console.log('[Hackathon Submission] 📋 Loading my submissions for hackathon:', id);
      setIsLoadingSubmissions(true);
      setSubmissionError(null);
      try {
         const response = await apiClient.getMySubmissions(id);
         console.log('[Hackathon Submission] 📡 getMySubmissions response:', response);
         // Response is ApiResponse<any[]>, extract data
         if (response.success && response.data) {
            console.log('[Hackathon Submission] ✅ Loaded', response.data.length, 'submissions');
            setMySubmissions(response.data);
         } else {
            console.log('[Hackathon Submission] ⚠️ No submissions or error:', response.error);
            setMySubmissions([]);
            if (response.error) {
               setSubmissionError(response.error);
            }
         }
      } catch (err: any) {
         console.error('[Hackathon Submission] ❌ Error loading submissions:', err);
         setSubmissionError(err.message || 'Failed to load submissions');
      } finally {
         setIsLoadingSubmissions(false);
      }
   };

   // Load submissions when entering submission tab
   useEffect(() => {
      if (activeSection === 'submission') {
         console.log('[Hackathon Submission] 🔄 Entering submission tab, loading data...');
         loadMySubmissions();
      }
   }, [activeSection, id]);

   // Handle import idea from platform - now creates a submission via API
   const handleImportIdea = async (idea: Project) => {
      if (!id) return;

      console.log('[Hackathon Submission] 📥 Importing idea to hackathon:', {
         hackathonId: id,
         projectId: idea.id,
         projectTitle: idea.title,
      });

      // Check if already submitted
      if (mySubmissions.find(s => s.projectId === idea.id || s.project?.id === idea.id)) {
         console.log('[Hackathon Submission] ⚠️ Idea already submitted');
         alert('This idea has already been submitted to this hackathon.');
         return;
      }

      setIsSubmitting(true);
      try {
         console.log('[Hackathon Submission] 🚀 Calling createSubmission API...');
         const response = await apiClient.createSubmission({
            hackathonId: id,
            projectId: idea.id,
         });
         console.log('[Hackathon Submission] 📡 API Response:', response);
         
         if (response.success) {
            console.log('[Hackathon Submission] ✅ Submission created successfully!', response.data);
            // Reload submissions after creating
            await loadMySubmissions();
            setIsImportModalOpen(false);
            setSubmissionStep('list');
         } else {
            console.error('[Hackathon Submission] ❌ API returned error:', response.error);
            throw new Error(response.error || 'Failed to create submission');
         }
      } catch (err: any) {
         console.error('[Hackathon Submission] ❌ Error submitting idea:', err);
         alert(err.message || 'Failed to submit idea');
      } finally {
         setIsSubmitting(false);
      }
   };

   // Handle delete submission
   const handleDeleteSubmission = async (submissionId: string) => {
      if (!confirm('Are you sure you want to remove this submission from the hackathon?')) {
         return;
      }
      try {
         const response = await apiClient.deleteSubmission(submissionId);
         if (response.success) {
            await loadMySubmissions();
            // If viewing the deleted submission, go back to list
            if (selectedIdeaId === submissionId) {
               setSelectedIdeaId(null);
               setSubmissionStep('list');
            }
         } else {
            throw new Error(response.error || 'Failed to delete submission');
         }
      } catch (err: any) {
         console.error('Error deleting submission:', err);
         alert(err.message || 'Failed to delete submission');
      }
   };

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



         {/* Mobile Bottom Tab Bar */}
         <div className="fixed bottom-0 left-0 right-0 z-[80] md:hidden bg-[#0a0a0a]/95 backdrop-blur-lg border-t border-white/10 safe-area-pb">
            <div className="flex items-center justify-around px-2 py-2">
               {/* Back to Home Button */}
               <Link
                  href="/home"
                  className="flex flex-col items-center gap-1 px-3 py-2 text-gray-500 hover:text-gold transition-colors"
               >
                  <ArrowLeft className="w-5 h-5" />
                  <span className="text-[9px] font-medium">Home</span>
               </Link>

               {/* Overview Tab */}
               <button
                  onClick={() => setActiveSection('overview')}
                  className={`flex flex-col items-center gap-1 px-3 py-2 transition-colors ${activeSection === 'overview' ? 'text-gold' : 'text-gray-500 hover:text-white'}`}
               >
                  <LayoutDashboard className="w-5 h-5" />
                  <span className="text-[9px] font-medium">Overview</span>
               </button>

               {/* Details Tab */}
               <button
                  onClick={() => setActiveSection('details')}
                  className={`flex flex-col items-center gap-1 px-3 py-2 transition-colors ${activeSection === 'details' ? 'text-gold' : 'text-gray-500 hover:text-white'}`}
               >
                  <FileText className="w-5 h-5" />
                  <span className="text-[9px] font-medium">Details</span>
               </button>

               {/* Ideas Tab */}
               <button
                  onClick={() => setActiveSection('ideas')}
                  className={`flex flex-col items-center gap-1 px-3 py-2 transition-colors ${activeSection === 'ideas' ? 'text-gold' : 'text-gray-500 hover:text-white'}`}
               >
                  <Lightbulb className="w-5 h-5" />
                  <span className="text-[9px] font-medium">Ideas</span>
               </button>

               {/* Submission Tab */}
               <button
                  onClick={() => setActiveSection('submission')}
                  className={`flex flex-col items-center gap-1 px-3 py-2 transition-colors ${activeSection === 'submission' ? 'text-gold' : 'text-gray-500 hover:text-white'}`}
               >
                  <Send className="w-5 h-5" />
                  <span className="text-[9px] font-medium">Submit</span>
               </button>

               {/* Team Tab */}
               <button
                  onClick={() => setActiveSection('project')}
                  className={`flex flex-col items-center gap-1 px-3 py-2 transition-colors ${activeSection === 'project' ? 'text-gold' : 'text-gray-500 hover:text-white'}`}
               >
                  <Users className="w-5 h-5" />
                  <span className="text-[9px] font-medium">Team</span>
               </button>

               {/* Resources Tab */}
               <button
                  onClick={() => setActiveSection('resources')}
                  className={`flex flex-col items-center gap-1 px-3 py-2 transition-colors ${activeSection === 'resources' ? 'text-gold' : 'text-gray-500 hover:text-white'}`}
               >
                  <BookOpen className="w-5 h-5" />
                  <span className="text-[9px] font-medium">Docs</span>
               </button>
            </div>
         </div>

         <div className="flex-1 flex overflow-hidden relative pt-4 pb-20 md:pt-24 md:pb-0">
            {/* Sidebar - Hidden on mobile */}
            <aside className="hidden md:flex md:relative md:bg-transparent md:border-white/5 md:z-auto md:w-56 flex-col border-r border-white/10">
               <div className="p-4 flex flex-col gap-6">
                  <Link href="/home" className="flex items-center gap-2 text-gray-500 hover:text-gold transition-colors group">
                     <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                     <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Back to Hub</span>
                  </Link>

                  <div>
                     <div className="flex items-center gap-2 text-white font-quantico font-bold text-lg mb-1">
                        <div className="w-8 h-8 bg-gradient-to-br from-gold to-yellow-600 rounded flex items-center justify-center text-black text-xs">H</div>
                        HACKATHON
                     </div>
                     <p className="text-[10px] text-gray-500 uppercase tracking-widest pl-10">Workspace</p>
                  </div>
               </div>
               <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
                  <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider px-2 mb-2 mt-2">Menu</div>
                  <SidebarItem id="overview" label="Overview" icon={LayoutDashboard} activeSection={activeSection} setActiveSection={setActiveSection} setIsMobileMenuOpen={setIsMobileMenuOpen} />
                  <SidebarItem id="details" label="Details" icon={FileText} activeSection={activeSection} setActiveSection={setActiveSection} setIsMobileMenuOpen={setIsMobileMenuOpen} />
                  <SidebarItem id="ideas" label="Ideas" icon={Lightbulb} activeSection={activeSection} setActiveSection={setActiveSection} setIsMobileMenuOpen={setIsMobileMenuOpen} />

                  <div className="my-4 border-t border-white/5" />
                  <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider px-2 mb-2">My Zone</div>
                  <SidebarItem id="submission" label="Submission" icon={Send} activeSection={activeSection} setActiveSection={setActiveSection} setIsMobileMenuOpen={setIsMobileMenuOpen} />
                  <SidebarItem id="project" label="Team & Reg" icon={Rocket} activeSection={activeSection} setActiveSection={setActiveSection} setIsMobileMenuOpen={setIsMobileMenuOpen} />
                  <SidebarItem id="resources" label="Resources" icon={BookOpen} activeSection={activeSection} setActiveSection={setActiveSection} setIsMobileMenuOpen={setIsMobileMenuOpen} />
               </nav>
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
                                       <div className="flex flex-col lg:grid lg:grid-cols-12 gap-4 md:gap-6 h-auto lg:h-full overflow-y-auto lg:overflow-hidden pb-6 lg:pb-0">

                                          {/* LEFT COLUMN: Title, Description, Terminal (Span 8) */}
                                          <div className="lg:col-span-8 flex flex-col gap-4 lg:h-full lg:min-h-0 lg:overflow-y-auto">
                                             {/* 1x6 Image Banner */}
                                             {hackathon.image_url && (
                                                <div className="relative w-full aspect-[2/1] md:aspect-[3/1] lg:aspect-[6/1] rounded-xl overflow-hidden shadow-2xl border border-white/10 shrink-0">
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

                                             {/* Title Section */}
                                             <div className="px-1">
                                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                                   <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${hackathon.status === 'active' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
                                                      {hackathon.status === 'active' ? 'Live Event' : 'Upcoming'}
                                                   </span>
                                                   <span className="text-gray-500 text-[10px] md:text-xs flex items-center gap-1">
                                                      <Calendar className="w-3 h-3" />
                                                      {eventStartDate && format(new Date(eventStartDate), 'MMM dd')} - {eventEndDate && format(new Date(eventEndDate), 'MMM dd, yyyy')}
                                                   </span>
                                                </div>
                                                <h1 className="text-base md:text-xl lg:text-2xl font-bold text-white font-quantico leading-tight mb-1">
                                                   {hackathon.title}
                                                </h1>
                                                <p className="text-gray-400 text-[10px] md:text-xs leading-relaxed line-clamp-2">
                                                   Build the future of decentralized technology. Join thousands of developers to compete for the grand prize.
                                                </p>
                                             </div>

                                             {/* Mobile: Quick Actions - Show on mobile only */}
                                             <div className="lg:hidden bg-gradient-to-br from-gold/20 to-yellow-600/5 border border-gold/30 rounded-xl p-4 shadow-lg shadow-gold/5">
                                                <div className="flex items-center justify-between">
                                                   <div>
                                                      <h3 className="text-xs font-bold text-gold uppercase tracking-wider flex items-center gap-2">
                                                         <Send className="w-3 h-3" /> Ready to ship?
                                                      </h3>
                                                      <p className="text-[10px] text-gray-400 mt-1">Submit your idea for judging</p>
                                                   </div>
                                                   <button
                                                      onClick={() => setActiveSection('submission')}
                                                      className="px-4 py-2 bg-gold text-black font-bold rounded-lg text-xs hover:bg-gold/90 flex items-center gap-1"
                                                   >
                                                      Submit <ChevronRight className="w-3 h-3" />
                                                   </button>
                                                </div>
                                             </div>

                                             {/* Mobile: Countdown - Show on mobile only */}
                                             <div className="lg:hidden bg-surface border border-white/5 rounded-xl p-3">
                                                <div className="flex items-center justify-between">
                                                   <p className="text-[10px] text-gray-500 uppercase tracking-wider">{countdown.label}</p>
                                                   <div className="flex items-center gap-2 text-gold bg-gold/5 px-3 py-1.5 rounded-lg border border-gold/10">
                                                      <Clock className="w-3 h-3" />
                                                      <span className="font-mono font-bold text-xs">{countdown.text}</span>
                                                   </div>
                                                </div>
                                             </div>

                                             {/* Terminal */}
                                             <div className="flex-1 flex flex-col bg-black border border-amber-200/20 rounded-xl p-3 md:p-6 font-mono text-xs shadow-[0_0_20px_rgba(251,191,36,0.05)] overflow-hidden min-h-[200px] md:min-h-[300px]">
                                                <div className="flex-1 flex flex-col space-y-2 overflow-hidden min-h-0">
                                                   <div className="border-b border-amber-200/10 pb-2 flex justify-between shrink-0">
                                                      <div><span className="text-amber-100">$</span> <span className="text-amber-100">cat system_announcements.log</span></div>
                                                      <div className="text-[10px] text-amber-100/60">SECURE_CONNECTION</div>
                                                   </div>
                                                   <div className="flex-1 overflow-y-auto space-y-2 text-amber-100/70 pr-2 scrollbar-thin scrollbar-thumb-amber-200/10">
                                                      {hackathon.announcements?.map((log: any) => {
                                                         // Effect Logic - from Legacy
                                                         let effectClass = '';
                                                         if (log.config?.effect === 'pulse') effectClass = 'animate-pulse font-bold';
                                                         if (log.config?.effect === 'typewriter') effectClass = 'border-r-2 border-amber-100 pr-1 animate-pulse'; // Cursor simulation
                                                         if (log.config?.effect === 'glitch') effectClass = 'text-shadow-glitch'; // Glitch effect

                                                         // Widget Logic (Countdown)
                                                         let widgetContent = null;
                                                         if (log.config?.widget?.type === 'countdown') {
                                                            const target = new Date(log.config.widget.target);
                                                            const diff = target.getTime() - now.getTime();
                                                            if (diff > 0) {
                                                               const hrs = Math.floor(diff / (1000 * 60 * 60));
                                                               const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                                                               const secs = Math.floor((diff % (1000 * 60)) / 1000);
                                                               widgetContent = (
                                                                  <span className="ml-2 text-red-500 font-bold bg-red-900/20 px-1 rounded">
                                                                     {String(hrs).padStart(2, '0')}:{String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
                                                                  </span>
                                                               );
                                                            } else {
                                                               widgetContent = <span className="ml-2 text-gray-500">[EXPIRED]</span>;
                                                            }
                                                         }

                                                         return (
                                                            <div key={log.id} className="group">
                                                               <span className="opacity-50 text-[10px] mr-2">[{format(new Date(log.date), 'HH:mm')}]</span>
                                                               <span
                                                                  className={`
                                                                     ${log.type === 'warning' ? 'text-yellow-400' : log.type === 'success' ? 'text-purple-400' : 'text-amber-100'}
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
                                                         <div key={idx} className={item.type === 'error' ? 'text-red-500' : 'text-amber-100'}>
                                                            {item.type === 'command' ? `$ ${item.content}` : item.content}
                                                         </div>
                                                      ))}
                                                      <div ref={terminalEndRef} />
                                                   </div>
                                                   <div className="flex items-center gap-2 pt-2 border-t border-amber-200/10 shrink-0">
                                                      <span className="text-amber-100">$</span>
                                                      <div className="relative flex-1">
                                                         <motion.input
                                                            type="text"
                                                            value={terminalInput}
                                                            onChange={(e) => setTerminalInput(e.target.value)}
                                                            onKeyDown={handleTerminalSubmit}
                                                            className={`border outline-none font-mono w-full px-2 py-1 rounded
                                                         ${isTerminalShaking ? 'bg-red-900/20 border-red-500 text-red-500 placeholder-red-500/50' : 'bg-transparent border-transparent text-amber-100'}
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

                                          {/* RIGHT COLUMN: Sidebar Widgets (Span 4) - Hidden on mobile */}
                                          <div className="hidden lg:flex lg:col-span-4 flex-col gap-4 md:gap-6 h-auto lg:h-full lg:overflow-y-auto pr-0 lg:pr-2">

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
                                       <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 h-full overflow-y-auto pr-0 lg:pr-2 pb-6 md:pb-0">
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
                                    // Get selected submission from API data
                                    const selectedSubmission = selectedIdeaId
                                       ? mySubmissions.find(s => s.id === selectedIdeaId || s.projectId === selectedIdeaId)
                                       : null;

                                    return (
                                       <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 h-full overflow-y-auto md:overflow-hidden pb-6 md:pb-0">
                                          {/* LEFT COLUMN: Submission Process (Span 8) */}
                                          <div className="lg:col-span-8 flex flex-col h-auto lg:h-full lg:overflow-y-auto pr-0 lg:pr-2 order-1">

                                             {/* Loading State */}
                                             {isLoadingSubmissions && (
                                                <div className="flex items-center justify-center h-64">
                                                   <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
                                                </div>
                                             )}

                                             {/* Error State */}
                                             {submissionError && !isLoadingSubmissions && (
                                                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
                                                   <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                                                   <p className="text-red-400 text-sm">{submissionError}</p>
                                                   <button
                                                      onClick={loadMySubmissions}
                                                      className="mt-4 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-gray-400 hover:text-white transition-colors"
                                                   >
                                                      Try Again
                                                   </button>
                                                </div>
                                             )}

                                             {/* LIST STATE: Show submitted ideas */}
                                             {!isLoadingSubmissions && !submissionError && submissionStep === 'list' && (
                                                <div className="space-y-6 h-full">
                                                   {/* Header with actions */}
                                                   <div className="bg-surface border border-white/5 rounded-xl p-6">
                                                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                                         <div>
                                                            <h2 className="text-xl font-bold text-white mb-1 font-quantico flex items-center gap-2">
                                                               <Send className="w-5 h-5 text-gold" />
                                                               My Submissions
                                                            </h2>
                                                            <p className="text-gray-400 text-xs">View and manage your submitted ideas for this hackathon.</p>
                                                         </div>
                                                         <div className="flex items-center gap-2 shrink-0">
                                                            <button
                                                               onClick={() => {
                                                                  setSelectedIdeaId(null);
                                                                  setSubmissionStep('new');
                                                               }}
                                                               className="px-4 py-2.5 bg-gradient-to-r from-gold to-yellow-600 text-black font-bold rounded-lg hover:shadow-[0_0_20px_rgba(255,215,0,0.2)] transition-all flex items-center gap-2 text-xs"
                                                            >
                                                               <Plus className="w-3.5 h-3.5" /> Submit New Idea
                                                            </button>
                                                         </div>
                                                      </div>
                                                   </div>

                                                   {/* Submitted Ideas Grid or Empty State */}
                                                   {mySubmissions.length === 0 ? (
                                                      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-surface border border-white/5 rounded-xl relative overflow-hidden min-h-[400px]">
                                                         <div className="absolute inset-0 bg-gradient-to-b from-gold/5 to-transparent pointer-events-none" />
                                                         <div className="relative z-10 max-w-lg">
                                                            <div className="w-20 h-20 mx-auto mb-6 bg-gold/10 rounded-full flex items-center justify-center border border-gold/30">
                                                               <Lightbulb className="w-10 h-10 text-gold" />
                                                            </div>
                                                            <h3 className="text-xl font-bold text-white mb-3 font-quantico">No Submissions Yet</h3>
                                                            <p className="text-gray-400 mb-6 leading-relaxed text-sm">
                                                               You haven't submitted any ideas to this hackathon yet. Start by submitting your first idea!
                                                            </p>
                                                            <button
                                                               onClick={() => {
                                                                  setSelectedIdeaId(null);
                                                                  setSubmissionStep('new');
                                                               }}
                                                               className="px-5 py-3 bg-gradient-to-r from-gold to-yellow-600 text-black font-bold rounded-lg hover:shadow-[0_0_20px_rgba(255,215,0,0.2)] transition-all flex items-center justify-center gap-2 text-sm mx-auto"
                                                            >
                                                               <Plus className="w-4 h-4" /> Submit Your First Idea
                                                            </button>
                                                         </div>
                                                      </div>
                                                   ) : (
                                                      <div className="grid gap-4">
                                                         <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">
                                                            {mySubmissions.length} Submitted Idea{mySubmissions.length > 1 ? 's' : ''}
                                                         </div>
                                                         {mySubmissions.map(submission => {
                                                            const project = submission.project;
                                                            const statusColor = submission.status === 'approved' ? 'green'
                                                               : submission.status === 'rejected' ? 'red'
                                                                  : submission.status === 'winner' || submission.status === 'finalist' ? 'gold'
                                                                     : 'green';
                                                            return (
                                                               <div
                                                                  key={submission.id}
                                                                  className="group relative p-5 rounded-xl border bg-black/20 border-white/5 hover:border-gold/30 hover:bg-gold/5 transition-all"
                                                               >
                                                                  <div className="flex justify-between items-start mb-3">
                                                                     <div className="flex items-center gap-2">
                                                                        <span className={`bg-${statusColor}-500/10 border border-${statusColor}-500/30 px-2 py-0.5 rounded text-[10px] text-${statusColor}-400 font-bold flex items-center gap-1`}>
                                                                           <CheckCircle2 className="w-2.5 h-2.5" /> {submission.status || 'Submitted'}
                                                                        </span>
                                                                        {project?.category && (
                                                                           <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[10px] text-gray-400 font-mono">{project.category}</span>
                                                                        )}
                                                                     </div>
                                                                     {/* Action Buttons */}
                                                                     <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <button
                                                                           onClick={(e) => {
                                                                              e.stopPropagation();
                                                                              setSelectedIdeaId(submission.id);
                                                                              setSubmissionStep('view');
                                                                           }}
                                                                           className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                                                                           title="View Details"
                                                                        >
                                                                           <FileText className="w-3.5 h-3.5" />
                                                                        </button>
                                                                        <button
                                                                           onClick={(e) => {
                                                                              e.stopPropagation();
                                                                              // Convert to Project type for EditProjectModal
                                                                              const projectToEdit: Project = {
                                                                                 id: project?.id || submission.projectId,
                                                                                 title: project?.title || 'Untitled',
                                                                                 description: project?.description || '',
                                                                                 category: (project?.category || 'Other') as Project['category'],
                                                                                 votes: project?.votes || 0,
                                                                                 type: 'idea',
                                                                                 stage: 'Idea',
                                                                                 tags: [],
                                                                                 feedbackCount: 0,
                                                                                 createdAt: submission.submittedAt,
                                                                                 author: { username: submission.author?.username || 'Unknown', wallet: '' }
                                                                              };
                                                                              setEditingSubmission(projectToEdit);
                                                                           }}
                                                                           className="p-2 rounded-lg bg-white/5 hover:bg-gold/20 text-gray-400 hover:text-gold transition-colors"
                                                                           title="Edit Submission"
                                                                        >
                                                                           <Edit3 className="w-3.5 h-3.5" />
                                                                        </button>
                                                                        <button
                                                                           onClick={(e) => {
                                                                              e.stopPropagation();
                                                                              handleDeleteSubmission(submission.id);
                                                                           }}
                                                                           className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                                                                           title="Remove Submission"
                                                                        >
                                                                           <Trash2 className="w-3.5 h-3.5" />
                                                                        </button>
                                                                     </div>
                                                                  </div>
                                                                  <h3
                                                                     className="text-lg font-bold text-white mb-2 group-hover:text-gold transition-colors cursor-pointer"
                                                                     onClick={() => {
                                                                        setSelectedIdeaId(submission.id);
                                                                        setSubmissionStep('view');
                                                                     }}
                                                                  >
                                                                     {project?.title || 'Untitled Submission'}
                                                                  </h3>
                                                                  <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed mb-4">{project?.description || 'No description'}</p>
                                                                  <div className="flex items-center gap-4 text-[10px] font-bold text-gray-600 uppercase tracking-tighter">
                                                                     <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> {submission.voteCount || project?.votes || 0} Votes</span>
                                                                     <span className="text-gray-800">•</span>
                                                                     <span>Submitted {format(new Date(submission.submittedAt), 'MMM dd, HH:mm')}</span>
                                                                  </div>
                                                               </div>
                                                            );
                                                         })}
                                                      </div>
                                                   )}

                                                   <p className="text-xs text-gray-500 text-center">Deadline: {eventEndDate && format(new Date(eventEndDate), 'MMM dd, yyyy HH:mm')}</p>
                                                </div>
                                             )}

                                             {/* VIEW STATE: View submission details */}
                                             {!isLoadingSubmissions && submissionStep === 'view' && selectedSubmission && (() => {
                                                const project = selectedSubmission.project;
                                                return (
                                                   <div className="space-y-6">
                                                      <div className="bg-surface border border-white/5 rounded-xl p-6">
                                                         <button onClick={() => { setSubmissionStep('list'); setSelectedIdeaId(null); }} className="text-xs text-gray-500 hover:text-white mb-4 flex items-center gap-1"><ArrowLeft className="w-3 h-3" /> Back to Submissions</button>
                                                         <div className="flex justify-between items-start">
                                                            <div>
                                                               <div className="flex items-center gap-2 mb-2">
                                                                  <span className="bg-green-500/10 border border-green-500/30 px-2 py-0.5 rounded text-[10px] text-green-400 font-bold flex items-center gap-1">
                                                                     <CheckCircle2 className="w-2.5 h-2.5" /> {selectedSubmission.status || 'Submitted'}
                                                                  </span>
                                                                  {project?.category && (
                                                                     <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[10px] text-gray-400 font-mono">{project.category}</span>
                                                                  )}
                                                               </div>
                                                               <h2 className="text-xl font-bold text-white mb-1 font-quantico">{project?.title || 'Untitled'}</h2>
                                                               <p className="text-gray-400 text-sm">{project?.description || 'No description'}</p>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                               <button
                                                                  onClick={() => {
                                                                     // Convert to Project type for EditProjectModal
                                                                     const projectToEdit: Project = {
                                                                        id: project?.id || selectedSubmission.projectId,
                                                                        title: project?.title || 'Untitled',
                                                                        description: project?.description || '',
                                                                        category: (project?.category || 'Other') as Project['category'],
                                                                        votes: project?.votes || 0,
                                                                        type: 'idea',
                                                                        stage: 'Idea',
                                                                        tags: [],
                                                                        feedbackCount: 0,
                                                                        createdAt: selectedSubmission.submittedAt,
                                                                        author: { username: selectedSubmission.author?.username || 'Unknown', wallet: '' }
                                                                     };
                                                                     setEditingSubmission(projectToEdit);
                                                                  }}
                                                                  className="px-4 py-2 bg-gold/10 hover:bg-gold/20 border border-gold/30 rounded-lg text-gold text-xs font-bold transition-all flex items-center gap-2"
                                                               >
                                                                  <Edit3 className="w-3 h-3" /> Edit
                                                               </button>
                                                               <button
                                                                  onClick={() => handleDeleteSubmission(selectedSubmission.id)}
                                                                  className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-xs font-bold transition-all flex items-center gap-2"
                                                               >
                                                                  <Trash2 className="w-3 h-3" /> Remove
                                                               </button>
                                                            </div>
                                                         </div>
                                                      </div>

                                                      {/* Submission Info */}
                                                      <div className="bg-surface border border-white/5 rounded-xl p-6 space-y-5">
                                                         <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                                            <Lightbulb className="w-4 h-4 text-gold" /> Idea Details
                                                         </h3>

                                                         <div className="space-y-4">
                                                            <div>
                                                               <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Description</label>
                                                               <p className="text-sm text-gray-300 bg-black/20 rounded-lg p-3 border border-white/5">{project?.description || 'No description'}</p>
                                                            </div>

                                                            <div>
                                                               <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Category</label>
                                                               <span className="inline-block bg-white/5 border border-white/10 px-3 py-1 rounded-lg text-sm text-gray-300">{project?.category || 'N/A'}</span>
                                                            </div>

                                                            <div>
                                                               <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Submitted At</label>
                                                               <p className="text-sm text-gray-300">{format(new Date(selectedSubmission.submittedAt), 'MMMM dd, yyyy - HH:mm')}</p>
                                                            </div>

                                                            {selectedSubmission.notes && (
                                                               <div>
                                                                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Notes</label>
                                                                  <p className="text-sm text-gray-300 bg-black/20 rounded-lg p-3 border border-white/5">{selectedSubmission.notes}</p>
                                                               </div>
                                                            )}
                                                         </div>
                                                      </div>

                                                      {/* Stats */}
                                                      <div className="grid grid-cols-3 gap-3">
                                                         <div className="bg-surface border border-white/5 rounded-xl p-4 text-center">
                                                            <div className="text-2xl font-bold text-gold font-mono">{selectedSubmission.voteCount || project?.votes || 0}</div>
                                                            <div className="text-[10px] text-gray-500 uppercase tracking-wider">Votes</div>
                                                         </div>
                                                         <div className="bg-surface border border-white/5 rounded-xl p-4 text-center">
                                                            <div className="text-2xl font-bold text-white font-mono">{selectedSubmission.judgeScore ? `${selectedSubmission.judgeScore}/100` : '—'}</div>
                                                            <div className="text-[10px] text-gray-500 uppercase tracking-wider">Score</div>
                                                         </div>
                                                         <div className="bg-surface border border-white/5 rounded-xl p-4 text-center">
                                                            <div className="text-2xl font-bold text-white font-mono capitalize">{selectedSubmission.status || 'pending'}</div>
                                                            <div className="text-[10px] text-gray-500 uppercase tracking-wider">Status</div>
                                                         </div>
                                                      </div>
                                                   </div>
                                                );
                                             })()}

                                             {/* NEW STATE: Submit new idea */}
                                             {!isLoadingSubmissions && !submissionError && submissionStep === 'new' && (
                                                <div className="space-y-6">
                                                   <div className="bg-surface border border-white/5 rounded-xl p-6">
                                                      <button onClick={() => setSubmissionStep('list')} className="text-xs text-gray-500 hover:text-white mb-4 flex items-center gap-1"><ArrowLeft className="w-3 h-3" /> Back to Submissions</button>
                                                      <h2 className="text-xl font-bold text-white mb-1 font-quantico flex items-center gap-2">
                                                         <Plus className="w-5 h-5 text-gold" />
                                                         Submit New Idea
                                                      </h2>
                                                      <p className="text-gray-400 text-sm">Create a new idea or import from your GimmeIdea profile.</p>
                                                   </div>

                                                   {/* Action Cards */}
                                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                      <button
                                                         onClick={() => openSubmitModal('idea')}
                                                         className="group p-6 bg-surface border border-white/5 hover:border-gold/30 rounded-xl text-left transition-all hover:bg-gold/5"
                                                      >
                                                         <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-gold/20 transition-colors">
                                                            <Sparkles className="w-6 h-6 text-gold" />
                                                         </div>
                                                         <h3 className="text-lg font-bold text-white mb-2 group-hover:text-gold transition-colors">Create New Idea</h3>
                                                         <p className="text-sm text-gray-500">Start fresh with a brand new idea specifically for this hackathon.</p>
                                                      </button>

                                                      <button
                                                         onClick={() => setIsImportModalOpen(true)}
                                                         className="group p-6 bg-surface border border-white/5 hover:border-gold/30 rounded-xl text-left transition-all hover:bg-gold/5"
                                                      >
                                                         <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-4 group-hover:bg-gold/10 transition-colors">
                                                            <FileUp className="w-6 h-6 text-gray-400 group-hover:text-gold transition-colors" />
                                                         </div>
                                                         <h3 className="text-lg font-bold text-white mb-2 group-hover:text-gold transition-colors">Import from GimmeIdea</h3>
                                                         <p className="text-sm text-gray-500">Use an existing idea from your GimmeIdea profile.</p>
                                                      </button>
                                                   </div>

                                                   <p className="text-xs text-gray-500 text-center">Deadline: {eventEndDate && format(new Date(eventEndDate), 'MMM dd, yyyy HH:mm')}</p>
                                                </div>
                                             )}
                                          </div>

                                          {/* RIGHT COLUMN: Sidebar Widgets (Span 4) */}
                                          <div className="lg:col-span-4 flex flex-col gap-4 md:gap-6 h-auto lg:h-full lg:overflow-y-auto pr-0 lg:pr-2 order-2">

                                             {/* Stats Widget */}
                                             <div className="bg-surface border border-white/5 rounded-xl p-5">
                                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                                   <Activity className="w-4 h-4" /> Your Stats
                                                </h3>
                                                <div className="grid grid-cols-2 gap-3">
                                                   <div className="bg-black/20 rounded-lg p-3 text-center">
                                                      <div className="text-xl font-bold text-gold font-mono">{mySubmissions.length}</div>
                                                      <div className="text-[10px] text-gray-500 uppercase">Submitted</div>
                                                   </div>
                                                   <div className="bg-black/20 rounded-lg p-3 text-center">
                                                      <div className="text-xl font-bold text-white font-mono">{mySubmissions.reduce((sum, s) => sum + (s.voteCount || s.project?.votes || 0), 0)}</div>
                                                      <div className="text-[10px] text-gray-500 uppercase">Total Votes</div>
                                                   </div>
                                                </div>
                                             </div>

                                             {/* Tips Widget */}
                                             <div className="bg-surface border border-white/5 rounded-xl p-5">
                                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                                   <Lightbulb className="w-4 h-4" /> Tips for Success
                                                </h3>
                                                <ul className="space-y-3 text-xs text-gray-400">
                                                   <li className="flex gap-2 items-start">
                                                      <span className="text-gold mt-0.5">✦</span>
                                                      <span>Keep your idea title clear and catchy</span>
                                                   </li>
                                                   <li className="flex gap-2 items-start">
                                                      <span className="text-gold mt-0.5">✦</span>
                                                      <span>Describe the problem you're solving</span>
                                                   </li>
                                                   <li className="flex gap-2 items-start">
                                                      <span className="text-gold mt-0.5">✦</span>
                                                      <span>Explain your unique solution approach</span>
                                                   </li>
                                                   <li className="flex gap-2 items-start">
                                                      <span className="text-gold mt-0.5">✦</span>
                                                      <span>Add relevant tags for better visibility</span>
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
                                       <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 h-full overflow-y-auto md:overflow-hidden pb-6 md:pb-0">
                                          {/* LEFT COLUMN: Team Management (Span 8) */}
                                          <div className="lg:col-span-8 flex flex-col gap-4 md:gap-6 h-auto lg:h-full lg:overflow-y-auto pr-0 lg:pr-2 order-1">
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
                                          <div className="lg:col-span-4 flex flex-col gap-4 md:gap-6 h-auto lg:h-full lg:overflow-y-auto pr-0 lg:pr-2 order-2">

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
                                       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 h-full overflow-y-auto pr-0 lg:pr-2 pb-6 md:pb-0">
                                          {hackathon.resources?.map((res, i) => (
                                             <a key={i} href={res.link} target="_blank" className="bg-surface border border-white/5 p-4 rounded-xl hover:bg-white/5 transition-all block">
                                                <h3 className="font-bold text-white mb-1 text-sm">{res.name}</h3>
                                                <p className="text-[10px] text-gray-500">External Link</p>
                                             </a>
                                          ))}
                                       </div>
                                    );

                                 case 'ideas':
                                    // Mock submitted ideas for this hackathon
                                    const MOCK_SUBMITTED_IDEAS = [
                                       { id: 'sub-1', title: 'DeFi Yield Optimizer', description: 'An AI-powered yield farming aggregator that automatically moves funds between protocols to maximize returns while minimizing gas fees.', category: 'DeFi', stage: 'Idea', votes: 156, comments: 23, author: { username: 'alice_dev', avatar: '/avatars/alice.png' }, isOwner: false, submittedAt: '2024-12-15T10:30:00Z', tags: ['AI', 'Yield', 'Automation'] },
                                       { id: 'sub-2', title: 'NFT Royalty Tracker', description: 'A comprehensive dashboard for creators to track their NFT royalties across multiple marketplaces in real-time.', category: 'NFT', stage: 'Prototype', votes: 98, comments: 15, author: { username: 'Thodium', avatar: '/avatars/default.png' }, isOwner: true, submittedAt: '2024-12-16T14:20:00Z', tags: ['Analytics', 'Creators'] },
                                       { id: 'sub-3', title: 'GameFi Leaderboard System', description: 'A decentralized leaderboard and achievement system for blockchain games with anti-cheat mechanisms.', category: 'Gaming', stage: 'Idea', votes: 87, comments: 12, author: { username: 'gamer_pro', avatar: '/avatars/gamer.png' }, isOwner: false, submittedAt: '2024-12-14T09:15:00Z', tags: ['Gaming', 'Achievements'] },
                                       { id: 'sub-4', title: 'Cross-Chain Bridge UI', description: 'A user-friendly interface for bridging assets across multiple blockchains with real-time fee comparison.', category: 'Infrastructure', stage: 'Prototype', votes: 134, comments: 19, author: { username: 'Thodium', avatar: '/avatars/default.png' }, isOwner: true, submittedAt: '2024-12-17T08:45:00Z', tags: ['Bridge', 'UX'] },
                                       { id: 'sub-5', title: 'DAO Voting Mobile App', description: 'A mobile-first application for participating in DAO governance with push notifications for proposals.', category: 'DAO', stage: 'Idea', votes: 76, comments: 8, author: { username: 'dao_enthusiast', avatar: '/avatars/dao.png' }, isOwner: false, submittedAt: '2024-12-13T16:00:00Z', tags: ['Mobile', 'Governance'] },
                                       { id: 'sub-6', title: 'Social Token Platform', description: 'A platform for creators to launch and manage their own social tokens with built-in engagement rewards.', category: 'Social', stage: 'Idea', votes: 112, comments: 21, author: { username: 'creator_hub', avatar: '/avatars/creator.png' }, isOwner: false, submittedAt: '2024-12-12T11:30:00Z', tags: ['Creators', 'Tokens'] },
                                    ];

                                    // Filter and sort ideas
                                    let filteredIdeas = [...MOCK_SUBMITTED_IDEAS];

                                    // Search filter
                                    if (ideasSearchQuery) {
                                       filteredIdeas = filteredIdeas.filter(idea =>
                                          idea.title.toLowerCase().includes(ideasSearchQuery.toLowerCase()) ||
                                          idea.description.toLowerCase().includes(ideasSearchQuery.toLowerCase()) ||
                                          idea.author.username.toLowerCase().includes(ideasSearchQuery.toLowerCase())
                                       );
                                    }

                                    // Category filter
                                    if (ideasCategoryFilter !== 'all') {
                                       filteredIdeas = filteredIdeas.filter(idea => idea.category === ideasCategoryFilter);
                                    }

                                    // My ideas filter
                                    if (showMyIdeasOnly) {
                                       filteredIdeas = filteredIdeas.filter(idea => idea.isOwner);
                                    }

                                    // Sort
                                    switch (ideasSortBy) {
                                       case 'votes':
                                          filteredIdeas.sort((a, b) => b.votes - a.votes);
                                          break;
                                       case 'comments':
                                          filteredIdeas.sort((a, b) => b.comments - a.comments);
                                          break;
                                       case 'newest':
                                       default:
                                          filteredIdeas.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
                                    }

                                    const categories = ['all', 'DeFi', 'NFT', 'Gaming', 'Infrastructure', 'DAO', 'Social', 'DePIN', 'Mobile', 'Security'];
                                    const myIdeasCount = MOCK_SUBMITTED_IDEAS.filter(i => i.isOwner).length;

                                    return (
                                       <div className="h-full overflow-y-auto pb-6">
                                          {/* Header Section - Like /idea page */}
                                          <div className="mb-6 md:mb-8">
                                             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                                                <div>
                                                   <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-bold mb-1 tracking-tight">
                                                      Explore <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFD700] to-[#FDB931]">Ideas</span>
                                                   </h1>
                                                   <p className="text-gray-400 text-xs sm:text-sm">
                                                      {MOCK_SUBMITTED_IDEAS.length} ideas submitted to this hackathon
                                                   </p>
                                                </div>
                                                <div className="flex gap-2 flex-wrap">
                                                   <button
                                                      onClick={() => setShowMyIdeasOnly(!showMyIdeasOnly)}
                                                      className={`px-3 sm:px-4 py-2 border rounded-full text-xs sm:text-sm font-mono transition-colors flex items-center gap-2 ${showMyIdeasOnly ? 'border-gold/50 bg-gold/10 text-gold' : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'}`}
                                                   >
                                                      <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                                                      My Ideas ({myIdeasCount})
                                                   </button>
                                                   <button
                                                      onClick={() => setActiveSection('submission')}
                                                      className="px-3 sm:px-4 py-2 bg-gradient-to-r from-[#FFD700] to-[#FDB931] text-black rounded-full text-xs sm:text-sm font-bold hover:shadow-lg transition-all flex items-center gap-2"
                                                   >
                                                      <Lightbulb className="w-3 h-3 sm:w-4 sm:h-4" />
                                                      <span className="hidden sm:inline">Submit</span> Idea
                                                   </button>
                                                </div>
                                             </div>

                                             {/* Search Bar */}
                                             {ideasSearchQuery && (
                                                <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
                                                   <span className="text-gray-400">Search results for:</span>
                                                   <span className="text-white font-bold">"{ideasSearchQuery}"</span>
                                                   <button onClick={() => setIdeasSearchQuery('')} className="ml-2 p-1 hover:bg-white/10 rounded-full"><X className="w-4 h-4" /></button>
                                                </div>
                                             )}

                                             {/* Category Pills - Horizontal Scroll */}
                                             <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide -mx-2 px-2">
                                                {categories.map(cat => (
                                                   <button
                                                      key={cat}
                                                      onClick={() => setIdeasCategoryFilter(cat)}
                                                      className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm whitespace-nowrap border transition-all duration-300 ${ideasCategoryFilter === cat
                                                         ? 'bg-white text-black border-white font-bold shadow-[0_0_15px_rgba(255,255,255,0.3)]'
                                                         : 'bg-white/5 text-gray-300 border-white/10 hover:border-white/30 hover:bg-white/10 hover:text-white'
                                                         }`}
                                                   >
                                                      {cat === 'all' ? 'All' : cat}
                                                   </button>
                                                ))}
                                             </div>
                                          </div>

                                          {/* Sort Controls */}
                                          <div className="flex items-center justify-between mb-4">
                                             <div className="flex items-center gap-2">
                                                <span className="text-xs text-gray-500">{filteredIdeas.length} ideas</span>
                                             </div>
                                             <div className="relative">
                                                <select
                                                   value={ideasSortBy}
                                                   onChange={(e) => setIdeasSortBy(e.target.value as any)}
                                                   className="appearance-none bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 pr-8 text-white text-xs focus:border-gold/50 outline-none cursor-pointer hover:bg-white/10 transition-colors"
                                                >
                                                   <option value="newest">Newest First</option>
                                                   <option value="votes">Most Voted</option>
                                                   <option value="comments">Most Discussed</option>
                                                </select>
                                                <SortDesc className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
                                             </div>
                                          </div>

                                          {/* Ideas Grid - 3 columns like /idea page */}
                                          {filteredIdeas.length === 0 ? (
                                             <div className="text-center py-20 sm:py-32 bg-white/[0.02] rounded-3xl border border-white/5">
                                                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                                   <Lightbulb className="w-8 h-8 text-gray-500" />
                                                </div>
                                                <p className="text-gray-400 text-lg mb-2">No ideas found</p>
                                                <button
                                                   onClick={() => { setIdeasCategoryFilter('all'); setIdeasSearchQuery(''); setShowMyIdeasOnly(false); }}
                                                   className="text-gold hover:text-white underline underline-offset-4 transition-colors"
                                                >
                                                   Clear all filters
                                                </button>
                                             </div>
                                          ) : (
                                             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
                                                {filteredIdeas.map((idea, index) => (
                                                   <motion.div
                                                      key={idea.id}
                                                      initial={{ opacity: 0, y: 20 }}
                                                      animate={{ opacity: 1, y: 0 }}
                                                      transition={{ duration: 0.25, delay: index * 0.05 }}
                                                      whileHover={{ y: -6, scale: 1.01 }}
                                                      whileTap={{ scale: 0.98 }}
                                                      className="relative rounded-2xl overflow-hidden cursor-pointer flex flex-col h-full group"
                                                   >
                                                      {/* Card background */}
                                                      <div className="absolute inset-0 bg-[#12131a]/70 backdrop-blur-sm group-hover:bg-[#12131a]/80 transition-all duration-500" />

                                                      {/* Golden glow background */}
                                                      <div className="absolute inset-0 bg-gradient-to-br from-[#FFD700]/[0.03] via-transparent to-[#FFD700]/[0.02] group-hover:from-[#FFD700]/[0.08] group-hover:to-[#FFD700]/[0.04] transition-all duration-500" />

                                                      {/* Geometric pattern */}
                                                      <div
                                                         className="absolute inset-0 opacity-[0.03] group-hover:opacity-[0.06] pointer-events-none transition-opacity duration-500"
                                                         style={{
                                                            backgroundImage: `
                                                               radial-gradient(circle at 20% 80%, #FFD700 1px, transparent 1px),
                                                               radial-gradient(circle at 80% 20%, #FFD700 1px, transparent 1px)
                                                            `,
                                                            backgroundSize: '100px 100px',
                                                         }}
                                                      />

                                                      {/* Border with glow */}
                                                      <div className="absolute inset-0 rounded-2xl border border-[#FFD700]/[0.08] group-hover:border-[#FFD700]/40 group-hover:shadow-[0_0_30px_rgba(255,215,0,0.15)] transition-all duration-500" />

                                                      {/* Header */}
                                                      <div className="relative px-4 sm:px-5 pt-4 sm:pt-5 pb-2 flex justify-between items-start z-10">
                                                         <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center bg-[#FFD700]/10 border border-[#FFD700]/20 group-hover:bg-[#FFD700]/20 group-hover:border-[#FFD700]/40 transition-all duration-500">
                                                            <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 text-[#FFD700]" />
                                                         </div>

                                                         <div className="flex items-center gap-2">
                                                            {idea.isOwner && (
                                                               <span className="px-2 py-0.5 rounded-lg text-[8px] sm:text-[9px] font-mono font-bold uppercase tracking-wider bg-blue-500/10 border border-blue-500/25 text-blue-400">
                                                                  Yours
                                                               </span>
                                                            )}
                                                            <span className={`px-2 py-0.5 rounded-lg text-[8px] sm:text-[9px] font-mono font-bold uppercase tracking-wider border ${idea.stage === 'Prototype'
                                                               ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400/80'
                                                               : 'bg-yellow-500/10 border-yellow-500/25 text-yellow-400/80'
                                                               }`}>
                                                               {idea.stage}
                                                            </span>
                                                         </div>
                                                      </div>

                                                      <div className="relative z-10 px-4 sm:px-5 pb-4 sm:pb-5 pt-2 flex flex-col flex-grow">
                                                         {/* Title */}
                                                         <h3 className="text-base sm:text-lg font-bold mb-2 line-clamp-2 text-white transition-colors duration-500 group-hover:text-[#FFD700]">
                                                            {idea.title}
                                                         </h3>

                                                         <p className="text-gray-500 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2 flex-grow leading-relaxed group-hover:text-gray-400 transition-colors duration-500">
                                                            {idea.description}
                                                         </p>

                                                         {/* Tags */}
                                                         <div className="flex flex-wrap gap-1.5 mb-3 sm:mb-4">
                                                            <span className="px-2 py-0.5 sm:py-1 rounded-lg text-[9px] sm:text-[10px] font-mono bg-white/[0.03] border border-white/[0.06] text-gray-500 group-hover:bg-white/[0.06] group-hover:text-gray-400 transition-all duration-500">
                                                               {idea.category}
                                                            </span>
                                                            {idea.tags.slice(0, 2).map((tag) => (
                                                               <span
                                                                  key={tag}
                                                                  className="px-2 py-0.5 sm:py-1 rounded-lg text-[9px] sm:text-[10px] font-mono bg-gold/5 border border-gold/10 text-gold/70 group-hover:bg-gold/10 group-hover:text-gold transition-all duration-500"
                                                               >
                                                                  {tag}
                                                               </span>
                                                            ))}
                                                         </div>

                                                         {/* Footer */}
                                                         <div className="flex items-center justify-between pt-3 sm:pt-4 mt-auto border-t border-white/[0.06] group-hover:border-white/10 transition-colors duration-500">
                                                            {/* Author */}
                                                            <div className="flex items-center gap-2">
                                                               <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-gold/30 to-yellow-600/30 flex items-center justify-center text-[9px] sm:text-[10px] text-gold font-bold">
                                                                  {idea.author.username.charAt(0).toUpperCase()}
                                                               </div>
                                                               <span className="text-[10px] sm:text-xs text-gray-400 truncate max-w-[80px] sm:max-w-[100px]">{idea.author.username}</span>
                                                            </div>

                                                            {/* Stats */}
                                                            <div className="flex items-center gap-3 sm:gap-4">
                                                               <motion.button
                                                                  whileTap={{ scale: 0.9 }}
                                                                  className="flex items-center gap-1 sm:gap-1.5 text-gray-500 hover:text-[#FFD700] transition-colors"
                                                               >
                                                                  <ThumbsUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                                  <span className="text-[10px] sm:text-xs font-medium">{idea.votes}</span>
                                                               </motion.button>
                                                               <button className="flex items-center gap-1 sm:gap-1.5 text-gray-500 hover:text-blue-400 transition-colors">
                                                                  <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                                  <span className="text-[10px] sm:text-xs font-medium">{idea.comments}</span>
                                                               </button>

                                                               {/* Owner Actions */}
                                                               {idea.isOwner && (
                                                                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                     <button
                                                                        onClick={(e) => { e.stopPropagation(); setEditingIdeaId(idea.id); }}
                                                                        className="p-1 hover:bg-white/10 rounded transition-colors text-gray-400 hover:text-white"
                                                                     >
                                                                        <Edit3 className="w-3 h-3" />
                                                                     </button>
                                                                     <button
                                                                        onClick={(e) => {
                                                                           e.stopPropagation();
                                                                           if (window.confirm('Delete this idea?')) console.log('Delete:', idea.id);
                                                                        }}
                                                                        className="p-1 hover:bg-red-500/10 rounded transition-colors text-gray-400 hover:text-red-400"
                                                                     >
                                                                        <Trash2 className="w-3 h-3" />
                                                                     </button>
                                                                  </div>
                                                               )}
                                                            </div>
                                                         </div>
                                                      </div>
                                                   </motion.div>
                                                ))}
                                             </div>
                                          )}
                                          z                                       </div>
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
         {/* Import Idea Modal */}
         <ImportIdeaModal
            isOpen={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
            onSelectIdea={handleImportIdea}
         />
         {/* Edit Submission Modal */}
         <EditProjectModal
            project={editingSubmission}
            isOpen={!!editingSubmission}
            onClose={() => setEditingSubmission(null)}
            onSave={(updatedData) => {
               // Here you would save the changes - for now just close modal
               console.log('Updated submission:', updatedData);
               setEditingSubmission(null);
            }}
         />
      </div>
   );
}