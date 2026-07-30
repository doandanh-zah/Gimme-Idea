'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  ExternalLink,
  Lightbulb,
  MessageCircle,
  Radio,
  Rss,
  ShieldCheck,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';

const FEATURES = [
  {
    id: 'ideas',
    index: '01',
    name: 'Ideas',
    description: 'Publish raw concepts, collect votes, and pressure-test demand.',
    icon: Lightbulb,
    route: '/idea',
    cta: 'Browse ideas',
    signal: 'Open validation',
  },
  {
    id: 'feeds',
    index: '02',
    name: 'GmiFeeds',
    description: 'Follow curated collections across markets, hackathons, and builder needs.',
    icon: Rss,
    route: '/feeds',
    cta: 'Open feeds',
    signal: 'Topic radar',
  },
  {
    id: 'gtm',
    index: '03',
    name: 'GTM Assistant',
    description: 'Turn early comments into sharper customer, wedge, and launch hypotheses.',
    icon: MessageCircle,
    route: '/idea',
    cta: 'Start GTM',
    signal: 'AI critique',
  },
] as const;

const PARTNERS = [
  {
    id: 'dsuc',
    name: 'DUT Superteam University Club',
    shortName: 'DSUC',
    description:
      'The first Solana blockchain club of Danang University of Science and Technology.',
    logo: '/dsuc.png',
    route: 'https://dsuc.fun',
    hasFullLogo: true,
  },
  {
    id: 'superteamvn',
    name: 'Superteam Vietnam',
    shortName: 'Superteam VN',
    description: 'Talent layer of Solana in Vietnam. Empowering builders nationwide.',
    logo: '/superteamvn.png',
    route: 'https://vn.superteam.fun',
    hasFullLogo: true,
  },
  {
    id: 'solana',
    name: 'Solana Foundation',
    shortName: 'Solana',
    description: 'A decentralized blockchain built for scale, speed, and composability.',
    logo: '/SOLANA.png',
    route: 'https://solana.com',
    hasFullLogo: false,
  },
] as const;

const QUICK_LINKS = [
  { name: 'Leaderboard', route: '/leaderboard', icon: Trophy },
  { name: 'Agents', route: '/agents', icon: Users },
  { name: 'Docs', route: '/docs', icon: ArrowUpRight },
] as const;

const HOME_METRICS = [
  { label: 'Signal loops', value: '3', detail: 'Idea, feed, GTM', icon: Activity },
  { label: 'Builder paths', value: '5', detail: 'From draft to mainnet', icon: Zap },
  { label: 'Network layer', value: 'VN', detail: 'DSUC + Superteam', icon: Radio },
] as const;

const WORKFLOW = [
  {
    title: 'Scan demand',
    body: 'Move through public ideas, comments, and feed clusters before picking what to build.',
  },
  {
    title: 'Post the wedge',
    body: 'Share the raw version early enough for builders to challenge the problem and scope.',
  },
  {
    title: 'Collect proof',
    body: 'Use votes, replies, and mentor feedback as the first proof layer for the next sprint.',
  },
] as const;

export default function HomeFeed() {
  const openSubmitModal = useAppStore((s) => s.openSubmitModal);
  const prefersReducedMotion = useReducedMotion();

  const fade = (delay = 0) =>
    prefersReducedMotion
      ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
      : {
          initial: { opacity: 0, y: 12 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.35, delay, ease: 'easeOut' as const },
        };

  return (
    <div className="relative min-h-screen">
      <div className="page-shell page-top pb-28 md:pb-16">
        <motion.header {...fade(0)} className="mb-12 border-b border-white/10 pb-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="ui-eyebrow">Home</span>
            <span className="font-mono text-[11px] uppercase text-gray-500">
              Idea / signal / build
            </span>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div className="max-w-3xl">
              <h1 className="font-display text-[clamp(2.25rem,6vw,4rem)] font-bold leading-[1.02] text-white">
                Builder workspace for ideas with real signal.
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-gray-400 sm:text-base">
                Track fresh concepts, curated feeds, partner networks, and GTM critique from one
                consistent workspace before committing a sprint.
              </p>
              <div className="mt-7 flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={() => openSubmitModal('idea')}
                  className="btn-primary"
                >
                  Submit idea
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
                <Link href="/idea" className="btn-ghost">
                  Explore feed
                </Link>
              </div>
            </div>

            <div className="border border-white/10 bg-[#0a0a0a]">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <span className="font-mono text-[10px] uppercase text-gray-500">
                  Today signal
                </span>
                <span className="font-mono text-[10px] text-[#14F195]">Live</span>
              </div>
              <div className="divide-y divide-white/10">
                {HOME_METRICS.map((metric) => {
                  const Icon = metric.icon;
                  return (
                    <div
                      key={metric.label}
                      className="grid min-h-[72px] grid-cols-[44px_1fr_auto] items-center gap-3 px-4 py-3"
                    >
                      <span className="flex h-10 w-10 items-center justify-center border border-white/10 bg-white/[0.03] text-[#FFD700]">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <div className="font-mono text-[10px] uppercase text-gray-500">
                          {metric.label}
                        </div>
                        <div className="mt-1 truncate text-sm text-gray-300">{metric.detail}</div>
                      </div>
                      <div className="font-mono text-xl font-bold tabular-nums text-white">
                        {metric.value}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.header>

        <motion.section {...fade(0.08)} className="mb-14 sm:mb-16">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <div className="ui-eyebrow mb-2">Workspace</div>
              <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
                Main paths
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {FEATURES.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div key={feature.id} {...fade(0.12 + index * 0.04)}>
                  <Link
                    href={feature.route}
                    className="group block min-h-[224px] border border-white/10 bg-[#0a0a0a] p-5 transition-colors duration-150 hover:border-[#FFD700]/35 hover:bg-[#FFD700]/[0.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700]"
                  >
                    <div className="mb-5 flex items-center justify-between">
                      <span className="flex h-10 w-10 items-center justify-center border border-white/10 bg-[#111] text-[#FFD700] transition-colors duration-150 group-hover:border-[#FFD700]/40">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <span className="font-mono text-[10px] uppercase text-gray-600">
                        {feature.index}
                      </span>
                    </div>
                    <div className="mb-2 font-mono text-[11px] font-semibold uppercase text-white">
                      {feature.name}
                    </div>
                    <p className="min-h-[72px] text-sm leading-6 text-gray-400">
                      {feature.description}
                    </p>
                    <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
                      <span className="font-mono text-[10px] uppercase text-gray-500">
                        {feature.signal}
                      </span>
                      <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase text-[#FFD700]">
                        {feature.cta}
                        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-1" />
                      </span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        <motion.section {...fade(0.16)} className="mb-14 sm:mb-16">
          <div className="grid border border-white/10 bg-[#0a0a0a] lg:grid-cols-[300px_1fr]">
            <div className="border-b border-white/10 p-5 lg:border-b-0 lg:border-r">
              <div className="ui-eyebrow mb-3">Operating loop</div>
              <h2 className="font-display text-2xl font-bold text-white">Validate before build.</h2>
              <p className="mt-3 text-sm leading-6 text-gray-500">
                A simple loop for deciding what deserves more time, money, and team attention.
              </p>
            </div>
            <div className="grid divide-y divide-white/10 md:grid-cols-3 md:divide-x md:divide-y-0">
              {WORKFLOW.map((item, index) => (
                <div key={item.title} className="p-5">
                  <div className="mb-4 font-mono text-xl font-bold text-[#FFD700]">
                    0{index + 1}
                  </div>
                  <h3 className="mb-2 font-mono text-[11px] font-semibold uppercase text-white">
                    {item.title}
                  </h3>
                  <p className="text-sm leading-6 text-gray-500">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section {...fade(0.22)} className="mb-14 sm:mb-16">
          <div className="grid grid-cols-1 border border-white/10 bg-[#0a0a0a] sm:grid-cols-3 sm:divide-x sm:divide-white/10">
            {QUICK_LINKS.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  href={link.route}
                  className="group flex min-h-[56px] items-center justify-between gap-3 border-b border-white/10 px-4 py-4 transition-colors duration-150 last:border-b-0 hover:bg-white/[0.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#FFD700] sm:border-b-0"
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-gray-500 transition-colors duration-150 group-hover:text-[#FFD700]" />
                    <span className="font-mono text-[11px] uppercase text-gray-300 group-hover:text-white">
                      {link.name}
                    </span>
                  </span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-gray-600 transition-colors duration-150 group-hover:text-[#FFD700]" />
                </Link>
              );
            })}
          </div>
        </motion.section>

        <motion.section {...fade(0.28)} className="mb-14 sm:mb-16">
          <div className="mb-5">
            <div className="ui-eyebrow mb-2">Network</div>
            <h2 className="font-display text-xl font-bold text-white sm:text-2xl">Partners</h2>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {PARTNERS.map((partner) => (
              <a
                key={partner.id}
                href={partner.route}
                target="_blank"
                rel="noopener noreferrer"
                className="group block min-h-[164px] border border-white/10 bg-[#0a0a0a] p-4 transition-colors duration-150 hover:border-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700]"
              >
                <div className="mb-3 flex items-center gap-3">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden border border-white/10 ${
                      partner.hasFullLogo ? 'bg-transparent' : 'bg-[#111]'
                    }`}
                  >
                    <Image
                      src={partner.logo}
                      alt={partner.name}
                      width={partner.hasFullLogo ? 44 : 28}
                      height={partner.hasFullLogo ? 44 : 28}
                      className={partner.hasFullLogo ? 'h-full w-full object-cover' : 'object-contain'}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-[11px] font-semibold uppercase text-white">
                      {partner.shortName}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1 font-mono text-[10px] text-gray-500">
                      <ExternalLink className="h-3 w-3" />
                      <span className="truncate">{partner.route.replace(/^https?:\/\//, '')}</span>
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-gray-600 transition-colors duration-150 group-hover:text-[#FFD700]" />
                </div>
                <p className="text-xs leading-6 text-gray-500">{partner.description}</p>
              </a>
            ))}
          </div>
        </motion.section>

        <motion.section
          {...fade(0.34)}
          className="border border-white/10 border-l-2 border-l-[#FFD700] bg-[#0a0a0a] px-5 py-8 sm:px-8"
        >
          <div className="ui-eyebrow mb-3">Next step</div>
          <h2 className="mb-3 max-w-xl font-display text-2xl font-bold text-white sm:text-3xl">
            Put one idea under pressure today.
          </h2>
          <p className="mb-6 max-w-lg text-sm leading-6 text-gray-400">
            Drop the raw version, collect objections, and decide what should move into build mode.
          </p>
          <div className="flex flex-wrap gap-2.5">
            <button type="button" onClick={() => openSubmitModal('idea')} className="btn-primary">
              Submit idea
            </button>
            <Link href="/idea" className="btn-ghost">
              Browse ideas
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
