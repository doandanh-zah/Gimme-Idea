import './globals.css';
import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import React from 'react';
import { WalletContextProvider } from '../lib/wallet-provider';

export const metadata: Metadata = {
  title: 'Gimme Idea | Solana Feedback Platform',
  description: 'Validate your Solana protocol ideas with community feedback.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-background text-white min-h-screen selection:bg-accent selection:text-black">
        <WalletContextProvider>
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
        </WalletContextProvider>
      </body>
    </html>
  );
}