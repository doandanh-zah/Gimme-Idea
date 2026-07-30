'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  Coins,
  Compass,
  Lightbulb,
  MessageSquareText,
  Network,
  Radio,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';
import Hero from '@/components/Hero';
import StatsDashboard from '@/components/StatsDashboard';
import { useAppStore } from '@/lib/store';

const problemCards = [
  {
    title: 'Ideas die in private chats',
    body: 'Good concepts disappear because they never meet builders, critics, or early users at the same time.',
    icon: MessageSquareText,
  },
  {
    title: 'Validation is too late',
    body: 'Teams often ask for feedback after scope, deck, and code are already expensive to change.',
    icon: Compass,
  },
  {
    title: 'Signal is scattered',
    body: 'Votes, comments, founders, feeds, and support should sit next to the idea instead of across tabs.',
    icon: Network,
  },
] as const;

const loopSteps = [
  {
    n: '01',
    title: 'Publish the raw wedge',
    body: 'Frame the problem, audience, market, and why Solana is the right execution layer.',
    icon: Lightbulb,
  },
  {
    n: '02',
    title: 'Let builders pressure-test it',
    body: 'Community replies expose missing demand, weak distribution, and hidden implementation cost.',
    icon: Users,
  },
  {
    n: '03',
    title: 'Turn comments into GTM',
    body: 'Gimme Sensei helps convert messy feedback into customer, positioning, and launch hypotheses.',
    icon: Sparkles,
  },
  {
    n: '04',
    title: 'Move only proven ideas forward',
    body: 'Use public signal, feed saves, and supporter intent as the filter before deeper build work.',
    icon: Zap,
  },
] as const;

const builderBenefits = [
  'Public reputation around the ideas you start or sharpen',
  'Curated feeds for hackathon tracks, markets, and founder requests',
  'Solana-native contribution flows through wallet-aware support',
  'AI mentor feedback that stays attached to the project thread',
  'Partner network discovery across DSUC, Superteam Vietnam, and builders',
  'A cleaner handoff from raw idea to team, proof, and roadmap',
] as const;

const trustSignals = [
  { label: 'Identity layer', value: 'Wallet + profile', icon: ShieldCheck },
  { label: 'Economic layer', value: 'Donations + support', icon: Coins },
  { label: 'Discovery layer', value: 'Feeds + ranking', icon: Radio },
] as const;

const partners = [
  {
    name: 'DUT Superteam University Club',
    shortName: 'DSUC',
    logo: '/dsuc.png',
    href: 'https://dsuc.fun',
  },
  {
    name: 'Superteam Vietnam',
    shortName: 'Superteam VN',
    logo: '/superteamvn.png',
    href: 'https://vn.superteam.fun',
  },
  {
    name: 'Solana',
    shortName: 'Solana',
    logo: '/SOLANA.png',
    href: 'https://solana.com',
  },
] as const;

function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 14 }}
      whileInView={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.35, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function SectionIntro({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div className="max-w-2xl">
      <div className="ui-eyebrow mb-3">{eyebrow}</div>
      <h2 className="font-display text-3xl font-bold leading-tight text-white sm:text-4xl">
        {title}
      </h2>
      <p className="mt-4 text-sm leading-7 text-gray-400 sm:text-base">{body}</p>
    </div>
  );
}

export default function LandingPage() {
  const openSubmitModal = useAppStore((s) => s.openSubmitModal);

  return (
    <div className="relative min-h-screen overflow-hidden text-white selection:bg-[#FFD700]/30 selection:text-[#FFD700]">
      <main>
        <Hero />

        <section className="landing-band border-b border-white/10 py-16 sm:py-20">
          <div className="page-shell">
            <Reveal className="grid gap-10 lg:grid-cols-[360px_1fr] lg:items-start">
              <SectionIntro
                eyebrow="Why it exists"
                title="The missing layer between a shower thought and a shipped product."
                body="Gimme Idea is built for the messy middle: the moment when a concept needs criticism, ranking, distribution clues, and builder context before anyone starts overbuilding."
              />

              <div className="grid gap-3 md:grid-cols-3">
                {problemCards.map((card, index) => {
                  const Icon = card.icon;
                  return (
                    <Reveal key={card.title} delay={index * 0.04}>
                      <div className="group min-h-[238px] border border-white/10 bg-[#0a0a0a] p-5 transition-colors duration-150 hover:border-[#FFD700]/35">
                        <div className="mb-5 flex h-10 w-10 items-center justify-center border border-white/10 text-[#FFD700] transition-colors duration-150 group-hover:border-[#FFD700]/40">
                          <Icon className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <h3 className="font-display text-xl font-bold text-white">{card.title}</h3>
                        <p className="mt-3 text-sm leading-6 text-gray-500">{card.body}</p>
                      </div>
                    </Reveal>
                  );
                })}
              </div>
            </Reveal>
          </div>
        </section>

        <section className="relative border-b border-white/10 py-16 sm:py-20">
          <div className="landing-flow-line" aria-hidden="true" />
          <div className="page-shell">
            <Reveal>
              <SectionIntro
                eyebrow="Validation loop"
                title="A clean path from raw idea to credible signal."
                body="The product keeps early discovery practical: publish, pressure-test, extract GTM, then decide whether the idea deserves a team, funding, or a prototype."
              />
            </Reveal>

            <div className="mt-10 grid gap-3 lg:grid-cols-4">
              {loopSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <Reveal key={step.n} delay={index * 0.05}>
                    <div className="relative min-h-[270px] overflow-hidden border border-white/10 bg-[#0a0a0a] p-5">
                      <div className="landing-card-sheen" aria-hidden="true" />
                      <div className="mb-6 flex items-center justify-between">
                        <span className="font-mono text-2xl font-bold text-[#FFD700]">
                          {step.n}
                        </span>
                        <span className="flex h-10 w-10 items-center justify-center border border-white/10 text-gray-300">
                          <Icon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      </div>
                      <h3 className="font-display text-xl font-bold text-white">{step.title}</h3>
                      <p className="mt-3 text-sm leading-6 text-gray-500">{step.body}</p>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 py-16 sm:py-20">
          <div className="page-shell">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-stretch">
              <Reveal>
                <StatsDashboard />
              </Reveal>

              <Reveal delay={0.08}>
                <div className="flex h-full flex-col border border-white/10 bg-[#0a0a0a]">
                  <div className="border-b border-white/10 p-5">
                    <div className="ui-eyebrow mb-3">Trust stack</div>
                    <h2 className="font-display text-2xl font-bold text-white">
                      Signal that stays attached to the idea.
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-gray-500">
                      Every important action should make the project easier to judge later.
                    </p>
                  </div>
                  <div className="divide-y divide-white/10">
                    {trustSignals.map((signal) => {
                      const Icon = signal.icon;
                      return (
                        <div
                          key={signal.label}
                          className="grid min-h-[76px] grid-cols-[44px_1fr] items-center gap-3 px-5 py-4"
                        >
                          <span className="flex h-10 w-10 items-center justify-center border border-white/10 text-[#FFD700]">
                            <Icon className="h-4 w-4" aria-hidden="true" />
                          </span>
                          <div>
                            <div className="font-mono text-[10px] uppercase text-gray-500">
                              {signal.label}
                            </div>
                            <div className="mt-1 text-sm text-white">{signal.value}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 py-16 sm:py-20">
          <div className="page-shell">
            <Reveal className="grid gap-10 lg:grid-cols-[360px_1fr] lg:items-start">
              <SectionIntro
                eyebrow="For builders"
                title="More than a board of random ideas."
                body="Landing, home, feeds, projects, support, and AI critique are connected around one purpose: help builders spend time on ideas with visible demand."
              />

              <div className="grid border border-white/10 bg-[#0a0a0a] sm:grid-cols-2">
                {builderBenefits.map((benefit, index) => (
                  <div
                    key={benefit}
                    className={`flex min-h-[86px] gap-3 p-4 ${
                      index % 2 === 0 ? 'sm:border-r sm:border-white/10' : ''
                    } ${index < 4 ? 'border-b border-white/10' : ''}`}
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#14F195]" aria-hidden="true" />
                    <p className="text-sm leading-6 text-gray-300">{benefit}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        <section className="border-b border-white/10 py-16 sm:py-20">
          <div className="page-shell">
            <Reveal className="mb-10">
              <SectionIntro
                eyebrow="Network"
                title="Built with the Solana builder community in mind."
                body="The platform gives university builders, ecosystem contributors, and early founders a shared surface for ideas that need sharper feedback."
              />
            </Reveal>

            <div className="grid gap-3 md:grid-cols-3">
              {partners.map((partner, index) => (
                <Reveal key={partner.name} delay={index * 0.05}>
                  <a
                    href={partner.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex min-h-[112px] items-center justify-between gap-4 border border-white/10 bg-[#0a0a0a] p-4 transition-colors duration-150 hover:border-[#FFD700]/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700]"
                  >
                    <span className="flex min-w-0 items-center gap-4">
                      <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden border border-white/10 bg-white/[0.03]">
                        <Image
                          src={partner.logo}
                          alt={partner.name}
                          width={56}
                          height={56}
                          className="max-h-10 w-auto object-contain"
                          style={{ height: 'auto' }}
                        />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-mono text-[11px] font-semibold uppercase text-white">
                          {partner.shortName}
                        </span>
                        <span className="mt-1 block truncate text-xs text-gray-500">
                          {partner.href.replace(/^https?:\/\//, '')}
                        </span>
                      </span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-gray-600 transition-transform duration-150 group-hover:translate-x-1 group-hover:text-[#FFD700]" />
                  </a>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden py-20 sm:py-24">
          <div className="landing-grid absolute inset-0 opacity-35" aria-hidden="true" />
          <div className="page-shell relative z-10">
            <Reveal>
              <div className="border border-white/10 border-l-2 border-l-[#FFD700] bg-[#0a0a0a]/90 p-6 backdrop-blur sm:p-8 lg:p-10">
                <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
                  <div className="max-w-3xl">
                    <div className="ui-eyebrow mb-3">Next step</div>
                    <h2 className="font-display text-3xl font-bold leading-tight text-white sm:text-5xl">
                      Put your idea where builders can challenge it.
                    </h2>
                    <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-400 sm:text-base">
                      If the idea survives public questions, sharper GTM prompts, and visible
                      demand, it is ready for a better sprint.
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                    <button
                      type="button"
                      onClick={() => openSubmitModal('idea')}
                      className="btn-primary"
                    >
                      Submit idea
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <Link href="/feeds" className="btn-ghost">
                      Browse feeds
                    </Link>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 py-10">
        <div className="page-shell flex flex-col gap-5 text-xs text-gray-500 md:flex-row md:items-center md:justify-between">
          <p>Built with DUT Superteam University Club for Solana builders.</p>
          <div className="flex gap-5 font-mono uppercase">
            <Link href="/terms" className="transition-colors duration-150 hover:text-[#FFD700]">
              Terms
            </Link>
            <Link href="/privacy" className="transition-colors duration-150 hover:text-[#FFD700]">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
