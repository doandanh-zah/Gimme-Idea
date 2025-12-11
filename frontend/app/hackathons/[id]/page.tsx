'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, Calendar, Users, Clock, ChevronRight, 
  Target, Zap, MessageSquare, FileText, CheckCircle2, 
  AlertCircle, MoreHorizontal, Github, Disc, Link as LinkIcon 
} from 'lucide-react';
import Image from 'next/image';

// --- MOCK DATA ---
const TIMELINE = [
  { id: 1, title: 'Registration', date: 'Dec 01', status: 'done' },
  { id: 2, title: 'Team Formation', date: 'Dec 10', status: 'done' },
  { id: 3, title: 'Submission', date: 'Dec 20', status: 'active' },
  { id: 4, title: 'Voting', date: 'Dec 25', status: 'pending' },
  { id: 5, title: 'Demo Day', date: 'Dec 30', status: 'pending' },
];

const TASKS = [
  { id: 1, text: 'Join Discord Server', done: true },
  { id: 2, text: 'Create Team Profile', done: true },
  { id: 3, text: 'Submit Project Proposal', done: false },
  { id: 4, text: 'Upload Demo Video', done: false },
];

const TRACKS = [
  { title: 'DeFi Revolution', reward: '$5,000', icon: Zap, color: 'text-yellow-400' },
  { title: 'NFT Utility', reward: '$3,000', icon: Disc, color: 'text-purple-400' },
  { title: 'Gaming & Metaverse', reward: '$4,000', icon: Target, color: 'text-green-400' },
  { title: 'Social Graph', reward: '$2,000', icon: Users, color: 'text-blue-400' },
];

const LEADERBOARD = [
  { rank: 1, name: 'Alpha Squad', points: 980 },
  { rank: 2, name: 'BlockBuilders', points: 945 },
  { rank: 3, name: 'ChainReaction', points: 890 },
];

export default function HackathonDashboard({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState('tracks');

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-300 pt-20 pb-10 px-4 font-sans text-sm">
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* --- LEFT COLUMN: META & TIMELINE (20%) --- */}
        <aside className="lg:col-span-3 space-y-6">
          {/* Event Info Card */}
          <div className="bg-[#111] border border-white/5 rounded-xl p-4">
            <h1 className="text-xl font-bold text-white font-quantico">GIMME<span className="text-[#FFD700]">HACK</span></h1>
            <p className="text-xs text-gray-500 mt-1">Winter Season 2025</p>
            <div className="mt-4 flex items-center gap-2 text-[#FFD700] bg-[#FFD700]/5 px-3 py-2 rounded-lg border border-[#FFD700]/10">
              <Clock className="w-4 h-4" />
              <span className="font-mono font-bold">04D : 12H : 30M</span>
            </div>
          </div>

          {/* Slim Vertical Timeline */}
          <div className="bg-[#111] border border-white/5 rounded-xl p-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Timeline</h3>
            <div className="relative border-l border-white/10 ml-2 space-y-6">
              {TIMELINE.map((step) => (
                <div key={step.id} className="relative pl-6 group cursor-default">
                  <div className={`absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full border-2 transition-all
                    ${step.status === 'done' ? 'bg-green-500 border-green-500' : 
                      step.status === 'active' ? 'bg-[#FFD700] border-[#FFD700] shadow-[0_0_8px_#FFD700]' : 
                      'bg-[#111] border-gray-600'}`} 
                  />
                  <div className={`${step.status === 'active' ? 'text-white' : 'text-gray-500'}`}>
                    <p className="font-medium text-xs md:text-sm">{step.title}</p>
                    <p className="text-[10px] font-mono opacity-70">{step.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-[#111] border border-white/5 rounded-xl p-4 space-y-2">
             <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Resources</h3>
             <button className="w-full text-left flex items-center gap-2 px-3 py-2 rounded hover:bg-white/5 text-xs transition-colors">
                <Github className="w-3.5 h-3.5" /> API Documentation
             </button>
             <button className="w-full text-left flex items-center gap-2 px-3 py-2 rounded hover:bg-white/5 text-xs transition-colors">
                <MessageSquare className="w-3.5 h-3.5" /> Mentor Discord
             </button>
             <button className="w-full text-left flex items-center gap-2 px-3 py-2 rounded hover:bg-white/5 text-xs transition-colors">
                <FileText className="w-3.5 h-3.5" /> Submission Guide
             </button>
          </div>
        </aside>


        {/* --- CENTER COLUMN: MAIN CONTENT (55%) --- */}
        <main className="lg:col-span-6 space-y-6">
          
          {/* Top Stats Bar */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-[#111] border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center">
               <Trophy className="w-5 h-5 text-yellow-500 mb-1" />
               <span className="text-lg font-bold text-white">$50,000</span>
               <span className="text-[10px] text-gray-500 uppercase">Prize Pool</span>
            </div>
            <div className="bg-[#111] border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center">
               <Users className="w-5 h-5 text-blue-500 mb-1" />
               <span className="text-lg font-bold text-white">342</span>
               <span className="text-[10px] text-gray-500 uppercase">Participants</span>
            </div>
            <div className="bg-[#111] border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center">
               <Target className="w-5 h-5 text-red-500 mb-1" />
               <span className="text-lg font-bold text-white">12</span>
               <span className="text-[10px] text-gray-500 uppercase">Tracks</span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-white/10">
             {['Tracks', 'Activity', 'Rules'].map((tab) => (
               <button
                 key={tab}
                 onClick={() => setActiveTab(tab.toLowerCase())}
                 className={`px-6 py-3 text-sm font-medium transition-colors relative ${
                   activeTab === tab.toLowerCase() ? 'text-[#FFD700]' : 'text-gray-500 hover:text-white'
                 }`}
               >
                 {tab}
                 {activeTab === tab.toLowerCase() && (
                   <motion.div layoutId="underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FFD700]" />
                 )}
               </button>
             ))}
          </div>

          {/* Tab Content Area */}
          <div className="min-h-[400px]">
             {activeTab === 'tracks' && (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {TRACKS.map((track, i) => (
                   <motion.div 
                     key={i}
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: i * 0.1 }}
                     className="bg-[#151515] border border-white/5 p-4 rounded-xl hover:border-white/20 transition-colors group"
                   >
                      <div className="flex justify-between items-start mb-3">
                        <div className={`p-2 rounded-lg bg-white/5 ${track.color}`}>
                          <track.icon className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-mono text-gray-500 bg-white/5 px-2 py-1 rounded">
                          {track.reward}
                        </span>
                      </div>
                      <h4 className="font-bold text-white mb-1 group-hover:text-[#FFD700] transition-colors">{track.title}</h4>
                      <p className="text-xs text-gray-500 line-clamp-2">Build innovative solutions utilizing {track.title.toLowerCase()} technology.</p>
                   </motion.div>
                 ))}
               </div>
             )}
             {activeTab === 'activity' && (
                <div className="text-center py-10 text-gray-500">Live activity feed connecting...</div>
             )}
          </div>
        </main>


        {/* --- RIGHT COLUMN: PERSONAL DASHBOARD (25%) --- */}
        <aside className="lg:col-span-3 space-y-6">
          
          {/* Compact Ticket (Stackable Design) */}
          <div className="bg-gradient-to-b from-[#1a1a1a] to-[#111] border border-white/10 rounded-xl p-0 overflow-hidden shadow-lg relative group">
             {/* Decorative Top Line */}
             <div className="h-1 w-full bg-gradient-to-r from-purple-500 via-blue-500 to-green-500" />
             
             <div className="p-4">
               <div className="flex items-center gap-3 mb-3">
                 <div className="w-10 h-10 rounded bg-white/10 flex items-center justify-center">
                    <Image src="/asset/logo-gmi.png" width={24} height={24} alt="Team" className="opacity-80" />
                 </div>
                 <div className="flex-1 min-w-0">
                   <h4 className="text-white font-bold truncate">Project Alpha</h4>
                   <p className="text-[10px] text-gray-500 uppercase">ID: #8821</p>
                 </div>
                 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
               </div>
               
               <div className="flex items-center justify-between text-xs text-gray-400 border-t border-white/5 pt-3">
                 <span>Team: <span className="text-white">SolanaGods</span></span>
                 <span className="bg-white/5 px-1.5 py-0.5 rounded text-[10px]">VERIFIED</span>
               </div>
             </div>
          </div>

          {/* Checklist */}
          <div className="bg-[#111] border border-white/5 rounded-xl p-4">
             <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Your Tasks</h3>
                <span className="text-[10px] bg-green-900/30 text-green-400 px-1.5 py-0.5 rounded">2/4</span>
             </div>
             <div className="space-y-3">
               {TASKS.map((task) => (
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

          {/* Mini Leaderboard */}
          <div className="bg-[#111] border border-white/5 rounded-xl p-4">
             <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Top Teams</h3>
                <MoreHorizontal className="w-4 h-4 text-gray-600 cursor-pointer hover:text-white" />
             </div>
             <div className="space-y-3">
               {LEADERBOARD.map((team) => (
                 <div key={team.rank} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                       <span className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] 
                         ${team.rank === 1 ? 'bg-yellow-500/20 text-yellow-500' : 
                           team.rank === 2 ? 'bg-gray-400/20 text-gray-400' : 
                           'bg-orange-700/20 text-orange-600'}`}>
                         {team.rank}
                       </span>
                       <span className="text-gray-300">{team.name}</span>
                    </div>
                    <span className="font-mono text-gray-500">{team.points} pts</span>
                 </div>
               ))}
             </div>
          </div>

        </aside>

      </div>
    </div>
  );
}
