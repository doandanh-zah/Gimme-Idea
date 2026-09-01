import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AppPageHeader } from '@/components/app-surfaces';
import { copy, isLocale } from '@/lib/i18n';

export default async function SettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = copy[locale];
  const other = locale === 'en' ? 'vi' : 'en';
  return (
    <main id="main" className="app-page">
      <AppPageHeader
        eyebrow="ACCOUNT / SETTINGS"
        title={t.shell.settings}
        summary={
          locale === 'vi'
            ? 'Tùy chọn hiển thị và ngôn ngữ cho thiết bị này.'
            : 'Display and language preferences for this device.'
        }
      />
      <section className="settings-list">
        <div>
          <span>
            <strong>{locale === 'vi' ? 'Ngôn ngữ' : 'Language'}</strong>
            <small>{locale === 'vi' ? 'Tiếng Việt' : 'English'}</small>
          </span>
          <Link href={`/${other}/settings`} hrefLang={other}>
            {other.toUpperCase()}
          </Link>
        </div>
        <div>
          <span>
            <strong>{locale === 'vi' ? 'Giao diện' : 'Appearance'}</strong>
            <small>{locale === 'vi' ? 'Dark editorial' : 'Dark editorial'}</small>
          </span>
          <button type="button" disabled>
            {locale === 'vi' ? 'Mặc định' : 'Default'}
          </button>
        </div>
      </section>
    </main>
  );
}
