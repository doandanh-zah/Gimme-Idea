'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Users, Trophy, ArrowRight, Zap, Loader2, 
  Lightbulb, Mic, Code, Target, ChevronRight, Clock,
  Star, Award, Medal, Sparkles, ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import ConstellationBackground from '@/components/ConstellationBackground';

interface HackathonRound {
  roundNumber: number;
  title: string;
  description: string;
  roundType: 'idea' | 'pitching' | 'final';
  mode: 'online' | 'offline' | 'hybrid';
  teamsAdvancing: number;
  bonusTeams?: number;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'active' | 'judging' | 'completed';
}

interface Hackathon {
  id: string;
  slug: string;
  title: string;
  tagline?: string;
  description?: string;
  status: 'draft' | 'upcoming' | 'active' | 'judging' | 'completed' | 'cancelled';
  prizePool?: string;
  participantsCount: number;
  teamsCount?: number;
  currentRound?: number;
  totalRounds?: number;
  rounds?: HackathonRound[];
  bannerImage?: string;
  organizerName?: string;
  registrationStart?: string;
  registrationEnd?: string;
}

// Round icon mapping
const getRoundIcon = (type: string) => {
  switch (type) {
    case 'idea': return Lightbulb;
    case 'pitching': return Mic;
    case 'final': return Code;
    default: return Target;
  }
};

// Status badge colors
const getStatusStyle = (status: string) => {
  switch (status) {
    case 'active': return 'bg-[#FFD700] text-black';
    case 'upcoming': return 'bg-blue-500/80 text-white';
    case 'judging': return 'bg-amber-500/80 text-black';
    case 'completed': return 'bg-purple-500/80 text-white';
    default: return 'bg-white/10 text-gray-500';
  }
};

// Featured Hackathon Card (main hackathon)
const FeaturedHackathonCard = ({ hackathon }: { hackathon: Hackathon }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Calculate countdown
  const getCountdown = () => {
    if (!hackathon.rounds || hackathon.rounds.length === 0) return null;
    
    const activeRound = hackathon.rounds.find(r => r.status === 'active');
    const upcomingRound = hackathon.rounds.find(r => r.status === 'upcoming');
    const targetRound = activeRound || upcomingRound;
    
    if (!targetRound) return null;
    
    const targetDate = new Date(activeRound ? targetRound.endDate : targetRound.startDate);
    const now = new Date();
    const diff = targetDate.getTime() - now.getTime();
    
    if (diff <= 0) return null;
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    return {
      days,
      hours,
      label: activeRound ? `Round ${activeRound.roundNumber} ends in` : `Round ${upcomingRound?.roundNumber} starts in`
    };
  };
  
  const countdown = getCountdown();
  const currentRound = hackathon.rounds?.find(r => r.status === 'active') || hackathon.rounds?.[0];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/hackathons/${hackathon.slug || hackathon.id}`}>
        <div 
          className="relative bg-gradient-to-br from-[#1a1a2e] to-[#0d0d1a] border border-[#FFD700]/20 rounded-2xl overflow-hidden transition-all duration-500"
          style={{
            boxShadow: isHovered 
              ? '0 0 60px rgba(255, 215, 0, 0.3), 0 0 120px rgba(153, 69, 255, 0.2)'
              : '0 0 30px rgba(255, 215, 0, 0.1)'
          }}
        >
          {/* Scanline effect */}
          <div 
            className="absolute inset-0 pointer-events-none z-[1]"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,215,0,0.02) 2px, rgba(255,215,0,0.02) 4px)',
              opacity: isHovered ? 0.8 : 0.4
            }}
          />
          
          {/* Status Badge */}
          <div className="absolute top-4 right-4 z-10">
            <div className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${getStatusStyle(hackathon.status)}`}>
              {hackathon.status === 'active' && <Zap className="w-3 h-3" />}
              {hackathon.status}
            </div>
          </div>
          
          {/* Content */}
          <div className="relative z-[2] p-8">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="w-5 h-5 text-[#FFD700]" />
                  <span className="text-[#FFD700] text-sm font-medium">Featured Hackathon</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 group-hover:text-[#FFD700] transition-colors">
                  {hackathon.title}
                </h2>
                <p className="text-gray-400 text-sm md:text-base max-w-2xl">
                  {hackathon.tagline || hackathon.description}
                </p>
              </div>
            </div>
            
            {/* Stats Row */}
            <div className="flex flex-wrap gap-6 mb-8">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-[#FFD700]/10 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-[#FFD700]" />
                </div>
                <div>
                  <div className="text-lg font-bold text-white">{hackathon.prizePool || 'TBA'}</div>
                  <div className="text-xs text-gray-500">Prize Pool</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <div className="text-lg font-bold text-white">{hackathon.teamsCount || hackathon.participantsCount || 0}</div>
                  <div className="text-xs text-gray-500">Teams Registered</div>
                </div>
              </div>
              
              {countdown && (
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white">
                      {countdown.days}d {countdown.hours}h
                    </div>
                    <div className="text-xs text-gray-500">{countdown.label}</div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Rounds Progress */}
            {hackathon.rounds && hackathon.rounds.length > 0 && (
              <div className="mb-8">
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">Competition Rounds</div>
                <div className="flex gap-2">
                  {hackathon.rounds.map((round, idx) => {
                    const RoundIcon = getRoundIcon(round.roundType);
                    const isActive = round.status === 'active';
                    const isCompleted = round.status === 'completed';
                    
                    return (
                      <div 
                        key={idx}
                        className={`flex-1 p-3 rounded-xl border transition-all ${
                          isActive 
                            ? 'bg-[#FFD700]/10 border-[#FFD700]/40' 
                            : isCompleted
                              ? 'bg-green-500/10 border-green-500/20'
                              : 'bg-white/5 border-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <RoundIcon className={`w-4 h-4 ${isActive ? 'text-[#FFD700]' : isCompleted ? 'text-green-400' : 'text-gray-500'}`} />
                          <span className={`text-xs font-bold ${isActive ? 'text-[#FFD700]' : isCompleted ? 'text-green-400' : 'text-gray-400'}`}>
                            Round {round.roundNumber}
                          </span>
                          {isActive && (
                            <span className="px-1.5 py-0.5 bg-[#FFD700] text-black text-[8px] font-bold rounded uppercase">Live</span>
                          )}
                        </div>
                        <div className={`text-sm font-medium ${isActive ? 'text-white' : 'text-gray-400'}`}>
                          {round.title}
                        </div>
                        <div className="text-[10px] text-gray-500 mt-1">
                          {round.mode === 'offline' ? '🏢 Offline' : round.mode === 'hybrid' ? '🌐 Hybrid' : '💻 Online'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* CTA */}
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">
                {hackathon.organizerName && `Organized by ${hackathon.organizerName}`}
              </div>
              <motion.div 
                className="flex items-center gap-2 text-[#FFD700] font-medium"
                animate={{ x: isHovered ? 5 : 0 }}
              >
                View Details
                <ArrowRight className="w-4 h-4" />
              </motion.div>
            </div>
          </div>
          
          {/* Animated border on hover */}
          <AnimatePresence>
            {isHovered && (
              <>
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  exit={{ scaleX: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent origin-left z-20"
                />
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  exit={{ scaleX: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#9945FF] to-transparent origin-right z-20"
                />
              </>
            )}
          </AnimatePresence>
        </div>
      </Link>
    </motion.div>
  );
};

// Partner/External Hackathon Card (smaller, simpler)
const PartnerHackathonCard = ({ hackathon, index }: { hackathon: Hackathon; index: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Link href={`/hackathons/${hackathon.slug || hackathon.id}`}>
        <div className="bg-[#111] border border-white/5 rounded-xl p-5 hover:border-white/20 transition-all group">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-gray-500" />
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">Partner Event</span>
            </div>
            <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getStatusStyle(hackathon.status)}`}>
              {hackathon.status}
            </div>
          </div>
          
          <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[#FFD700] transition-colors line-clamp-1">
            {hackathon.title}
          </h3>
          
          <p className="text-sm text-gray-400 line-clamp-2 mb-4">
            {hackathon.tagline || hackathon.description}
          </p>
          
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Trophy className="w-3 h-3" />
                {hackathon.prizePool || 'TBA'}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {hackathon.participantsCount || 0}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 group-hover:text-[#FFD700] transition-colors" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default function HackathonsList() {
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHackathons = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const res = await fetch(`${API_URL}/hackathons`);
        const data = await res.json();
        
        if (data.success && data.data) {
          setHackathons(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch hackathons:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHackathons();
  }, []);

  // Separate featured (Gimme Idea's own) and partner hackathons
  const featuredHackathon = hackathons.find(h => h.status === 'active' || h.status === 'upcoming');
  const partnerHackathons = hackathons.filter(h => h.id !== featuredHackathon?.id && h.status !== 'draft');
  
  // Past hackathons
  const pastHackathons = hackathons.filter(h => h.status === 'completed');

  return (
    <div className="min-h-screen text-gray-300 pt-28 pb-10 px-4 font-sans relative">
      {/* Constellation Background */}
      <ConstellationBackground opacity={0.25} />

      <div className="max-w-[1000px] mx-auto space-y-10">
        
        {/* Header */}
        <div className="border-b border-white/10 pb-6">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-8 h-8 text-[#FFD700]" />
            <h1 className="text-3xl font-bold text-white font-quantico">HACKATHONS</h1>
          </div>
          <p className="text-gray-400 max-w-2xl">
            Join Gimme Idea's hackathons and compete through 3 rounds: Idea Phase, Pitching, and Grand Final. 
            Build innovative solutions, get feedback, and win prizes!
          </p>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#FFD700]" />
          </div>
        ) : (
          <>
            {/* Featured Hackathon */}
            {featuredHackathon ? (
              <section>
                <FeaturedHackathonCard hackathon={featuredHackathon} />
              </section>
            ) : (
              <div className="text-center py-16 bg-[#111] border border-white/5 rounded-xl">
                <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No Active Hackathon</h3>
                <p className="text-gray-500">Stay tuned for our next hackathon announcement!</p>
              </div>
            )}

            {/* How It Works */}
            <section className="bg-[#111]/50 border border-white/5 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#FFD700]" />
                How Gimme Idea Hackathons Work
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-[#FFD700]/20 flex items-center justify-center">
                      <Lightbulb className="w-4 h-4 text-[#FFD700]" />
                    </div>
                    <span className="font-bold text-white">Round 1: Idea</span>
                  </div>
                  <p className="text-sm text-gray-400">
                    Submit ideas (3-5 per team), give feedback to others, and compete for top spots. 
                    Top 10 ideas + Top 5 engagement teams advance.
                  </p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <Mic className="w-4 h-4 text-purple-400" />
                    </div>
                    <span className="font-bold text-white">Round 2: Pitching</span>
                  </div>
                  <p className="text-sm text-gray-400">
                    Present your solution to judges. Can be online or offline depending on the season. 
                    Top 10 best pitches move to the final.
                  </p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                      <Code className="w-4 h-4 text-cyan-400" />
                    </div>
                    <span className="font-bold text-white">Round 3: Final</span>
                  </div>
                  <p className="text-sm text-gray-400">
                    Demo your MVP and technical implementation. Win prizes and recognition!
                    3-5 winners per season.
                  </p>
                </div>
              </div>
            </section>

            {/* Partner Hackathons */}
            {partnerHackathons.length > 0 && (
              <section>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <ExternalLink className="w-5 h-5 text-gray-400" />
                  Partner Hackathons
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {partnerHackathons.map((h, i) => (
                    <PartnerHackathonCard key={h.id} hackathon={h} index={i} />
                  ))}
                </div>
              </section>
            )}

            {/* Past Hackathons */}
            {pastHackathons.length > 0 && (
              <section>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-gray-400" />
                  Past Hackathons
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {pastHackathons.map((h, i) => (
                    <PartnerHackathonCard key={h.id} hackathon={h} index={i} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
