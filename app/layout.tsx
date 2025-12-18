import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import { WalletProvider } from '@/contexts/WalletContext';
import { Navbar } from '@/components/Navbar';
import './globals.css';

export const metadata: Metadata = {
  title: 'GimmeIdea - Site Demo',
  description: 'Share and discover Web3 ideas on Solana',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-dark text-white antialiased">
        <WalletProvider>
          <Navbar />
          <main className="pt-16 min-h-screen">
            {children}
          </main>
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#1a1a1a',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.1)',
              },
            }}
          />
        </WalletProvider>
      </body>
    </html>
  );
}
