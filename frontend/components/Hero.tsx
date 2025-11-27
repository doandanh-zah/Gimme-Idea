
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Terminal, Code, Cpu, LayoutGrid, Plus } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { useRouter } from 'next/navigation';

const Hero: React.FC = () => {
  const { openSubmitModal } = useAppStore();
  const router = useRouter();

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
      
      {/* Dynamic Background Elements (Glows) - Darker/Deeper colors as requested */}
      <div className="absolute inset-0 bg-gradient-radial from-purple-900/5 to-transparent opacity-10 pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        {/* Deep Purple Orb */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#2e1065] rounded-full blur-[120px] animate-pulse-slow opacity-40 mix-blend-screen" />
        
        {/* Dark Gold/Bronze Orb */}
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-[#422006] rounded-full blur-[120px] animate-pulse-slow opacity-40 mix-blend-screen" style={{animationDelay: '2s'}} />
      </div>

      {/* Content Container */}
      <div className="max-w-7xl mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-12 items-center">
        
        {/* Left Column: Text */}
        <div className="text-left space-y-8">
          <motion.div
             initial={{ opacity: 0, x: -50 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-6 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-xs font-mono text-green-400 uppercase tracking-wide">Solana Devnet Beta Compatible</span>
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-display font-bold leading-tight mb-6">
              Ship faster with <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#9945FF] to-[#ffd700]">Real Feedback.</span>
            </h1>
            
            <p className="text-lg text-gray-400 max-w-xl leading-relaxed">
              Don't build in a silo. Validate your <span className="text-gold font-mono">Solana</span> protocols with a community of builders before you deploy capital. 
              Earn reputation and USDC for quality code reviews.
            </p>

            <div className="flex flex-wrap gap-4 mt-8">
              <button
                onClick={() => openSubmitModal('idea')}
                className="px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-gold transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Share Your Idea
              </button>
              <button
                onClick={() => router.push('/idea')}
                className="px-8 py-4 bg-transparent border border-white/20 text-white font-bold rounded-full hover:border-white hover:bg-white/5 transition-all duration-300 flex items-center gap-2"
              >
                <LayoutGrid className="w-5 h-5" />
                Explore Ideas
              </button>
            </div>
          </motion.div>


        </div>

        {/* Right Column: Visuals */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative hidden lg:block"
        >
          {/* Abstract Code Card */}
          <div className="absolute top-0 right-0 w-72 glass-panel p-4 rounded-xl rotate-6 animate-float z-20">
            <div className="flex items-center gap-2 mb-3">
              <Code className="w-4 h-4 text-gold" />
              <span className="text-xs text-gray-400 font-mono">Smart Contract Audit</span>
            </div>
            <div className="space-y-2">
              <div className="h-2 bg-white/10 rounded w-3/4"></div>
              <div className="h-2 bg-white/10 rounded w-full"></div>
              <div className="h-2 bg-white/10 rounded w-5/6"></div>
              <div className="h-2 bg-red-500/20 rounded w-1/2 mt-2"></div>
            </div>
            <div className="mt-4 flex justify-end">
               <span className="text-[10px] font-mono bg-gold/20 text-gold px-2 py-1 rounded">Critical Bug Found</span>
            </div>
          </div>

          {/* Terminal Window */}
          <div className="bg-[#0f0f0f] border border-white/10 rounded-xl overflow-hidden shadow-2xl max-w-md mx-auto relative z-10">
            <div className="bg-[#1a1a1a] px-4 py-2 flex items-center gap-2 border-b border-white/5">
              <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
              <div className="ml-auto text-xs text-gray-600 font-mono">bash — 80x24</div>
            </div>
            <div className="p-6 font-mono text-sm text-gray-300 space-y-2">
              <p><span className="text-green-400">➜</span> <span className="text-blue-400">~</span> gimme-idea init</p>
              <p className="text-gray-500">Initializing project environment...</p>
              <p className="text-gray-500">Connecting to Solana Devnet...</p>
              <p><span className="text-green-400">✔</span> Wallet connected: <span className="text-gold">8xF3...92a</span></p>
              <p><span className="text-green-400">✔</span> Fetching community feedback...</p>
              <div className="p-3 bg-white/5 rounded border-l-2 border-gold mt-4">
                <p className="text-xs text-gray-400 mb-1">@rust_wizard says:</p>
                <p className="text-white">"Consider using PDA seeds for better account derivation here. Saves 0.002 SOL per user."</p>
              </div>
              <p className="animate-pulse">_</p>
            </div>
          </div>
          
          {/* Floating Tech Icons */}
          <div className="absolute -bottom-10 -left-10 bg-black p-4 rounded-2xl border border-white/10 animate-float" style={{animationDelay: '1s'}}>
            <Cpu className="w-8 h-8 text-purple-500" />
          </div>

        </motion.div>
      </div>
    </section>
  );
};

export default Hero;