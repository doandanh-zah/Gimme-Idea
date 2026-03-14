'use client';

// CRITICAL: Import polyfills FIRST before any other imports
import '../polyfills';

import { Inter, JetBrains_Mono, Space_Grotesk, Quantico } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { WalletProvider } from '../components/WalletProvider';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { LazorkitProvider } from '../contexts/LazorkitContext';
import Navbar from '../components/Navbar';
import { ConnectReminderModal } from '../components/ConnectReminderModal';
import { ConnectWalletPopup } from '../components/ConnectWalletPopup';
import { SubmissionModal } from '../components/SubmissionModal';
import { WalletEmailPopup } from '../components/WalletEmailPopup';
import ErrorBoundary from '../components/ErrorBoundary';
import ConstellationBackground from '../components/ConstellationBackground';
import Script from 'next/script';
import React, { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAppStore } from '../lib/store';

// Component to sync AuthContext user with Zustand store
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

// Note: Global polyfills are now handled via webpack ProvidePlugin in next.config.js
// and synchronous inline script in layout.tsx

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });
const space = Space_Grotesk({ subsets: ['latin'], variable: '--font-space' });
const quantico = Quantico({ weight: ['400', '700'], subsets: ['latin'], variable: '--font-quantico' });

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname();
  const previousPath = useRef(pathname);
  const [routeLoading, setRouteLoading] = useState(false);

  useEffect(() => {
    if (previousPath.current !== pathname) {
      setRouteLoading(true);
      const t = setTimeout(() => setRouteLoading(false), 550);
      previousPath.current = pathname;
      return () => clearTimeout(t);
    }
  }, [pathname]);

  return (
    <body className={`${inter.variable} ${mono.variable} ${space.variable} ${quantico.variable} font-sans bg-background text-white min-h-screen selection:bg-accent selection:text-black`}>
      {routeLoading && (
        <div className="fixed inset-0 z-[210] bg-black/45 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
          <div className="w-10 h-10 rounded-full border-2 border-[#FFD700]/30 border-t-[#FFD700] animate-spin" />
        </div>
      )}

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
        <WalletProvider>
          <LazorkitProvider>
            <AuthProvider>
              <AuthStoreSync />
              <CommitDebugLogger />
              {/* Global Constellation Background */}
              <ConstellationBackground opacity={0.25} showShootingStars={true} showGradientOrbs={true} />
              <Navbar />
              <ConnectReminderModal />
              <ConnectWalletPopup />
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
          </LazorkitProvider>
        </WalletProvider>
      </ErrorBoundary>
    </body>
  );
}
