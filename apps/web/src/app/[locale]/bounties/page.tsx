import { notFound } from 'next/navigation';
import { StaticShellPage } from '@/components/static-shell-page';
import { copy, isLocale } from '@/lib/i18n';

export default async function BountiesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = copy[locale];
  return (
    <StaticShellPage
      eyebrow="EXPLORE / BOUNTIES"
      title={t.shell.bounties}
      summary={
        locale === 'vi'
          ? 'Những Problem đang treo thưởng để ai đó giải.'
          : 'Problems with a prize attached for someone to solve.'
      }
      emptyTitle={locale === 'vi' ? 'Chưa có bounty đang mở' : 'No open bounties yet'}
      emptyBody={
        locale === 'vi'
          ? 'Bounty funded sẽ xuất hiện ở đây khi escrow và funding được kết nối.'
          : 'Funded bounties will appear here when escrow and funding are connected.'
      }
    />
  );
}
