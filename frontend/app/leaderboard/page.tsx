'use client';

import Link from 'next/link';
import { ArrowLeft, Star, TrendingUp, Trophy, Users } from 'lucide-react';

const previewStats = [
  {
    title: 'Top Creators',
    description: 'Most innovative idea publishers.',
    icon: Star,
  },
  {
    title: 'Top Feedbackers',
    description: 'Most helpful community members.',
    icon: TrendingUp,
  },
  {
    title: 'Top Supporters',
    description: 'Generous tip contributors.',
    icon: Users,
  },
];

export default function LeaderboardPage() {
  return (
    <main className="relative min-h-screen pb-20 pt-28 text-white">

      <div className="page-shell">
        <Link
          href="/home"
          className="mb-8 inline-flex min-h-[40px] items-center gap-2 text-sm text-gray-400 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <section className="border border-white/10 bg-white/[0.03] p-6 text-center sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center border border-[#FFD700]/30 bg-[#FFD700]/10">
            <Trophy className="h-8 w-8 text-[#FFD700]" />
          </div>

          <p className="ui-eyebrow mx-auto mt-6 w-fit">Community ranking</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
            Leaderboard Coming Soon
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-gray-400">
            We are building a leaderboard for top idea creators, helpful feedbackers, and generous supporters.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            {previewStats.map((item) => (
              <div key={item.title} className="border border-white/10 bg-black/20 p-5">
                <item.icon className="mx-auto h-7 w-7 text-[#FFD700]" />
                <h2 className="mt-4 font-semibold text-white">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-gray-500">{item.description}</p>
              </div>
            ))}
          </div>

          <Link href="/idea" className="btn-primary mx-auto mt-8">
            Build reputation now
          </Link>
        </section>
      </div>
    </main>
  );
}
