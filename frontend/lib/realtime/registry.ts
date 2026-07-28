'use client';

export type RealtimeChannelKey =
  | 'notifications'
  | 'teamInvites'
  | 'announcements'
  | 'comments'
  | 'projects';

type ChannelPolicy = {
  enabled: boolean;
  allowedWhen: string;
  forbiddenWhen: string;
};

const envEnabled = (name: string) => process.env[name] === 'true';
const realtimeGloballyEnabled =
  envEnabled('NEXT_PUBLIC_ENABLE_REALTIME') &&
  process.env.NEXT_PUBLIC_DISABLE_REALTIME !== 'true';

export const realtimeChannelMatrix: Record<RealtimeChannelKey, ChannelPolicy> = {
  notifications: {
    enabled:
      realtimeGloballyEnabled &&
      envEnabled('NEXT_PUBLIC_ENABLE_REALTIME_NOTIFICATIONS'),
    allowedWhen: 'Logged-in user plus notifications realtime flag',
    forbiddenWhen: 'Logged out or notifications flag disabled',
  },
  teamInvites: {
    enabled:
      realtimeGloballyEnabled &&
      envEnabled('NEXT_PUBLIC_ENABLE_REALTIME_TEAM_INVITES'),
    allowedWhen: 'Logged-in user plus relevant invite surfaces',
    forbiddenWhen: 'Logged out, invites unused, or team invites flag disabled',
  },
  announcements: {
    enabled:
      realtimeGloballyEnabled &&
      envEnabled('NEXT_PUBLIC_ENABLE_REALTIME_ANNOUNCEMENTS'),
    allowedWhen: 'Logged-in user plus announcements realtime flag',
    forbiddenWhen: 'Guest users or announcements flag disabled',
  },
  comments: {
    enabled:
      realtimeGloballyEnabled &&
      envEnabled('NEXT_PUBLIC_ENABLE_REALTIME_COMMENTS'),
    allowedWhen: 'Idea/project detail for the current id only',
    forbiddenWhen: 'List pages or comments flag disabled',
  },
  projects: {
    enabled:
      realtimeGloballyEnabled &&
      envEnabled('NEXT_PUBLIC_ENABLE_REALTIME_PROJECTS'),
    allowedWhen: 'Explicit product opt-in for live global feed',
    forbiddenWhen: 'Default idea/project lists',
  },
};

export function isRealtimeChannelEnabled(channel: RealtimeChannelKey) {
  return realtimeChannelMatrix[channel].enabled;
}

export function logRealtimeLifecycle(
  channel: string,
  action: 'subscribe' | 'unsubscribe' | 'error',
  meta?: Record<string, unknown>
) {
  const shouldLog =
    process.env.NODE_ENV !== 'production' ||
    process.env.NEXT_PUBLIC_DEBUG_REALTIME === 'true';

  if (!shouldLog) {
    return;
  }

  console.debug(`[Realtime] ${action}: ${channel}`, meta || {});
}
