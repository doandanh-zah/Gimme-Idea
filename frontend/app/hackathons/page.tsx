'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Users, Trophy, ArrowRight, Zap, Loader2 } from 'lucide-react';
import Link from 'next/link';
import SponsorModal from '@/components/SponsorModal';
import ConstellationBackground from '@/components/ConstellationBackground';
import { HACKATHONS_MOCK_DATA, Hackathon } from '@/lib/mock-hackathons';

export default function HackathonsList() {
  const [isSponsorModalOpen, setIsSponsorModalOpen] = useState(false);
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHackathons = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const res = await fetch(`${API_URL}/hackathons`);
        const data = await res.json();
        
        if (data.success && data.data && data.data.length > 0) {
          // Transform API data to match expected format
          const transformedData = data.data.map((h: any) => ({
            id: h.slug || h.id,
            title: h.title,
            description: h.description || h.tagline,
            status: h.status,
            date: h.submissionStart 
              ? new Date(h.submissionStart).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
              : 'TBA',
            prizePool: h.prizePool || 'TBA',
            participants: [], // Will be populated from API
            participantsCount: h.participantsCount || 0,
          }));
          setHackathons(transformedData);
        } else {
          // Fallback to mock data if API returns empty
          setHackathons(HACKATHONS_MOCK_DATA);
        }
      } catch (error) {
        console.error('Failed to fetch hackathons:', error);
        // Fallback to mock data on error
        setHackathons(HACKATHONS_MOCK_DATA);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHackathons();
  }, []);

  // Filter to only show non-draft hackathons
  const visibleHackathons = hackathons.filter(h => h.status !== 'draft');

  return (
    <div className="min-h-screen text-gray-300 pt-28 pb-10 px-4 font-sans text-sm relative">
      {/* Constellation Background */}
      <ConstellationBackground opacity={0.25} />

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
        <div className="grid gap-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#FFD700]" />
            </div>
          ) : visibleHackathons.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No hackathons available at the moment.
            </div>
          ) : (
            visibleHackathons.map((hackathon, i) => (
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
                    ${hackathon.status === 'active' ? 'bg-[#FFD700] text-black' : 
                      hackathon.status === 'upcoming' ? 'bg-blue-500/80 text-white' :
                      hackathon.status === 'judging' ? 'bg-amber-500/80 text-black' :
                      hackathon.status === 'completed' ? 'bg-purple-500/80 text-white' :
                      'bg-white/10 text-gray-500'}`}>
                    {hackathon.status}
                  </div>

                  <div className="grid md:grid-cols-12 gap-6 items-center">
                    
                    {/* Date Block */}
                    <div className="md:col-span-2 flex flex-col items-center justify-center border-r border-white/5 pr-4">
                        <div className="text-2xl font-bold text-white font-mono">{hackathon.date.split(' ')[0]}</div>
                        <div className="text-xs text-gray-500 uppercase">{hackathon.date.split(' ')[1] || ''}</div>
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
                           {hackathon.participantsCount || hackathon.participants?.length || 0} Builders
                         </div>
                         <div className="flex items-center gap-1">
                           <Trophy className="w-3.5 h-3.5" />
                           {hackathon.prizePool}
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
          ))
          )}
        </div>

      </div>
      
      <SponsorModal isOpen={isSponsorModalOpen} onClose={() => setIsSponsorModalOpen(false)} />
    </div>
  );
}
