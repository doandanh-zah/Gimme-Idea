'use client';
export default function ErrorState({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="center-state">
      <p className="eyebrow">NETWORK / TEMPORARILY UNAVAILABLE</p>
      <h1>The evidence graph could not be loaded.</h1>
      <button className="button button-primary" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
