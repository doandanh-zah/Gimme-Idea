import { notFound } from 'next/navigation';
import { AppPageHeader } from '@/components/app-surfaces';
import { ProfileSession } from '@/components/profile-session';
import { copy, isLocale } from '@/lib/i18n';

export default async function ProfilePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = copy[locale];
  return (
    <main id="main" className="app-page">
      <AppPageHeader
        eyebrow="IDENTITY / PROFILE"
        title={t.shell.profile}
        summary={
          locale === 'vi'
            ? 'Hồ sơ, đóng góp và lịch sử xây dựng của bạn.'
            : 'Your identity, contributions and builder history.'
        }
      />
      <ProfileSession locale={locale} />
    </main>
  );
}
