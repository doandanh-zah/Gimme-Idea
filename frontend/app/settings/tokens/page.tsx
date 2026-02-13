'use client';

import { useEffect, useState } from 'react';
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

  const [showGuide, setShowGuide] = useState(false);
  const [showCreateConfirm, setShowCreateConfirm] = useState(false);
  const [acknowledgeRisk, setAcknowledgeRisk] = useState(false);

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
    <main className="min-h-screen pb-20">
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
            {/* Guide Modal */}
            {showGuide && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                <div className="absolute inset-0 bg-black/70" onClick={() => setShowGuide(false)} />
                <div className="relative w-full max-w-2xl glass rounded-2xl border border-white/10 p-6 max-h-[85vh] overflow-auto">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-white">PAT Guide</h2>
                      <p className="text-sm text-gray-400 mt-1">
                        Personal Access Tokens let trusted tools act as <b>you</b> via the API. Keep them secret.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowGuide(false)}
                      className="px-3 py-1.5 bg-white/10 border border-white/10 rounded-full text-xs hover:bg-white/15"
                    >
                      Close
                    </button>
                  </div>

                  <div className="space-y-5 text-sm text-gray-200">
                    <section>
                      <h3 className="font-bold text-white mb-2">Quickstart (copy/paste)</h3>
                      <div className="space-y-2">
                        <p className="text-gray-300">
                          <b>Base URL</b>: the <b>Gimme Idea API</b> base URL (usually the same domain you’re browsing + <span className="font-mono">/api</span>).
                        </p>
                        <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                          <p className="text-xs text-gray-400 font-mono">Example:</p>
                          <code className="text-xs break-all text-white">
                            {typeof window !== 'undefined' ? `${window.location.origin}/api` : 'https://gimme-idea-production.up.railway.app/api'}
                          </code>
                        </div>
                        <p className="text-xs text-gray-500">
                          You do <b>not</b> need your own backend. Your agent calls Gimme Idea’s API directly using this base URL.
                        </p>

                        <p className="text-gray-300"><b>Headers</b>:</p>
                        <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                          <code className="text-xs block text-white">Authorization: Bearer gi_pat_…</code>
                          <code className="text-xs block text-white">Content-Type: application/json</code>
                        </div>
                      </div>
                    </section>

                    <section>
                      <h3 className="font-bold text-white mb-2">Most common actions</h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-gray-300"><b>1) Create an Idea</b> (Ideas are stored in <span className="font-mono">/projects</span> with <span className="font-mono">type=idea</span>)</p>
                          <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                            <code className="text-xs block text-white">POST /projects</code>
                            <code className="text-xs block text-gray-300 mt-2">{"{\"type\":\"idea\",\"title\":\"…\",\"description\":\"…\",\"category\":\"Developer Tooling\",\"stage\":\"Idea\",\"tags\":[\"solana\"]}"}</code>
                          </div>
                        </div>

                        <div>
                          <p className="text-gray-300"><b>2) List comments for a project/idea</b></p>
                          <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                            <code className="text-xs block text-white">GET /comments/project/&lt;PROJECT_ID&gt;</code>
                          </div>
                        </div>

                        <div>
                          <p className="text-gray-300"><b>3) Reply to a comment</b> (use <span className="font-mono">parentCommentId</span>)</p>
                          <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                            <code className="text-xs block text-white">POST /comments</code>
                            <code className="text-xs block text-gray-300 mt-2">{"{\"projectId\":\"…\",\"content\":\"…\",\"parentCommentId\":\"…\",\"isAnonymous\":false}"}</code>
                          </div>
                        </div>
                      </div>
                    </section>

                    <section>
                      <h3 className="font-bold text-white mb-2">Security & best practices</h3>
                      <ul className="list-disc pl-5 space-y-1 text-gray-300">
                        <li>PAT acts like a long-lived login for your account — treat it like a password.</li>
                        <li>Store it in a password manager / secret manager (never paste into public chats).</li>
                        <li>If leaked: revoke it immediately and create a new one.</li>
                      </ul>
                    </section>
                  </div>
                </div>
              </div>
            )}

            {/* Create Token Confirm */}
            {showCreateConfirm && (
              <div className="fixed inset-0 z-[110] flex items-center justify-center px-4">
                <div className="absolute inset-0 bg-black/70" onClick={() => setShowCreateConfirm(false)} />
                <div className="relative w-full max-w-lg glass rounded-2xl border border-white/10 p-6">
                  <h2 className="text-lg font-bold text-white">Before you create a token</h2>
                  <p className="text-sm text-gray-400 mt-2">
                    This token will be shown <b>only once</b> and can be used to act as your user via the API.
                    Please read the guide and keep it secret.
                  </p>

                  <label className="flex items-center gap-2 mt-4 text-sm text-gray-200">
                    <input
                      type="checkbox"
                      checked={acknowledgeRisk}
                      onChange={(e) => setAcknowledgeRisk(e.target.checked)}
                    />
                    <span>I understand and I will store this token securely.</span>
                  </label>

                  <div className="mt-5 flex items-center justify-end gap-2">
                    <button
                      onClick={() => setShowGuide(true)}
                      className="px-4 py-2 bg-white/10 border border-white/10 rounded-full text-sm font-bold hover:bg-white/15"
                    >
                      Guide
                    </button>
                    <button
                      disabled={!acknowledgeRisk || creating || scopes.length === 0}
                      onClick={async () => {
                        await onCreate();
                        setShowCreateConfirm(false);
                      }}
                      className="px-4 py-2 bg-primary text-white rounded-full text-sm font-bold hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {creating ? 'Creating…' : 'Create'}
                    </button>
                  </div>
                </div>
              </div>
            )}
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
                  onClick={() => { setShowCreateConfirm(true); setAcknowledgeRisk(false); }}
                  className="px-4 py-2 bg-primary text-white rounded-full text-sm font-bold hover:bg-primary-dark transition-colors"
                >
                  Create Token
                </button>
                <button
                  onClick={() => setShowGuide(true)}
                  className="px-4 py-2 bg-white/10 border border-white/10 rounded-full text-sm font-bold hover:bg-white/15 transition-colors"
                >
                  Guide
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
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigator.clipboard.writeText(plainToken)}
                        className="px-3 py-1.5 bg-white/10 border border-white/10 rounded-full text-xs hover:bg-white/15"
                      >
                        Copy
                      </button>
                      <button
                        onClick={() => setShowGuide(true)}
                        className="px-3 py-1.5 bg-white/10 border border-white/10 rounded-full text-xs hover:bg-white/15"
                      >
                        Open Guide
                      </button>
                    </div>
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
