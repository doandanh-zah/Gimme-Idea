'use client';

import './globals.css';
import { Inter, JetBrains_Mono, Space_Grotesk, Quantico } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { WalletProvider } from '../components/WalletProvider';
import { AuthProvider } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import { ConnectReminderModal } from '../components/ConnectReminderModal';
import { ConnectWalletPopup } from '../components/ConnectWalletPopup';
import { SubmissionModal } from '../components/SubmissionModal';
import Script from 'next/script';
import React from 'react';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });
const space = Space_Grotesk({ subsets: ['latin'], variable: '--font-space' });
const quantico = Quantico({ weight: ['400', '700'], subsets: ['latin'], variable: '--font-quantico' });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>Gimme Idea | Share your idea and feedback to earn</title>
        <meta name="description" content="Share your startup ideas, get community feedback, and receive crypto tips. Built on Solana blockchain." />
        <meta name="keywords" content="startup ideas, solana, crypto, blockchain, community feedback, idea validation" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href="https://gimmeidea.com" />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://gimmeidea.com" />
        <meta property="og:title" content="Gimme Idea | Share & Validate Startup Ideas" />
        <meta property="og:description" content="Share your startup ideas, get community feedback, and receive crypto tips on Solana." />
        <meta property="og:image" content="https://gimmeidea.com/OG-img.png" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Gimme Idea | Share & Validate Startup Ideas" />
        <meta name="twitter:description" content="Share your startup ideas, get community feedback, and receive crypto tips on Solana." />
        <meta name="twitter:image" content="https://gimmeidea.com/OG-img.png" />
        
        {/* Schema Markup - Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
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
            })
          }}
        />
      </head>
      <body className={`${inter.variable} ${mono.variable} ${space.variable} ${quantico.variable} font-sans bg-background text-white min-h-screen selection:bg-accent selection:text-black`}>
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-65VF8CLCR7"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-65VF8CLCR7');
          `}
        </Script>

        <WalletProvider>
          <AuthProvider>
            <Navbar />
            <ConnectWalletPopup />
            <ConnectReminderModal />
            <SubmissionModal />
            <Toaster
              position="bottom-right"
              toastOptions={{
                style: {
                  background: '#1A1A1A',
                  color: '#fff',
                  border: '1px solid #333',
                },
                success: {
                  iconTheme: {
                    primary: '#14F195',
                    secondary: '#000',
                  },
                },
              }}
            />
            {children}
          </AuthProvider>
        </WalletProvider>
      </body>
    </html>
  );
}