'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy, Calendar, Users, Clock, ChevronRight,
  Target, Zap, MessageSquare, FileText, CheckCircle2,
  AlertCircle, MoreHorizontal, Github, Disc, Link as LinkIcon,
  Monitor, Mic, SwatchBook, Code, ShieldCheck, Smartphone, UserPlus, RefreshCw, Lock, Search, Plus, Settings, LogOut, UserMinus
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
  const now = mockDate ? new Date(mockDate) : new Date(); // Get current date/time (or mock)

  // Timeline logic moved up
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

  // Tab Logic: Hide locked, sort by newest unlocked first
  const allTabs = hackathon?.tabs || [];

  const visibleTabs = allTabs
    .map((tab: any) => {
      const stepIndex = tab.stepId ? dynamicTimeline.findIndex((s: any) => s.id === tab.stepId) : -1;
      const step = stepIndex !== -1 ? dynamicTimeline[stepIndex] : null;

      let unlockDate = new Date(0); // Default unlocked for static tabs like Tracks
      let isExpired = false;

      if (step) {
        if (tab.preview && stepIndex > 0) {
          // Preview Mode: Unlock immediately when the PREVIOUS step ends
          const prevStep = dynamicTimeline[stepIndex - 1];
          unlockDate = prevStep.endDate ? new Date(prevStep.endDate) : new Date(prevStep.startDate);
        } else {
          // Standard Mode: Unlock when the step actually starts
          unlockDate = new Date(step.startDate);
        }

        // Expire logic: Hide after phase ends if configured
        if (tab.hideAfterEnd && step.endDate) {
          isExpired = !isBefore(now, new Date(step.endDate));
        }
      }

      const isLocked = isBefore(now, unlockDate);
      return { ...tab, startDate: unlockDate, isLocked, isExpired };
    })
    .filter((tab: any) => !tab.isLocked && !tab.isExpired)
    .sort((a: any, b: any) => b.startDate.getTime() - a.startDate.getTime());

  // Initialize activeTab with 'announcement' if visible, otherwise the first visible tab
  const [activeTab, setActiveTab] = useState(
    visibleTabs.some(tab => tab.id === 'announcement')
      ? 'announcement'
      : visibleTabs[0]?.id || 'tracks'
  );
  const [teamTabMode, setTeamTabMode] = useState<'teams' | 'teammates'>('teams');
  const [searchTeamQuery, setSearchTeamQuery] = useState('');
  const [userTeam, setUserTeam] = useState<any>(null); // Mock state for user's team
  const [expandedTrack, setExpandedTrack] = useState<number | null>(null);
  const [countdown, setCountdown] = useState({ text: 'Calculating...', label: 'Loading...' });

  // Terminal State
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalHistory, setTerminalHistory] = useState<{ type: 'command' | 'error', content: string }[]>([]);
  const [isTerminalShaking, setIsTerminalShaking] = useState(false);
  const [deniedCount, setDeniedCount] = useState(0);
  const terminalEndRef = React.useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!hackathon) return;

    const updateTimer = () => {
      const currentNow = mockDate ? new Date(mockDate) : new Date();

      // Collect all milestones (starts and ends)
      const milestones: { date: Date; title: string }[] = [];
      hackathon.timeline.forEach(step => {
        milestones.push({ date: new Date(step.startDate), title: `Start: ${step.title}` });
        if (step.endDate) {
          milestones.push({ date: new Date(step.endDate), title: `End: ${step.title}` });
        }
      });

      milestones.sort((a, b) => a.date.getTime() - b.date.getTime());

      // Find the first step that hasn't happened yet
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
        setCountdown({ text: 'Hackathon Ended', label: 'Status' });
      }
    };

    updateTimer(); // Initial call
    // Only set interval if NOT in mock mode (or if we want mock time to progress, which is complex. Static is better for snapshots)
    if (!mockDate) {
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [hackathon, mockDate]);

  // Auto-scroll terminal
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminalHistory, hackathon?.announcements]);

  if (!hackathon) {
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

  return (
    <div className="min-h-screen bg-background text-gray-300 pt-28 pb-10 px-4 font-sans text-sm">
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* --- LEFT COLUMN: META & TIMELINE (20%) --- */}
        <aside className="lg:col-span-3 space-y-6">
          {/* Event Info Card */}
          <div className="bg-surface border border-white/5 rounded-xl p-4">
            <h1 className="text-xl font-bold text-white font-quantico break-words">
              {hackathon.title}
            </h1>
            <p className="text-xs text-gray-500 mt-1">{hackathon.status === 'active' ? 'Live Event' : 'Upcoming Event'}</p>
            {hackathon.countdown && (
              <div className="mt-4 space-y-1">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">{countdown.label}</p>
                <div className="flex items-center gap-2 text-gold bg-gold/5 px-3 py-2 rounded-lg border border-gold/10">
                  <Clock className="w-4 h-4" />
                  <span className="font-mono font-bold text-xs md:text-sm">{countdown.text}</span>
                </div>
              </div>
            )}
          </div>

          {/* Slim Vertical Timeline */}
          {hackathon.timeline && hackathon.timeline.length > 0 && (
            <div className="bg-surface border border-white/5 rounded-xl p-4">
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
                          step.status === 'active' ? 'bg-gold border-gold shadow-[0_0_15px_var(--color-gold)] scale-125' :
                            'bg-surface border-gray-600'}`}
                      />
                    </div>
                    <div className={`${step.status === 'active' ? 'text-white' : 'text-gray-500'}`}>
                      <p className="font-medium text-xs md:text-sm">{step.title}</p>
                      <p className="text-[10px] font-mono opacity-70">
                        {format(new Date(step.startDate), 'MMM dd')}
                        {step.endDate && ` - ${format(new Date(step.endDate), 'MMM dd')}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tasks */}
          {(() => {
            const activeStep = dynamicTimeline.find(step => step.status === 'active');
            const currentTasks = hackathon.tasks?.filter(t => t.phaseId === activeStep?.id) || [];

            if (currentTasks.length === 0) return null;

            return (
              <div className="bg-surface border border-white/5 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex flex-col">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Your Tasks</h3>
                    {activeStep && <span className="text-[10px] text-gold mt-0.5">{activeStep.title}</span>}
                  </div>
                  <span className="text-[10px] bg-green-900/30 text-green-400 px-1.5 py-0.5 rounded">
                    {currentTasks.filter(t => t.done).length}/{currentTasks.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {currentTasks.map((task) => (
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
          <div className="flex border-b border-white/10">
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 text-sm font-medium transition-colors relative flex items-center gap-2 ${activeTab === tab.id ? 'text-gold' : 'text-gray-500 hover:text-white'
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
                                                                                                                                                               {activeTab === 'announcement' && (
                                                                                                                                                                  <div className="bg-black border border-green-500/30 rounded-lg p-6 font-mono text-xs shadow-[0_0_20px_rgba(34,197,94,0.1)] h-[500px] flex flex-col">
                                                                                                                                                                    <div className="flex gap-1.5 mb-4">                                                                                                                     <div className="w-3 h-3 rounded-full bg-red-500/50" />
                                                                                                                     <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                                                                                                                     <div className="w-3 h-3 rounded-full bg-green-500/50" />
                                                                                                                   </div>
                                                                                                                   <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
                                                                                                                     <div className="border-b border-green-500/20 pb-2 flex justify-between shrink-0">
                                                                                                                        <div><span className="text-green-600">$</span> <span className="text-green-400">cat system_announcements.log</span></div>
                                                                                                                        <div className="text-xs text-green-800">Connection: SECURE</div>
                                                                                                                     </div>
                                                                                                                     
                                                                                                                     <div className="flex-1 overflow-y-auto space-y-3 text-green-300/80 pr-2">
                                                                                                                       {hackathon.announcements ? hackathon.announcements.map((log: any) => {
                                                                                                                         // Effect Logic
                                                                                                                         let effectClass = '';
                                                                                                                         if (log.config?.effect === 'pulse') effectClass = 'animate-pulse font-bold';
                                                                                                                         if (log.config?.effect === 'typewriter') effectClass = 'border-r-2 border-green-500 pr-1 animate-pulse'; // Simple cursor simulation
                                                                                                                         if (log.config?.effect === 'glitch') effectClass = 'text-shadow-glitch'; // Need custom CSS or inline style
                                                                                                 
                                                                                                                         // Widget Logic (Countdown)
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
                                                                                                                               <span className="opacity-50 text-xs mr-2">[{format(new Date(log.date), 'MM-dd HH:mm')}]</span>
                                                                                                                               <span className={`
                                                                                                                                   ${log.type === 'warning' ? 'text-yellow-400' : log.type === 'success' ? 'text-green-400' : 'text-gray-300'}
                                                                                                                                   ${effectClass}
                                                                                                                               `}
                                                                                                                               style={log.config?.effect === 'glitch' ? { textShadow: '2px 0 red, -2px 0 blue' } : {}}
                                                                                                                               >
                                                                                                                                 {log.message}
                                                                                                                               </span>
                                                                                                                               {widgetContent}
                                                                                                                           </div>
                                                                                                                         );
                                                                                                                       }) : (
                                                                                                                         <p className="text-gray-500 italic">No announcements found.</p>
                                                                                                                       )}
                                                                                                                       {/* Session History */}
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
                                                                                                                                                                                                                                                 />                                                                                                                       </div>
                                                                                                                     </div>
                                                                                                                   </div>
                                                                                                                 </div>
                                                                                                              )}                       {activeTab === 'tracks' && (<div className="space-y-4">
              {hackathon.tracks?.map((track, i) => {
                const TrackIcon = LucideIconMap[track.icon as keyof typeof LucideIconMap] || Target;
                const isExpanded = expandedTrack === i;

                return (
                  <div
                    key={i}
                    onClick={() => setExpandedTrack(isExpanded ? null : i)}
                    className={`relative w-full overflow-hidden rounded-xl border border-white/5 bg-surface cursor-pointer transition-all duration-500 ease-out group ${isExpanded ? 'h-64' : 'h-32'}`}
                  >
                    <div className="absolute inset-0 flex">
                      {/* Text Content (Left) */}
                      <div className="flex-1 p-6 flex flex-col justify-center relative z-10 max-w-[65%]">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`p-2 rounded-lg bg-black/40 ${track.color}`}>
                            <TrackIcon className="w-5 h-5" />
                          </div>
                          <h3 className="text-xl font-bold text-white font-quantico">{track.title}</h3>
                        </div>


                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 text-gray-400 text-sm"
                          >
                            <p>Build the best solution for {track.title} to win the grand prize. Judging criteria includes innovation, technical difficulty, and design.</p>
                          </motion.div>
                        )}
                      </div>

                      {/* Image Content (Right) */}
                      <div className="w-[45%] relative h-full -ml-12">
                        {/* Blur/Gradient Overlay */}
                        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-surface via-surface/90 to-transparent z-10 pointer-events-none" />

                        {track.image ? (
                          <Image
                            src={track.image}
                            alt={track.title}
                            layout="fill"
                            objectFit="cover"
                            className="transition-transform duration-700"
                          />
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

                <button className="bg-gold text-black text-lg font-bold px-8 py-3 rounded-lg hover:bg-gold/90 transition-transform hover:scale-105">
                  Register Now
                </button>

                                <p className="text-xs text-gray-500">
                                   Registration closes on {hackathon.timeline.find(s => s.id === '1')?.endDate ? format(new Date(hackathon.timeline.find(s => s.id === '1')!.endDate!), 'MMM dd, yyyy') : 'TBA'}
                                </p>              </div>
            )}

            {activeTab === 'team' && (
              <div className="space-y-6">
                {userTeam ? (
                  // --- MY TEAM DASHBOARD ---
                  <div className="space-y-6">
                    <div className="flex justify-between items-start bg-surface border border-white/5 rounded-xl p-6">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h2 className="text-3xl font-bold text-white font-quantico">{userTeam.name}</h2>
                          <span className="bg-gold/20 text-gold text-xs px-2 py-0.5 rounded border border-gold/20">Leader</span>
                        </div>
                        <p className="text-gray-400 text-sm">Your team is ready to build!</p>
                        <div className="flex gap-2 mt-4">
                          {userTeam.tags.map((tag: string) => <span key={tag} className="text-xs bg-white/5 px-2 py-1 rounded text-gray-300">{tag}</span>)}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-2 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                          <Settings className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setUserTeam(null)}
                          className="p-2 rounded hover:bg-red-500/10 text-red-500 transition-colors" title="Leave Team"
                        >
                          <LogOut className="w-5 h-5" />
                        </button>
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
                                  {member.name.charAt(0)}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-white">{member.name}</p>
                                  <p className="text-[10px] text-gray-400">{member.role}</p>
                                </div>
                              </div>
                              {member.isLeader ? (
                                <Trophy className="w-3 h-3 text-gold" />
                              ) : (
                                <button className="text-gray-500 hover:text-red-500 transition-colors">
                                  <UserMinus className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          ))}
                          {userTeam.members.length < userTeam.maxMembers && (
                            <div className="p-3 border border-dashed border-white/10 rounded-lg flex items-center justify-center text-gray-500 text-xs gap-2 cursor-pointer hover:border-gold/30 hover:text-gold transition-all">
                              <Plus className="w-4 h-4" /> Invite Member
                            </div>
                          )}
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
                ) : (
                  <div className="space-y-6">
                    {/* Header & Controls */}
                    <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                      <div>
                        <h2 className="text-2xl font-bold text-white font-quantico">Find your Squad</h2>
                        <p className="text-gray-400 text-sm">Join an existing team or find talent for your idea.</p>
                      </div>
                                                <div className="flex items-center gap-3">
                                                   <button 
                                                     onClick={() => setUserTeam(DEFAULT_NEW_TEAM)}
                                                     className="flex items-center gap-2 bg-gold text-black font-bold text-xs px-4 py-2 rounded hover:bg-gold/90 transition-colors"
                                                   >
                                                      <Plus className="w-3.5 h-3.5" /> Create Team
                                                   </button>                        <div className="flex bg-surface border border-white/10 rounded-lg p-1">
                          <button
                            onClick={() => setTeamTabMode('teams')}
                            className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${teamTabMode === 'teams' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                          >
                            Find Teams
                          </button>
                          <button
                            onClick={() => setTeamTabMode('teammates')}
                            className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${teamTabMode === 'teammates' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                          >
                            Find Teammates
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="text"
                        placeholder={teamTabMode === 'teams' ? "Search by team name or tags..." : "Search by name or skills..."}
                        value={searchTeamQuery}
                        onChange={(e) => setSearchTeamQuery(e.target.value)}
                        className="w-full bg-surface border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-gold/50 transition-colors"
                      />
                    </div>

                    {/* Content List */}
                    <div className="grid gap-4">
                      {teamTabMode === 'teams' ? (
                        // Render hackathon.teams filtered by search
                        (hackathon.teams || []).filter((t: any) => t.name.toLowerCase().includes(searchTeamQuery.toLowerCase()) || t.tags.some((tag: any) => tag.toLowerCase().includes(searchTeamQuery.toLowerCase())))
                          .map((team: any) => (
                            <div key={team.id} className="bg-surface border border-white/5 rounded-xl p-5 hover:border-gold/30 transition-all group">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="text-lg font-bold text-white group-hover:text-gold transition-colors">{team.name}</h3>
                                  <div className="flex gap-2 mt-2">
                                    {team.tags.map((tag: any) => <span key={tag} className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-gray-400">{tag}</span>)}
                                  </div>
                                </div>
                                <button className="bg-gold text-black text-xs font-bold px-4 py-2 rounded hover:bg-gold/90 transition-colors">
                                  Join Request
                                </button>
                              </div>
                              <div className="mt-4 flex items-center gap-6 text-xs text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Users className="w-3.5 h-3.5" />
                                  {team.members}/{team.maxMembers} Members
                                </div>
                                {team.lookingFor.length > 0 && (
                                  <div className="flex items-center gap-1 text-gold/80">
                                    <Target className="w-3.5 h-3.5" />
                                    Looking for: {team.lookingFor.join(', ')}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                      ) : (
                        // Render hackathon.participants filtered by search
                        (hackathon.participants || []).filter((u: any) => u.name.toLowerCase().includes(searchTeamQuery.toLowerCase()) || u.skills.some((s: any) => s.toLowerCase().includes(searchTeamQuery.toLowerCase())))
                          .map((user: any) => (
                            <div key={user.id} className="bg-surface border border-white/5 rounded-xl p-5 hover:border-blue-400/30 transition-all flex items-center justify-between group">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                                  {user.name.charAt(0)}
                                </div>
                                <div>
                                  <h3 className="text-white font-bold">{user.name}</h3>
                                  <p className="text-xs text-gray-400">{user.role}</p>
                                  <div className="flex gap-1 mt-1">
                                    {user.skills.map((skill: any) => <span key={skill} className="text-[10px] border border-white/10 px-1.5 rounded text-gray-500">{skill}</span>)}
                                  </div>
                                </div>
                              </div>
                              <button className="p-2 rounded-full border border-white/10 hover:bg-white/10 hover:text-white text-gray-400 transition-colors" title="Send Message">
                                <MessageSquare className="w-4 h-4" />
                              </button>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'submission' && (
              <div className="text-center py-10 text-gray-500">
                <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Submission portal will open once the project submission phase begins.</p>
                <p className="text-xs mt-2">Check the timeline for submission dates!</p>
              </div>
            )}

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

          {/* Compact Ticket (Stackable Design) */}
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
                {hackathon.prizes.map((prize, i) => (
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
              {hackathon.resources.map((resource, i) => {
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