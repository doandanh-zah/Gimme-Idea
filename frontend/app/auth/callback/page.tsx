'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          router.push('/home');
          return;
        }

        // Redirect to idea page after successful login
        // The AuthContext will handle showing the wallet popup if needed
        router.push('/idea');
      } catch (err) {
        console.error('Auth callback error:', err);
        router.push('/home');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-20 text-gray-300 sm:px-6">
      <section className="w-full max-w-sm border border-white/10 bg-white/[0.03] p-6 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#FFD700]" aria-hidden="true" />
        <h1 className="mt-5 text-xl font-semibold text-white">Signing in</h1>
        <p className="mt-2 text-sm leading-6 text-gray-400">Checking your session and sending you back to Gimme Idea.</p>
      </section>
    </main>
  );
}
