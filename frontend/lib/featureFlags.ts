'use client';

import { realtimeChannelMatrix } from './realtime/registry';

const enableRealtime =
  process.env.NEXT_PUBLIC_ENABLE_REALTIME === 'true' &&
  process.env.NEXT_PUBLIC_DISABLE_REALTIME !== 'true';

// In-app notifications (API poll + bell UI). Off by default to cut noise/egress.
const enableNotifications =
  process.env.NEXT_PUBLIC_ENABLE_NOTIFICATIONS === 'true';

export const featureFlags = {
  // Realtime can create a steady stream of Supabase egress, so it is opt-in.
  enableRealtime,
  disableRealtime: !enableRealtime,
  realtime: realtimeChannelMatrix,
  /** Bell + notification list API. Default off until product re-enables. */
  enableNotifications,
};
