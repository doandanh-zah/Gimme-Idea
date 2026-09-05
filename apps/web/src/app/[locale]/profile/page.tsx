import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Award, Blocks, CheckCircle2, Sparkles } from 'lucide-react';
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
        <div className="v1-profile-proof-grid">
          <article>
            <Sparkles size={20} aria-hidden="true" />
            <strong>Forecasting systems</strong>
            <span>
              {locale === 'vi' ? 'Kỹ năng công khai · tự khai báo' : 'Public skill · self-declared'}
            </span>
          </article>
          <article>
            <Blocks size={20} aria-hidden="true" />
            <strong>Kitchen Signal Lab</strong>
            <span>
              {locale === 'vi' ? 'Project công khai · prototype' : 'Public Project · prototype'}
            </span>
            <Link href={`/${locale}/projects/kitchen-signal-lab`}>
              {locale === 'vi' ? 'Xem Project' : 'View Project'}
            </Link>
          </article>
          <article>
            <Award size={20} aria-hidden="true" />
            <strong>{locale === 'vi' ? 'Kết quả Build Bounty' : 'Build Bounty result'}</strong>
            <span>{locale === 'vi' ? 'Chưa có kết quả công khai' : 'No public result yet'}</span>
          </article>
          <article>
            <CheckCircle2 size={20} aria-hidden="true" />
            <strong>{locale === 'vi' ? 'Hoạt động đóng góp' : 'Contribution activity'}</strong>
            <span>1 public build · 0 verified wins</span>
          </article>
        </div>
      </section>
    </main>
  );
}
