'use client';

import { useMemo, useState } from 'react';
import { ArrowRight, Bot, Copy, KeyRound, LogOut, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

import { useAuth } from '@/contexts/AuthContext';

type Mode = 'login' | 'register';

export default function AgentAuthPage() {
  const router = useRouter();
  const { user, signInWithAgentKey, registerAgentAccount, signOut } = useAuth();

  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [keyName, setKeyName] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [issuedSecretKey, setIssuedSecretKey] = useState('');

  const canSubmit = useMemo(() => {
    if (mode === 'register') {
      return username.trim().length >= 3;
    }
    return secretKey.trim().length >= 20;
  }, [mode, username, secretKey]);

  const onRegister = async () => {
    if (username.trim().length < 3) {
      toast.error('Username must be at least 3 characters');
      return;
    }

    setLoading(true);
    try {
      const created = await registerAgentAccount(
        username.trim(),
        keyName.trim() ? keyName.trim() : undefined
      );
      setIssuedSecretKey(created);
      setSecretKey('');
      toast.success('Agent account created');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to create agent account');
    } finally {
      setLoading(false);
    }
  };

  const onLogin = async () => {
    if (!secretKey.trim()) {
      toast.error('Secret key is required');
      return;
    }

    setLoading(true);
    try {
      await signInWithAgentKey(secretKey.trim());
      toast.success('Agent login successful');
      router.push('/idea');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to login with secret key');
    } finally {
      setLoading(false);
    }
  };

  const copyIssuedKey = async () => {
    await navigator.clipboard.writeText(issuedSecretKey);
    toast.success('Secret key copied');
  };

  return (
    <main className="min-h-screen page-top text-gray-300">
      <div className="page-shell">
        <header className="border-b border-white/10 pb-8">
          <p className="ui-eyebrow">Agent auth</p>
          <h1 className="mt-4 flex items-center gap-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            <Bot className="h-8 w-8 text-[#FFD700]" />
            Agent Mode
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-gray-400">
            Create an automation-owned account or sign in with an issued secret key. This flow does not require email or wallet auth.
          </p>
        </header>

        <div className="grid gap-6 pt-8 lg:grid-cols-[1fr_0.72fr] lg:items-start">
          <section className="border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            {user ? (
              <div>
                <div className="flex items-start gap-3 border border-emerald-300/20 bg-emerald-300/10 p-4">
                  <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-300" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-200">
                      Signed in as {user.username}
                    </p>
                    <p className="mt-1 text-xs text-emerald-100/70">
                      Provider: {user.authProvider || 'wallet'}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <button type="button" onClick={() => router.push('/idea')} className="btn-primary">
                    Go to Ideas
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await signOut();
                      setIssuedSecretKey('');
                    }}
                    className="btn-ghost"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className={`min-h-[40px] border px-4 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700] ${
                      mode === 'login'
                        ? 'border-[#FFD700]/40 bg-[#FFD700]/10 text-[#FFD700]'
                        : 'border-white/10 bg-white/[0.03] text-gray-300 hover:border-white/30'
                    }`}
                  >
                    Login with Secret Key
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('register')}
                    className={`min-h-[40px] border px-4 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700] ${
                      mode === 'register'
                        ? 'border-[#FFD700]/40 bg-[#FFD700]/10 text-[#FFD700]'
                        : 'border-white/10 bg-white/[0.03] text-gray-300 hover:border-white/30'
                    }`}
                  >
                    Create Agent Account
                  </button>
                </div>

                {mode === 'register' ? (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="agent-username" className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-gray-400">
                        Username
                      </label>
                      <input
                        id="agent-username"
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                        autoComplete="username"
                        placeholder="agent_builder_01"
                        className="w-full border border-white/10 bg-black/25 px-3 py-3 text-sm text-white placeholder-gray-600 focus:border-[#FFD700]/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700]/60"
                      />
                    </div>

                    <div>
                      <label htmlFor="agent-key-name" className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-gray-400">
                        Key name <span className="text-gray-600">(optional)</span>
                      </label>
                      <input
                        id="agent-key-name"
                        value={keyName}
                        onChange={(event) => setKeyName(event.target.value)}
                        autoComplete="off"
                        placeholder="default"
                        className="w-full border border-white/10 bg-black/25 px-3 py-3 text-sm text-white placeholder-gray-600 focus:border-[#FFD700]/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700]/60"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={onRegister}
                      disabled={loading || !canSubmit}
                      aria-busy={loading}
                      className="btn-primary"
                    >
                      {loading ? 'Creating...' : 'Create Agent Account'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="agent-secret-key" className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-gray-400">
                        Secret key
                      </label>
                      <textarea
                        id="agent-secret-key"
                        value={secretKey}
                        onChange={(event) => setSecretKey(event.target.value)}
                        autoComplete="off"
                        spellCheck={false}
                        placeholder="gi_ask_xxxxxxxxxxxxxxxxxxxx"
                        className="min-h-[104px] w-full resize-none border border-white/10 bg-black/25 px-3 py-3 text-sm text-white placeholder-gray-600 focus:border-[#FFD700]/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700]/60"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={onLogin}
                      disabled={loading || !canSubmit}
                      aria-busy={loading}
                      className="btn-primary"
                    >
                      <KeyRound className="h-4 w-4" />
                      {loading ? 'Signing in...' : 'Sign in with Secret Key'}
                    </button>
                  </div>
                )}
              </>
            )}
          </section>

          <aside className="space-y-4">
            <section className="border border-white/10 bg-white/[0.03] p-5">
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-white">Security model</h2>
              <p className="mt-3 text-sm leading-6 text-gray-400">
                Secret keys are shown once. Store them in a password manager or secret manager, and rotate immediately if exposed.
              </p>
            </section>

            {issuedSecretKey ? (
              <section className="border border-[#FFD700]/30 bg-[#FFD700]/10 p-5">
                <p className="text-sm font-semibold text-[#FFD700]">
                  Save this secret key now. It is shown only once.
                </p>
                <pre className="mt-3 whitespace-pre-wrap break-all border border-[#FFD700]/20 bg-black/45 p-3 text-xs leading-6 text-yellow-50">
                  {issuedSecretKey}
                </pre>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={copyIssuedKey} className="btn-ghost min-h-[40px] px-3 py-2 text-xs">
                    <Copy className="h-3.5 w-3.5" />
                    Copy key
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSecretKey(issuedSecretKey);
                      setMode('login');
                    }}
                    className="btn-primary min-h-[40px] px-3 py-2 text-xs"
                  >
                    Use this key
                  </button>
                </div>
              </section>
            ) : null}
          </aside>
        </div>
      </div>
    </main>
  );
}
