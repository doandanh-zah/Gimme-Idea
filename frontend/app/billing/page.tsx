'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CreditCard, Loader2, ReceiptText } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';

import { apiClient } from '../../lib/api-client';

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <main className="relative min-h-screen px-4 pt-28 pb-20 sm:px-6">
          <div className="mx-auto max-w-4xl">
            <div className="h-8 w-24 animate-pulse bg-white/10" />
            <div className="mt-8 h-10 w-48 animate-pulse bg-white/10" />
            <div className="mt-6 h-40 animate-pulse border border-white/10 bg-white/[0.03]" />
          </div>
        </main>
      }
    >
      <BillingContent />
    </Suspense>
  );
}

function BillingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const sessionId = useMemo(() => searchParams.get('session_id'), [searchParams]);
  const success = useMemo(() => searchParams.get('success') === '1', [searchParams]);

  useEffect(() => {
    const confirm = async () => {
      if (!success || !sessionId) return;
      const res = await apiClient.confirmStripeCheckout(sessionId);
      if (res.success) {
        toast.success('Payment confirmed. Billing is active.');
      } else {
        toast.error(res.error || 'Could not confirm payment yet');
      }
    };
    void confirm();
  }, [success, sessionId]);

  const startCheckout = async (plan: 'pack' | 'pro5' | 'pro10') => {
    if (!name.trim() || !email.trim()) {
      toast.error('Please enter payer name and email');
      return;
    }

    setLoadingPlan(plan);
    try {
      const res = await apiClient.createStripeCheckout({
        plan,
        payerName: name.trim(),
        payerEmail: email.trim(),
        country: country.trim() || undefined,
      });
      if (!res.success || !res.data?.url) {
        toast.error(res.error || 'Failed to start checkout');
        return;
      }
      window.location.href = res.data.url;
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <main className="relative min-h-screen px-4 pt-28 pb-20 text-gray-300 sm:px-6">

      <div className="mx-auto max-w-5xl">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-8 inline-flex min-h-[40px] items-center gap-2 text-sm text-gray-400 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <header className="border-b border-white/10 pb-8">
          <p className="ui-eyebrow">Billing</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Checkout and AI credits
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-gray-400">
            International card checkout via Stripe, with crypto plans kept separate from wallet-based product flows.
          </p>
        </header>

        <section className="my-8 border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-5 flex items-center gap-3">
            <ReceiptText className="h-5 w-5 text-[#FFD700]" />
            <h2 className="text-lg font-semibold text-white">Payer Information</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="payer-name" className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-gray-400">
                Full name
              </label>
              <input
                id="payer-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                placeholder="Full name"
                className="w-full border border-white/10 bg-black/25 px-3 py-3 text-sm text-white placeholder-gray-600 focus:border-[#FFD700]/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700]/60"
              />
            </div>
            <div>
              <label htmlFor="payer-email" className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-gray-400">
                Email
              </label>
              <input
                id="payer-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                spellCheck={false}
                placeholder="you@example.com"
                className="w-full border border-white/10 bg-black/25 px-3 py-3 text-sm text-white placeholder-gray-600 focus:border-[#FFD700]/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700]/60"
              />
            </div>
            <div>
              <label htmlFor="payer-country" className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-gray-400">
                Country <span className="text-gray-600">(optional)</span>
              </label>
              <input
                id="payer-country"
                value={country}
                onChange={(event) => setCountry(event.target.value)}
                autoComplete="country-name"
                placeholder="Country"
                className="w-full border border-white/10 bg-black/25 px-3 py-3 text-sm text-white placeholder-gray-600 focus:border-[#FFD700]/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700]/60"
              />
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <PlanCard
            title="$1 / 5 Questions"
            desc="Pay as you go for deeper brainstorming."
            cta="Buy question pack"
            onClick={() => startCheckout('pack')}
            loading={loadingPlan === 'pack'}
          />
          <PlanCard
            title="$5 / month"
            desc="Unlimited idea views for frequent browsing."
            cta="Start Pro5"
            onClick={() => startCheckout('pro5')}
            loading={loadingPlan === 'pro5'}
          />
          <PlanCard
            title="$10 / month"
            desc="Unlimited idea views plus unlimited AI advice."
            cta="Start Pro10"
            onClick={() => startCheckout('pro10')}
            loading={loadingPlan === 'pro10'}
            highlight
          />
        </section>

        <p className="mt-6 text-xs leading-5 text-gray-500">
          Card payments are processed by Stripe and support Visa, Mastercard, and major international cards.
        </p>
      </div>
    </main>
  );
}

function PlanCard({
  title,
  desc,
  cta,
  onClick,
  loading,
  highlight = false,
}: {
  title: string;
  desc: string;
  cta: string;
  onClick: () => void;
  loading: boolean;
  highlight?: boolean;
}) {
  return (
    <article className={`border ${highlight ? 'border-[#FFD700]/40 bg-[#FFD700]/10' : 'border-white/10 bg-white/[0.03]'} p-5`}>
      <CreditCard className="h-5 w-5 text-[#FFD700]" />
      <h3 className="mt-5 text-xl font-semibold text-white">{title}</h3>
      <p className="mt-2 min-h-[48px] text-sm leading-6 text-gray-400">{desc}</p>
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className={`mt-5 flex min-h-[44px] w-full items-center justify-center gap-2 px-4 text-sm font-bold transition disabled:opacity-60 ${
          highlight
            ? 'bg-[#FFD700] text-black hover:bg-[#FDB931]'
            : 'border border-white/10 bg-white/[0.04] text-white hover:bg-white/10'
        }`}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Redirecting...
          </>
        ) : (
          cta
        )}
      </button>
    </article>
  );
}
