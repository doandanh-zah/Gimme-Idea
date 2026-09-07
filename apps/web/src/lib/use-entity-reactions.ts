'use client';
import { useEffect, useRef, useState } from 'react';
import type { Locale } from '@gimme-idea/contracts';
import { browserRequest } from './api';
import { useAuth } from './auth';

type Reactions = { bookmarked: boolean; liked: boolean; following: boolean };
type Action = 'bookmark' | 'like' | 'follow';
const empty: Reactions = { bookmarked: false, liked: false, following: false };
const field = { bookmark: 'bookmarked', like: 'liked', follow: 'following' } as const;
const eventName = 'gimme-reactions-updated';

export function useEntityReactions(
  kind: 'problem' | 'idea' | 'project' | 'bounty',
  slug: string,
  locale: Locale,
) {
  const { session, hydrated, getAccessToken, requireAuth } = useAuth();
  const identity = `${session?.id ?? 'guest'}:${kind}:${slug}`;
  const path = `/v1/me/reactions/${kind}/${encodeURIComponent(slug)}`;
  const [state, setState] = useState<{
    identity: string;
    data: Reactions;
    busy: boolean;
    error: string | null;
  }>({ identity: '', data: empty, busy: false, error: null });
  const [retry, setRetry] = useState(0);
  const pending = useRef<Action | null>(null);
  const currentIdentity = useRef(identity);
  useEffect(() => {
    currentIdentity.current = identity;
  }, [identity]);
  const errorText =
    locale === 'vi'
      ? 'Chưa đồng bộ được trạng thái. Hãy thử lại.'
      : 'Could not synchronize this action. Try again.';
  const ready = state.identity === identity;

  useEffect(() => {
    if (!session || !hydrated) return;
    const controller = new AbortController();
    const sync = (event: Event) => {
      const detail = (event as CustomEvent<{ identity: string; data: Reactions }>).detail;
      if (detail.identity === identity)
        setState({ identity, data: detail.data, busy: false, error: null });
    };
    window.addEventListener(eventName, sync);
    void (async () => {
      try {
        const token = await getAccessToken();
        const data = await browserRequest<Reactions>(path, {
          accessToken: token,
          signal: controller.signal,
        });
        if (!data) throw new Error('Content is unavailable.');
        if (controller.signal.aborted) return;
        const action = pending.current;
        pending.current = null;
        if (action) {
          const enabled = !data[field[action]];
          await browserRequest(path, {
            method: 'PUT',
            accessToken: token,
            signal: controller.signal,
            body: JSON.stringify({ action, enabled }),
          });
          data[field[action]] = enabled;
        }
        if (!controller.signal.aborted) {
          setState({ identity, data, busy: false, error: null });
          if (action)
            window.dispatchEvent(new CustomEvent(eventName, { detail: { identity, data } }));
        }
      } catch {
        if (!controller.signal.aborted)
          setState({ identity, data: empty, busy: false, error: errorText });
      }
    })();
    return () => {
      controller.abort();
      window.removeEventListener(eventName, sync);
    };
  }, [session?.id, hydrated, identity, getAccessToken, path, retry, errorText, session]);

  const toggle = async (action: Action) => {
    if (!requireAuth(action)) {
      pending.current = action;
      return;
    }
    if (!ready || state.busy || state.error) return;
    const enabled = !state.data[field[action]];
    setState({ ...state, busy: true, error: null });
    try {
      const token = await getAccessToken();
      if (currentIdentity.current !== identity) return;
      await browserRequest(path, {
        method: 'PUT',
        accessToken: token,
        body: JSON.stringify({ action, enabled }),
      });
      if (currentIdentity.current !== identity) return;
      const data = { ...state.data, [field[action]]: enabled };
      setState({ identity, data, busy: false, error: null });
      window.dispatchEvent(new CustomEvent(eventName, { detail: { identity, data } }));
    } catch {
      if (currentIdentity.current === identity)
        setState({ ...state, busy: false, error: errorText });
    }
  };
  return {
    ...(ready ? state.data : empty),
    busy: !hydrated || Boolean(session && !ready) || (ready && state.busy),
    error: ready ? state.error : null,
    toggle,
    retry: () => setRetry((value) => value + 1),
  };
}
