'use client';

import Link from 'next/link';
import { Lightbulb } from 'lucide-react';
import { WalletButton } from './WalletButton';

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold">
            <span className="text-white">Gimme</span>
            <span className="text-accent">Idea</span>
          </span>
        </Link>

        {/* Wallet Button */}
        <WalletButton />
      </div>
    </nav>
  );
}
