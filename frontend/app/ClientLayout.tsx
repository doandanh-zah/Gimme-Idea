'use client';

import { Inter, JetBrains_Mono } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import { ConnectReminderModal } from '../components/ConnectReminderModal';
import { SubmissionModal } from '../components/SubmissionModal';
import { WalletEmailPopup } from '../components/WalletEmailPopup';
import { WalletSurfaceHost } from '../components/wallet/WalletSurfaceHost';
import { QueryProvider } from '../providers/QueryProvider';
import ErrorBoundary from '../components/ErrorBoundary';
import Script from 'next/script';
import React, { useEffect } from 'react';
import { useAppStore } from '../lib/store';
import { AuthQueryCacheBridge } from '../components/AuthQueryCacheBridge';

/**
 * AuthContext is the session source of truth.
 * Zustand only mirrors `user` for components still reading store.user —
 * do not write independent login state into the store.
 */
function AuthStoreSync() {
  const { user: authUser } = useAuth();
  const setUser = useAppStore((state) => state.setUser);

  useEffect(() => {
    setUser(authUser);
  }, [authUser, setUser]);

  return null;
}

function CommitDebugLogger() {
  useEffect(() => {
    const commitSha = process.env.NEXT_PUBLIC_GIT_COMMIT_SHA;

    if (!commitSha || typeof window === 'undefined') {
      return;
    }

    const debugWindow = window as Window & { __GIMME_IDEA_COMMIT_LOGGED__?: boolean };
    if (debugWindow.__GIMME_IDEA_COMMIT_LOGGED__) {
      return;
    }

    debugWindow.__GIMME_IDEA_COMMIT_LOGGED__ = true;
    console.log(`[Gimme Idea] Git commit: ${commitSha}`);
  }, []);

  return null;
}

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <body
      className={`${inter.variable} ${mono.variable} font-sans bg-background text-white min-h-screen selection:bg-accent selection:text-black`}
    >
      {/* Static light wash — no constellation DOM / animated orbs */}
      <div className="page-wash" aria-hidden="true" />

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

      <ErrorBoundary>
        <QueryProvider>
          <AuthProvider>
            <AuthStoreSync />
            <AuthQueryCacheBridge />
            <CommitDebugLogger />
            <Navbar />
            <ConnectReminderModal />
            <WalletSurfaceHost />
            <WalletEmailPopup />
            <SubmissionModal />
            {children}
            <Toaster
              position="bottom-right"
              toastOptions={{
                style: {
                  background: '#1A1A1A',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                },
              }}
            />
          </AuthProvider>
        </QueryProvider>
      </ErrorBoundary>
    </body>
  );
}
