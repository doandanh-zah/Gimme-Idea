import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { SiteNav } from '@/components/site-nav';
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
  return (
    <div className="site-shell" lang={locale}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <div className="site-header-inner">
          <Link className="brand" href={`/${locale}`} aria-label="Gimme Idea home">
            <Image src="/brand/logo-gmi.png" alt="" width={36} height={36} priority />
            <span>GIMME IDEA</span>
          </Link>
          <SiteNav
            locale={locale}
            labels={{
              home: t.navHome,
              problems: t.navProblems,
              ideas: t.navIdeas,
              menu: t.menu,
              close: t.closeMenu,
              explore: t.exploreNetwork,
              homeHint: t.homeHint,
              problemHint: t.problemHint,
              ideaHint: t.ideaHint,
            }}
          />
        </div>
      </header>
      {children}
      <footer className="site-footer">
        <span>GIMME IDEA / FOUNDATION 02</span>
        <span>PROBLEM → IDEA → PROJECT</span>
      </footer>
    </div>
  );
}
