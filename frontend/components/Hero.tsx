'use client';

import React from 'react';
import { ArrowUpRight, LayoutGrid, Plus } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { useRouter } from 'next/navigation';

const heroSteps = [
  {
    n: '01',
    t: 'Publish',
    d: 'Drop a raw idea — problem, solution, opportunity.',
  },
  {
    n: '02',
    t: 'Signal',
    d: 'Community votes, comments, and AI feedback stack up.',
  },
  {
    n: '03',
    t: 'Build',
    d: 'Find co-founders, pools, and builders ready to ship.',
  },
];

const metricCells = [
  { k: 'Chain', v: 'Solana' },
  { k: 'Signal', v: 'Votes' },
  { k: 'AI', v: 'Sensei' },
];

function HeroStepsPanel() {
  return (
    <>
      <div className="border border-white/10 bg-[#0a0a0a]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <span className="font-mono text-[10px] tracking-[0.16em] uppercase text-gray-500">
            How it works
          </span>
          <span className="font-mono text-[10px] text-[#FFD700]">01 — 03</span>
        </div>

        {heroSteps.map((step, i) => (
          <div
            key={step.n}
            className={`grid grid-cols-[48px_1fr] gap-3 px-4 py-5 ${
              i < 2 ? 'border-b border-white/10' : ''
            }`}
          >
            <span className="font-quantico text-xl font-bold text-[#FFD700]">{step.n}</span>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-display font-semibold text-white text-lg tracking-tight">
                  {step.t}
                </h3>
                <ArrowUpRight className="w-3.5 h-3.5 text-gray-600" />
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">{step.d}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-3 border border-white/10 border-t-0 bg-[#0a0a0a] divide-x divide-white/10">
        {metricCells.map((cell) => (
          <div key={cell.k} className="px-3 py-3 text-center">
            <div className="font-mono text-[9px] tracking-widest uppercase text-gray-600 mb-1">
              {cell.k}
            </div>
            <div className="text-sm font-semibold text-white">{cell.v}</div>
          </div>
        ))}
      </div>
    </>
  );
}

const Hero: React.FC = () => {
  const openSubmitModal = useAppStore((state) => state.openSubmitModal);
  const router = useRouter();

  return (
    <>
      <section className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden px-4 pb-28 pt-28 sm:px-6 sm:pt-32 lg:pb-16">
        <div className="max-w-6xl mx-auto w-full">
          {/* Top strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-10 sm:mb-14 pb-4 border-b border-white/10">
            <span className="ui-eyebrow">Solana mainnet</span>
            <span className="font-mono text-[11px] tracking-widest uppercase text-gray-500">
              Idea · Feedback · Build
            </span>
          </div>

          <div className="grid lg:grid-cols-12 gap-10 lg:gap-8 items-end">
            {/* Copy — 7 cols */}
            <div className="lg:col-span-7 space-y-8">
              <h1 className="font-display font-bold tracking-tight leading-[0.95] text-[clamp(2.75rem,8vw,5.5rem)]">
                <span className="block text-white">Ship faster</span>
                <span className="block text-white">
                  with{' '}
                  <span className="text-[#FFD700]">real</span>
                </span>
                <span className="block">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#9945FF] to-[#FFD700]">
                    feedback.
                  </span>
                </span>
              </h1>

              <p className="text-base sm:text-lg text-gray-400 max-w-lg leading-relaxed border-l-2 border-[#FFD700]/40 pl-4">
                Share concepts, get honest input from builders, and find what the community actually
                wants — before you write the first line of code.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <button type="button" onClick={() => openSubmitModal('idea')} className="btn-primary">
                  <Plus className="w-4 h-4" />
                  Share your idea
                </button>
                <button type="button" onClick={() => router.push('/idea')} className="btn-ghost">
                  <LayoutGrid className="w-4 h-4" />
                  Browse ideas
                </button>
              </div>
            </div>

            {/* Side panel — 5 cols: editorial index, not fake terminal */}
            <div className="hidden lg:col-span-5 lg:block">
              <HeroStepsPanel />
            </div>
          </div>
        </div>
      </section>

      <div className="px-4 pb-12 sm:px-6 lg:hidden">
        <div className="max-w-6xl mx-auto">
          <HeroStepsPanel />
        </div>
      </div>
    </>
  );
};

export default Hero;
