import { notFound } from 'next/navigation';
import { StaticShellPage } from '@/components/static-shell-page';
import { copy, isLocale } from '@/lib/i18n';

export default async function FollowingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = copy[locale];
  return (
    <StaticShellPage
      eyebrow="NETWORK / FOLLOWING"
      title={t.shell.following}
      summary={
        locale === 'vi'
          ? 'Một feed dành cho Problems, Ideas và người dùng bạn đang theo dõi.'
          : 'A focused feed for Problems, Ideas and people you follow.'
      }
      emptyTitle={locale === 'vi' ? 'Chưa theo dõi đối tượng nào' : 'Nothing followed yet'}
      emptyBody={
        locale === 'vi'
          ? 'Follow sẽ được kết nối khi authentication và social graph được triển khai.'
          : 'Following will connect when authentication and the social graph are implemented.'
      }
    />
  );
}
