'use client';

import { AlertCircle } from 'lucide-react';

export default function BountiesError({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="app-page bounty-page-error">
      <AlertCircle size={28} aria-hidden="true" />
      <h1>Couldn&apos;t load bounties</h1>
      <p>The Devnet connection failed. Your funds and on-chain state are unchanged.</p>
      <button type="button" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
