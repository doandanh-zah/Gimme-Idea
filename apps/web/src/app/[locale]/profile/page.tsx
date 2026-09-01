import { notFound } from 'next/navigation';
import { AppPageHeader } from '@/components/app-surfaces';
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
      <section className="guest-profile-state">
        <span className="guest-avatar guest-avatar-large">G</span>
        <div>
          <h2>{t.shell.guest}</h2>
          <p>{t.shell.signedOut}</p>
        </div>
        <button type="button" className="button button-primary" disabled>
          {t.shell.addAccount}
        </button>
      </section>
    </main>
  );
}
