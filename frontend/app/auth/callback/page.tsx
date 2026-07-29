'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import {
  clearSupabaseAuthCallbackParams,
  clearSupabaseAuthStorage,
  hasSupabaseEnv,
  isRecoverableSupabaseAuthError,
  supabase,
} from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        if (!hasSupabaseEnv) {
          console.error('Auth callback error: Supabase env is not configured');
          clearSupabaseAuthCallbackParams();
          router.replace('/home');
          return;
        }

        const url = new URL(window.location.href);
        const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''));
        const oauthError =
          hashParams.get('error_description') ||
          hashParams.get('error') ||
          url.searchParams.get('error_description') ||
          url.searchParams.get('error');

        if (oauthError) {
          console.error('Auth callback error:', oauthError);
          clearSupabaseAuthCallbackParams();
          router.replace('/home');
          return;
        }

        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          clearSupabaseAuthCallbackParams();

          if (error) {
            console.error('Auth callback setSession error:', error.message || error);
            if (isRecoverableSupabaseAuthError(error)) {
              clearSupabaseAuthStorage();
              await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
            }
            router.replace('/home');
            return;
          }

          router.replace('/idea');
          return;
        }

        const code = url.searchParams.get('code');
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          clearSupabaseAuthCallbackParams();

          if (error) {
            console.error('Auth callback exchange error:', error.message || error);
            if (isRecoverableSupabaseAuthError(error)) {
              clearSupabaseAuthStorage();
              await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
            }
            router.replace('/home');
            return;
          }

          router.replace('/idea');
          return;
        }

        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth callback session error:', error.message || error);
          if (isRecoverableSupabaseAuthError(error)) {
            clearSupabaseAuthStorage();
            await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
          }
          clearSupabaseAuthCallbackParams();
          router.replace('/home');
          return;
        }

        clearSupabaseAuthCallbackParams();
        router.replace(data.session ? '/idea' : '/home');
      } catch (err) {
        console.error('Auth callback error:', err);
        if (isRecoverableSupabaseAuthError(err)) {
          clearSupabaseAuthStorage();
          await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
        }
        clearSupabaseAuthCallbackParams();
        router.replace('/home');
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
