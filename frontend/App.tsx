'use client';

import React, { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import StatsDashboard from './components/StatsDashboard';
import JourneyMap from './components/JourneyMap';
import { useAppStore } from './lib/store';
import { useAuth } from './contexts/AuthContext';
import Dashboard from './components/Dashboard';
import { ProjectDetail } from './components/ProjectDetail';
import { IdeaDetail } from './components/IdeaDetail';
import { SubmissionModal } from './components/SubmissionModal';
import { Donate } from './components/Donate';
import { LoadingLightbulb } from './components/LoadingLightbulb';
import { Profile } from './components/Profile';
import { ConnectReminderModal } from './components/ConnectReminderModal';
import { ConnectWalletPopup } from './components/ConnectWalletPopup';

function App() {
  const { currentView, isNavigating, openSubmitModal, setUser } = useAppStore();
  const { user: authUser, isLoading: authLoading } = useAuth();
  const [stars, setStars] = useState<{ id: number; top: string; left: string; size: number; duration: string; opacity: number }[]>([]);

  // Sync AuthContext user with Store
  useEffect(() => {
    setUser(authUser);
  }, [authUser, setUser]);

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
            <section className="py-12 border-y border-white/5 bg-gradient-to-b from-transparent via-[#000000]/60 to-[#000000]/80">
              <div className="max-w-7xl mx-auto backdrop-blur-sm">
                 <StatsDashboard />
              </div>
            </section>

            {/* Journey Map */}
            <JourneyMap />

            {/* CTA */}
            <section className="py-32 px-6 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gold/10 blur-[100px] pointer-events-none" />
              <div className="relative z-10 max-w-3xl mx-auto space-y-8">
                <h2 className="text-5xl md:text-6xl font-display font-bold tracking-tight">
                  Ready to validate your <br /><span className="text-gold glow-text-gold">Moonshot?</span>
                </h2>
                <p className="text-xl text-gray-400">Join 12,000+ developers building the future of Solana.</p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">

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
      {(isNavigating || authLoading) && (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-lg flex items-center justify-center">
          <LoadingLightbulb text={authLoading ? "Loading..." : "Accessing Protocol..."} />
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
      <ConnectWalletPopup />
      <ConnectReminderModal />
      <SubmissionModal />
      
      {renderContent()}

      <footer className="border-t border-white/10 py-8 px-6 bg-black/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-2xl font-display font-bold">Gimme<span className="text-gold">Idea</span></div>
          <div className="text-gray-500 text-sm font-mono">
            &copy; 2025 Gimme Idea Protocol. Product of DUT Superteam University Club
          </div>
          <div className="flex gap-4 text-gray-400 text-sm">
            <a href="/terms" className="hover:text-white transition-colors">Terms</a>
            <span className="text-gray-600">•</span>
            <a href="/privacy" className="hover:text-white transition-colors">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
