import { notFound } from 'next/navigation';
import { AppPageHeader } from '@/components/app-surfaces';
import { NotificationList } from '@/components/notification-list';
import { copy, isLocale } from '@/lib/i18n';

export default async function NotificationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = copy[locale];
  return (
    <main id="main" className="app-page v1-notifications">
      <AppPageHeader
        eyebrow="ACTIVITY / USEFUL SIGNALS"
        title={t.shell.notifications}
        summary={
          locale === 'vi'
            ? 'Bounty, submission, research và payout — không tối ưu cho Like.'
            : 'Bounties, submissions, research and payouts—not Like-driven noise.'
        }
      />
      <NotificationList locale={locale} />
    </main>
  );
}
