'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Users, Trophy, ArrowRight, Zap } from 'lucide-react';
import Link from 'next/link';

// --- MOCK DATA ---
const HACKATHONS = [
  { 
    id: 'winter-2025', 
    title: 'GIMMEHACK Winter Season 2025', 
    date: 'Dec 01 - Dec 30, 2025', 
    status: 'active',
    participants: 342,
    prizePool: '$50,000',
    description: 'Build the next generation of decentralized applications on Solana.',
    tags: ['DeFi', 'NFT', 'Gaming']
  },
  { 
    id: 'autumn-2025', 
    title: 'GIMMEHACK Autumn Season 2025', 
    date: 'Sep 01 - Sep 30, 2025', 
    status: 'completed',
    participants: 210,
    prizePool: '$30,000',
    description: 'Focus on SocialFi and Community building tools.',
    tags: ['SocialFi', 'DAO']
  },
  { 
    id: 'summer-2025', 
    title: 'GIMMEHACK Summer Season 2025', 
    date: 'Jun 01 - Jun 30, 2025', 
    status: 'completed',
    participants: 156,
    prizePool: '$20,000',
    description: 'Summer heat for blazing fast consumer crypto apps.',
    tags: ['Consumer', 'Mobile']
  },
];

export default function HackathonsList() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-300 pt-20 pb-10 px-4 font-sans text-sm">
      <div className="max-w-[1000px] mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-white font-quantico mb-2">HACKATHONS</h1>
            <p className="text-gray-400">Join our global community of builders and ship products.</p>
          </div>
          <div className="flex gap-2">
            <a href="https://forms.gle/your-sponsor-form-link" target="_blank" rel="noopener noreferrer" className="bg-[#FFD700] text-black font-bold px-4 py-2 rounded hover:bg-[#FFD700]/90 transition-colors">
              Apply as Sponsor
            </a>
          </div>
        </div>

        {/* List */}
        <div className="grid gap-4">
          {HACKATHONS.map((hackathon, i) => (
            <motion.div
              key={hackathon.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link href={`/hackathons/${hackathon.id}`}>
                <div className="bg-[#111] border border-white/5 rounded-xl p-6 hover:border-white/20 transition-all group relative overflow-hidden">
                  
                  {/* Status Badge */}
                  <div className={`absolute top-0 right-0 px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-bl-xl
                    ${hackathon.status === 'active' ? 'bg-[#FFD700] text-black' : 'bg-white/10 text-gray-500'}`}>
                    {hackathon.status}
                  </div>

                  <div className="grid md:grid-cols-12 gap-6 items-center">
                    
                    {/* Date Block */}
                    <div className="md:col-span-2 flex flex-col items-center justify-center border-r border-white/5 pr-4">
                        <div className="text-2xl font-bold text-white font-mono">{hackathon.date.split(' ')[0]}</div>
                        <div className="text-xs text-gray-500 uppercase">{hackathon.date.split(' ')[1]}</div>
                    </div>

                    {/* Main Info */}
                    <div className="md:col-span-7 space-y-2">
                      <div className="flex items-center gap-2 mb-1">
                        {hackathon.status === 'active' && (
                          <span className="flex items-center gap-1 text-[10px] text-[#FFD700] border border-[#FFD700]/20 px-1.5 rounded bg-[#FFD700]/5">
                            <Zap className="w-3 h-3" /> LIVE
                          </span>
                        )}
                        <h2 className="text-xl font-bold text-white group-hover:text-[#FFD700] transition-colors">
                          {hackathon.title}
                        </h2>
                      </div>
                      
                      <p className="text-gray-400 text-sm line-clamp-1">{hackathon.description}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500 pt-2">
                         <div className="flex items-center gap-1">
                           <Users className="w-3.5 h-3.5" />
                           {hackathon.participants} Builders
                         </div>
                         <div className="flex items-center gap-1">
                           <Trophy className="w-3.5 h-3.5" />
                           {hackathon.prizePool}
                         </div>
                         <div className="flex gap-2 ml-2">
                           {hackathon.tags.map(tag => (
                             <span key={tag} className="bg-white/5 px-2 py-0.5 rounded text-[10px]">{tag}</span>
                           ))}
                         </div>
                      </div>
                    </div>

                    {/* Action */}
                    <div className="md:col-span-3 flex justify-end">
                      <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-[#FFD700] group-hover:text-black group-hover:border-[#FFD700] transition-all">
                        <ArrowRight className="w-5 h-5" />
                      </div>
                    </div>

                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

      </div>
    </div>
  );
}