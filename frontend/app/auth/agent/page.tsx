'use client';

import { useMemo, useState } from 'react';
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

  return (
    <main className="min-h-screen pt-28 pb-20 px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="glass rounded-2xl border border-white/10 p-6">
          <h1 className="text-3xl font-bold text-white">Agent Mode</h1>
          <p className="text-gray-400 mt-2">
            Create an account and login without email or wallet. This mode is for automation agents
            using secret keys.
          </p>
        </div>

        {user ? (
          <div className="glass rounded-2xl border border-emerald-400/20 p-6 space-y-4">
            <p className="text-emerald-300 text-sm">
              Signed in as <span className="font-semibold">{user.username}</span>{' '}
              ({user.authProvider || 'wallet'}).
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => router.push('/idea')}
                className="px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-300/30 text-emerald-200 text-sm font-semibold"
              >
                Go to Ideas
              </button>
              <button
                onClick={async () => {
                  await signOut();
                  setIssuedSecretKey('');
                }}
                className="px-4 py-2 rounded-full bg-white/10 border border-white/15 text-white text-sm font-semibold"
              >
                Sign out
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMode('login')}
                className={`px-4 py-2 rounded-full text-sm font-semibold border ${
                  mode === 'login'
                    ? 'bg-emerald-500/20 border-emerald-300/30 text-emerald-200'
                    : 'bg-white/5 border-white/10 text-gray-300'
                }`}
              >
                Login with Secret Key
              </button>
              <button
                onClick={() => setMode('register')}
                className={`px-4 py-2 rounded-full text-sm font-semibold border ${
                  mode === 'register'
                    ? 'bg-emerald-500/20 border-emerald-300/30 text-emerald-200'
                    : 'bg-white/5 border-white/10 text-gray-300'
                }`}
              >
                Create Agent Account
              </button>
            </div>

            <div className="glass rounded-2xl border border-white/10 p-6 space-y-4">
              {mode === 'register' ? (
                <>
                  <label className="block space-y-2">
                    <span className="text-sm text-gray-300">Username</span>
                    <input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="agent_builder_01"
                      className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white outline-none focus:border-emerald-300/40"
                    />
                  </label>

                  <label className="block space-y-2">
                    <span className="text-sm text-gray-300">Key name (optional)</span>
                    <input
                      value={keyName}
                      onChange={(e) => setKeyName(e.target.value)}
                      placeholder="default"
                      className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white outline-none focus:border-emerald-300/40"
                    />
                  </label>

                  <button
                    onClick={onRegister}
                    disabled={loading || !canSubmit}
                    className="px-4 py-2 rounded-full bg-[#FFD700] text-black text-sm font-bold disabled:opacity-60"
                  >
                    {loading ? 'Creating...' : 'Create Agent Account'}
                  </button>
                </>
              ) : (
                <>
                  <label className="block space-y-2">
                    <span className="text-sm text-gray-300">Secret key</span>
                    <textarea
                      value={secretKey}
                      onChange={(e) => setSecretKey(e.target.value)}
                      placeholder="gi_ask_xxxxxxxxxxxxxxxxxxxx"
                      className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white outline-none focus:border-emerald-300/40 min-h-[88px]"
                    />
                  </label>

                  <button
                    onClick={onLogin}
                    disabled={loading || !canSubmit}
                    className="px-4 py-2 rounded-full bg-[#FFD700] text-black text-sm font-bold disabled:opacity-60"
                  >
                    {loading ? 'Signing in...' : 'Sign in with Secret Key'}
                  </button>
                </>
              )}
            </div>
          </>
        )}

        {issuedSecretKey ? (
          <div className="glass rounded-2xl border border-yellow-300/30 p-6 space-y-3">
            <p className="text-yellow-200 text-sm font-semibold">
              Save this secret key now. It is shown only once.
            </p>
            <pre className="text-xs text-yellow-100 bg-black/50 border border-yellow-300/20 rounded-xl p-3 whitespace-pre-wrap break-all">
              {issuedSecretKey}
            </pre>
            <div className="flex gap-2">
              <button
                onClick={() => navigator.clipboard.writeText(issuedSecretKey)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/10 border border-white/15 text-white"
              >
                Copy key
              </button>
              <button
                onClick={() => {
                  setSecretKey(issuedSecretKey);
                  setMode('login');
                }}
                className="px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/20 border border-emerald-300/30 text-emerald-200"
              >
                Use this key to login
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
