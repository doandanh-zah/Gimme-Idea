
import React, { useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import StatsDashboard from './components/StatsDashboard';
import JourneyMap from './components/JourneyMap';
import { ProjectCard } from './components/ProjectCard';
import { PROJECTS } from './constants';
import { Shield, Star, Zap } from 'lucide-react';
import { useAppStore } from './lib/store';
import Dashboard from './components/Dashboard';
import { ProjectDetail } from './components/ProjectDetail';
import { UploadProject } from './components/UploadProject';
import { WalletModal } from './components/WalletModal';
import { LoadingLightbulb } from './components/LoadingLightbulb';
import { Profile } from './components/Profile';

function App() {
  const { currentView, setView, openWalletModal, isNavigating } = useAppStore();

  // Create Stars
  const stars = Array.from({ length: 80 }).map((_, i) => ({
    id: i,
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    size: `${Math.random() * 2 + 1}px`,
    duration: `${Math.random() * 3 + 2}s`,
    opacity: Math.random() * 0.7 + 0.3
  }));

  // Main Layout Content based on view
  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'project-detail':
        return <ProjectDetail />;
      case 'upload':
        return <UploadProject />;
      case 'profile':
        return <Profile />;
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
                  <button onClick={() => setView('dashboard')} className="text-gold font-mono text-sm hover:underline mt-4 md:mt-0">
                    View all projects &rarr;
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {PROJECTS.slice(0, 3).map(project => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              </div>
            </section>

            {/* Features / Why Us */}
            <section className="py-24 px-6 bg-gradient-to-b from-transparent to-purple-950/40">
              <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-12">
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-black/40 rounded-xl flex items-center justify-center border border-white/10 text-gold shadow-[0_0_15px_rgba(255,215,0,0.2)]">
                    <Shield className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-display font-bold">Anonymous Feedback</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    Give brutal, honest feedback without risking your reputation. Zero-knowledge proof identity verification ensures quality without doxxing.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-black/40 rounded-xl flex items-center justify-center border border-white/10 text-[#9945FF] shadow-[0_0_15px_rgba(153,69,255,0.3)]">
                    <Star className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-display font-bold">Earn While You Audit</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    High-quality feedback earns Reputation Points (RP). Convert RP to USDC or governance tokens in partner DAOs.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-black/40 rounded-xl flex items-center justify-center border border-white/10 text-[#14F195] shadow-[0_0_15px_rgba(20,241,149,0.2)]">
                    <Zap className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-display font-bold">Direct GitHub Sync</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    Automatically turn feedback into GitHub Issues. Integrate with GitLab and Linear for seamless workflow management.
                  </p>
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
                  <button onClick={() => setView('upload')} className="px-8 py-4 bg-[#9945FF] text-white font-bold rounded-full hover:bg-[#7c3aed] transition-colors shadow-lg shadow-purple-500/20">
                    Submit Project
                  </button>
                  <button 
                    onClick={() => openWalletModal()}
                    className="px-8 py-4 bg-black/50 backdrop-blur-md border border-white/20 rounded-full font-bold hover:bg-white/10 transition-colors"
                  >
                    Connect Wallet
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
      {/* Global Loading Overlay */}
      {isNavigating && (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-lg flex items-center justify-center">
          <LoadingLightbulb text="Accessing Protocol..." />
        </div>
      )}

      {/* Global Dynamic Background - Fixed Animation Classes */}
      <div className="fixed inset-0 z-[-20]">
          <div className="bg-grid opacity-40"></div>
          
          <div className="bg-orb w-[800px] h-[800px] bg-[#9945FF] top-[-300px] left-[-200px] animate-orb-1"></div>
          <div className="bg-orb w-[700px] h-[700px] bg-[#FFD700] bottom-[-200px] right-[-200px] animate-orb-2"></div>
          <div className="bg-orb w-[400px] h-[400px] bg-[#14F195] top-[40%] left-[20%] animate-orb-3 opacity-30"></div>
          <div className="bg-orb w-[500px] h-[500px] bg-[#9945FF] bottom-[10%] left-[10%] animate-orb-1 opacity-40"></div>
      </div>

      <div className="stars">
        {stars.map(star => (
            <div 
                key={star.id}
                className="star"
                style={{
                    top: star.top,
                    left: star.left,
                    width: star.size,
                    height: star.size,
                    '--duration': star.duration,
                    '--opacity': star.opacity
                } as React.CSSProperties}
            />
        ))}
        <div className="shooting-star" style={{ top: '20%', left: '20%' }}></div>
        <div className="shooting-star" style={{ top: '60%', left: '80%', animationDelay: '2s' }}></div>
        <div className="shooting-star" style={{ top: '40%', left: '60%', animationDelay: '4s' }}></div>
        <div className="shooting-star" style={{ top: '15%', left: '50%', animationDelay: '7s' }}></div>
      </div>

      <Navbar />
      <WalletModal />
      
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
