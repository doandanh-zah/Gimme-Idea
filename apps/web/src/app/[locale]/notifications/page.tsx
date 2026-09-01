import { notFound } from 'next/navigation';
import { StaticShellPage } from '@/components/static-shell-page';
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
    <StaticShellPage
      eyebrow="ACTIVITY / NOTIFICATIONS"
      title={t.shell.notifications}
      summary={
        locale === 'vi'
          ? 'Cập nhật liên quan đến các đối tượng và tài khoản bạn quan tâm.'
          : 'Updates from the objects and accounts you care about.'
      }
      emptyTitle={locale === 'vi' ? 'Bạn đã xem hết' : 'You are all caught up'}
      emptyBody={
        locale === 'vi'
          ? 'Chưa có thông báo mới. Những cập nhật quan trọng sẽ xuất hiện tại đây.'
          : 'No new notifications. Important network updates will appear here.'
      }
    />
  );
}
