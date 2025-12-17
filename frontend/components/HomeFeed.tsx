'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lightbulb, Rocket, Users, Trophy, Rss, Sparkles, 
  ExternalLink
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';
import Image from 'next/image';

// Feature stars (web features) - positioned around the center
const FEATURE_STARS = [
  { id: 'ideas', name: 'Ideas', icon: Lightbulb, color: '#FFD700', route: '/idea', angle: 0, distance: 80 },
  { id: 'feeds', name: 'Feeds', icon: Rss, color: '#14F195', route: '/feeds', angle: 90, distance: 85 },
  { id: 'hackathons', name: 'Hackathons', icon: Rocket, color: '#FF6B6B', route: '/hackathons', angle: 180, distance: 80 },
  { id: 'leaderboard', name: 'Leaderboard', icon: Trophy, color: '#9945FF', route: '/leaderboard', angle: 270, distance: 85 },
];

// Partner planets configuration
const getPartnerPlanets = (isMobile: boolean) => {
  const baseOrbit = isMobile ? 140 : 200;
  const orbitGap = isMobile ? 50 : 70;
  
  return [
    {
      id: 'solana',
      name: 'Solana',
      description: 'A decentralized blockchain built for scale. Fast, secure, and energy-efficient.',
      logo: '/SOLANA.svg',
      gradient: 'linear-gradient(135deg, #9945FF 0%, #14F195 50%, #00D1FF 100%)',
      glowColor: 'rgba(153, 69, 255, 0.5)',
      size: isMobile ? 50 : 65,
      orbitRadius: baseOrbit,
      orbitSpeed: 40,
      startAngle: 30,
      route: 'https://solana.com',
      external: true,
    },
    {
      id: 'dsuc',
      name: 'DSUC',
      description: 'DUT Superteam University Club - The first Solana blockchain club of Danang University',
      logo: '/dsuc.png',
      gradient: 'linear-gradient(135deg, #0EA5E9 0%, #FACC15 100%)',
      glowColor: 'rgba(14, 165, 233, 0.5)',
      size: isMobile ? 45 : 58,
      orbitRadius: baseOrbit + orbitGap,
      orbitSpeed: 55,
      startAngle: 150,
      route: 'https://dsuc.fun',
      external: true,
    },
    {
      id: 'superteamvn',
      name: 'Superteam VN',
      description: 'Talent Layer of Solana in Vietnam',
      logo: '/superteamvn.png',
      gradient: 'linear-gradient(135deg, #EF4444 0%, #FACC15 100%)',
      glowColor: 'rgba(239, 68, 68, 0.5)',
      size: isMobile ? 42 : 55,
      orbitRadius: baseOrbit + orbitGap * 2,
      orbitSpeed: 70,
      startAngle: 270,
      route: 'https://vn.superteam.fun',
      external: true,
    },
  ];
};

export default function HomeFeed() {
  const router = useRouter();
  const { user } = useAuth();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [stats, setStats] = useState({ ideas: 0, hackathons: 0, feeds: 0, users: 0 });
  const [orbitAngles, setOrbitAngles] = useState<{ [key: string]: number }>({});
  const [isMobile, setIsMobile] = useState(false);
  const [stars, setStars] = useState<{ id: number; top: string; left: string; size: number; duration: string; opacity: number }[]>([]);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const isPausedRef = useRef(false);

  const PARTNER_PLANETS = getPartnerPlanets(isMobile);
  const centerSize = isMobile ? 80 : 110;
  const featureStarSize = isMobile ? 32 : 42;

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Generate background stars
  useEffect(() => {
    const newStars = Array.from({ length: 60 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: Math.random() * 2.5 + 0.5,
      duration: `${Math.random() * 3 + 2}s`,
      opacity: Math.random() * 0.7 + 0.3
    }));
    setStars(newStars);
  }, []);

  // Initialize orbit angles
  useEffect(() => {
    const initialAngles: { [key: string]: number } = {};
    PARTNER_PLANETS.forEach(planet => {
      initialAngles[planet.id] = planet.startAngle;
    });
    setOrbitAngles(initialAngles);
  }, [isMobile]);

  // Load real stats from API
  useEffect(() => {
    const loadStats = async () => {
      try {
        const [ideasRes, feedsRes, hackathonsRes] = await Promise.all([
          apiClient.getProjects({ type: 'idea', limit: 100 }),
          apiClient.getFeeds({ limit: 100 }),
          apiClient.getHackathons().catch(() => ({ data: [] })),
        ]);
        
        const ideasCount = (ideasRes as any).pagination?.total || ideasRes.data?.length || 0;
        const feedsCount = (feedsRes as any).pagination?.total || feedsRes.data?.length || 0;
        const hackathonsCount = hackathonsRes.data?.filter((h: { status: string }) => 
          h.status === 'upcoming' || h.status === 'active'
        ).length || 0;
        const uniqueUsers = new Set(ideasRes.data?.map((idea: { author?: { username?: string } }) => idea.author?.username).filter(Boolean));
        
        setStats({ 
          ideas: ideasCount, 
          hackathons: hackathonsCount, 
          feeds: feedsCount, 
          users: uniqueUsers.size,
        });
      } catch (e) { 
        console.log('Stats error:', e);
      }
    };
    loadStats();
  }, []);

  // Animation loop - pauses when hovering
  useEffect(() => {
    const animate = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const delta = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;
      
      if (!isPausedRef.current) {
        setOrbitAngles(prev => {
          const newAngles: { [key: string]: number } = {};
          PARTNER_PLANETS.forEach(planet => {
            const currentAngle = prev[planet.id] ?? planet.startAngle;
            newAngles[planet.id] = (currentAngle + (360 / planet.orbitSpeed) * delta) % 360;
          });
          return newAngles;
        });
      }
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [isMobile]);

  // Pause/resume animation on hover
  const handleHover = useCallback((itemId: string | null) => {
    setHoveredItem(itemId);
    isPausedRef.current = itemId !== null;
  }, []);

  const getPlanetPosition = useCallback((planet: ReturnType<typeof getPartnerPlanets>[0]) => {
    const angle = (orbitAngles[planet.id] ?? planet.startAngle) * (Math.PI / 180);
    const ellipseRatio = isMobile ? 0.55 : 0.45;
    return { 
      x: Math.cos(angle) * planet.orbitRadius, 
      y: Math.sin(angle) * planet.orbitRadius * ellipseRatio 
    };
  }, [orbitAngles, isMobile]);

  const handleClick = (route: string, external?: boolean) => {
    if (external) {
      window.open(route, '_blank');
    } else {
      router.push(route);
    }
  };

  // Get feature star position
  const getFeatureStarPosition = (angle: number, distance: number) => {
    const rad = (angle - 90) * (Math.PI / 180);
    return {
      x: Math.cos(rad) * (isMobile ? distance * 0.7 : distance),
      y: Math.sin(rad) * (isMobile ? distance * 0.7 : distance)
    };
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background - same as other pages */}
      <div className="fixed inset-0 z-[-1]">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#05010d] via-[#0a0015] to-[#020105]" />
        
        {/* Nebula orbs */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#9945FF]/20 rounded-full blur-[150px] opacity-40" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-[#FFD700]/15 rounded-full blur-[150px] opacity-30" />
        <div className="absolute top-[40%] right-[20%] w-[400px] h-[400px] bg-[#14F195]/10 rounded-full blur-[120px] opacity-25" />
        
        {/* Stars container - same as Dashboard */}
        <div className="stars-container">
          {stars.map((star) => (
            <div
              key={star.id}
              className="star"
              style={{
                top: star.top,
                left: star.left,
                width: `${star.size}px`,
                height: `${star.size}px`,
                '--duration': star.duration,
                '--opacity': star.opacity
              } as React.CSSProperties}
            />
          ))}
          <div className="shooting-star" style={{ top: '20%', left: '80%' }} />
          <div className="shooting-star" style={{ top: '60%', left: '10%', animationDelay: '2s' }} />
          <div className="shooting-star" style={{ top: '40%', left: '50%', animationDelay: '5s' }} />
        </div>
      </div>

      {/* Header */}
      <div className="pt-24 sm:pt-28 px-4 sm:px-6 text-center relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-2 sm:mb-3 tracking-tight">
            Welcome to{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFD700] via-[#FDB931] to-[#FFD700]">
              Gimme Idea
            </span>
          </h1>
          <p className="text-gray-400 text-sm sm:text-base max-w-md mx-auto">
            Explore our innovation universe. Tap any planet to discover.
          </p>
        </motion.div>
      </div>

      {/* Solar System */}
      <div className="relative w-full h-[420px] sm:h-[520px] md:h-[580px] lg:h-[620px] flex items-center justify-center mt-2 sm:mt-6">
        {/* Orbit lines for partner planets */}
        {PARTNER_PLANETS.map(planet => (
          <div 
            key={`orbit-${planet.id}`} 
            className="absolute left-1/2 top-1/2 rounded-full border border-white/[0.04] pointer-events-none"
            style={{ 
              width: planet.orbitRadius * 2, 
              height: planet.orbitRadius * (isMobile ? 1.1 : 0.9),
              transform: 'translate(-50%, -50%)'
            }} 
          />
        ))}

        {/* Center - Gimme Idea Logo */}
        <motion.div
          className="absolute cursor-pointer select-none z-50"
          style={{ left: '50%', top: '50%', x: -centerSize / 2, y: -centerSize / 2 }}
          onMouseEnter={() => handleHover('gimme-idea')}
          onMouseLeave={() => handleHover(null)}
          onClick={() => handleClick('/idea')}
          animate={{ scale: hoveredItem === 'gimme-idea' ? 1.15 : 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          {/* Glow */}
          <div 
            className="absolute rounded-full blur-2xl transition-all duration-300"
            style={{ 
              inset: -centerSize * 0.4,
              background: 'radial-gradient(circle, rgba(255,215,0,0.6) 0%, rgba(255,215,0,0.2) 50%, transparent 70%)',
              opacity: hoveredItem === 'gimme-idea' ? 1 : 0.7,
              transform: `scale(${hoveredItem === 'gimme-idea' ? 1.5 : 1.2})`
            }} 
          />
          {/* Logo */}
          <div 
            className="relative rounded-full flex items-center justify-center overflow-hidden"
            style={{
              width: centerSize, 
              height: centerSize,
              background: 'radial-gradient(circle at 30% 25%, #FFD700, #FDB931 50%, #E6A800 100%)',
              boxShadow: `
                0 0 ${hoveredItem === 'gimme-idea' ? 60 : 35}px rgba(255,215,0,0.6),
                inset -${centerSize * 0.15}px -${centerSize * 0.15}px ${centerSize * 0.3}px rgba(0,0,0,0.3),
                inset ${centerSize * 0.08}px ${centerSize * 0.08}px ${centerSize * 0.15}px rgba(255,255,255,0.3)
              `,
            }}
          >
            <Image 
              src="/logo-gmi.png" 
              alt="Gimme Idea" 
              width={centerSize * 0.65} 
              height={centerSize * 0.65}
              className="object-contain drop-shadow-lg"
            />
          </div>
          {/* Label */}
          <motion.div 
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            className="absolute left-1/2 -translate-x-1/2 text-center whitespace-nowrap pointer-events-none"
            style={{ top: centerSize + 12 }}
          >
            <p className="font-bold text-white text-sm sm:text-base drop-shadow-lg">Gimme Idea</p>
            <p className="text-[10px] sm:text-xs text-gray-400/80">Innovation Hub</p>
          </motion.div>
        </motion.div>

        {/* Feature Stars - web features around center */}
        {FEATURE_STARS.map(feature => {
          const pos = getFeatureStarPosition(feature.angle, feature.distance);
          const isHovered = hoveredItem === feature.id;
          const Icon = feature.icon;

          return (
            <motion.div
              key={feature.id}
              className="absolute cursor-pointer select-none z-40"
              style={{
                left: '50%',
                top: '50%',
                x: pos.x - featureStarSize / 2,
                y: pos.y - featureStarSize / 2,
              }}
              onMouseEnter={() => handleHover(feature.id)}
              onMouseLeave={() => handleHover(null)}
              onClick={() => handleClick(feature.route)}
              animate={{ scale: isHovered ? 1.3 : 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              {/* Star glow */}
              <div 
                className="absolute rounded-full blur-lg transition-all duration-300"
                style={{ 
                  inset: -featureStarSize * 0.3,
                  background: feature.color,
                  opacity: isHovered ? 0.7 : 0.4,
                }} 
              />
              {/* Star body */}
              <div 
                className="relative rounded-full flex items-center justify-center"
                style={{
                  width: featureStarSize, 
                  height: featureStarSize,
                  background: `radial-gradient(circle at 35% 30%, white, ${feature.color} 60%)`,
                  boxShadow: `0 0 ${isHovered ? 25 : 15}px ${feature.color}`,
                }}
              >
                <Icon 
                  style={{ 
                    width: featureStarSize * 0.45, 
                    height: featureStarSize * 0.45, 
                    color: '#1a1a2e',
                  }} 
                />
              </div>
              {/* Label on hover */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute left-1/2 -translate-x-1/2 text-center whitespace-nowrap pointer-events-none"
                    style={{ top: featureStarSize + 6 }}
                  >
                    <p className="font-semibold text-white text-xs drop-shadow-lg">{feature.name}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}

        {/* Partner Planets - orbiting */}
        {PARTNER_PLANETS.map(planet => {
          const pos = getPlanetPosition(planet);
          const isHovered = hoveredItem === planet.id;

          return (
            <motion.div
              key={planet.id}
              className="absolute cursor-pointer select-none"
              style={{
                left: '50%',
                top: '50%',
                x: pos.x - planet.size / 2,
                y: pos.y - planet.size / 2,
                zIndex: isHovered ? 100 : 20,
              }}
              onMouseEnter={() => handleHover(planet.id)}
              onMouseLeave={() => handleHover(null)}
              onTouchStart={() => handleHover(planet.id)}
              onClick={() => handleClick(planet.route, planet.external)}
              animate={{ scale: isHovered ? 1.4 : 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              {/* Glow effect */}
              <div 
                className="absolute rounded-full blur-xl transition-all duration-300"
                style={{ 
                  inset: -planet.size * 0.35,
                  background: planet.glowColor,
                  opacity: isHovered ? 0.9 : 0.5,
                  transform: `scale(${isHovered ? 1.6 : 1.2})`
                }} 
              />

              {/* Planet body with gradient background */}
              <div 
                className="relative rounded-full flex items-center justify-center overflow-hidden transition-shadow duration-300"
                style={{
                  width: planet.size, 
                  height: planet.size,
                  background: planet.gradient,
                  boxShadow: `
                    0 0 ${isHovered ? 45 : 20}px ${planet.glowColor},
                    inset -${planet.size * 0.15}px -${planet.size * 0.15}px ${planet.size * 0.3}px rgba(0,0,0,0.35),
                    inset ${planet.size * 0.08}px ${planet.size * 0.08}px ${planet.size * 0.15}px rgba(255,255,255,0.2)
                  `,
                }}
              >
                <Image 
                  src={planet.logo} 
                  alt={planet.name} 
                  width={planet.size * 0.55} 
                  height={planet.size * 0.55}
                  className="object-contain drop-shadow-md"
                />
              </div>

              {/* Planet label */}
              <motion.div 
                initial={false}
                animate={{ 
                  opacity: isHovered ? 1 : 0,
                  y: isHovered ? 0 : 8
                }}
                transition={{ duration: 0.2 }}
                className="absolute left-1/2 -translate-x-1/2 text-center whitespace-nowrap pointer-events-none"
                style={{ top: planet.size + 8 }}
              >
                <p className="font-bold text-white text-xs sm:text-sm drop-shadow-lg">{planet.name}</p>
              </motion.div>

              {/* Hover info card */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 w-48 sm:w-56 p-3 sm:p-4 rounded-2xl glass-panel z-50"
                    style={{ 
                      background: `linear-gradient(135deg, rgba(255,255,255,0.1), rgba(5,3,10,0.95))`,
                      borderColor: `rgba(255,255,255,0.15)`
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden"
                        style={{ background: planet.gradient }}
                      >
                        <Image 
                          src={planet.logo} 
                          alt={planet.name} 
                          width={20} 
                          height={20}
                          className="object-contain"
                        />
                      </div>
                      <span className="font-bold text-white text-sm">{planet.name}</span>
                    </div>
                    <p className="text-xs text-gray-300 mb-3 leading-relaxed">{planet.description}</p>
                    <div 
                      className="pt-2 border-t border-white/10 flex items-center justify-center gap-1.5 text-xs font-medium text-white/80"
                    >
                      <span>Visit Website</span>
                      <ExternalLink className="w-3 h-3" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Bottom stats bar */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.3, duration: 0.6 }} 
        className="fixed bottom-0 left-0 right-0 z-20 pb-4 sm:pb-6 px-4"
      >
        <div className="max-w-2xl mx-auto">
          <div className="glass-panel rounded-2xl p-3 sm:p-4 flex items-center justify-around gap-2">
            {[
              { icon: Lightbulb, label: 'Ideas', value: stats.ideas, color: '#FFD700' },
              { icon: Rocket, label: 'Events', value: stats.hackathons, color: '#FF6B6B' },
              { icon: Rss, label: 'Feeds', value: stats.feeds, color: '#14F195' },
              { icon: Users, label: 'Builders', value: stats.users, color: '#3B82F6' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-1.5 sm:gap-2">
                <div 
                  className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0" 
                  style={{ backgroundColor: `${item.color}15` }}
                >
                  <item.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: item.color }} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs text-gray-500 hidden sm:block">{item.label}</p>
                  <p className="font-bold text-white text-xs sm:text-sm">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* User badge - top left */}
      {user && (
        <motion.div 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }} 
          className="fixed top-20 sm:top-24 left-3 sm:left-6 z-20"
        >
          <div className="flex items-center gap-2 sm:gap-3 glass-panel rounded-xl sm:rounded-2xl p-2 sm:p-3 pr-3 sm:pr-5">
            {user.avatar ? (
              <Image 
                src={user.avatar} 
                alt={user.username} 
                width={32} 
                height={32} 
                className="rounded-full border-2 border-[#FFD700]/30 w-8 h-8 sm:w-10 sm:h-10" 
              />
            ) : (
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#FFD700]/30 to-[#FFD700]/10 flex items-center justify-center">
                <span className="text-[#FFD700] font-bold text-xs sm:text-sm">
                  {user.username?.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="hidden sm:block">
              <p className="text-[10px] text-gray-500">Welcome back</p>
              <p className="font-semibold text-white text-sm">{user.username}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* New Idea button - top right */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }} 
        animate={{ opacity: 1, x: 0 }} 
        className="fixed top-20 sm:top-24 right-3 sm:right-6 z-20"
      >
        <button 
          onClick={() => router.push('/idea/new')} 
          className="flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-[#FFD700] to-[#FDB931] text-black font-bold px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl hover:shadow-lg hover:shadow-[#FFD700]/30 transition-all text-sm"
        >
          <Sparkles className="w-4 h-4" />
          <span className="hidden sm:inline">New Idea</span>
        </button>
      </motion.div>
    </div>
  );
}
