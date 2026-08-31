import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { copy, isLocale, locales } from '@/lib/i18n';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}
export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = copy[locale];
  const other = locale === 'en' ? 'vi' : 'en';
  return (
    <div className="site-shell" lang={locale}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <Link className="brand" href={`/${locale}`} aria-label="Gimme Idea home">
          <Image src="/brand/logo-gmi.png" alt="" width={36} height={36} priority />
          <span>GIMME IDEA</span>
        </Link>
        <nav aria-label="Primary">
          <Link href={`/${locale}/problems/restaurant-food-waste`}>{t.navProblems}</Link>
          <Link href={`/${locale}/ideas/demand-pulse-for-kitchens`}>{t.navIdeas}</Link>
          <Link className="locale-switch" href={`/${other}`} hrefLang={other}>
            {other.toUpperCase()}
          </Link>
        </nav>
      </header>
      {children}
      <footer className="site-footer">
        <span>GIMME IDEA / FOUNDATION 02</span>
        <span>PROBLEM → IDEA → PROJECT</span>
      </footer>
    </div>
  );
}
