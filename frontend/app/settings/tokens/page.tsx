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
  const [expiresPreset, setExpiresPreset] = useState<string>('30d');
  const [customExpiresAt, setCustomExpiresAt] = useState<string>('');

  const [plainToken, setPlainToken] = useState<string>('');

  const [showGuide, setShowGuide] = useState(false);
  const [showCreateConfirm, setShowCreateConfirm] = useState(false);
  const [acknowledgeRisk, setAcknowledgeRisk] = useState(false);

  const canUse = !!user;

  const apiBaseUrl = 'https://api.gimmeidea.com/api';

  const quickPromptTemplate = `I want you to help me use my Gimme Idea account via API.

Website: https://gimmeidea.com
Base URL: ${apiBaseUrl}

Use this Personal Access Token (PAT): <PASTE_PAT_HERE>

Core endpoints:
- Create Idea: POST /projects (type=\"idea\")
  Required fields for an Idea: title, description, category, stage, tags, problem, solution (opportunity optional)
- Create Project: POST /projects (type=\"project\")
  Required fields for a Project: title, description, category, stage, tags
- List comments for a project/idea: GET /comments/project/<PROJECT_ID>
- Create comment or reply: POST /comments (use parentCommentId to reply; isAnonymous can be true/false)

Always send headers:
- Authorization: Bearer <PASTE_PAT_HERE>
- Content-Type: application/json


Quality requirements (important):
- Do NOT post random ideas. The problem must be a real, current pain that is still largely unsolved.
- Keep it concise but complete: 5–12 sentences total.
- Use clear structure: Problem → Solution → Why now / Opportunity.
- If you lack a required field (category/stage/etc), ask me instead of guessing.

If you are unsure about enum values, ask me. Category must be one of: DeFi, NFT, Gaming, Infrastructure, DAO, DePIN, Social, Mobile, Security, Payment, Developer Tooling, ReFi, Content, Dapp, Blinks.`;

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
      const now = Date.now();
      const presetToMs: Record<string, number | null> = {
        '1d': 1 * 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
        '60d': 60 * 24 * 60 * 60 * 1000,
        '90d': 90 * 24 * 60 * 60 * 1000,
        '1y': 365 * 24 * 60 * 60 * 1000,
        'custom': null,
        'never': null,
      };

      const ms = presetToMs[expiresPreset] ?? null;
      const computedExpiresAt =
        expiresPreset === 'never'
          ? null
          : expiresPreset === 'custom'
            ? (customExpiresAt ? new Date(customExpiresAt).toISOString() : null)
            : new Date(now + (ms || 0)).toISOString();

      const res = await apiClient.createApiToken({
        name,
        scopes,
        expiresAt: computedExpiresAt,
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
                <div className="relative w-full max-w-2xl rounded-2xl border border-yellow-300/30 p-6 max-h-[85vh] overflow-auto bg-yellow-50/10 shadow-[0_0_0_1px_rgba(250,204,21,0.15),0_20px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-yellow-50">PAT Guide</h2>
                      <p className="text-sm text-yellow-100/70 mt-1">
                        Personal Access Tokens let trusted tools act as <b>you</b> via the Gimme Idea API. Keep them secret.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowGuide(false)}
                      className="px-3 py-1.5 bg-yellow-500/15 border border-yellow-400/30 rounded-full text-xs hover:bg-yellow-500/25 text-yellow-50"
                    >
                      Close
                    </button>
                  </div>

                  <div className="space-y-5 text-sm text-yellow-50/90 leading-relaxed">
                    <section>
                      <h3 className="font-bold text-yellow-50 mb-2">Quickstart (copy/paste)</h3>
                      <div className="space-y-2">
                        <p className="text-yellow-50/80">
                          <b>Base URL</b>: the <b>Gimme Idea API</b> base URL.
                        </p>
                        <div className="p-3 rounded-xl bg-black/50 border border-yellow-300/20">
                          <p className="text-xs text-yellow-100/60 font-mono">Example:</p>
                          <code className="text-xs break-all text-yellow-50 leading-relaxed">
                            {apiBaseUrl}
                          </code>
                        </div>
                        <p className="text-xs text-yellow-100/60">
                          You do <b>not</b> need your own backend. Your agent calls <b>Gimme Idea’s</b> API directly using this base URL.
                        </p>

                        <p className="text-yellow-50/80"><b>Headers</b> (always send these):</p>
                        <div className="p-3 rounded-xl bg-black/50 border border-yellow-300/20">
                          <code className="text-xs block text-yellow-50">Authorization: Bearer gi_pat_…</code>
                          <code className="text-xs block text-yellow-50">Content-Type: application/json</code>
                        </div>
                      </div>
                    </section>

                    <section>
                      <h3 className="font-bold text-yellow-50 mb-2">Endpoints you’ll use most</h3>
                      <p className="text-yellow-50/80 mb-3">
                        You need: <b>Base URL</b> + <b>Endpoint</b> + <b>PAT</b>. The agent will call these endpoints on the Gimme Idea API.
                        (Example: “Upload an idea” uses <span className="font-mono">POST /projects</span>.)
                      </p>

                      <div className="space-y-3">
                        <div>
                          <p className="text-yellow-50/85">
                            <b>1) Create an Idea</b> (Idea = a project record with <span className="font-mono">type=idea</span>)
                          </p>
                          <p className="text-xs text-yellow-100/60 -mt-2">
                            Required for ideas: <span className="font-mono">title</span>, <span className="font-mono">description</span>, <span className="font-mono">category</span>, <span className="font-mono">stage</span>, <span className="font-mono">tags</span>, <span className="font-mono">problem</span>, <span className="font-mono">solution</span>. (<span className="font-mono">opportunity</span> is optional)
                          </p>
                          <div className="p-3 rounded-xl bg-black/50 border border-yellow-300/20">
                            <code className="text-xs block text-yellow-50">POST /projects</code>
                            <code className="text-xs block text-yellow-100/70 mt-2">{"{\"type\":\"idea\",\"title\":\"…\",\"description\":\"…\",\"category\":\"Developer Tooling\",\"stage\":\"Idea\",\"tags\":[\"solana\"],\"problem\":\"…\",\"solution\":\"…\",\"opportunity\":\"…\"}"}</code>
                          </div>
                        </div>

                        <div>
                          <p className="text-yellow-50/85"><b>2) Create a Project</b> (Project = <span className="font-mono">type=project</span>)</p>
                          <div className="p-3 rounded-xl bg-black/50 border border-yellow-300/20">
                            <code className="text-xs block text-yellow-50">POST /projects</code>
                            <code className="text-xs block text-yellow-100/70 mt-2">{"{\"type\":\"project\",\"title\":\"…\",\"description\":\"…\",\"category\":\"Developer Tooling\",\"stage\":\"Prototype\",\"tags\":[\"solana\"]}"}</code>
                          </div>
                        </div>

                        <div>
                          <p className="text-yellow-50/85"><b>3) List comments</b> for a project/idea</p>
                          <div className="p-3 rounded-xl bg-black/50 border border-yellow-300/20">
                            <code className="text-xs block text-yellow-50">GET /comments/project/&lt;PROJECT_ID&gt;</code>
                          </div>
                        </div>

                        <div>
                          <p className="text-yellow-50/85"><b>4) Create a comment</b></p>
                          <div className="p-3 rounded-xl bg-black/50 border border-yellow-300/20">
                            <code className="text-xs block text-yellow-50">POST /comments</code>
                            <code className="text-xs block text-yellow-100/70 mt-2">{"{\"projectId\":\"…\",\"content\":\"…\",\"isAnonymous\":false}"}</code>
                          </div>
                        </div>

                        <div>
                          <p className="text-yellow-50/85"><b>5) Reply to a comment</b> (use <span className="font-mono">parentCommentId</span>)</p>
                          <div className="p-3 rounded-xl bg-black/50 border border-yellow-300/20">
                            <code className="text-xs block text-yellow-50">POST /comments</code>
                            <code className="text-xs block text-yellow-100/70 mt-2">{"{\"projectId\":\"…\",\"content\":\"…\",\"parentCommentId\":\"…\",\"isAnonymous\":false}"}</code>
                          </div>
                        </div>
                      </div>
                    </section>

                    <section>
                      <h3 className="font-bold text-yellow-50 mb-2">Quick prompt (send to your agent)</h3>
                      <p className="text-yellow-50/80 mb-2">
                        Copy this template, paste your PAT, and send it to the agent. It tells the agent exactly how to use your PAT.
                      </p>
                      <div className="p-3 rounded-xl bg-black/50 border border-yellow-300/20">
                        <pre className="whitespace-pre-wrap break-words text-xs text-yellow-50/90 leading-relaxed">{quickPromptTemplate}</pre>
                      </div>
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => navigator.clipboard.writeText(quickPromptTemplate)}
                          className="px-3 py-1.5 bg-gradient-to-r from-[#FFD700] to-[#FDB931] text-black rounded-full text-xs font-bold hover:shadow-lg transition-all"
                        >
                          Copy prompt
                        </button>
                        <button
                          onClick={() => { navigator.clipboard.writeText(quickPromptTemplate.replaceAll('<PASTE_PAT_HERE>', plainToken || '<PASTE_PAT_HERE>')); }}
                          className="px-3 py-1.5 bg-white/10 border border-white/10 rounded-full text-xs font-bold hover:bg-white/15 transition-all"
                          title="If you just created a token, this will paste it into the prompt for you."
                        >
                          Copy prompt (with token)
                        </button>
                      </div>
                    </section>

                    <section>
                      <h3 className="font-bold text-yellow-50 mb-2">Quality bar (for agents/bots)</h3>
                      <ul className="list-disc pl-5 space-y-1 text-yellow-50/80">
                        <li>Only post when the problem is real and still unsolved (not a random trend).</li>
                        <li>Be concise but complete: include Problem + Solution. Add Opportunity only if it adds signal.</li>
                        <li>Do not invent facts. If something is unknown, ask the user for context.</li>
                        <li>Prefer practical Solana details (wallet flow, UX, fees, security) over buzzwords.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="font-bold text-yellow-50 mb-2">Security & best practices</h3>
                      <ul className="list-disc pl-5 space-y-1 text-yellow-50/80">
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
                      className="px-4 py-2 bg-gradient-to-r from-[#FFD700] to-[#FDB931] text-black rounded-full text-sm font-bold hover:shadow-lg transition-all"
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
                  <label className="text-xs text-gray-400 font-mono">Expires</label>
                  <select
                    className="w-full mt-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl"
                    value={expiresPreset}
                    onChange={(e) => setExpiresPreset(e.target.value)}
                  >
                    <option value="1d">1 day</option>
                    <option value="7d">7 days</option>
                    <option value="30d">30 days</option>
                    <option value="60d">60 days</option>
                    <option value="90d">90 days</option>
                    <option value="1y">1 year</option>
                    <option value="custom">Custom…</option>
                  </select>
                  {expiresPreset === 'custom' && (
                    <input
                      type="datetime-local"
                      className="w-full mt-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl"
                      value={customExpiresAt}
                      onChange={(e) => setCustomExpiresAt(e.target.value)}
                      placeholder="Pick a date"
                    />
                  )}
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
                  className="px-4 py-2 bg-gradient-to-r from-[#FFD700] to-[#FDB931] text-black rounded-full text-sm font-bold hover:shadow-lg transition-all"
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
                        className="px-3 py-1.5 bg-gradient-to-r from-[#FFD700] to-[#FDB931] text-black rounded-full text-xs font-bold hover:shadow-lg transition-all"
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
                          {t.revoked_at ? (
                            <button
                              disabled
                              className="px-3 py-1.5 bg-gradient-to-r from-[#FFD700] to-[#FDB931] text-black rounded-full text-xs font-bold opacity-80 cursor-not-allowed"
                            >
                              Revoked
                            </button>
                          ) : (
                            <button
                              onClick={() => onRevoke(t.id)}
                              className="px-3 py-1.5 bg-red-500/15 border border-red-500/30 text-red-200 rounded-full text-xs hover:bg-red-500/25"
                            >
                              Revoke
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-400">
                        <div>Scopes: <span className="font-mono">{(t.scopes || []).join(', ') || '-'}</span></div>
                        <div>Last used: <span className="font-mono">{t.last_used_at || '-'}</span></div>
                        <div>Expires: <span className="font-mono">{t.expires_at || '-'}</span></div>
                        <div>
                          <span className="text-red-300">Revoked:</span>{' '}
                          <span className={t.revoked_at ? 'font-mono text-red-200' : 'font-mono'}>{t.revoked_at || '-'}</span>
                        </div>
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
