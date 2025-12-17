'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, Rss, Rocket, ExternalLink, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import ConstellationBackground from './ConstellationBackground';

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
    name: 'DSUC',
    description: 'DUT Superteam University Club - The first Solana blockchain club of Danang University',
    logo: '/dsuc.png',
    gradient: 'linear-gradient(135deg, #3366ff 0%, #00ccff 60%, #99ff66 100%)',
    route: 'https://dsuc.fun',
    external: true,
  },
  {
    id: 'superteamvn',
    name: 'Superteam VN',
    description: 'Talent Layer of Solana in Vietnam. Empowering builders across the nation.',
    logo: '/superteamvn.png',
    gradient: 'linear-gradient(135deg, #EF4444 0%, #FACC15 100%)',
    route: 'https://vn.superteam.fun',
    external: true,
  },
  {
    id: 'solana',
    name: 'Solana',
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
      {/* Constellation Background */}
      <ConstellationBackground opacity={0.3} />

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
          
          <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-3 gap-6'}`}>
            {PARTNERS.map((partner, index) => {
              const isHovered = hoveredItem === partner.id;
              
              return (
                <motion.div
                  key={partner.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="group relative cursor-pointer"
                  onMouseEnter={() => setHoveredItem(partner.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  onClick={() => handleClick(partner.route, partner.external)}
                >
                  <div 
                    className="relative p-5 rounded-xl border border-white/10 bg-white/[0.02] backdrop-blur-sm transition-all duration-300"
                    style={{
                      borderColor: isHovered ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
                    }}
                  >
                    <div className="flex items-center gap-4">
                      {/* Logo */}
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
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
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-white text-sm truncate">{partner.name}</h3>
                          <ExternalLink className="w-3 h-3 text-gray-500 flex-shrink-0" />
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2">{partner.description}</p>
                      </div>
                    </div>
                  </div>
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
