export const runtime = "nodejs";

import './globals.css';
import { Metadata } from 'next';
import ClientLayout from './ClientLayout';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Gimme Idea | Share your idea and feedback to earn',
  description: 'Share your startup ideas, get community feedback, and receive crypto tips. Built on Solana blockchain.',
  keywords: ['startup ideas', 'solana', 'crypto', 'blockchain', 'community feedback', 'idea validation'],
  authors: [{ name: 'DUT Superteam University Club' }],
  creator: 'DUT Superteam University Club',
  metadataBase: new URL('https://gimmeidea.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    url: 'https://gimmeidea.com',
    title: 'Gimme Idea | Share & Validate Startup Ideas',
    description: 'Share your startup ideas, get community feedback, and receive crypto tips on Solana.',
    siteName: 'Gimme Idea',
    images: [
      {
        url: 'https://gimmeidea.com/OG-img.png',
        width: 1200,
        height: 630,
        alt: 'Gimme Idea - Share & Validate Startup Ideas',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gimme Idea | Share & Validate Startup Ideas',
    description: 'Share your startup ideas, get community feedback, and receive crypto tips on Solana.',
    images: ['https://gimmeidea.com/OG-img.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: '/favicon.ico',
    shortcut: '/favicon.ico',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

// JSON-LD Schema
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Gimme Idea",
  "url": "https://gimmeidea.com",
  "description": "A platform to share startup ideas, get community feedback, and receive crypto tips on Solana blockchain.",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "creator": {
    "@type": "Organization",
    "name": "DUT Superteam University Club",
    "url": "https://gimmeidea.com"
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <Script id="polyfill-global" strategy="beforeInteractive">
          {`(function(){
            if (typeof window !== 'undefined') {
              window.global = window.global || window;
              window.globalThis = window.globalThis || window;
              window.process = window.process || { env: {} };
            }
          })();`}
        </Script>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <ClientLayout>
        {children}
      </ClientLayout>
    </html>
  );
}