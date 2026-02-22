'use client';

import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';

type AgentKeyMeta = {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt?: string | null;
  revokedAt?: string | null;
  createdAt: string;
  isActive: boolean;
};

const fmt = (iso?: string | null) => {
  if (!iso) return '-';
  return new Date(iso).toLocaleString();
};

export default function AgentKeysPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [keys, setKeys] = useState<AgentKeyMeta[]>([]);
  const [error, setError] = useState('');

  const [currentSecretKey, setCurrentSecretKey] = useState('');
  const [newKeyName, setNewKeyName] = useState('');
  const [rotating, setRotating] = useState(false);
  const [newSecretKey, setNewSecretKey] = useState('');

  const [revokeSecretKey, setRevokeSecretKey] = useState('');
  const [revoking, setRevoking] = useState(false);

  const activeKeysCount = useMemo(() => keys.filter((k) => k.isActive).length, [keys]);

  const loadKeys = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await apiClient.listAgentKeys();
      if (!res.success || !res.data) {
        throw new Error(res.error || 'Failed to load keys');
      }
      setKeys(res.data.keys || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load keys');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    loadKeys();
  }, [user?.id]);

  const onRotate = async () => {
    if (!currentSecretKey.trim()) {
      toast.error('Current secret key is required');
      return;
    }

    setRotating(true);
    setError('');
    setNewSecretKey('');
    try {
      const res = await apiClient.rotateAgentKey({
        currentSecretKey: currentSecretKey.trim(),
        newKeyName: newKeyName.trim() || undefined,
      });
      if (!res.success || !res.data?.secretKey) {
        throw new Error(res.error || 'Failed to rotate key');
      }
      setNewSecretKey(res.data.secretKey);
      setCurrentSecretKey('');
      setNewKeyName('');
      toast.success('Agent key rotated');
      await loadKeys();
    } catch (e: any) {
      setError(e?.message || 'Failed to rotate key');
    } finally {
      setRotating(false);
    }
  };

  const onRevoke = async () => {
    if (!revokeSecretKey.trim()) {
      toast.error('Secret key is required');
      return;
    }

    setRevoking(true);
    setError('');
    try {
      const res = await apiClient.revokeAgentKey({ secretKey: revokeSecretKey.trim() });
      if (!res.success || !res.data?.revoked) {
        throw new Error(res.error || 'Failed to revoke key');
      }
      setRevokeSecretKey('');
      toast.success('Agent key revoked');
      await loadKeys();
    } catch (e: any) {
      setError(e?.message || 'Failed to revoke key');
    } finally {
      setRevoking(false);
    }
  };

  if (!user) {
    return (
      <main className="min-h-screen pt-28 pb-20 px-6">
        <div className="max-w-3xl mx-auto glass rounded-2xl border border-white/10 p-6">
          <p className="text-gray-300">Please sign in first.</p>
          <button
            onClick={() => router.push('/auth/agent')}
            className="mt-4 px-4 py-2 rounded-full bg-[#FFD700] text-black text-sm font-bold"
          >
            Open Agent Auth
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pt-28 pb-20 px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="glass rounded-2xl border border-white/10 p-6 space-y-2">
          <h1 className="text-3xl font-bold">Agent Keys</h1>
          <p className="text-gray-400">
            Manage secret keys used by agents. Raw keys are never stored and are shown only once on
            rotate.
          </p>
          <p className="text-sm text-gray-300">
            Active keys: <span className="font-semibold text-white">{activeKeysCount}</span>
          </p>
        </div>

        {error ? (
          <div className="glass rounded-2xl border border-red-400/25 p-4 text-sm text-red-300">
            {error}
          </div>
        ) : null}

        <div className="glass rounded-2xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Key List</h2>
            <button
              onClick={loadKeys}
              disabled={loading}
              className="px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-xs font-semibold"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-white/10">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Prefix</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Last Used</th>
                  <th className="py-2 pr-4">Created</th>
                </tr>
              </thead>
              <tbody>
                {keys.length === 0 ? (
                  <tr>
                    <td className="py-3 text-gray-500" colSpan={5}>
                      No agent keys found.
                    </td>
                  </tr>
                ) : (
                  keys.map((k) => (
                    <tr key={k.id} className="border-b border-white/5">
                      <td className="py-2 pr-4 text-gray-200">{k.name}</td>
                      <td className="py-2 pr-4 font-mono text-gray-300">{k.keyPrefix}...</td>
                      <td className="py-2 pr-4">
                        {k.isActive ? (
                          <span className="text-emerald-300">active</span>
                        ) : (
                          <span className="text-red-300">revoked</span>
                        )}
                      </td>
                      <td className="py-2 pr-4 text-gray-300">{fmt(k.lastUsedAt)}</td>
                      <td className="py-2 pr-4 text-gray-300">{fmt(k.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="glass rounded-2xl border border-white/10 p-6 space-y-3">
            <h2 className="text-lg font-semibold">Rotate Key</h2>
            <p className="text-xs text-gray-400">
              Rotate revokes the current key and returns a new key once.
            </p>
            <textarea
              value={currentSecretKey}
              onChange={(e) => setCurrentSecretKey(e.target.value)}
              placeholder="Current secret key"
              className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white outline-none focus:border-emerald-300/40 min-h-[88px]"
            />
            <input
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="New key name (optional)"
              className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white outline-none focus:border-emerald-300/40"
            />
            <button
              onClick={onRotate}
              disabled={rotating}
              className="px-4 py-2 rounded-full bg-[#FFD700] text-black text-sm font-bold disabled:opacity-60"
            >
              {rotating ? 'Rotating...' : 'Rotate Key'}
            </button>
          </div>

          <div className="glass rounded-2xl border border-white/10 p-6 space-y-3">
            <h2 className="text-lg font-semibold">Revoke Key</h2>
            <p className="text-xs text-gray-400">Revoke disables a key immediately.</p>
            <textarea
              value={revokeSecretKey}
              onChange={(e) => setRevokeSecretKey(e.target.value)}
              placeholder="Secret key to revoke"
              className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white outline-none focus:border-red-300/40 min-h-[88px]"
            />
            <button
              onClick={onRevoke}
              disabled={revoking}
              className="px-4 py-2 rounded-full bg-red-500/20 border border-red-300/40 text-red-200 text-sm font-bold disabled:opacity-60"
            >
              {revoking ? 'Revoking...' : 'Revoke Key'}
            </button>
          </div>
        </div>

        {newSecretKey ? (
          <div className="glass rounded-2xl border border-yellow-300/30 p-6 space-y-3">
            <p className="text-yellow-200 text-sm font-semibold">
              New key generated. Save it now because it will not be shown again.
            </p>
            <pre className="text-xs text-yellow-100 bg-black/50 border border-yellow-300/20 rounded-xl p-3 whitespace-pre-wrap break-all">
              {newSecretKey}
            </pre>
            <button
              onClick={() => navigator.clipboard.writeText(newSecretKey)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/10 border border-white/15 text-white"
            >
              Copy key
            </button>
          </div>
        ) : null}
      </div>
    </main>
  );
}
