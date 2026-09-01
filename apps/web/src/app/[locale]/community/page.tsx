import { notFound } from 'next/navigation';
import { StaticShellPage } from '@/components/static-shell-page';
import { copy, isLocale } from '@/lib/i18n';

export default async function CommunityPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = copy[locale];
  return (
    <StaticShellPage
      eyebrow="NETWORK / COMMUNITY"
      title={t.shell.community}
      summary={
        locale === 'vi'
          ? 'Nơi các cuộc thảo luận tham chiếu đến canonical Problem và Idea.'
          : 'Discussion that references canonical Problems and Ideas without replacing them.'
      }
      emptyTitle={locale === 'vi' ? 'Community đang được chuẩn bị' : 'Community is being prepared'}
      emptyBody={
        locale === 'vi'
          ? 'Discussion thuộc milestone tiếp theo và chưa được giả lập trong foundation.'
          : 'Discussion belongs to the next milestone and is not simulated in the foundation.'
      }
    />
  );
}
