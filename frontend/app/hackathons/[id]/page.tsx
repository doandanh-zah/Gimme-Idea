'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy, Calendar, Users, Clock, ChevronRight,
  Target, Zap, MessageSquare, FileText, CheckCircle2,
  AlertCircle, MoreHorizontal, Github, Disc, Link as LinkIcon,
  Monitor, Mic, SwatchBook, Code, ShieldCheck, Smartphone, UserPlus, RefreshCw
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
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
  const { id } = params;

  const hackathon = HACKATHONS_MOCK_DATA.find(h => h.id === id);

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
              <div className="mt-4 flex items-center gap-2 text-gold bg-gold/5 px-3 py-2 rounded-lg border-gold/10">
                <Clock className="w-4 h-4" />
                <span className="font-mono font-bold">{hackathon.countdown}</span>
              </div>
            )}
          </div>

          {/* Slim Vertical Timeline */}
          {hackathon.timeline && hackathon.timeline.length > 0 && (
            <div className="bg-surface border border-white/5 rounded-xl p-4">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Timeline</h3>
              <div className="relative border-l border-white/10 ml-2 space-y-6">
                {hackathon.timeline.map((step) => (
                  <div key={step.id} className="relative pl-6 group cursor-default">
                    <div className={`absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full border-2 transition-all
                      ${step.status === 'done' ? 'bg-green-500 border-green-500' : 
                        step.status === 'active' ? 'bg-gold border-goldshadow-[0_0_8px_var(--color-gold)]' : 
                        'bg-surface border-gray-600'}`} 
                    />
                    <div className={`${step.status === 'active' ? 'text-white' : 'text-gray-500'}`}>
                      <p className="font-medium text-xs md:text-sm">{step.title}</p>
                      <p className="text-[10px] font-mono opacity-70">{step.date}</p>
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
             {['Tracks', 'Prize', 'Team'].map((tab) => (
               <button
                 key={tab}
                 onClick={() => setActiveTab(tab.toLowerCase())}
                 className={`px-6 py-3 text-sm font-medium transition-colors relative ${
                   activeTab === tab.toLowerCase() ? 'text-gold' : 'text-gray-500 hover:text-white'
                 }`}
               >
                 {tab}
                 {activeTab === tab.toLowerCase() && (
                   <motion.div layoutId="underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold" />
                 )}
               </button>
             ))}
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
                               <p className="text-gold font-mono text-lg">{track.reward}</p>
                               
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
                                   className="transition-transform duration-700 group-hover:scale-105"
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
             
             {activeTab === 'prize' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="bg-surface border border-white/5 rounded-xl p-8 text-center flex flex-col justify-center items-center">
                      <Trophy className="w-16 h-16 text-gold mb-4" />
                      <h2 className="text-4xl font-bold text-white mb-2 font-quantico">{hackathon.prizePool}</h2>
                      <p className="text-gray-500 uppercase tracking-widest text-sm">Total Prize Pool</p>
                   </div>
                   <div className="space-y-4">
                      <h3 className="text-lg font-bold text-white">Prize Breakdown</h3>
                      {hackathon.tracks?.map((track, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-surfaceHighlight rounded-lg border border-white/5">
                           <span className="text-gray-300">{track.title}</span>
                           <span className="text-gold font-mono">{track.reward}</span>
                        </div>
                      ))}
                   </div>
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

          {/* Tracks Section (Moved from Center) */}
          {hackathon.tracks && hackathon.tracks.length > 0 && (
             <div className="bg-surface border border-white/5 rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tracks & Bounties</h3>
                {hackathon.tracks.map((track, i) => {
                   const TrackIcon = LucideIconMap[track.icon as keyof typeof LucideIconMap] || Target;
                   return (
                   <div key={i} className="bg-white/5 border border-white/5 rounded-lg p-3 hover:border-white/20 transition-colors group">
                      <div className="flex items-center justify-between mb-2">
                         <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded bg-black/40 ${track.color}`}>
                               <TrackIcon className="w-3.5 h-3.5" />
                            </div>
                            <span className="font-bold text-white text-xs">{track.title}</span>
                         </div>
                      </div>
                      <div className="flex items-center justify-between">
                         <span className="text-[10px] text-gray-500">Reward Pool</span>
                         <span className="text-xs font-mono text-gold bg-gold/10 px-2 py-0.5 rounded border-gold/20">
                            {track.reward}
                         </span>
                      </div>
                   </div>
                   )
                })}
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
