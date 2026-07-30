'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  Coins,
  Compass,
  FileText,
  Lightbulb,
  MessageSquareText,
  Network,
  Radio,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Wallet,
  Zap,
} from 'lucide-react';
import Hero from '@/components/Hero';
import { useAppStore } from '@/lib/store';

/* ---------------------------------------------------------
 * PAGE CONTENT STORYBOARD
 *
 * Static navbar stays interactive immediately.
 * Hero CTA is available on first paint.
 *
 *    0ms   hero renders with animated background system
 *   80ms   landing shell settles in
 *  180ms   first signal rail becomes visible
 *  320ms   content sections can reveal on scroll
 *  520ms   repeated cards start their local stagger
 * --------------------------------------------------------- */

const TIMING = {
  shell: 80,
  rail: 180,
  sections: 320,
  cards: 520,
};

const SECTION_MOTION = {
  offsetY: 16,
  spring: { type: 'spring' as const, stiffness: 350, damping: 28 },
};

const CARD_MOTION = {
  offsetY: 18,
  stagger: 0.05,
  spring: { type: 'spring' as const, stiffness: 300, damping: 30 },
};

const audiences = [
  {
    title: 'Founders',
    role: 'Need sharper demand proof before building',
    body: 'Turn a vague concept into a public brief with problem evidence, target user, Solana fit, and the exact help you need next.',
    icon: Lightbulb,
  },
  {
    title: 'Reviewers',
    role: 'Need a faster way to find useful feedback targets',
    body: 'Scan ideas by category, vote where demand looks real, and leave critique that becomes part of the idea history.',
    icon: MessageSquareText,
  },
  {
    title: 'Supporters',
    role: 'Need context before backing early work',
    body: 'See the public trail behind an idea before sending tips, joining a team, or supporting a pool.',
    icon: Wallet,
  },
] as const;

const insightStats = [
  { label: 'Brief', value: 'Problem / user / wedge', tone: 'text-[#FFD700]' },
  { label: 'Critique', value: 'Objections with evidence', tone: 'text-[#14F195]' },
  { label: 'Intent', value: 'Wallet-aware support trail', tone: 'text-[#C4B5FD]' },
] as const;

const ideaAnatomy = [
  {
    label: 'Problem evidence',
    detail: 'Name the user, the painful job, and the workaround they already use.',
    icon: Target,
  },
  {
    label: 'Why Solana',
    detail: 'Explain why wallets, speed, composability, payments, or ownership make the idea better.',
    icon: Zap,
  },
  {
    label: 'Distribution wedge',
    detail: 'Show the first community, channel, or partner path that can produce users.',
    icon: Compass,
  },
  {
    label: 'Open request',
    detail: 'Ask for the next concrete help: critique, cofounder, design, code, capital, or users.',
    icon: Radio,
  },
] as const;

const signalModel = [
  {
    title: 'Votes',
    strong: 'Measure appetite',
    weak: 'Do not replace comments',
    note: 'Votes help ideas surface, but a useful vote pattern still needs reasons attached.',
  },
  {
    title: 'Feedback',
    strong: 'Find hidden risk',
    weak: 'Must be specific',
    note: 'The best replies mention user pain, market timing, implementation cost, or GTM gaps.',
  },
  {
    title: 'Feeds',
    strong: 'Create context',
    weak: 'Avoid random lists',
    note: 'A feed should tell builders why an idea belongs to a market, track, or research theme.',
  },
  {
    title: 'Support',
    strong: 'Shows intent',
    weak: 'Not a promise',
    note: 'Wallet-aware support creates a public trail without pretending every idea is fundable.',
  },
] as const;

const productLayers = [
  {
    title: 'Structured publishing',
    body: 'Idea submissions capture problem, opportunity, solution, GTM, team context, category, and tags.',
    icon: FileText,
  },
  {
    title: 'Community discovery',
    body: 'Public feeds, rankings, profile context, and leaderboards make good critique easier to find.',
    icon: Network,
  },
  {
    title: 'AI-assisted critique',
    body: 'Gimme Sensei helps turn messy input into clearer questions, risks, and next hypotheses.',
    icon: Sparkles,
  },
  {
    title: 'Solana-native support',
    body: 'Wallet login, donations, tips, and pool support keep economic intent close to the idea.',
    icon: Coins,
  },
] as const;

const reviewRubric = [
  'Can you describe the first user without saying everyone?',
  'Is the Solana reason essential or just branding?',
  'What evidence would make the team stop working on it?',
  'Who can give the next 10 meaningful replies?',
  'What would a small prototype prove in one week?',
] as const;

const partners = [
  {
    name: 'DUT Superteam University Club',
    shortName: 'DSUC',
    logo: '/dsuc.png',
    href: 'https://dsuc.fun',
    role: 'University builder network',
  },
  {
    name: 'Superteam Vietnam',
    shortName: 'Superteam VN',
    logo: '/superteamvn.png',
    href: 'https://vn.superteam.fun',
    role: 'Solana talent layer',
  },
  {
    name: 'Solana',
    shortName: 'Solana',
    logo: '/SOLANA.png',
    href: 'https://solana.com',
    role: 'Execution ecosystem',
  },
] as const;

const faqs = [
  {
    question: 'Is this only for finished startups?',
    answer:
      'No. The strongest use case is earlier: before a product sprint, hackathon build, or fundraising story becomes expensive to change.',
  },
  {
    question: 'What makes a good idea post?',
    answer:
      'A clear user, painful problem, why now, why Solana, and the one next request you want from builders.',
  },
  {
    question: 'How should reviewers contribute?',
    answer:
      'Leave evidence or objections. A short comment with a specific customer risk is more valuable than generic praise.',
  },
  {
    question: 'Where do feeds fit?',
    answer:
      'Feeds group ideas by market, hackathon track, research theme, or founder need so people can review in context.',
  },
] as const;

function Reveal({
  children,
  className = '',
  delay = 0,
  enabled = true,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  enabled?: boolean;
}) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: SECTION_MOTION.offsetY }}
      whileInView={enabled ? { opacity: 1, y: 0 } : undefined}
      animate={!enabled ? { opacity: 1, y: 0 } : undefined}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ ...SECTION_MOTION.spring, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function StaggerItem({
  children,
  index,
  className = '',
  visible = true,
}: {
  children: React.ReactNode;
  index: number;
  className?: string;
  visible?: boolean;
}) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: CARD_MOTION.offsetY }}
      animate={{
        opacity: visible ? 1 : 0,
        y: visible ? 0 : CARD_MOTION.offsetY,
      }}
      transition={{ ...CARD_MOTION.spring, delay: index * CARD_MOTION.stagger }}
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

export default function LandingExperience() {
  const openSubmitModal = useAppStore((s) => s.openSubmitModal);
  const prefersReducedMotion = useReducedMotion();
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion) {
      setStage(4);
      return undefined;
    }

    const timers = [
      setTimeout(() => setStage(1), TIMING.shell),
      setTimeout(() => setStage(2), TIMING.rail),
      setTimeout(() => setStage(3), TIMING.sections),
      setTimeout(() => setStage(4), TIMING.cards),
    ];

    return () => timers.forEach(clearTimeout);
  }, [prefersReducedMotion]);

  return (
    <div className="relative min-h-screen overflow-hidden text-white selection:bg-[#FFD700]/30 selection:text-[#FFD700]">
      <main>
        <Hero />

        <motion.section
          initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
          animate={
            prefersReducedMotion
              ? { opacity: 1, y: 0 }
              : {
                  opacity: stage >= 2 ? 1 : 0,
                  y: stage >= 2 ? 0 : 16,
                }
          }
          transition={SECTION_MOTION.spring}
          className="relative border-b border-white/10 bg-[#070707] py-8"
        >
          <div className="landing-rail-glow" aria-hidden="true" />
          <div className="page-shell">
            <div className="grid overflow-hidden border border-white/10 bg-[#0a0a0a]/80 backdrop-blur md:grid-cols-3 md:divide-x md:divide-white/10">
              {insightStats.map((item, index) => (
                <StaggerItem key={item.label} index={index} visible={stage >= 4}>
                  <div className="landing-signal-cell min-h-[92px] p-4">
                    <div className="mb-3 font-mono text-[10px] uppercase text-gray-500">
                      {item.label}
                    </div>
                    <div className={`font-display text-xl font-bold ${item.tone}`}>{item.value}</div>
                  </div>
                </StaggerItem>
              ))}
            </div>
          </div>
        </motion.section>

        <section className="landing-band relative border-b border-white/10 py-16 sm:py-20">
          <div className="landing-section-beam" aria-hidden="true" />
          <div className="page-shell">
            <Reveal className="grid gap-10 lg:grid-cols-[360px_1fr] lg:items-start">
              <SectionIntro
                eyebrow="Who it is for"
                title="Different users need different signal from the same idea."
                body="A founder, reviewer, and supporter can look at the same thread and each leave with the context they need to make a better next decision."
              />

              <div className="grid gap-3 md:grid-cols-3">
                {audiences.map((audience, index) => {
                  const Icon = audience.icon;
                  return (
                    <StaggerItem key={audience.title} index={index} visible={stage >= 4}>
                      <div className="landing-card min-h-[260px] border border-white/10 bg-[#0a0a0a] p-5">
                        <div className="mb-5 flex h-10 w-10 items-center justify-center border border-white/10 text-[#FFD700]">
                          <Icon className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <div className="font-mono text-[10px] uppercase text-gray-500">
                          {audience.role}
                        </div>
                        <h3 className="mt-3 font-display text-xl font-bold text-white">
                          {audience.title}
                        </h3>
                        <p className="mt-3 text-sm leading-6 text-gray-500">{audience.body}</p>
                      </div>
                    </StaggerItem>
                  );
                })}
              </div>
            </Reveal>
          </div>
        </section>

        <section className="relative border-b border-white/10 py-16 sm:py-20">
          <div className="landing-flow-line" aria-hidden="true" />
          <div className="landing-circuit" aria-hidden="true" />
          <div className="page-shell">
            <Reveal className="mb-10">
              <SectionIntro
                eyebrow="Submission standard"
                title="A useful idea post is closer to a research brief than a slogan."
                body="Gimme Idea works best when the first post gives reviewers enough context to disagree intelligently."
              />
            </Reveal>

            <div className="grid gap-3 lg:grid-cols-4">
              {ideaAnatomy.map((item, index) => {
                const Icon = item.icon;
                return (
                  <StaggerItem key={item.label} index={index}>
                    <div className="landing-card relative min-h-[232px] overflow-hidden border border-white/10 bg-[#0a0a0a] p-5">
                      <div className="landing-card-sheen" aria-hidden="true" />
                      <div className="mb-6 flex items-center justify-between">
                        <span className="font-mono text-xl font-bold text-[#FFD700]">
                          0{index + 1}
                        </span>
                        <span className="flex h-10 w-10 items-center justify-center border border-white/10 text-gray-300">
                          <Icon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      </div>
                      <h3 className="font-display text-xl font-bold text-white">{item.label}</h3>
                      <p className="mt-3 text-sm leading-6 text-gray-500">{item.detail}</p>
                    </div>
                  </StaggerItem>
                );
              })}
            </div>
          </div>
        </section>

        <section className="relative border-b border-white/10 py-16 sm:py-20">
          <div className="landing-section-beam landing-section-beam-right" aria-hidden="true" />
          <div className="page-shell">
            <Reveal className="grid gap-10 lg:grid-cols-[360px_1fr] lg:items-start">
              <SectionIntro
                eyebrow="Signal model"
                title="Not all engagement should be treated as proof."
                body="The product separates lightweight attention from reusable evidence so builders can tell hype apart from useful demand."
              />

              <div className="overflow-hidden border border-white/10 bg-[#0a0a0a]">
                <div className="hidden grid-cols-[160px_1fr_1fr] border-b border-white/10 px-4 py-3 font-mono text-[10px] uppercase text-gray-500 md:grid">
                  <span>Layer</span>
                  <span>Strong when</span>
                  <span>Weak when</span>
                </div>
                <div className="divide-y divide-white/10">
                  {signalModel.map((item, index) => (
                    <StaggerItem key={item.title} index={index}>
                      <div className="landing-signal-row grid gap-4 p-4 md:grid-cols-[160px_1fr_1fr]">
                        <div>
                          <div className="font-mono text-[11px] font-semibold uppercase text-[#FFD700]">
                            {item.title}
                          </div>
                          <p className="mt-2 text-xs leading-5 text-gray-500 md:hidden">{item.note}</p>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">{item.strong}</div>
                          <p className="mt-1 hidden text-xs leading-5 text-gray-500 md:block">{item.note}</p>
                        </div>
                        <div className="text-sm text-gray-400">{item.weak}</div>
                      </div>
                    </StaggerItem>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="border-b border-white/10 py-16 sm:py-20">
          <div className="page-shell">
            <Reveal className="mb-10">
              <SectionIntro
                eyebrow="Product layers"
                title="The system keeps context, discovery, critique, and support connected."
                body="Each layer is useful on its own, but the value comes from keeping them around the same idea thread."
              />
            </Reveal>

            <div className="grid gap-3 md:grid-cols-2">
              {productLayers.map((layer, index) => {
                const Icon = layer.icon;
                return (
                  <StaggerItem key={layer.title} index={index}>
                    <div className="landing-card grid min-h-[160px] grid-cols-[44px_1fr] gap-4 border border-white/10 bg-[#0a0a0a] p-5">
                      <span className="flex h-11 w-11 items-center justify-center border border-white/10 text-[#FFD700]">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div>
                        <h3 className="font-display text-xl font-bold text-white">{layer.title}</h3>
                        <p className="mt-3 text-sm leading-6 text-gray-500">{layer.body}</p>
                      </div>
                    </div>
                  </StaggerItem>
                );
              })}
            </div>
          </div>
        </section>

        <section className="relative border-b border-white/10 py-16 sm:py-20">
          <div className="landing-circuit landing-circuit-soft" aria-hidden="true" />
          <div className="page-shell">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
              <Reveal>
                <div>
                  <SectionIntro
                    eyebrow="Reviewer rubric"
                    title="The best comments answer one hard question."
                    body="This gives the community a shared standard for judging early ideas without turning every thread into noise."
                  />
                  <div className="mt-8 overflow-hidden border border-white/10 bg-[#0a0a0a]">
                    {reviewRubric.map((question, index) => (
                      <StaggerItem key={question} index={index}>
                        <div className="landing-signal-row grid min-h-[64px] grid-cols-[40px_1fr] items-center gap-3 border-b border-white/10 px-4 last:border-b-0">
                          <span className="font-mono text-sm font-bold text-[#FFD700]">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <span className="text-sm leading-6 text-gray-300">{question}</span>
                        </div>
                      </StaggerItem>
                    ))}
                  </div>
                </div>
              </Reveal>

              <Reveal delay={0.08}>
                <div className="landing-card border border-white/10 border-l-2 border-l-[#14F195] bg-[#0a0a0a] p-5">
                  <ShieldCheck className="mb-5 h-6 w-6 text-[#14F195]" aria-hidden="true" />
                  <h3 className="font-display text-2xl font-bold text-white">Trust is contextual.</h3>
                  <p className="mt-3 text-sm leading-6 text-gray-500">
                    Profiles, wallet-aware actions, public comments, and feed curation give reviewers
                    more context than an isolated post can provide.
                  </p>
                  <div className="mt-6 grid gap-2 font-mono text-[10px] uppercase text-gray-500">
                    <div className="landing-meter flex min-h-[36px] items-center justify-between border border-white/10 px-3">
                      <span>Identity</span>
                      <span className="text-white">Profile / wallet</span>
                    </div>
                    <div className="landing-meter flex min-h-[36px] items-center justify-between border border-white/10 px-3">
                      <span>Evidence</span>
                      <span className="text-white">Votes / comments</span>
                    </div>
                    <div className="landing-meter flex min-h-[36px] items-center justify-between border border-white/10 px-3">
                      <span>Intent</span>
                      <span className="text-white">Tips / support</span>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 py-16 sm:py-20">
          <div className="page-shell">
            <Reveal className="mb-10">
              <SectionIntro
                eyebrow="Network"
                title="Rooted in the Solana builder community."
                body="The platform is shaped around students, ecosystem contributors, and founders who need faster idea feedback loops."
              />
            </Reveal>

            <div className="grid gap-3 md:grid-cols-3">
              {partners.map((partner, index) => (
                <StaggerItem key={partner.name} index={index}>
                  <a
                    href={partner.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="landing-card group flex min-h-[132px] items-center justify-between gap-4 border border-white/10 bg-[#0a0a0a] p-4 transition-colors duration-150 hover:border-[#FFD700]/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700]"
                  >
                    <span className="flex min-w-0 items-center gap-4">
                      <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden border border-white/10 bg-white/[0.03]">
                        <Image
                          src={partner.logo}
                          alt={partner.name}
                          width={56}
                          height={56}
                          className="object-contain"
                        />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-mono text-[11px] font-semibold uppercase text-white">
                          {partner.shortName}
                        </span>
                        <span className="mt-1 block truncate text-xs text-gray-500">
                          {partner.role}
                        </span>
                      </span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-gray-600 transition-transform duration-150 group-hover:translate-x-1 group-hover:text-[#FFD700]" />
                  </a>
                </StaggerItem>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 py-16 sm:py-20">
          <div className="page-shell">
            <Reveal className="grid gap-10 lg:grid-cols-[360px_1fr] lg:items-start">
              <SectionIntro
                eyebrow="FAQ"
                title="The product is strict about useful context, not polished decks."
                body="A rough idea is welcome. A vague idea with no user, no reason, and no request is hard for builders to help."
              />

              <div className="divide-y divide-white/10 overflow-hidden border border-white/10 bg-[#0a0a0a]">
                {faqs.map((faq, index) => (
                  <StaggerItem key={faq.question} index={index}>
                    <div className="landing-signal-row p-5">
                      <h3 className="font-display text-lg font-bold text-white">{faq.question}</h3>
                      <p className="mt-2 text-sm leading-6 text-gray-500">{faq.answer}</p>
                    </div>
                  </StaggerItem>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        <section className="relative overflow-hidden py-20 sm:py-24">
          <div className="landing-grid absolute inset-0 opacity-35" aria-hidden="true" />
          <div className="landing-cta-beam" aria-hidden="true" />
          <div className="page-shell relative z-10">
            <Reveal>
              <div className="landing-card border border-white/10 border-l-2 border-l-[#FFD700] bg-[#0a0a0a]/90 p-6 backdrop-blur sm:p-8 lg:p-10">
                <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
                  <div className="max-w-3xl">
                    <div className="ui-eyebrow mb-3">Start with a real brief</div>
                    <h2 className="font-display text-3xl font-bold leading-tight text-white sm:text-5xl">
                      Write the idea so someone can challenge it.
                    </h2>
                    <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-400 sm:text-base">
                      The first post does not need to be perfect. It needs enough evidence and
                      specificity for the next person to make it sharper.
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
                    <Link href="/idea" className="btn-ghost">
                      Browse ideas
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
