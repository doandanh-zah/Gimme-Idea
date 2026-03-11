'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { apiClient } from '../../lib/api-client';

export default function BillingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen pt-24 pb-16 px-4 sm:px-6" />}>
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
    confirm();
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
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white text-sm mb-4">← Back</button>
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">Billing</h1>
        <p className="text-gray-400 mb-8">International checkout (Visa/Mastercard via Stripe) + crypto plans.</p>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 mb-6">
          <h2 className="text-lg font-semibold text-[#FFD700] mb-4">Payer Information</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="bg-[#12131a] border border-white/10 rounded-lg px-3 py-2 text-sm" />
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="bg-[#12131a] border border-white/10 rounded-lg px-3 py-2 text-sm" />
            <input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Country (optional)" className="bg-[#12131a] border border-white/10 rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <PlanCard title="$1 / 5 Questions" desc="Pay as you go for brainstorm depth." cta="Buy question pack" onClick={() => startCheckout('pack')} loading={loadingPlan === 'pack'} />
          <PlanCard title="$5 / month" desc="Unlimited idea views. Great for frequent browsing." cta="Start Pro5" onClick={() => startCheckout('pro5')} loading={loadingPlan === 'pro5'} />
          <PlanCard title="$10 / month" desc="Unlimited idea views + unlimited AI advice." cta="Start Pro10" onClick={() => startCheckout('pro10')} loading={loadingPlan === 'pro10'} highlight />
        </div>

        <p className="text-xs text-gray-500 mt-6">Card payments are processed by Stripe (supports Visa/Mastercard and major international cards).</p>
      </div>
    </div>
  );
}

function PlanCard({ title, desc, cta, onClick, loading, highlight = false }: { title: string; desc: string; cta: string; onClick: () => void; loading: boolean; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border ${highlight ? 'border-[#FFD700]/40' : 'border-white/10'} bg-[#0f1118] p-5`}>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-sm text-gray-400 mb-5 min-h-[42px]">{desc}</p>
      <button onClick={onClick} disabled={loading} className={`w-full rounded-full py-2.5 font-bold ${highlight ? 'bg-[#FFD700] text-black' : 'bg-white/10 text-white hover:bg-white/20'} disabled:opacity-60`}>
        {loading ? 'Redirecting…' : cta}
      </button>
    </div>
  );
}
