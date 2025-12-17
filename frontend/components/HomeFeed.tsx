'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, Rss, Rocket, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

// All orbiting items configuration (from inside to outside)
const getOrbitItems = (isMobile: boolean) => {
  const baseSize = isMobile ? 42 : 65;
  const sizeDecrement = isMobile ? 2 : 3;
  
  return [
    {
      id: 'ideas',
      name: 'Ideas',
      description: 'Discover and share innovative concepts. The heart of our innovation ecosystem.',
      icon: Lightbulb,
      type: 'feature' as const,
      color: '#FFD700',
      glowColor: 'rgba(255, 215, 0, 0.5)',
      size: baseSize,
      orbitRadius: isMobile ? 90 : 160,
      orbitSpeed: 35,
      startAngle: 0,
      route: '/idea',
      external: false,
    },
    {
      id: 'feeds',
      name: 'Feeds',
      description: 'Curated collections of ideas. Follow topics that interest you.',
      icon: Rss,
      type: 'feature' as const,
      color: '#14F195',
      glowColor: 'rgba(20, 241, 149, 0.5)',
      size: baseSize - sizeDecrement,
      orbitRadius: isMobile ? 140 : 240,
      orbitSpeed: 45,
      startAngle: 60,
      route: '/feeds',
      external: false,
    },
    {
      id: 'hackathons',
      name: 'Hackathons',
      description: 'Build together, compete together. Join exciting blockchain hackathons.',
      icon: Rocket,
      type: 'feature' as const,
      color: '#FF6B6B',
      glowColor: 'rgba(255, 107, 107, 0.5)',
      size: baseSize - sizeDecrement * 2,
      orbitRadius: isMobile ? 190 : 320,
      orbitSpeed: 55,
      startAngle: 120,
      route: '/hackathons',
      external: false,
    },
    {
      id: 'dsuc',
      name: 'DSUC',
      description: 'DUT Superteam University Club - The first Solana blockchain club of Danang University',
      logo: '/dsuc.png',
      type: 'partner' as const,
      gradient: 'linear-gradient(135deg, #3366ff 0%, #00ccff 60%, #99ff66 100%)',
      glowColor: 'rgba(51, 102, 255, 0.6)',
      size: baseSize - sizeDecrement * 3,
      orbitRadius: isMobile ? 240 : 400,
      orbitSpeed: 70,
      startAngle: 180,
      route: 'https://dsuc.fun',
      external: true,
    },
    {
      id: 'superteamvn',
      name: 'Superteam VN',
      description: 'Talent Layer of Solana in Vietnam. Empowering builders across the nation.',
      logo: '/superteamvn.png',
      type: 'partner' as const,
      gradient: 'linear-gradient(135deg, #EF4444 0%, #FACC15 100%)',
      glowColor: 'rgba(239, 68, 68, 0.5)',
      size: baseSize - sizeDecrement * 4,
      orbitRadius: isMobile ? 290 : 480,
      orbitSpeed: 90,
      startAngle: 240,
      route: 'https://vn.superteam.fun',
      external: true,
    },
    {
      id: 'solana',
      name: 'Solana',
      description: 'A decentralized blockchain built for scale. Fast, secure, and energy-efficient.',
      logo: '/SOLANA.png',
      type: 'partner' as const,
      gradient: 'linear-gradient(135deg, #9945FF 0%, #14F195 50%, #00D1FF 100%)',
      glowColor: 'rgba(153, 69, 255, 0.5)',
      size: baseSize - sizeDecrement * 5,
      orbitRadius: isMobile ? 340 : 560,
      orbitSpeed: 110,
      startAngle: 300,
      route: 'https://solana.com',
      external: true,
    },
  ];
};

const GlitchText = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <span className={`relative inline-block ${className}`}>
    <span className="relative z-10">{children}</span>
    <span className="absolute top-0 left-0 text-[#14F195] opacity-60 animate-glitch-1 z-0" aria-hidden="true">{children}</span>
    <span className="absolute top-0 left-0 text-[#FF6B6B] opacity-60 animate-glitch-2 z-0" aria-hidden="true">{children}</span>
  </span>
);

export default function HomeFeed() {
  const router = useRouter();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [orbitAngles, setOrbitAngles] = useState<{ [key: string]: number }>({});
  const [isMobile, setIsMobile] = useState(false);
  const [stars, setStars] = useState<{ id: number; top: string; left: string; size: number; duration: string; opacity: number; shape: string }[]>([]);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const isPausedRef = useRef(false);

  const ORBIT_ITEMS = getOrbitItems(isMobile);
  const centerSize = isMobile ? 70 : 110;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Generate diverse stars like real universe
  useEffect(() => {
    const shapes = ['circle', 'diamond', 'cross', 'sparkle'];
    const newStars = Array.from({ length: 150 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: Math.random() * 4 + 1, // Bigger stars (1-5px)
      duration: `${Math.random() * 4 + 2}s`,
      opacity: Math.random() * 0.8 + 0.2,
      shape: shapes[Math.floor(Math.random() * shapes.length)]
    }));
    setStars(newStars);
  }, []);

  useEffect(() => {
    const initialAngles: { [key: string]: number } = {};
    ORBIT_ITEMS.forEach(item => {
      initialAngles[item.id] = item.startAngle;
    });
    setOrbitAngles(initialAngles);
  }, [isMobile]);

  useEffect(() => {
    const animate = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const delta = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;
      
      if (!isPausedRef.current) {
        setOrbitAngles(prev => {
          const newAngles: { [key: string]: number } = {};
          ORBIT_ITEMS.forEach(item => {
            const currentAngle = prev[item.id] ?? item.startAngle;
            newAngles[item.id] = (currentAngle + (360 / item.orbitSpeed) * delta) % 360;
          });
          return newAngles;
        });
      }
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [isMobile]);

  const handleHover = useCallback((itemId: string | null) => {
    setHoveredItem(itemId);
    isPausedRef.current = itemId !== null;
  }, []);

  const getItemPosition = useCallback((item: ReturnType<typeof getOrbitItems>[0]) => {
    const angle = (orbitAngles[item.id] ?? item.startAngle) * (Math.PI / 180);
    const ellipseRatio = isMobile ? 0.6 : 0.5;
    return { 
      x: Math.cos(angle) * item.orbitRadius, 
      y: Math.sin(angle) * item.orbitRadius * ellipseRatio 
    };
  }, [orbitAngles, isMobile]);

  const handleClick = (route: string, external?: boolean) => {
    if (external) {
      window.open(route, '_blank');
    } else {
      router.push(route);
    }
  };

  // Desktop view
  if (!isMobile) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Background - Same as Dashboard/Idea page */}
        <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
          <div className="bg-grid opacity-40"></div>
          
          {/* Deep Purple Orb - Top Left */}
          <div className="absolute top-[-20%] left-[-10%] w-[700px] h-[700px] bg-[#2e1065] rounded-full blur-[150px] animate-pulse-slow opacity-50 mix-blend-screen" />
        
          {/* Dark Gold/Bronze Orb - Bottom Right */}
          <div className="absolute bottom-[-20%] right-[-10%] w-[700px] h-[700px] bg-[#422006] rounded-full blur-[150px] animate-pulse-slow opacity-50 mix-blend-screen" style={{animationDelay: '2s'}} />
          
          {/* Additional cyan orb for depth */}
          <div className="absolute top-[30%] right-[-15%] w-[500px] h-[500px] bg-[#14F195]/20 rounded-full blur-[120px] opacity-30" />

          <div className="stars-container">
            {stars.map((star) => (
              <div
                key={star.id}
                className={`star star-${star.shape}`}
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
            <div className="shooting-star" style={{ top: '10%', left: '90%' }} />
            <div className="shooting-star" style={{ top: '40%', left: '5%', animationDelay: '2s' }} />
            <div className="shooting-star" style={{ top: '25%', left: '70%', animationDelay: '4s' }} />
            <div className="shooting-star" style={{ top: '70%', left: '20%', animationDelay: '6s' }} />
            <div className="shooting-star" style={{ top: '55%', left: '85%', animationDelay: '8s' }} />
            <div className="shooting-star" style={{ top: '85%', left: '45%', animationDelay: '10s' }} />
          </div>
        </div>

        <div className="pt-24 md:pt-28 px-4 sm:px-6 max-w-[1600px] mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.6 }}
            className="text-center mb-6 md:mb-8"
          >
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 tracking-tight">
              Welcome to{' '}
              <span className="font-quantico">
                <span className="text-white">Gimme</span>
                <span className="text-[#FFD700]">Idea</span>
              </span>
            </h1>
            <p className="text-gray-400 text-sm md:text-base max-w-lg mx-auto">
              Explore our innovation universe. Hover any planet to discover.
            </p>
          </motion.div>

          <div className="relative w-full h-[700px] lg:h-[800px] xl:h-[850px] 2xl:h-[900px] flex items-center justify-center">
            {ORBIT_ITEMS.map(item => (
              <div 
                key={`orbit-${item.id}`} 
                className="absolute left-1/2 top-1/2 rounded-full border border-white/[0.06] pointer-events-none"
                style={{ 
                  width: item.orbitRadius * 2, 
                  height: item.orbitRadius * 0.5,
                  transform: 'translate(-50%, -50%)'
                }} 
              />
            ))}

            <motion.div
              className="absolute cursor-pointer select-none z-50"
              style={{ left: '50%', top: '50%', x: -centerSize / 2, y: -centerSize / 2 }}
              onMouseEnter={() => handleHover('gimme-idea')}
              onMouseLeave={() => handleHover(null)}
              onClick={() => handleClick('/idea')}
              animate={{ scale: hoveredItem === 'gimme-idea' ? 1.15 : 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <div 
                className="absolute rounded-full blur-2xl transition-all duration-500"
                style={{ 
                  inset: -centerSize * 0.3,
                  background: 'radial-gradient(circle, rgba(255,215,0,0.3) 0%, transparent 70%)',
                  opacity: hoveredItem === 'gimme-idea' ? 0.8 : 0.4,
                }} 
              />
              <div 
                className="relative flex items-center justify-center"
                style={{ width: centerSize, height: centerSize }}
              >
                <Image 
                  src="/logo-gmi.png" 
                  alt="Gimme Idea" 
                  width={centerSize} 
                  height={centerSize}
                  className="object-contain drop-shadow-[0_0_20px_rgba(255,215,0,0.5)]"
                />
              </div>
              <motion.div 
                animate={{ opacity: hoveredItem === 'gimme-idea' ? 1 : 0.7 }}
                className="absolute left-1/2 -translate-x-1/2 text-center whitespace-nowrap pointer-events-none"
                style={{ top: centerSize + 8 }}
              >
                <p className="font-quantico font-bold text-white text-sm">
                  Gimme<span className="text-[#FFD700]">Idea</span>
                </p>
              </motion.div>
            </motion.div>

            {ORBIT_ITEMS.map(item => {
              const pos = getItemPosition(item);
              const isHovered = hoveredItem === item.id;
              const Icon = 'icon' in item ? item.icon : null;

              return (
                <motion.div
                  key={item.id}
                  className="absolute cursor-pointer select-none"
                  style={{
                    left: '50%',
                    top: '50%',
                    x: pos.x - item.size / 2,
                    y: pos.y - item.size / 2,
                    zIndex: isHovered ? 100 : 20,
                  }}
                  onMouseEnter={() => handleHover(item.id)}
                  onMouseLeave={() => handleHover(null)}
                  onClick={() => handleClick(item.route, item.external)}
                  animate={{ scale: isHovered ? 1.35 : 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  <div 
                    className="absolute rounded-full blur-xl transition-all duration-300"
                    style={{ 
                      inset: -item.size * 0.4,
                      background: item.glowColor,
                      opacity: isHovered ? 0.8 : 0.4,
                    }} 
                  />

                  <div 
                    className="relative rounded-full flex items-center justify-center overflow-hidden transition-all duration-300"
                    style={{
                      width: item.size, 
                      height: item.size,
                      background: item.type === 'feature' 
                        ? `radial-gradient(circle at 30% 25%, white, ${item.color} 60%)`
                        : item.gradient,
                      boxShadow: `0 0 ${isHovered ? 40 : 15}px ${item.glowColor}`,
                    }}
                  >
                    {item.type === 'feature' && Icon ? (
                      <Icon 
                        style={{ 
                          width: item.size * 0.45, 
                          height: item.size * 0.45, 
                          color: '#1a1a2e',
                        }} 
                      />
                    ) : (
                      <Image 
                        src={(item as any).logo} 
                        alt={item.name} 
                        width={item.size * 0.6} 
                        height={item.size * 0.6}
                        className="object-contain"
                      />
                    )}
                  </div>

                  <AnimatePresence>
                    {isHovered && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute left-1/2 -translate-x-1/2 bottom-full mb-4 w-56 md:w-64 p-4 rounded-2xl z-50 overflow-hidden"
                        style={{ 
                          background: 'rgba(5, 3, 15, 0.95)',
                          border: `1px solid ${item.type === 'feature' ? item.color : 'rgba(255,255,255,0.15)'}40`,
                          boxShadow: `0 0 30px ${item.glowColor}, inset 0 0 30px rgba(0,0,0,0.5)`,
                        }}
                      >
                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent animate-scan" />
                        </div>

                        <div className="relative z-10">
                          <div className="flex items-center gap-2 mb-2">
                            {item.type === 'feature' && Icon ? (
                              <div 
                                className="w-8 h-8 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: `${item.color}20` }}
                              >
                                <Icon className="w-4 h-4" style={{ color: item.color }} />
                              </div>
                            ) : (
                              <div 
                                className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden"
                                style={{ background: item.gradient }}
                              >
                                <Image 
                                  src={(item as any).logo} 
                                  alt={item.name} 
                                  width={20} 
                                  height={20}
                                  className="object-contain"
                                />
                              </div>
                            )}
                            <GlitchText className="font-bold text-white text-sm">{item.name}</GlitchText>
                          </div>
                          <p className="text-xs text-gray-400 leading-relaxed mb-3">{item.description}</p>
                          <div 
                            className="pt-2 border-t border-white/10 flex items-center justify-center gap-1.5 text-xs font-medium"
                            style={{ color: item.type === 'feature' ? item.color : '#fff' }}
                          >
                            <GlitchText>{item.external ? 'Visit Website' : 'Explore'}</GlitchText>
                            <ExternalLink className="w-3 h-3" />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Mobile view - Vertical Solar System
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background - Same as Dashboard */}
      <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
        <div className="bg-grid opacity-30"></div>
        
        {/* Deep Purple Orb */}
        <div className="absolute top-[-15%] left-[-20%] w-[400px] h-[400px] bg-[#2e1065] rounded-full blur-[100px] animate-pulse-slow opacity-50 mix-blend-screen" />
      
        {/* Dark Gold Orb */}
        <div className="absolute bottom-[-15%] right-[-20%] w-[400px] h-[400px] bg-[#422006] rounded-full blur-[100px] animate-pulse-slow opacity-50 mix-blend-screen" style={{animationDelay: '2s'}} />
        
        {/* Cyan orb */}
        <div className="absolute top-[40%] right-[-25%] w-[300px] h-[300px] bg-[#14F195]/20 rounded-full blur-[80px] opacity-30" />

        <div className="stars-container">
          {stars.map((star) => (
            <div
              key={star.id}
              className={`star star-${star.shape}`}
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
          <div className="shooting-star" style={{ top: '15%', left: '85%' }} />
          <div className="shooting-star" style={{ top: '45%', left: '5%', animationDelay: '2.5s' }} />
          <div className="shooting-star" style={{ top: '75%', left: '70%', animationDelay: '5s' }} />
        </div>
      </div>

      <div className="pt-20 px-4 pb-24">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5 }}
          className="text-center mb-6"
        >
          <h1 className="text-xl font-bold mb-1 tracking-tight">
            Welcome to{' '}
            <span className="font-quantico">
              <span className="text-white">Gimme</span>
              <span className="text-[#FFD700]">Idea</span>
            </span>
          </h1>
          <p className="text-gray-400 text-xs">
            Tap any planet to explore
          </p>
        </motion.div>

        {/* Vertical Solar System */}
        <div className="relative w-full min-h-[1200px] flex flex-col items-center">
          {/* Vertical orbit line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
          
          {/* Center - Gimme Idea */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 mb-8"
            onClick={() => handleClick('/idea')}
          >
            <div 
              className="absolute rounded-full blur-2xl"
              style={{ 
                inset: -20,
                background: 'radial-gradient(circle, rgba(255,215,0,0.4) 0%, transparent 70%)',
              }} 
            />
            <div className="relative w-20 h-20 flex items-center justify-center cursor-pointer">
              <Image 
                src="/logo-gmi.png" 
                alt="Gimme Idea" 
                width={80} 
                height={80}
                className="object-contain drop-shadow-[0_0_20px_rgba(255,215,0,0.6)]"
              />
            </div>
            <p className="text-center mt-2 font-quantico font-bold text-white text-sm">
              Gimme<span className="text-[#FFD700]">Idea</span>
            </p>
          </motion.div>

          {/* Orbiting items - alternating left/right */}
          {ORBIT_ITEMS.map((item, index) => {
            const isLeft = index % 2 === 0;
            const Icon = 'icon' in item ? item.icon : null;
            const isActive = hoveredItem === item.id;
            
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: isLeft ? -50 : 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.15, duration: 0.5 }}
                className={`relative flex items-center gap-4 mb-10 ${isLeft ? 'self-start ml-4' : 'self-end mr-4 flex-row-reverse'}`}
                onClick={() => handleClick(item.route, item.external)}
                onTouchStart={() => setHoveredItem(item.id)}
                onTouchEnd={() => setTimeout(() => setHoveredItem(null), 2000)}
              >
                {/* Connecting line to center */}
                <div 
                  className={`absolute top-1/2 h-px bg-gradient-to-r ${isLeft ? 'right-full mr-2 from-transparent to-white/20' : 'left-full ml-2 from-white/20 to-transparent'}`}
                  style={{ width: isLeft ? 'calc(50vw - 80px)' : 'calc(50vw - 80px)' }}
                />
                
                {/* Planet */}
                <motion.div 
                  className="relative cursor-pointer"
                  animate={{ scale: isActive ? 1.2 : 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  <div 
                    className="absolute rounded-full blur-xl transition-all duration-300"
                    style={{ 
                      inset: -item.size * 0.3,
                      background: item.glowColor,
                      opacity: isActive ? 0.8 : 0.5,
                    }} 
                  />
                  <div 
                    className="relative rounded-full flex items-center justify-center overflow-hidden"
                    style={{
                      width: item.size, 
                      height: item.size,
                      background: item.type === 'feature' 
                        ? `radial-gradient(circle at 30% 25%, white, ${item.color} 60%)`
                        : item.gradient,
                      boxShadow: `0 0 ${isActive ? 30 : 15}px ${item.glowColor}`,
                    }}
                  >
                    {item.type === 'feature' && Icon ? (
                      <Icon 
                        style={{ 
                          width: item.size * 0.45, 
                          height: item.size * 0.45, 
                          color: '#1a1a2e',
                        }} 
                      />
                    ) : (
                      <Image 
                        src={(item as any).logo} 
                        alt={item.name} 
                        width={item.size * 0.55} 
                        height={item.size * 0.55}
                        className="object-contain"
                      />
                    )}
                  </div>
                </motion.div>

                {/* Info card */}
                <motion.div 
                  className={`glass-panel rounded-xl p-3 max-w-[200px] ${isLeft ? '' : 'text-right'}`}
                  animate={{ 
                    scale: isActive ? 1.05 : 1,
                    borderColor: isActive ? (item.type === 'feature' ? item.color : 'rgba(255,255,255,0.3)') : 'rgba(255,255,255,0.1)'
                  }}
                  style={{ borderWidth: 1 }}
                >
                  <div className={`flex items-center gap-2 mb-1 ${isLeft ? '' : 'flex-row-reverse'}`}>
                    <span className="font-bold text-white text-sm">{item.name}</span>
                    {item.external && <ExternalLink className="w-3 h-3 text-gray-400" />}
                  </div>
                  <p className="text-[10px] text-gray-400 leading-relaxed line-clamp-2">{item.description}</p>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
