'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Trophy, ArrowRight, Zap, Loader2 } from 'lucide-react';
import Link from 'next/link';
import SponsorModal from '@/components/SponsorModal';
import { apiClient } from '@/lib/api-client';
import { format } from 'date-fns';

export default function HackathonsList() {
  const [isSponsorModalOpen, setIsSponsorModalOpen] = useState(false);
  const [stars, setStars] = useState<{ id: number; top: string; left: string; size: number; duration: string; opacity: number }[]>([]);
  
  const [hackathons, setHackathons] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Generate stars on mount
  useEffect(() => {
    const newStars = Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: Math.random() * 2 + 1,
      duration: `${Math.random() * 3 + 2}s`,
      opacity: Math.random()
    }));
    setStars(newStars);
  }, []);

  // Fetch Hackathons
  useEffect(() => {
    async function fetchHackathons() {
      try {
        setIsLoading(true);
        const res = await apiClient.getHackathons();
        console.log("DEBUG: Hackathons Response:", res);

        // Check if response is an array (Direct Supabase response)
        if (Array.isArray(res)) {
          setHackathons(res);
        } 
        // Fallback: Check standard ApiResponse format
        else if (res && res.success && Array.isArray(res.data)) {
          setHackathons(res.data);
        }
        else {
          console.error("DEBUG: Invalid data format", res);
        }
      } catch (error) {
        console.error("Failed to fetch hackathons", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchHackathons();
  }, []);

  return (
    <div className="min-h-screen text-gray-300 pt-28 pb-10 px-4 font-sans text-sm relative">
      {/* Background with Stars & Grid */}
      <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
        <div className="bg-grid opacity-40"></div>
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#2e1065] rounded-full blur-[120px] animate-pulse-slow opacity-40 mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-[#422006] rounded-full blur-[120px] animate-pulse-slow opacity-40 mix-blend-screen" style={{animationDelay: '2s'}} />
        <div className="stars-container">
          {stars.map((star) => (
            <div key={star.id} className="star" style={{ top: star.top, left: star.left, width: `${star.size}px`, height: `${star.size}px`, '--duration': star.duration, '--opacity': star.opacity } as React.CSSProperties} />
          ))}
        </div>
      </div>

      <div className="max-w-[1000px] mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-white font-quantico mb-2">HACKATHONS</h1>
            <p className="text-gray-400">Join our global community of builders and ship products.</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setIsSponsorModalOpen(true)}
              className="bg-[#FFD700] text-black font-bold px-4 py-2 rounded hover:bg-[#FFD700]/90 transition-colors"
            >
              Apply as Sponsor
            </button>
          </div>
        </div>

        {/* List */}
        {isLoading ? (
             <div className="flex justify-center py-20">
                 <Loader2 className="w-8 h-8 text-gold animate-spin" />
             </div>
        ) : (
            <div className="grid gap-4">
              {hackathons.map((hackathon, i) => (
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
                            <div className="text-2xl font-bold text-white font-mono">
                                {format(new Date(hackathon.start_date), 'MMM')}
                            </div>
                            <div className="text-xs text-gray-500 uppercase">
                                {format(new Date(hackathon.start_date), 'dd')}
                            </div>
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
                               {hackathon.participants_count || 0} Builders
                             </div>
                             <div className="flex items-center gap-1">
                               <Trophy className="w-3.5 h-3.5" />
                               {hackathon.prize_pool}
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
              
              {hackathons.length === 0 && (
                  <div className="text-center py-20 text-gray-500">
                      <p>No hackathons found.</p>
                  </div>
              )}
            </div>
        )}

      </div>
      
      <SponsorModal isOpen={isSponsorModalOpen} onClose={() => setIsSponsorModalOpen(false)} />
    </div>
  );
}