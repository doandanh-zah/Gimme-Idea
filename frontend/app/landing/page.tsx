'use client';

import React from 'react';
import Hero from '@/components/Hero';
import StatsDashboard from '@/components/StatsDashboard';
import JourneyMap from '@/components/JourneyMap';
import { useAppStore } from '@/lib/store';

export default function LandingPage() {
  const openSubmitModal = useAppStore((s) => s.openSubmitModal);

  return (
    <div className="min-h-screen text-white selection:bg-[#FFD700]/30 selection:text-[#FFD700] relative overflow-hidden">
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
            <button
              type="button"
              onClick={() => openSubmitModal('idea')}
              className="btn-primary"
            >
              Submit idea
            </button>
          </div>
        </section>
      </main>

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
