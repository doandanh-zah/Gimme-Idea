'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  Archive,
  Calendar,
  Clock,
  Code,
  ExternalLink,
  Lightbulb,
  Mic,
  RefreshCw,
  Target,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';

interface HackathonRound {
  roundNumber: number;
  title: string;
  description: string;
  roundType: 'idea' | 'pitching' | 'final';
  mode: 'online' | 'offline' | 'hybrid';
  teamsAdvancing: number;
  bonusTeams?: number;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'active' | 'judging' | 'completed';
}

interface Hackathon {
  id: string;
  slug: string;
  title: string;
  tagline?: string;
  description?: string;
  status: 'draft' | 'upcoming' | 'active' | 'judging' | 'completed' | 'cancelled';
  prizePool?: string;
  participantsCount: number;
  teamsCount?: number;
  currentRound?: number;
  totalRounds?: number;
  rounds?: HackathonRound[];
  coverImage?: string;
  bannerImage?: string;
  imageUrl?: string;
  mode?: 'online' | 'offline' | 'hybrid';
  organizerName?: string;
  registrationStart?: string;
  registrationEnd?: string;
}

const STATUS_STYLE: Record<Hackathon['status'], string> = {
  active: 'border-[#FFD700]/35 bg-[#FFD700]/10 text-[#FFD700]',
  upcoming: 'border-cyan-300/25 bg-cyan-300/10 text-cyan-200',
  judging: 'border-amber-300/25 bg-amber-300/10 text-amber-200',
  completed: 'border-emerald-300/25 bg-emerald-300/10 text-emerald-200',
  draft: 'border-white/10 bg-white/[0.04] text-gray-400',
  cancelled: 'border-red-300/25 bg-red-300/10 text-red-200',
};

function getRoundIcon(type: HackathonRound['roundType']) {
  switch (type) {
    case 'idea':
      return Lightbulb;
    case 'pitching':
      return Mic;
    case 'final':
      return Code;
    default:
      return Target;
  }
}

function getCoverImage(hackathon: Hackathon) {
  return hackathon.coverImage || hackathon.imageUrl || hackathon.bannerImage || '';
}

function getEventHref(hackathon: Hackathon) {
  return `/hackathons/${hackathon.slug || hackathon.id}`;
}

function getCountdown(hackathon: Hackathon) {
  const activeRound = hackathon.rounds?.find((round) => round.status === 'active');
  const upcomingRound = hackathon.rounds?.find((round) => round.status === 'upcoming');
  const targetRound = activeRound || upcomingRound;

  if (!targetRound) return null;

  const targetDate = new Date(activeRound ? targetRound.endDate : targetRound.startDate);
  const diff = targetDate.getTime() - Date.now();

  if (Number.isNaN(targetDate.getTime()) || diff <= 0) return null;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  return {
    days,
    hours,
    label: activeRound ? `Round ${activeRound.roundNumber} ends in` : `Round ${upcomingRound?.roundNumber} starts in`,
  };
}

function formatDate(value?: string) {
  if (!value) return 'TBA';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'TBA';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

function HackathonsSkeleton() {
  return (
    <main className="min-h-screen px-4 pb-16 pt-28 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="h-4 w-28 animate-pulse bg-white/10" />
        <div className="mt-4 h-10 w-full max-w-lg animate-pulse bg-white/10" />
        <div className="mt-3 h-5 w-full max-w-2xl animate-pulse bg-white/10" />
        <div className="mt-8 min-h-[320px] animate-pulse border border-white/10 bg-white/[0.03]" />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-44 animate-pulse border border-white/10 bg-white/[0.03]" />
          ))}
        </div>
      </div>
    </main>
  );
}

function StatusBadge({ status }: { status: Hackathon['status'] }) {
  return (
    <span className={`inline-flex min-h-[28px] items-center gap-1 border px-2 text-[11px] font-semibold uppercase ${STATUS_STYLE[status]}`}>
      {status === 'active' ? <Zap className="h-3 w-3" aria-hidden="true" /> : null}
      {status}
    </span>
  );
}

function EventStats({ hackathon }: { hackathon: Hackathon }) {
  const countdown = getCountdown(hackathon);

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="border border-white/10 bg-white/[0.03] p-4">
        <Trophy className="h-5 w-5 text-[#FFD700]" aria-hidden="true" />
        <p className="mt-3 text-lg font-semibold text-white">{hackathon.prizePool || 'TBA'}</p>
        <p className="text-xs text-gray-500">Prize pool</p>
      </div>
      <div className="border border-white/10 bg-white/[0.03] p-4">
        <Users className="h-5 w-5 text-cyan-200" aria-hidden="true" />
        <p className="mt-3 text-lg font-semibold text-white">{hackathon.teamsCount || hackathon.participantsCount || 0}</p>
        <p className="text-xs text-gray-500">Teams registered</p>
      </div>
      <div className="border border-white/10 bg-white/[0.03] p-4">
        <Clock className="h-5 w-5 text-emerald-200" aria-hidden="true" />
        <p className="mt-3 text-lg font-semibold text-white">
          {countdown ? `${countdown.days}d ${countdown.hours}h` : formatDate(hackathon.registrationEnd)}
        </p>
        <p className="text-xs text-gray-500">{countdown?.label || 'Registration ends'}</p>
      </div>
    </div>
  );
}

function RoundTimeline({ rounds }: { rounds?: HackathonRound[] }) {
  if (!rounds?.length) return null;

  return (
    <div className="mt-6 border-t border-white/10 pt-5">
      <p className="ui-eyebrow">Competition rounds</p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {rounds.map((round) => {
          const RoundIcon = getRoundIcon(round.roundType);
          const isActive = round.status === 'active';
          const isCompleted = round.status === 'completed';

          return (
            <div
              key={`${round.roundNumber}-${round.title}`}
              className={`border p-4 ${
                isActive
                  ? 'border-[#FFD700]/35 bg-[#FFD700]/10'
                  : isCompleted
                    ? 'border-emerald-300/20 bg-emerald-300/10'
                    : 'border-white/10 bg-white/[0.03]'
              }`}
            >
              <div className="flex items-center gap-2">
                <RoundIcon className={isActive ? 'h-4 w-4 text-[#FFD700]' : 'h-4 w-4 text-gray-400'} aria-hidden="true" />
                <span className={isActive ? 'text-xs font-semibold uppercase text-[#FFD700]' : 'text-xs font-semibold uppercase text-gray-400'}>
                  Round {round.roundNumber}
                </span>
              </div>
              <h3 className="mt-3 text-sm font-semibold text-white">{round.title}</h3>
              <p className="mt-2 line-clamp-3 text-xs leading-5 text-gray-400">{round.description}</p>
              <p className="mt-3 text-[11px] uppercase text-gray-500">{round.mode}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FeaturedHackathonCard({ hackathon }: { hackathon: Hackathon }) {
  const coverImage = getCoverImage(hackathon);

  return (
    <Link
      href={getEventHref(hackathon)}
      className="group block overflow-hidden border border-[#FFD700]/25 bg-white/[0.03] transition hover:border-[#FFD700]/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700]"
    >
      {coverImage ? (
        <div className="relative aspect-[3/1] min-h-[180px] w-full overflow-hidden border-b border-white/10">
          <Image
            src={coverImage}
            alt={`${hackathon.title} banner`}
            fill
            className="object-cover transition duration-500 group-hover:scale-[1.02]"
            sizes="(min-width: 1280px) 1280px, 100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" aria-hidden="true" />
        </div>
      ) : null}

      <div className="p-5 sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="ui-eyebrow">Featured hackathon</span>
              <StatusBadge status={hackathon.status} />
            </div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{hackathon.title}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-400 sm:text-base">
              {hackathon.tagline || hackathon.description || 'Compete through idea, pitch, and build rounds.'}
            </p>
            {hackathon.organizerName ? (
              <p className="mt-3 text-xs text-gray-500">Organized by {hackathon.organizerName}</p>
            ) : null}
          </div>
          <span className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-[#FFD700]">
            View details
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" />
          </span>
        </div>

        <div className="mt-6">
          <EventStats hackathon={hackathon} />
        </div>
        <RoundTimeline rounds={hackathon.rounds} />
      </div>
    </Link>
  );
}

function CompactHackathonCard({ hackathon, label }: { hackathon: Hackathon; label: string }) {
  const coverImage = getCoverImage(hackathon);

  return (
    <Link
      href={getEventHref(hackathon)}
      className="group block h-full overflow-hidden border border-white/10 bg-white/[0.03] transition hover:border-[#FFD700]/35 hover:bg-white/[0.05] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700]"
    >
      {coverImage ? (
        <div className="relative aspect-[16/7] w-full border-b border-white/10">
          <Image src={coverImage} alt={`${hackathon.title} banner`} fill className="object-cover" sizes="(min-width: 768px) 50vw, 100vw" />
        </div>
      ) : null}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <span className="ui-eyebrow">{label}</span>
          <StatusBadge status={hackathon.status} />
        </div>
        <h3 className="mt-4 line-clamp-2 text-lg font-semibold text-white">{hackathon.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-400">{hackathon.tagline || hackathon.description || 'Hackathon details are coming soon.'}</p>
        <div className="mt-5 flex flex-wrap gap-4 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1">
            <Trophy className="h-3.5 w-3.5 text-[#FFD700]" aria-hidden="true" />
            {hackathon.prizePool || 'TBA'}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5 text-cyan-200" aria-hidden="true" />
            {hackathon.teamsCount || hackathon.participantsCount || 0}
          </span>
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
            {formatDate(hackathon.registrationEnd || hackathon.registrationStart)}
          </span>
        </div>
      </div>
    </Link>
  );
}

function HowItWorks() {
  const steps = [
    {
      icon: Lightbulb,
      title: 'Idea round',
      text: 'Submit several ideas, review others, and let the strongest concepts rise through signal and feedback.',
    },
    {
      icon: Mic,
      title: 'Pitch round',
      text: 'Turn the top concepts into focused pitches for judges, mentors, and early supporters.',
    },
    {
      icon: Code,
      title: 'Final build',
      text: 'Demo the MVP, show traction, and compete for prizes, credits, and community recognition.',
    },
  ];

  return (
    <section className="border border-white/10 bg-white/[0.03] p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <Trophy className="h-5 w-5 text-[#FFD700]" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-white">How Gimme Idea hackathons work</h2>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div key={step.title} className="border border-white/10 bg-black/20 p-4">
              <Icon className="h-5 w-5 text-[#FFD700]" aria-hidden="true" />
              <h3 className="mt-4 text-sm font-semibold text-white">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-gray-400">{step.text}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function HackathonsList() {
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadHackathons = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const res = await fetch(`${API_URL}/hackathons`);
      if (!res.ok) {
        throw new Error('Could not load hackathons.');
      }

      const data = await res.json();
      setHackathons(data.success && Array.isArray(data.data) ? data.data : []);
    } catch (requestError) {
      console.error('Failed to fetch hackathons:', requestError);
      setError(requestError instanceof Error ? requestError.message : 'Could not load hackathons.');
      setHackathons([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHackathons();
  }, [loadHackathons]);

  const { featuredHackathon, partnerHackathons, pastHackathons } = useMemo(() => {
    const visible = hackathons.filter((hackathon) => hackathon.status !== 'draft' && hackathon.status !== 'cancelled');
    const featured = visible.find((hackathon) => hackathon.status === 'active' || hackathon.status === 'upcoming') || null;

    return {
      featuredHackathon: featured,
      partnerHackathons: visible.filter((hackathon) => hackathon.id !== featured?.id && hackathon.status !== 'completed'),
      pastHackathons: visible.filter((hackathon) => hackathon.status === 'completed'),
    };
  }, [hackathons]);

  if (isLoading) {
    return <HackathonsSkeleton />;
  }

  return (
    <main className="min-h-screen px-4 pb-16 pt-28 text-gray-300 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="border-b border-white/10 pb-6">
          <p className="ui-eyebrow">Build competitions</p>
          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">Hackathons</h1>
              <p className="mt-4 text-base leading-7 text-gray-400">
                Join focused build seasons with idea validation, pitching, team formation, and final demos.
              </p>
            </div>
            <Link href="/idea" className="btn-primary w-full sm:w-auto">
              Submit an idea
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </header>

        {error ? (
          <section className="border border-red-300/25 bg-red-300/10 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-red-200" aria-hidden="true" />
                <div>
                  <h2 className="text-sm font-semibold text-red-100">Could not load hackathons</h2>
                  <p className="mt-1 text-sm text-red-100/75">{error}</p>
                </div>
              </div>
              <button type="button" onClick={() => void loadHackathons()} className="btn-ghost border-red-300/30 text-red-100 hover:bg-red-300/10">
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Retry
              </button>
            </div>
          </section>
        ) : null}

        {!error && featuredHackathon ? (
          <FeaturedHackathonCard hackathon={featuredHackathon} />
        ) : null}

        {!error && !featuredHackathon ? (
          <section className="border border-dashed border-white/10 bg-black/20 px-6 py-14 text-center">
            <Archive className="mx-auto h-10 w-10 text-gray-600" aria-hidden="true" />
            <h2 className="mt-4 text-lg font-semibold text-white">No active hackathon</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-400">
              There is no open competition right now. New hackathon seasons will appear here when registration opens.
            </p>
          </section>
        ) : null}

        {!error ? <HowItWorks /> : null}

        {!error && partnerHackathons.length > 0 ? (
          <section>
            <div className="mb-4 flex items-center gap-2">
              <ExternalLink className="h-5 w-5 text-gray-400" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-white">Partner hackathons</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {partnerHackathons.map((hackathon) => (
                <CompactHackathonCard key={hackathon.id} hackathon={hackathon} label="Partner event" />
              ))}
            </div>
          </section>
        ) : null}

        {!error && pastHackathons.length > 0 ? (
          <section>
            <div className="mb-4 flex items-center gap-2">
              <Archive className="h-5 w-5 text-gray-400" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-white">Past hackathons</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {pastHackathons.map((hackathon) => (
                <CompactHackathonCard key={hackathon.id} hackathon={hackathon} label="Past event" />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
