import './globals.css';
import './v1.css';
import './brand-system.css';
import type { Metadata } from 'next';
import { Suspense, type ReactNode } from 'react';
import { AuthProvider } from '@/lib/auth';
import { GoogleAnalytics } from '@/components/google-analytics';
import { headers } from 'next/headers';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: { default: 'Gimme Idea — Find what matters', template: '%s — Gimme Idea' },
  description: 'An evidence-backed network from problems to ideas to projects.',
  icons: { icon: '/brand/logo-gmi.png' },
};
export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = (await headers()).get('x-gimme-locale') === 'vi' ? 'vi' : 'en';
  return (
    <html lang={locale} data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://use.typekit.net" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://use.typekit.net/qqv3drj.css" />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
        <Suspense fallback={null}>
          <GoogleAnalytics />
        </Suspense>
      </body>
    </html>
  );
}
