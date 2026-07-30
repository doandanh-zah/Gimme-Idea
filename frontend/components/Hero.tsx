'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  Coins,
  LayoutGrid,
  MessageSquareText,
  Plus,
  Radio,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';
import { useAppStore } from '../lib/store';

const heroMetrics = [
  { label: 'Validate', value: 'Ideas', detail: 'Votes, replies, AI critique', icon: Sparkles },
  { label: 'Find', value: 'Builders', detail: 'Feeds, profiles, network signal', icon: Users },
  { label: 'Fund', value: 'Support', detail: 'Solana-native tips and backing', icon: Coins },
] as const;

const signalRows = [
  { label: 'Problem pull', value: 'High', tone: 'text-[#14F195]' },
  { label: 'Builder interest', value: 'Rising', tone: 'text-[#FFD700]' },
  { label: 'GTM clarity', value: 'Needs edge', tone: 'text-[#C4B5FD]' },
] as const;

const proofChips = [
  { label: 'Public feedback', icon: MessageSquareText },
  { label: 'Solana builders', icon: Radio },
  { label: 'Verified actions', icon: ShieldCheck },
  { label: 'Fast iteration', icon: Zap },
] as const;

const Hero: React.FC = () => {
  const openSubmitModal = useAppStore((state) => state.openSubmitModal);
  const prefersReducedMotion = useReducedMotion();

  const reveal = prefersReducedMotion
    ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
    : {
        initial: { opacity: 0, y: 14 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.4, ease: 'easeOut' as const },
      };

  return (
    <section className="landing-hero relative isolate overflow-hidden border-b border-white/10">
      <Image
        src="/OG-img.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="landing-hero-image object-cover"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,5,5,0.94)_0%,rgba(5,5,5,0.82)_48%,rgba(5,5,5,0.56)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_26%,rgba(255,215,0,0.18),transparent_32%),linear-gradient(180deg,rgba(5,5,5,0.22),#050505_96%)]" />
      <div className="landing-grid absolute inset-0 opacity-60" />
      <div className="landing-scan absolute inset-x-0 top-0 h-px bg-[#FFD700]/50" />

      <div className="page-shell relative z-10 flex min-h-[92svh] flex-col justify-center py-28 sm:py-32 lg:py-36">
        <motion.div {...reveal} className="max-w-4xl">
          <div className="mb-5 inline-flex min-h-[32px] items-center gap-2 border border-white/10 bg-black/35 px-3 font-mono text-[11px] uppercase text-[#FFD700] backdrop-blur">
            <Radio className="h-3.5 w-3.5" aria-hidden="true" />
            Solana idea validation network
          </div>

          <h1 className="font-display text-5xl font-bold leading-none text-white sm:text-6xl lg:text-7xl">
            Gimme Idea
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-gray-200 sm:text-lg">
            A clean place to publish startup ideas, collect honest builder signal, and turn early
            comments into decisions before the product sprint gets expensive.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={() => openSubmitModal('idea')} className="btn-primary">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Submit idea
            </button>
            <Link href="/idea" className="btn-ghost bg-black/30 backdrop-blur">
              <LayoutGrid className="h-4 w-4" aria-hidden="true" />
              Browse ideas
            </Link>
          </div>
        </motion.div>

        <motion.div
          {...(prefersReducedMotion
            ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
            : {
                initial: { opacity: 0, y: 16 },
                animate: { opacity: 1, y: 0 },
                transition: { duration: 0.4, delay: 0.12, ease: 'easeOut' as const },
              })}
          className="mt-12 grid gap-3 lg:grid-cols-[minmax(0,1fr)_360px]"
        >
          <div className="grid border border-white/10 bg-black/45 backdrop-blur md:grid-cols-3 md:divide-x md:divide-white/10">
            {heroMetrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <div key={metric.label} className="min-h-[118px] border-b border-white/10 p-4 last:border-b-0 md:border-b-0">
                  <div className="mb-5 flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase text-gray-500">
                      {metric.label}
                    </span>
                    <Icon className="h-4 w-4 text-[#FFD700]" aria-hidden="true" />
                  </div>
                  <div className="font-display text-2xl font-bold text-white">{metric.value}</div>
                  <p className="mt-1 text-xs leading-5 text-gray-400">{metric.detail}</p>
                </div>
              );
            })}
          </div>

          <div className="border border-white/10 bg-black/55 backdrop-blur">
            <div className="flex min-h-[42px] items-center justify-between border-b border-white/10 px-4">
              <span className="font-mono text-[10px] uppercase text-gray-500">
                Live signal stack
              </span>
              <span className="landing-signal-dot" aria-hidden="true" />
            </div>
            <div className="divide-y divide-white/10">
              {signalRows.map((row) => (
                <div key={row.label} className="flex min-h-[44px] items-center justify-between gap-4 px-4">
                  <span className="text-sm text-gray-400">{row.label}</span>
                  <span className={`font-mono text-[11px] uppercase ${row.tone}`}>{row.value}</span>
                </div>
              ))}
            </div>
            <div className="flex min-h-[44px] items-center justify-between border-t border-white/10 px-4 text-xs text-gray-500">
              <span>Next review</span>
              <span className="font-mono text-[#FFD700]">Community queue</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          {...(prefersReducedMotion
            ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
            : {
                initial: { opacity: 0 },
                animate: { opacity: 1 },
                transition: { duration: 0.35, delay: 0.22, ease: 'easeOut' as const },
              })}
          className="mt-4 flex flex-wrap gap-2"
        >
          {proofChips.map((chip) => {
            const Icon = chip.icon;
            return (
              <span
                key={chip.label}
                className="inline-flex min-h-[32px] items-center gap-2 border border-white/10 bg-black/35 px-3 text-xs text-gray-300 backdrop-blur"
              >
                <Icon className="h-3.5 w-3.5 text-[#FFD700]" aria-hidden="true" />
                {chip.label}
              </span>
            );
          })}
        </motion.div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#050505] to-transparent" />
      <ArrowRight className="pointer-events-none absolute bottom-8 right-6 hidden h-5 w-5 text-[#FFD700]/70 sm:block" />
    </section>
  );
};

export default Hero;
