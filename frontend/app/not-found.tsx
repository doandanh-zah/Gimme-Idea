'use client';

import Link from 'next/link';
import { ArrowLeft, Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="min-h-screen page-top text-gray-300">
      <section className="page-shell flex min-h-[60vh] items-center justify-center">
        <div className="w-full max-w-xl border border-white/10 bg-white/[0.03] p-6 text-center sm:p-8">
        <Search className="mx-auto h-11 w-11 text-[#FFD700]" aria-hidden="true" />
        <p className="ui-eyebrow mt-6 justify-center">404</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Page not found</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-gray-400">
          The page you are looking for does not exist, moved, or is no longer public.
        </p>

        <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
          <Link href="/landing" className="btn-primary">
            <Home className="h-4 w-4" aria-hidden="true" />
            Go home
          </Link>
          <button type="button" onClick={() => window.history.back()} className="btn-ghost">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Go back
          </button>
        </div>
        </div>
      </section>
    </main>
  );
}
