'use client';

import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import StatsDashboard from './components/StatsDashboard';
import JourneyMap from './components/JourneyMap';
import { useAppStore } from './lib/store';
import { useAuth } from './contexts/AuthContext';
import Dashboard from './components/Dashboard';
import { SubmissionModal } from './components/SubmissionModal';
import { LoadingLightbulb } from './components/LoadingLightbulb';
import { ConnectReminderModal } from './components/ConnectReminderModal';

const LoadingView = () => <LoadingLightbulb text="Loading..." />;

const ProjectDetail = dynamic(
  () => import('./components/ProjectDetail').then((mod) => mod.ProjectDetail),
  { ssr: false, loading: LoadingView }
);
const IdeaDetail = dynamic(
  () => import('./components/IdeaDetail').then((mod) => mod.IdeaDetail),
  { ssr: false, loading: LoadingView }
);
const Donate = dynamic(
  () => import('./components/Donate').then((mod) => mod.Donate),
  { ssr: false, loading: LoadingView }
);
const Profile = dynamic(
  () => import('./components/Profile').then((mod) => mod.Profile),
  { ssr: false, loading: LoadingView }
);

function App() {
  const { currentView, isNavigating, openSubmitModal, setUser } = useAppStore();
  const { user: authUser, isLoading: authLoading } = useAuth();

  // Sync AuthContext user with Store
  useEffect(() => {
    setUser(authUser);
  }, [authUser, setUser]);

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

            <section className="py-12 border-y border-white/10">
              <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <div className="ui-eyebrow mb-6">Network signal</div>
                <StatsDashboard />
              </div>
            </section>

            <JourneyMap />

            <section className="py-20 md:py-28 px-4 sm:px-6 border-t border-white/10">
              <div className="max-w-3xl mx-auto">
                <div className="ui-eyebrow mb-4">Next step</div>
                <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight leading-tight mb-4">
                  Ready to validate your{' '}
                  <span className="text-[#FFD700]">moonshot</span>?
                </h2>
                <p className="text-base sm:text-lg text-gray-500 mb-8 max-w-xl">
                  Where ideas meet builders. Share, discover, and grow together.
                </p>
                <button type="button" onClick={() => openSubmitModal('idea')} className="btn-primary">
                  Submit idea
                </button>
              </div>
            </section>
          </main>
        );
    }
  };

  return (
    <div className="min-h-screen text-white selection:bg-[#FFD700]/30 selection:text-[#FFD700] relative overflow-hidden">
      {(isNavigating || authLoading) && (
        <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center">
          <LoadingLightbulb text={authLoading ? 'Loading...' : 'Accessing Protocol...'} />
        </div>
      )}

      {/* Note: Navbar/modals also mounted in ClientLayout for app routes; landing SPA shell keeps its own for legacy view switch */}
      <Navbar />
      <ConnectReminderModal />
      <SubmissionModal />

      {renderContent()}

      <footer className="border-t border-white/10 py-10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="font-quantico text-xl font-bold">
              Gimme<span className="text-[#FFD700]">Idea</span>
            </div>
            <div className="mt-2 text-gray-600 text-xs font-mono uppercase tracking-wider">
              © 2025 · DUT Superteam University Club
            </div>
          </div>
          <div className="flex gap-6 text-xs font-mono uppercase tracking-wider text-gray-500">
            <a href="/terms" className="hover:text-[#FFD700] transition-colors">
              Terms
            </a>
            <a href="/privacy" className="hover:text-[#FFD700] transition-colors">
              Privacy
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
