'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BookOpenText,
  CheckCircle2,
  Copy,
  KeyRound,
  RefreshCw,
  ShieldAlert,
  Trash2,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { apiClient } from '../../../lib/api-client';
import { useAppStore } from '../../../lib/store';

const ALL_SCOPES = [
  { id: 'post:read', label: 'Read posts/feed' },
  { id: 'post:write', label: 'Create posts' },
  { id: 'comment:write', label: 'Create comments' },
  { id: 'comment:reply', label: 'Reply to comments' },
  { id: 'feed:write', label: 'Manage feeds and bookmarks' },
  { id: 'profile:write', label: 'Edit profile' },
  { id: 'social:write', label: 'Follow and social actions' },
  { id: 'hackathon:write', label: 'Manage hackathon participation' },
  { id: 'notification:read', label: 'Read notifications and announcements' },
  { id: 'notification:write', label: 'Manage notifications and announcements' },
];

type ApiTokenRecord = {
  id: string;
  name: string;
  scopes?: string[];
  last_used_at?: string | null;
  expires_at?: string | null;
  revoked_at?: string | null;
};

const apiBaseUrl = 'https://api.gimmeidea.com/api';

function TokenSkeletonList() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="border border-white/10 bg-white/[0.03] p-4">
          <div className="h-5 w-40 animate-pulse bg-white/10" />
          <div className="mt-3 h-4 w-64 animate-pulse bg-white/10" />
          <div className="mt-5 grid gap-2 md:grid-cols-2">
            <div className="h-4 w-full animate-pulse bg-white/10" />
            <div className="h-4 w-full animate-pulse bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ApiTokensPage() {
  const user = useAppStore((state) => state.user);

  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [tokens, setTokens] = useState<ApiTokenRecord[]>([]);
  const [error, setError] = useState('');

  const [name, setName] = useState('Agent Token');
  const [scopes, setScopes] = useState<string[]>([
    'post:read',
    'post:write',
    'comment:write',
    'comment:reply',
    'feed:write',
    'profile:write',
    'social:write',
    'hackathon:write',
    'notification:read',
    'notification:write',
  ]);
  const [expiresPreset, setExpiresPreset] = useState('30d');
  const [customExpiresAt, setCustomExpiresAt] = useState('');
  const [plainToken, setPlainToken] = useState('');

  const [showGuide, setShowGuide] = useState(false);
  const [showCreateConfirm, setShowCreateConfirm] = useState(false);
  const [acknowledgeRisk, setAcknowledgeRisk] = useState(false);
  const [revokeCandidate, setRevokeCandidate] = useState<ApiTokenRecord | null>(null);

  const canUse = Boolean(user);
  const canCreate = name.trim().length > 0 && scopes.length > 0;

  const quickPromptTemplate = useMemo(() => `I want you to help me use my Gimme Idea account via API.

Website: https://gimmeidea.com
Base URL: ${apiBaseUrl}

Use this Personal Access Token (PAT): <PASTE_PAT_HERE>

Recommended scopes by workflow:
- posting ideas/projects: post:write
- commenting: comment:write
- replying: comment:reply
- managing feeds/bookmarks: feed:write
- editing profile/follow graph: profile:write + social:write
- hackathon team/submission actions: hackathon:write
- reading notifications/announcements: notification:read
- clearing or marking notifications: notification:write

Core endpoints:
- Create Idea: POST /projects (type="idea")
  Required fields for an Idea: title, description, category, stage, tags, problem, solution (opportunity optional)
- Create Project: POST /projects (type="project")
  Required fields for a Project: title, description, category, stage, tags
- List comments for a project/idea: GET /comments/project/<PROJECT_ID>
- Create comment or reply: POST /comments (use parentCommentId to reply; isAnonymous can be true/false)

Always send headers:
- Authorization: Bearer <PASTE_PAT_HERE>
- Content-Type: application/json

Quality requirements:
- Do NOT post random ideas. The problem must be a real, current pain that is still largely unsolved.
- Keep it concise but complete: 5-12 sentences total.
- Use clear structure: Problem -> Solution -> Why now / Opportunity.
- If you lack a required field (category/stage/etc), ask me instead of guessing.

If you are unsure about enum values, ask me. Category must be one of: DeFi, NFT, Gaming, Infrastructure, DAO, DePIN, Social, Mobile, Security, Payment, Developer Tooling, ReFi, Content, Dapp, Blinks.`, []);

  const copyText = async (text: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(message);
    } catch {
      toast.error('Could not copy to clipboard');
    }
  };

  const load = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const res = await apiClient.listApiTokens();
      if (!res.success) throw new Error(res.error || 'Failed to load tokens');
      setTokens(res.data || []);
    } catch (requestError: any) {
      setError(requestError?.message || 'Failed to load tokens');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canUse) {
      void load();
    }
  }, [canUse, load]);

  const onToggleScope = (id: string) => {
    setScopes((previous) =>
      previous.includes(id) ? previous.filter((scope) => scope !== id) : [...previous, id]
    );
  };

  const getExpiresAt = () => {
    const now = Date.now();
    const presetToMs: Record<string, number | null> = {
      '1d': 1 * 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '60d': 60 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000,
      '1y': 365 * 24 * 60 * 60 * 1000,
      custom: null,
      never: null,
    };

    if (expiresPreset === 'never') return null;
    if (expiresPreset === 'custom') {
      return customExpiresAt ? new Date(customExpiresAt).toISOString() : null;
    }

    const ms = presetToMs[expiresPreset] ?? presetToMs['30d'];
    return new Date(now + (ms || 0)).toISOString();
  };

  const onCreate = async () => {
    setError('');
    setPlainToken('');
    setCreating(true);
    try {
      const res = await apiClient.createApiToken({
        name: name.trim(),
        scopes,
        expiresAt: getExpiresAt(),
      });
      if (!res.success || !res.data?.token) throw new Error(res.error || 'Failed to create token');

      setPlainToken(res.data.token);
      toast.success('Token created');
      await load();
    } catch (requestError: any) {
      setError(requestError?.message || 'Failed to create token');
    } finally {
      setCreating(false);
    }
  };

  const onRevokeConfirmed = async () => {
    if (!revokeCandidate) return;

    setError('');
    try {
      const res = await apiClient.revokeApiToken(revokeCandidate.id);
      if (!res.success) throw new Error(res.error || 'Failed to revoke token');
      toast.success('Token revoked');
      setRevokeCandidate(null);
      await load();
    } catch (requestError: any) {
      setError(requestError?.message || 'Failed to revoke token');
    }
  };

  return (
    <main className="min-h-screen px-4 pb-20 pt-28 text-gray-300 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <header className="border-b border-white/10 pb-8">
          <p className="ui-eyebrow">Developer access</p>
          <h1 className="mt-4 flex items-center gap-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            <KeyRound className="h-8 w-8 text-[#FFD700]" />
            API Tokens
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-gray-400">
            Create Personal Access Tokens for trusted agents with workflow-scoped permissions.
          </p>
        </header>

        {!canUse ? (
          <section className="mt-8 border border-white/10 bg-white/[0.03] p-6">
            <AlertTriangle className="h-7 w-7 text-[#FFD700]" />
            <h2 className="mt-4 text-lg font-semibold text-white">Sign in required</h2>
            <p className="mt-2 text-sm leading-6 text-gray-400">Please sign in to manage API tokens.</p>
          </section>
        ) : (
          <>
            <section className="mt-8 border border-white/10 bg-white/[0.03] p-5 sm:p-6">
              <div className="flex flex-col gap-3 border-b border-white/10 pb-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">Create Token</h2>
                  <p className="mt-1 text-sm text-gray-500">The token value is shown only once. Store it safely.</p>
                </div>
                <button type="button" onClick={() => setShowGuide(true)} className="btn-ghost min-h-[40px] px-3 py-2 text-xs">
                  <BookOpenText className="h-4 w-4" />
                  Guide
                </button>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="token-name" className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-gray-400">
                    Name
                  </label>
                  <input
                    id="token-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    autoComplete="off"
                    className="w-full border border-white/10 bg-black/25 px-4 py-3 text-sm text-white focus:border-[#FFD700]/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700]/60"
                  />
                </div>

                <div>
                  <label htmlFor="token-expires" className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-gray-400">
                    Expires
                  </label>
                  <select
                    id="token-expires"
                    value={expiresPreset}
                    onChange={(event) => setExpiresPreset(event.target.value)}
                    className="w-full border border-white/10 bg-black/25 px-4 py-3 text-sm text-white focus:border-[#FFD700]/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700]/60"
                  >
                    <option value="1d">1 day</option>
                    <option value="7d">7 days</option>
                    <option value="30d">30 days</option>
                    <option value="60d">60 days</option>
                    <option value="90d">90 days</option>
                    <option value="1y">1 year</option>
                    <option value="custom">Custom</option>
                    <option value="never">Never</option>
                  </select>
                  {expiresPreset === 'custom' ? (
                    <input
                      type="datetime-local"
                      aria-label="Custom expiration date"
                      className="mt-2 w-full border border-white/10 bg-black/25 px-4 py-3 text-sm text-white focus:border-[#FFD700]/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700]/60"
                      value={customExpiresAt}
                      onChange={(event) => setCustomExpiresAt(event.target.value)}
                    />
                  ) : null}
                </div>
              </div>

              <fieldset className="mt-5">
                <legend className="text-xs font-medium uppercase tracking-[0.14em] text-gray-400">Scopes</legend>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {ALL_SCOPES.map((scope) => (
                    <label
                      key={scope.id}
                      className="flex min-h-[44px] items-center gap-3 border border-white/10 bg-black/20 p-3 text-sm text-gray-200"
                    >
                      <input
                        type="checkbox"
                        checked={scopes.includes(scope.id)}
                        onChange={() => onToggleScope(scope.id)}
                        className="h-4 w-4 accent-[#FFD700]"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-white">{scope.label}</span>
                        <span className="block break-all font-mono text-xs text-gray-500">{scope.id}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="mt-5 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center">
                <button
                  type="button"
                  disabled={creating || !canCreate}
                  onClick={() => {
                    setShowCreateConfirm(true);
                    setAcknowledgeRisk(false);
                  }}
                  className="btn-primary"
                >
                  Create Token
                </button>
                <p className="text-xs leading-5 text-gray-500">
                  Choose the smallest set of scopes needed for the automation workflow.
                </p>
              </div>

              {plainToken ? (
                <div className="mt-5 border border-[#FFD700]/30 bg-[#FFD700]/10 p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-[#FFD700]" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#FFD700]">Your new token is ready. Copy it now.</p>
                      <code className="mt-3 block break-all border border-[#FFD700]/20 bg-black/45 p-3 text-sm leading-6 text-yellow-50">
                        {plainToken}
                      </code>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button type="button" onClick={() => copyText(plainToken, 'Token copied')} className="btn-ghost min-h-[40px] px-3 py-2 text-xs">
                          <Copy className="h-3.5 w-3.5" />
                          Copy
                        </button>
                        <button type="button" onClick={() => setShowGuide(true)} className="btn-ghost min-h-[40px] px-3 py-2 text-xs">
                          Open Guide
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {error ? (
                <div className="mt-5 border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-100">
                  {error}
                </div>
              ) : null}
            </section>

            <section className="mt-6 border border-white/10 bg-white/[0.03] p-5 sm:p-6">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">Your Tokens</h2>
                  <p className="mt-1 text-sm text-gray-500">Review active, expired, and revoked tokens.</p>
                </div>
                <button
                  type="button"
                  onClick={() => void load()}
                  disabled={loading}
                  aria-busy={loading}
                  className="btn-ghost min-h-[40px] px-3 py-2 text-xs"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              {loading ? (
                <TokenSkeletonList />
              ) : tokens.length === 0 ? (
                <div className="border border-dashed border-white/10 bg-black/20 px-5 py-10 text-center">
                  <KeyRound className="mx-auto h-8 w-8 text-gray-600" />
                  <h3 className="mt-4 text-base font-semibold text-white">No tokens yet</h3>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                    Create a scoped token when you are ready to connect a trusted automation workflow.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tokens.map((token) => (
                    <article key={token.id} className="border border-white/10 bg-black/20 p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-white">{token.name}</h3>
                            {token.revoked_at ? (
                              <span className="border border-red-400/30 bg-red-400/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-red-200">
                                Revoked
                              </span>
                            ) : (
                              <span className="border border-emerald-300/25 bg-emerald-300/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-200">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="mt-2 break-all font-mono text-xs text-gray-500">id: {token.id}</p>
                        </div>

                        {!token.revoked_at ? (
                          <button
                            type="button"
                            onClick={() => setRevokeCandidate(token)}
                            className="inline-flex min-h-[40px] items-center justify-center gap-2 border border-red-400/30 bg-red-400/10 px-3 text-xs font-semibold text-red-200 transition hover:bg-red-400/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Revoke
                          </button>
                        ) : null}
                      </div>

                      <div className="mt-4 grid gap-2 text-xs text-gray-400 md:grid-cols-2">
                        <div>
                          Scopes:{' '}
                          <span className="font-mono text-gray-300">{(token.scopes || []).join(', ') || '-'}</span>
                        </div>
                        <div>
                          Last used: <span className="font-mono text-gray-300">{token.last_used_at || '-'}</span>
                        </div>
                        <div>
                          Expires: <span className="font-mono text-gray-300">{token.expires_at || '-'}</span>
                        </div>
                        <div>
                          Revoked: <span className="font-mono text-gray-300">{token.revoked_at || '-'}</span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {showGuide ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4" role="dialog" aria-modal="true" aria-labelledby="pat-guide-title">
          <button type="button" aria-label="Close PAT guide" className="absolute inset-0 bg-black/75" onClick={() => setShowGuide(false)} />
          <div className="relative max-h-[85vh] w-full max-w-2xl overflow-auto border border-[#FFD700]/25 bg-[#12100A] p-5 shadow-2xl sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 id="pat-guide-title" className="text-xl font-semibold text-yellow-50">PAT Guide</h2>
                <p className="mt-1 text-sm leading-6 text-yellow-100/70">
                  Personal Access Tokens let trusted tools act as you via the Gimme Idea API. Keep them secret.
                </p>
              </div>
              <button type="button" onClick={() => setShowGuide(false)} className="btn-ghost min-h-[40px] px-3 py-2 text-xs">
                <X className="h-4 w-4" />
                Close
              </button>
            </div>

            <div className="space-y-5 text-sm leading-7 text-yellow-50/90">
              <section>
                <h3 className="font-semibold text-yellow-50">Base URL and headers</h3>
                <code className="mt-2 block break-all border border-yellow-300/20 bg-black/50 p-3 text-xs text-yellow-50">
                  {apiBaseUrl}
                </code>
                <pre className="mt-2 whitespace-pre-wrap border border-yellow-300/20 bg-black/50 p-3 text-xs text-yellow-50">
{`Authorization: Bearer gi_pat_...
Content-Type: application/json`}
                </pre>
              </section>

              <section>
                <h3 className="font-semibold text-yellow-50">Common endpoints</h3>
                <div className="mt-2 space-y-2">
                  {[
                    'POST /projects',
                    'GET /comments/project/<PROJECT_ID>',
                    'POST /comments',
                  ].map((endpoint) => (
                    <code key={endpoint} className="block border border-yellow-300/20 bg-black/50 p-3 text-xs text-yellow-50">
                      {endpoint}
                    </code>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="font-semibold text-yellow-50">Quick prompt</h3>
                <pre className="mt-2 max-h-[260px] overflow-auto whitespace-pre-wrap break-words border border-yellow-300/20 bg-black/50 p-3 text-xs leading-6 text-yellow-50/90">
                  {quickPromptTemplate}
                </pre>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => copyText(quickPromptTemplate, 'Prompt copied')} className="btn-primary min-h-[40px] px-3 py-2 text-xs">
                    Copy prompt
                  </button>
                  <button
                    type="button"
                    onClick={() => copyText(quickPromptTemplate.replaceAll('<PASTE_PAT_HERE>', plainToken || '<PASTE_PAT_HERE>'), 'Prompt copied')}
                    className="btn-ghost min-h-[40px] px-3 py-2 text-xs"
                  >
                    Copy with token
                  </button>
                </div>
              </section>

              <section>
                <h3 className="font-semibold text-yellow-50">Security</h3>
                <ul className="mt-2 list-inside list-disc space-y-1 text-yellow-50/80">
                  <li>PAT acts like a long-lived login for your account.</li>
                  <li>Store it in a password manager or secret manager.</li>
                  <li>If leaked, revoke it immediately and create a new one.</li>
                </ul>
              </section>
            </div>
          </div>
        </div>
      ) : null}

      {showCreateConfirm ? (
        <div className="fixed inset-0 z-[110] flex items-center justify-center px-4" role="dialog" aria-modal="true" aria-labelledby="create-token-title">
          <button type="button" aria-label="Cancel token creation" className="absolute inset-0 bg-black/75" onClick={() => setShowCreateConfirm(false)} />
          <div className="relative w-full max-w-lg border border-white/10 bg-[#0D0D12] p-5 shadow-2xl">
            <ShieldAlert className="h-7 w-7 text-[#FFD700]" />
            <h2 id="create-token-title" className="mt-4 text-lg font-semibold text-white">Before you create a token</h2>
            <p className="mt-2 text-sm leading-6 text-gray-400">
              This token is shown only once and can act as your user through the API. Keep it secret.
            </p>

            <label className="mt-4 flex items-start gap-3 border border-white/10 bg-white/[0.03] p-3 text-sm text-gray-200">
              <input
                type="checkbox"
                checked={acknowledgeRisk}
                onChange={(event) => setAcknowledgeRisk(event.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[#FFD700]"
              />
              <span>I understand and I will store this token securely.</span>
            </label>

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button type="button" onClick={() => setShowGuide(true)} className="btn-ghost">
                Guide
              </button>
              <button
                type="button"
                disabled={!acknowledgeRisk || creating || !canCreate}
                aria-busy={creating}
                onClick={async () => {
                  await onCreate();
                  setShowCreateConfirm(false);
                }}
                className="btn-primary"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {revokeCandidate ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center px-4" role="dialog" aria-modal="true" aria-labelledby="revoke-token-title">
          <button type="button" aria-label="Cancel token revoke" className="absolute inset-0 bg-black/75" onClick={() => setRevokeCandidate(null)} />
          <div className="relative w-full max-w-md border border-red-400/25 bg-[#0D0D12] p-5 shadow-2xl">
            <AlertTriangle className="h-7 w-7 text-red-300" />
            <h2 id="revoke-token-title" className="mt-4 text-lg font-semibold text-white">Revoke this token?</h2>
            <p className="mt-2 text-sm leading-6 text-gray-400">
              {revokeCandidate.name} will stop working immediately. This action cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setRevokeCandidate(null)} className="btn-ghost">
                Cancel
              </button>
              <button
                type="button"
                onClick={onRevokeConfirmed}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 border border-red-400/30 bg-red-400/10 px-5 text-sm font-semibold text-red-100 transition hover:bg-red-400/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300"
              >
                Revoke
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
