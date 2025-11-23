
'use client';

import React, { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import StatsDashboard from './components/StatsDashboard';
import JourneyMap from './components/JourneyMap';
import { ProjectCard } from './components/ProjectCard';
import { PROJECTS } from './constants';
import { Shield, Star, Zap, Plus, LayoutGrid } from 'lucide-react';
import { useAppStore } from './lib/store';
import Dashboard from './components/Dashboard';
import { ProjectDetail } from './components/ProjectDetail';
import { IdeaDetail } from './components/IdeaDetail';
import { WalletModal } from './components/WalletModal';
import { SubmissionModal } from './components/SubmissionModal';
import { Donate } from './components/Donate';
import { LoadingLightbulb } from './components/LoadingLightbulb';
import { Profile } from './components/Profile';
import { ConnectReminderModal } from './components/ConnectReminderModal';

function App() {
  const { currentView, setView, openWalletModal, isNavigating, openSubmitModal } = useAppStore();
  const [stars, setStars] = useState<{ id: number; top: string; left: string; size: number; duration: string; opacity: number }[]>([]);

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

  const renderContent = () => {
    switch (currentView) {
      case 'projects-dashboard':
        return <Dashboard mode="project" />;
      case 'ideas-dashboard':
        return <Dashboard mode="idea" />;
      case 'project-detail':
        return <ProjectDetail />;
      case 'idea-detail':
        return <IdeaDetail />;
      case 'profile':
        return <Profile />;
      case 'donate':
        return <Donate />;
      case 'landing':
      default:
        return (
          <main>
            <Hero />
            
            {/* Stats Section */}
            <section className="py-12 border-y border-white/5 bg-black/40 backdrop-blur-sm">
              <div className="max-w-7xl mx-auto">
                 <StatsDashboard />
              </div>
            </section>

            {/* Journey Map */}
            <JourneyMap />

            {/* Featured Projects */}
            <section className="py-24 px-6 relative">
              <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-end mb-12">
                  <div>
                    <h2 className="text-4xl font-display font-bold mb-2">Trending <span className="text-[#9945FF] glow-text">Builds</span></h2>
                    <p className="text-gray-400">Projects seeking your technical expertise right now.</p>
                  </div>
                  <button onClick={() => setView('projects-dashboard')} className="text-gold font-mono text-sm hover:underline mt-4 md:mt-0">
                    View all projects &rarr;
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {PROJECTS.filter(p => p.type === 'project').slice(0, 3).map(project => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              </div>
            </section>

            {/* CTA */}
            <section className="py-32 px-6 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gold/10 blur-[100px] pointer-events-none" />
              <div className="relative z-10 max-w-3xl mx-auto space-y-8">
                <h2 className="text-5xl md:text-6xl font-display font-bold tracking-tight">
                  Ready to validate your <br /><span className="text-gold glow-text-gold">Moonshot?</span>
                </h2>
                <p className="text-xl text-gray-400">Join 12,000+ developers building the future of Solana.</p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <button onClick={() => openSubmitModal('project')} className="px-8 py-4 bg-[#9945FF] text-white font-bold rounded-full hover:bg-[#7c3aed] transition-colors shadow-lg shadow-purple-500/20">
                    Launch Project
                  </button>
                  <button 
                    onClick={() => openSubmitModal('idea')}
                    className="px-8 py-4 bg-transparent border border-white/20 text-white rounded-full font-bold hover:bg-white/10 transition-colors"
                  >
                    Submit Idea
                  </button>
                </div>
              </div>
            </section>
          </main>
        );
    }
  };

  return (
    <div className="min-h-screen text-white selection:bg-gold/30 selection:text-gold relative overflow-hidden">
      {isNavigating && (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-lg flex items-center justify-center">
          <LoadingLightbulb text="Accessing Protocol..." />
        </div>
      )}

      {/* Global Dynamic Background & Stars */}
      <div className="fixed inset-0 z-[-20]">
          <div className="bg-grid opacity-40"></div>
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
          </div>
      </div>

      <Navbar />
      <WalletModal />
      <ConnectReminderModal />
      <SubmissionModal />
      
      {renderContent()}

      <footer className="border-t border-white/10 py-12 px-6 bg-black/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-2xl font-display font-bold">Gimme<span className="text-gold">Idea</span></div>
          <div className="text-gray-500 text-sm font-mono">
            &copy; 2025 Gimme Idea Protocol. Product of DUT Superteam University Club
          </div>
          <div className="flex gap-6 text-gray-400">
            <a href="#" className="hover:text-white transition-colors">Twitter</a>
            <a href="#" className="hover:text-white transition-colors">Discord</a>
            <a href="#" className="hover:text-white transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
