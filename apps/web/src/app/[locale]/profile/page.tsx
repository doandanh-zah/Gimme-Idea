import { notFound } from 'next/navigation';
import Link from 'next/link';
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
      <section className="v1-profile-proof" aria-labelledby="builder-proof-title">
        <header>
          <p className="v1-kicker">BUILDER PROOF</p>
          <h2 id="builder-proof-title">
            {locale === 'vi' ? 'Năng lực được chứng minh bằng công việc' : 'Proof through work'}
          </h2>
        </header>
        <p className="empty-note">
          {locale === 'vi'
            ? 'Thành tích và kỹ năng chưa được kết nối với hồ sơ. Khám phá vấn đề để bắt đầu đóng góp.'
            : 'Skills and achievements are not connected to your profile yet. Explore Problems to start contributing.'}
        </p>
        <Link className="button button-quiet" href={`/${locale}/problems`}>
          {locale === 'vi' ? 'Khám phá vấn đề' : 'Explore Problems'}
        </Link>
      </section>
    </main>
  );
}
