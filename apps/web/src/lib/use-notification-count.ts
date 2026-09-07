'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from './auth';
import { browserRequest } from './api';
export const notificationChangeEvent = 'gimme-notifications-updated';
export function useNotificationCount() {
  const { session, hydrated, getAccessToken } = useAuth();
  const pathname = usePathname();
  const [state, setState] = useState<{ actor: string; count: number } | null>(null);
  useEffect(() => {
    if (!hydrated || !session) return;
    const controller = new AbortController();
    let generation = 0;
    const refresh = async () => {
      const current = ++generation;
      try {
        const token = await getAccessToken();
        const result = await browserRequest<{ count: number }>('/v1/notifications/unread-count', {
          accessToken: token,
          signal: controller.signal,
        });
        if (
          !controller.signal.aborted &&
          current === generation &&
          result &&
          Number.isSafeInteger(result.count) &&
          result.count >= 0
        )
          setState({ actor: session.id, count: result.count });
      } catch {
        if (!controller.signal.aborted && current === generation) setState(null);
      }
    };
    const listener = () => {
      void refresh();
    };
    listener();
    window.addEventListener(notificationChangeEvent, listener);
    return () => {
      controller.abort();
      window.removeEventListener(notificationChangeEvent, listener);
    };
  }, [session, hydrated, getAccessToken, pathname]);
  return state?.actor === session?.id ? state?.count : undefined;
}
