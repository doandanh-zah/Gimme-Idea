'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, Rss, Rocket, ExternalLink, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

// Constellation items configuration
const FEATURES = [
  {
    id: 'ideas',
    name: 'Ideas',
    description: 'Discover and share innovative concepts. The heart of our innovation ecosystem.',
    icon: Lightbulb,
    color: '#FFD700',
    route: '/idea',
    external: false,
  },
  {
    id: 'feeds',
    name: 'Feeds',
    description: 'Curated collections of ideas. Follow topics that interest you.',
    icon: Rss,
    color: '#14F195',
    route: '/feeds',
    external: false,
  },
  {
    id: 'hackathons',
    name: 'Hackathons',
    description: 'Build together, compete together. Join exciting blockchain hackathons.',
    icon: Rocket,
    color: '#FF6B6B',
    route: '/hackathons',
    external: false,
  },
];

const PARTNERS = [
  {
    id: 'dsuc',
    name: 'DUT Superteam University Club',
    shortName: 'DSUC',
    description: 'The first Solana blockchain club of Danang University of Science and Technology. Building the next generation of Web3 developers.',
    logo: '/dsuc.png',
    gradient: 'linear-gradient(135deg, #3366ff 0%, #00ccff 60%, #99ff66 100%)',
    route: 'https://dsuc.fun',
    external: true,
  },
  {
    id: 'superteamvn',
    name: 'Superteam Vietnam',
    shortName: 'Superteam VN',
    description: 'Talent Layer of Solana in Vietnam. Empowering builders across the nation.',
    logo: '/superteamvn.png',
    gradient: 'linear-gradient(135deg, #EF4444 0%, #FACC15 100%)',
    route: 'https://vn.superteam.fun',
    external: true,
  },
  {
    id: 'solana',
    name: 'Solana Foundation',
    shortName: 'Solana',
    description: 'A decentralized blockchain built for scale. Fast, secure, and energy-efficient.',
    logo: '/SOLANA.png',
    gradient: 'linear-gradient(135deg, #9945FF 0%, #14F195 50%, #00D1FF 100%)',
    route: 'https://solana.com',
    external: true,
  },
];

export default function HomeFeed() {
  const router = useRouter();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleClick = (route: string, external?: boolean) => {
    if (external) {
      window.open(route, '_blank');
    } else {
      router.push(route);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className={`${isMobile ? 'pt-20 px-4 pb-24' : 'pt-24 md:pt-28 px-4 sm:px-6'} max-w-6xl mx-auto`}>
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5 }}
          className="text-center mb-12 md:mb-16"
        >
          {/* Logo */}
          <motion.div 
            className="inline-flex items-center justify-center mb-6 cursor-pointer"
            whileHover={{ scale: 1.05 }}
            onClick={() => handleClick('/idea')}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-[#FFD700]/20 rounded-full blur-2xl scale-150" />
              <Image 
                src="/logo-gmi.png" 
                alt="Gimme Idea" 
                width={isMobile ? 80 : 100}
                height={isMobile ? 80 : 100}
                className="relative object-contain drop-shadow-[0_0_30px_rgba(255,215,0,0.4)]"
              />
            </div>
          </motion.div>
          
          <h1 className={`${isMobile ? 'text-2xl' : 'text-4xl md:text-5xl'} font-bold mb-4 tracking-tight`}>
            <span className="font-quantico">
              <span className="text-white">Gimme</span>
              <span className="text-[#FFD700]">Idea</span>
            </span>
          </h1>
          <p className={`text-gray-400 ${isMobile ? 'text-sm' : 'text-base md:text-lg'} max-w-xl mx-auto`}>
            Where innovative ideas meet the Solana ecosystem
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5, delay: 0.2 }}
          className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-3 gap-6'} mb-12 md:mb-16`}
        >
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon;
            const isHovered = hoveredItem === feature.id;
            
            return (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="group relative cursor-pointer"
                onMouseEnter={() => setHoveredItem(feature.id)}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => handleClick(feature.route, feature.external)}
              >
                <div 
                  className="relative p-6 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-sm transition-all duration-300 h-full"
                  style={{
                    borderColor: isHovered ? `${feature.color}40` : 'rgba(255,255,255,0.1)',
                    boxShadow: isHovered ? `0 0 40px ${feature.color}20` : 'none',
                  }}
                >
                  {/* Glow effect */}
                  <div 
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: `radial-gradient(circle at 50% 0%, ${feature.color}10, transparent 70%)` }}
                  />
                  
                  <div className="relative z-10">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
                      style={{ backgroundColor: `${feature.color}15` }}
                    >
                      <Icon className="w-6 h-6" style={{ color: feature.color }} />
                    </div>
                    
                    <h3 className="text-lg font-bold text-white mb-2">{feature.name}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed mb-4">{feature.description}</p>
                    
                    <div 
                      className="flex items-center gap-2 text-sm font-medium transition-all duration-300"
                      style={{ color: feature.color }}
                    >
                      <span>Explore</span>
                      <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Partners Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold text-white/80 mb-6 text-center`}>
            Powered by Our Partners
          </h2>
          
          <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-3 gap-6'}`}>
            {PARTNERS.map((partner, index) => {
              const isHovered = hoveredItem === partner.id;
              
              return (
                <motion.div
                  key={partner.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="group relative"
                  onMouseEnter={() => setHoveredItem(partner.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  {/* Horizontal Card - Logo + Name */}
                  <div 
                    className="relative px-4 py-3 rounded-xl border border-white/10 bg-white/[0.02] backdrop-blur-sm transition-all duration-300 cursor-pointer flex items-center gap-3"
                    style={{
                      borderColor: isHovered ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
                    }}
                    onClick={() => handleClick(partner.route, partner.external)}
                  >
                    {/* Logo */}
                    <div 
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:scale-110 flex-shrink-0"
                      style={{ background: partner.gradient }}
                    >
                      <Image 
                        src={partner.logo} 
                        alt={partner.name} 
                        width={28}
                        height={28}
                        className="object-contain"
                      />
                    </div>
                    
                    {/* Name */}
                    <h3 className="font-bold text-white text-xs sm:text-sm">{partner.shortName}</h3>
                  </div>

                  {/* Hover Popup with Strong Glitch Effect */}
                  <AnimatePresence>
                    {isHovered && (
                      <>
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          className={
                            isMobile 
                              ? "absolute z-50 left-0 right-0 top-full mt-2 w-full" 
                              : "absolute z-50 left-1/2 -translate-x-1/2 bottom-full mb-3 w-80 pointer-events-none"
                          }
                        >
                        <motion.div 
                          className="relative p-5 rounded-xl border border-[#FFD700]/30 bg-[#0a0a10]/98 backdrop-blur-xl shadow-2xl overflow-hidden"
                          animate={{
                            boxShadow: [
                              '0 0 20px rgba(255, 215, 0, 0.2), 0 0 40px rgba(153, 69, 255, 0.1)',
                              '0 0 30px rgba(255, 215, 0, 0.3), 0 0 50px rgba(153, 69, 255, 0.2)',
                              '0 0 20px rgba(255, 215, 0, 0.2), 0 0 40px rgba(153, 69, 255, 0.1)',
                            ],
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          {/* Animated scanline */}
                          <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,215,0,0.02)_2px,rgba(255,215,0,0.02)_4px)]" />
                            <motion.div 
                              className="absolute left-0 right-0 h-20 bg-gradient-to-b from-[#FFD700]/10 to-transparent"
                              animate={{ top: ['-80px', '100%'] }}
                              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                            />
                          </div>
                          
                          {/* Glitch border effects - Yellow & Purple */}
                          <div className="absolute inset-0 rounded-xl">
                            <motion.div 
                              className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent"
                              animate={{ opacity: [0.5, 1, 0.5], x: [-5, 5, -5] }}
                              transition={{ duration: 0.5, repeat: Infinity }}
                            />
                            <motion.div 
                              className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#9945FF] to-transparent"
                              animate={{ opacity: [0.5, 1, 0.5], x: [5, -5, 5] }}
                              transition={{ duration: 0.5, repeat: Infinity, delay: 0.1 }}
                            />
                            <div className="absolute top-0 bottom-0 left-0 w-[2px] bg-gradient-to-b from-[#FFD700] via-transparent to-[#9945FF] opacity-50" />
                            <div className="absolute top-0 bottom-0 right-0 w-[2px] bg-gradient-to-b from-[#9945FF] via-transparent to-[#FFD700] opacity-50" />
                          </div>
                          
                          {/* Content */}
                          <div className="relative z-10">
                            {/* Header with logo */}
                            <div className="flex items-center gap-3 mb-4">
                              <motion.div 
                                className="w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 ring-2 ring-[#FFD700]/30"
                                style={{ background: partner.gradient }}
                                animate={{
                                  boxShadow: [
                                    '0 0 10px rgba(255, 215, 0, 0.3)',
                                    '0 0 20px rgba(255, 215, 0, 0.5)',
                                    '0 0 10px rgba(255, 215, 0, 0.3)',
                                  ],
                                }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                              >
                                <Image 
                                  src={partner.logo} 
                                  alt={partner.name} 
                                  width={28}
                                  height={28}
                                  className="object-contain"
                                />
                              </motion.div>
                              <div className="flex-1 min-w-0">
                                {/* Glitch Title with Framer Motion */}
                                <motion.h4 
                                  className="font-bold text-base text-[#FFD700]"
                                  animate={{
                                    textShadow: [
                                      '0 0 10px rgba(255, 215, 0, 0.8)',
                                      '-2px 0 rgba(153, 69, 255, 0.8), 2px 0 rgba(255, 215, 0, 0.8)',
                                      '2px 0 rgba(153, 69, 255, 0.8), -2px 0 rgba(255, 215, 0, 0.8)',
                                      '0 0 10px rgba(255, 215, 0, 0.8)',
                                    ],
                                  }}
                                  transition={{ duration: 0.3, repeat: Infinity }}
                                >
                                  {partner.name}
                                </motion.h4>
                                <div className="flex items-center gap-1.5 text-[11px] text-[#FFD700]/70 mt-0.5">
                                  <ExternalLink className="w-3 h-3" />
                                  <motion.span
                                    animate={{ opacity: [0.7, 1, 0.7] }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                  >
                                    {partner.route.replace('https://', '')}
                                  </motion.span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Description */}
                            <motion.p 
                              className="text-sm text-gray-300 leading-relaxed mb-4"
                              animate={{
                                x: [0, -1, 1, 0],
                                opacity: [1, 0.95, 1],
                              }}
                              transition={{ duration: 3, repeat: Infinity }}
                            >
                              {partner.description}
                            </motion.p>
                            
                            {/* Terminal style footer */}
                            <div className="pt-3 border-t border-[#FFD700]/20">
                              <div className="flex items-center gap-2 text-xs">
                                <motion.span 
                                  className="text-[#FFD700] font-mono font-bold"
                                  animate={{ opacity: [1, 0.3, 1] }}
                                  transition={{ duration: 0.8, repeat: Infinity }}
                                >
                                  {'>'}
                                </motion.span>
                                <motion.span 
                                  className="text-[#FFD700]/70 font-mono tracking-wider"
                                  animate={{ 
                                    opacity: [0.7, 1, 0.7],
                                    textShadow: [
                                      'none',
                                      '0 0 5px rgba(255, 215, 0, 0.5)',
                                      'none',
                                    ],
                                  }}
                                  transition={{ duration: 1.5, repeat: Infinity }}
                                >
                                  CLICK_TO_CONNECT
                                </motion.span>
                                <motion.span 
                                  className="text-[#9945FF] font-mono ml-auto"
                                  animate={{ opacity: [1, 0, 1] }}
                                  transition={{ duration: 1, repeat: Infinity }}
                                >
                                  █
                                </motion.span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Arrow pointing down - hide on mobile */}
                          {!isMobile && (
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#0a0a10] border-r-2 border-b-2 border-[#FFD700]/30 transform rotate-45" />
                          )}
                        </motion.div>
                      </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ duration: 0.5, delay: 0.7 }}
          className="text-center mt-12 md:mt-16 pb-8"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleClick('/idea')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black font-semibold text-sm transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,215,0,0.4)]"
          >
            Start Exploring
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
