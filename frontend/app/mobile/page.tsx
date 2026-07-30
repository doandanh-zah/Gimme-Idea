'use client';

import Link from 'next/link';
import { ArrowRight, Download, ShieldCheck, Smartphone, Zap } from 'lucide-react';

const featureRows = [
  {
    icon: Zap,
    title: 'Fast idea loop',
    body: 'Post, vote, reply, and scan feedback with touch-first spacing.',
  },
  {
    icon: Smartphone,
    title: 'Phone navigation',
    body: 'Safer tap targets and routing built for repeated mobile sessions.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure account flows',
    body: 'OAuth and session behavior tuned for app persistence.',
  },
];

export default function MobileLandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden page-top text-white">

      <div className="page-shell">
        <header className="border-b border-white/10 pb-8">
          <p className="ui-eyebrow">Mobile build</p>
          <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight sm:text-5xl">
                Gimme Idea on your phone
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-gray-400 sm:text-base">
                Same builder workflow, tuned for mobile sessions: discover ideas, vote, comment,
                and publish while you are away from desktop.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <a
                href="https://t.me/DoanZah"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                Download APK
              </a>
              <Link href="/contact" className="btn-ghost">
                <Smartphone className="h-4 w-4" aria-hidden="true" />
                Request iOS access
              </Link>
            </div>
          </div>
        </header>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="border border-white/10 bg-[#0a0a0a] p-5 sm:p-8">
            <p className="font-mono text-[11px] uppercase tracking-wider text-gray-500">
              Android available / iOS waitlist
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Install, sign in, keep shipping.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-400">
              The mobile app focuses on the high-frequency loop: read promising ideas, support the
              ones with signal, and reply while the context is still fresh.
            </p>

            <div className="mt-8 divide-y divide-white/10 border-y border-white/10">
              {featureRows.map((feature) => (
                <div key={feature.title} className="grid gap-3 py-5 sm:grid-cols-[44px_1fr]">
                  <div className="flex h-10 w-10 items-center justify-center border border-white/10 bg-[#111]">
                    <feature.icon className="h-4 w-4 text-[#FFD700]" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{feature.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-gray-400">{feature.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside className="border border-white/10 bg-[#0a0a0a] p-5">
            <p className="ui-eyebrow">Next step</p>
            <h2 className="mt-4 text-xl font-semibold text-white">Need the latest build?</h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-400">
              Download requests currently route through Telegram so we can hand you the correct APK
              and collect device-specific issues.
            </p>
            <a
              href="https://t.me/DoanZah"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost mt-6 w-full"
            >
              Contact maintainer
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </aside>
        </section>
      </div>
    </main>
  );
}
