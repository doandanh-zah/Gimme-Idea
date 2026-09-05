import type { Metadata } from 'next';
import { AlertTriangle, ArrowRight, FileSearch, Flag, GitMerge, ShieldAlert } from 'lucide-react';
import { notFound } from 'next/navigation';
import { AppPageHeader } from '@/components/app-surfaces';
import { isLocale } from '@/lib/i18n';
export const metadata: Metadata = {
  title: 'Operational review',
  robots: { index: false, follow: false },
};
export default async function AdminReview({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const queues = [
    [FileSearch, 'Problem Signals', '12', 'AI-extracted records awaiting a canonical decision'],
    [GitMerge, 'Duplicate Candidates', '7', 'Suggestions only; no automatic merge'],
    [Flag, 'Content Review', '4', 'Imported provenance and creator claims'],
    [ShieldAlert, 'Bounty Resolution', '1', 'Development fixture; no escrow control'],
    [AlertTriangle, 'Payout Failures', '0', 'No production payout integration'],
  ] as const;
  return (
    <main id="main" className="app-page v1-admin-page">
      <AppPageHeader
        eyebrow="OPERATIONS / RESTRICTED"
        title={locale === 'vi' ? 'Hàng đợi review' : 'Review queues'}
        summary={
          locale === 'vi'
            ? 'UI contract tối thiểu cho moderation, research và resolution. Không có action backend trong Phase 1.'
            : 'A minimal UI contract for moderation, research and resolution. No backend actions in Phase 1.'
        }
      />
      <div className="v1-admin-warning">
        <ShieldAlert size={20} aria-hidden="true" />
        <span>
          <strong>Development Preview</strong>
          <small>
            {locale === 'vi'
              ? 'Không có quyền rút escrow hoặc thay đổi on-chain.'
              : 'No escrow withdrawal or on-chain authority is exposed here.'}
          </small>
        </span>
      </div>
      <section className="v1-admin-queues">
        {queues.map(([Icon, label, count, detail]) => (
          <button type="button" key={label} disabled>
            <Icon size={20} aria-hidden="true" />
            <span>
              <strong>{label}</strong>
              <small>{detail}</small>
            </span>
            <b>{count}</b>
            <ArrowRight size={17} aria-hidden="true" />
          </button>
        ))}
      </section>
    </main>
  );
}
