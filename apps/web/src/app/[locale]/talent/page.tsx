import { notFound } from 'next/navigation';
import { StaticShellPage } from '@/components/static-shell-page';
import { copy, isLocale } from '@/lib/i18n';

export default async function TalentPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = copy[locale];
  return (
    <StaticShellPage
      eyebrow="EXPLORE / TALENT"
      title={t.shell.talent}
      summary={
        locale === 'vi'
          ? 'Người và team đang tìm việc trên các Problem có mở hiring.'
          : 'People and teams looking to work on Problems that are hiring.'
      }
      emptyTitle={locale === 'vi' ? 'Chưa có talent board' : 'Talent board is empty'}
      emptyBody={
        locale === 'vi'
          ? 'Talent sẽ xuất hiện khi hồ sơ builder và hiring được triển khai.'
          : 'Talent will appear when builder profiles and hiring are implemented.'
      }
    />
  );
}
