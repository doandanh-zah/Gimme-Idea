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
            ? 'Cập nhật về ý tưởng, dự án, bài dự thi và những hoạt động bạn quan tâm.'
            : 'Updates on your ideas, projects, entries and the work you follow.'
        }
      />
      <NotificationList locale={locale} />
    </main>
  );
}
