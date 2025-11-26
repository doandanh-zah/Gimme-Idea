
'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Code, Zap, Shield, Users, Terminal } from 'lucide-react';
import Navbar from '../components/Navbar';

export default function LandingPage() {
  return (
    <main className="min-h-screen relative overflow-hidden">
      <Navbar />
      
      {/* Background Gradients - Adjusted to be diagonal, further apart, and fainter */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/15 rounded-full blur-[140px] -z-10" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-accent/10 rounded-full blur-[140px] -z-10" />

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm"
        >
          <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
          <span className="text-xs font-mono text-success font-bold tracking-wide">LIVE ON SOLANA MAINNET</span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold tracking-tight leading-tight mb-8 max-w-4xl"
        >
          Ship faster with <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-gray-500">Actionable Feedback.</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg text-gray-400 max-w-2xl mb-10 leading-relaxed"
        >
          The first decentralized feedback layer for Solana builders. Validate ideas, 
          audit code snippets, and earn <span className="text-accent font-mono">USDC</span> for constructive criticism.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap gap-4 justify-center"
        >
          <Link href="/dashboard" className="px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-accent hover:scale-105 transition-all flex items-center gap-2">
            Launch App <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/docs" className="px-8 py-4 bg-white/5 border border-white/10 text-white font-bold rounded-full hover:bg-white/10 transition-all flex items-center gap-2">
            <Terminal className="w-4 h-4" />
            Read Docs
          </Link>
        </motion.div>

        {/* Stats */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16 mt-24 border-t border-white/5 pt-12"
        >
          {[
            { label: 'Active Projects', value: '2.3K' },
            { label: 'Feedback Loop', value: '18K+' },
            { label: 'USDC Rewarded', value: '$420K' },
            { label: 'Builders', value: '12K' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <h3 className="text-3xl font-bold mb-1">{stat.value}</h3>
              <p className="text-xs font-mono text-gray-500 uppercase tracking-widest">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 bg-surface/50 border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Shield className="w-6 h-6 text-accent" />,
                title: "Anon Feedback",
                desc: "Give brutal, honest feedback using ZK-proofs to protect your identity while building reputation."
              },
              {
                icon: <Code className="w-6 h-6 text-primary" />,
                title: "Code Audits",
                desc: "Share snippets securely. Get line-by-line optimization suggestions from senior Rust devs."
              },
              {
                icon: <Users className="w-6 h-6 text-success" />,
                title: "DAO Governance",
                desc: "Top contributors get governance rights to shape the future of the platform protocol."
              }
            ].map((feature, i) => (
              <div key={i} className="p-8 rounded-2xl bg-[#0A0A0A] border border-white/5 hover:border-accent/20 transition-all hover:-translate-y-1 group">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
