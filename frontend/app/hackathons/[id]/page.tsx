'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy, Calendar, Users, Clock, ChevronRight,
  Target, Zap, MessageSquare, FileText, CheckCircle2,
  AlertCircle, MoreHorizontal, Github, Disc, Link as LinkIcon,
  Monitor, Mic, SwatchBook, Code, ShieldCheck, Smartphone, UserPlus, RefreshCw, Lock
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

export default function HackathonDashboard({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState('tracks');
  const [expandedTrack, setExpandedTrack] = useState<number | null>(null);
  const [countdown, setCountdown] = useState({ text: 'Calculating...', label: 'Loading...' });
  const { id } = params;

  const hackathon = HACKATHONS_MOCK_DATA.find(h => h.id === id);

  const searchParams = useSearchParams();
  const mockDate = searchParams.get('mockDate') || searchParams.get('mockdate');

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

  const now = mockDate ? new Date(mockDate) : new Date(); // Get current date/time (or mock)

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
            <h1 className="text-xl font-bold text-white font-quantico">
              {hackathon.title.split(' ')[0]}<span className="text-gold">{hackathon.title.split(' ')[1]}</span>
            </h1>
            <p className="text-xs text-gray-500 mt-1">{hackathon.title.substring(hackathon.title.indexOf('Season'))}</p>
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
                                  <div className={`absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full border-2 transition-all
                                    ${step.status === 'done' ? 'bg-green-500 border-green-500' : 
                                      step.status === 'active' ? 'bg-gold border-gold shadow-[0_0_8px_var(--color-gold)]' : 
                                      'bg-surface border-gray-600'}`} 
                                  />
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
           {hackathon.tasks && hackathon.tasks.length > 0 && (
            <div className="bg-surface border border-white/5 rounded-xl p-4">
               <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Your Tasks</h3>
                  <span className="text-[10px] bg-green-900/30 text-green-400 px-1.5 py-0.5 rounded">
                    {hackathon.tasks.filter(t => t.done).length}/{hackathon.tasks.length}
                  </span>
               </div>
               <div className="space-y-3">
                 {hackathon.tasks.map((task) => (
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
          )}
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
                       {['Tracks', 'Team', 'Submission', 'Voting'].map((tab) => {
                         const lowerTab = tab.toLowerCase();
                         const isLocked = (() => {
                           if (!hackathon) return true; // Should not happen with current flow
                           const regOpens = dynamicTimeline.find(s => s.title.includes('Registration'))?.startDate;
                           const submissionStarts = dynamicTimeline.find(s => s.title.includes('Idea Submission'))?.startDate;
                           const submissionEnds = dynamicTimeline.find(s => s.title.includes('Idea Submission'))?.endDate;
                           const now = new Date();
          
                           switch (lowerTab) {
                             case 'team': return !regOpens || isBefore(now, new Date(regOpens));
                             case 'submission': return !submissionStarts || isBefore(now, new Date(submissionStarts));
                             case 'voting': return !submissionEnds || isBefore(now, new Date(submissionEnds));
                             default: return false; // Tracks always unlocked
                           }
                         })();
          
                         return (
                           <button
                             key={tab}
                             onClick={() => !isLocked && setActiveTab(lowerTab)}
                             className={`px-6 py-3 text-sm font-medium transition-colors relative flex items-center gap-2 ${
                               activeTab === lowerTab ? 'text-gold' : 'text-gray-500 hover:text-white'
                             } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                             disabled={isLocked}
                           >
                             {tab}
                             {isLocked && <Lock className="w-3.5 h-3.5" />}
                             {activeTab === lowerTab && (
                               <motion.div layoutId="underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold" />
                             )}
                           </button>
                         );
                       })}
                    </div>
          {/* Tab Content Area */}
          <div className="min-h-[400px]">
             {activeTab === 'tracks' && (
                <div className="space-y-4">
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
             


             {activeTab === 'team' && (
                <div className="space-y-6">
                   <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-white">Leaderboard</h3>
                      <button className="px-4 py-2 bg-primary hover:bg-primary-dark rounded-lg text-white text-sm font-bold transition-colors">
                         View All Teams
                      </button>
                   </div>
                   
                   <div className="space-y-2">
                      {hackathon.leaderboard?.map((team, i) => (
                         <div key={i} className="flex items-center justify-between p-4 bg-surface border border-white/5 rounded-xl hover:border-gold/30 transition-colors">
                            <div className="flex items-center gap-4">
                               <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                                 i === 0 ? 'bg-gold text-black' : 
                                 i === 1 ? 'bg-gray-300 text-black' : 
                                 i === 2 ? 'bg-amber-700 text-white' : 'bg-surfaceHighlight text-gray-500'
                               }`}>
                                 {team.rank}
                               </div>
                               <span className="font-bold text-white">{team.name}</span>
                            </div>
                            <span className="font-mono text-gold">{team.points} pts</span>
                         </div>
                      ))}
                   </div>
                </div>
             )}

             {activeTab === 'submission' && (
                <div className="text-center py-10 text-gray-500">
                    <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Submission portal will open once the project submission phase begins.</p>
                    <p className="text-xs mt-2">Check the timeline for submission dates!</p>
                </div>
             )}

             {activeTab === 'voting' && (
                <div className="text-center py-10 text-gray-500">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Community voting will begin after the submission deadline.</p>
                    <p className="text-xs mt-2">Get ready to vote for your favorite projects!</p>
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
                         <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            i === 0 ? 'bg-gold text-black' :
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
               )})}
            </div>
          )}

        </aside>

      </div>
    </div>
  );
}
