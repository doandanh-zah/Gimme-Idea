'use client';

import { useEffect, useMemo, useState } from 'react';
import Navbar from '../../../components/Navbar';
import { useAppStore } from '../../../lib/store';
import { apiClient } from '../../../lib/api-client';

const ALL_SCOPES = [
  { id: 'post:read', label: 'Read posts/feed' },
  { id: 'post:write', label: 'Create posts' },
  { id: 'comment:write', label: 'Create comments' },
  { id: 'comment:reply', label: 'Reply to comments' },
];

export default function ApiTokensPage() {
  const { user } = useAppStore();

  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [tokens, setTokens] = useState<any[]>([]);
  const [error, setError] = useState<string>('');

  const [name, setName] = useState('Agent Token');
  const [scopes, setScopes] = useState<string[]>(['post:read', 'post:write', 'comment:write', 'comment:reply']);
  const [expiresAt, setExpiresAt] = useState<string>('');

  const [plainToken, setPlainToken] = useState<string>('');

  const canUse = !!user;

  const load = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await apiClient.listApiTokens();
      if (!res.success) throw new Error(res.error || 'Failed to load tokens');
      setTokens(res.data || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load tokens');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canUse) load();
  }, [canUse]);

  const onToggleScope = (id: string) => {
    setScopes((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

  const onCreate = async () => {
    setError('');
    setPlainToken('');
    setCreating(true);
    try {
      const res = await apiClient.createApiToken({
        name,
        scopes,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      });
      if (!res.success || !res.data?.token) throw new Error(res.error || 'Failed to create token');

      setPlainToken(res.data.token);
      await load();
    } catch (e: any) {
      setError(e?.message || 'Failed to create token');
    } finally {
      setCreating(false);
    }
  };

  const onRevoke = async (id: string) => {
    if (!confirm('Revoke this token? It will stop working immediately.')) return;

    setError('');
    try {
      const res = await apiClient.revokeApiToken(id);
      if (!res.success) throw new Error(res.error || 'Failed to revoke token');
      await load();
    } catch (e: any) {
      setError(e?.message || 'Failed to revoke token');
    }
  };

  return (
    <main className="min-h-screen bg-background pb-20">
      <Navbar />

      <div className="pt-28 px-6 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">API Tokens</h1>
        <p className="text-gray-400 mb-8">
          Create Personal Access Tokens (PAT) to allow trusted agents to post/comment as your user with scoped permissions.
        </p>

        {!canUse && (
          <div className="glass p-6 rounded-xl border border-white/10">
            <p className="text-gray-300">Please sign in to manage tokens.</p>
          </div>
        )}

        {canUse && (
          <>
            <div className="glass p-6 rounded-xl border border-white/10 mb-8">
              <h2 className="text-lg font-bold mb-3">Create Token</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 font-mono">Name</label>
                  <input
                    className="w-full mt-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-mono">Expires (optional)</label>
                  <input
                    type="datetime-local"
                    className="w-full mt-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="text-xs text-gray-400 font-mono">Scopes</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                  {ALL_SCOPES.map((s) => (
                    <label key={s.id} className="flex items-center gap-2 text-sm text-gray-200">
                      <input type="checkbox" checked={scopes.includes(s.id)} onChange={() => onToggleScope(s.id)} />
                      <span>{s.label}</span>
                      <span className="text-gray-500 font-mono text-xs">({s.id})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-5 flex items-center gap-3">
                <button
                  disabled={creating || scopes.length === 0}
                  onClick={onCreate}
                  className="px-4 py-2 bg-primary text-white rounded-full text-sm font-bold hover:bg-primary-dark transition-colors"
                >
                  {creating ? 'Creating…' : 'Create Token'}
                </button>
                <p className="text-xs text-gray-400">
                  The token value is shown <b>only once</b>. Store it safely.
                </p>
              </div>

              {plainToken && (
                <div className="mt-4 p-4 rounded-xl bg-black/40 border border-white/10">
                  <p className="text-xs text-gray-400 font-mono mb-2">Your new token (copy now):</p>
                  <div className="flex flex-col md:flex-row gap-3 md:items-center">
                    <code className="break-all text-sm text-white">{plainToken}</code>
                    <button
                      onClick={() => navigator.clipboard.writeText(plainToken)}
                      className="px-3 py-1.5 bg-white/10 border border-white/10 rounded-full text-xs hover:bg-white/15"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}

              {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
            </div>

            <div className="glass p-6 rounded-xl border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Your Tokens</h2>
                <button
                  onClick={load}
                  disabled={loading}
                  className="px-3 py-1.5 bg-white/10 border border-white/10 rounded-full text-xs hover:bg-white/15"
                >
                  {loading ? 'Refreshing…' : 'Refresh'}
                </button>
              </div>

              {tokens.length === 0 ? (
                <p className="text-gray-400 text-sm">No tokens yet.</p>
              ) : (
                <div className="space-y-3">
                  {tokens.map((t) => (
                    <div key={t.id} className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <div>
                          <p className="text-white font-bold">{t.name}</p>
                          <p className="text-xs text-gray-400 font-mono break-all">id: {t.id}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => onRevoke(t.id)}
                            className="px-3 py-1.5 bg-red-500/15 border border-red-500/30 text-red-200 rounded-full text-xs hover:bg-red-500/25"
                          >
                            Revoke
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-400">
                        <div>Scopes: <span className="font-mono">{(t.scopes || []).join(', ') || '-'}</span></div>
                        <div>Last used: <span className="font-mono">{t.last_used_at || '-'}</span></div>
                        <div>Expires: <span className="font-mono">{t.expires_at || '-'}</span></div>
                        <div>Revoked: <span className="font-mono">{t.revoked_at || '-'}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
