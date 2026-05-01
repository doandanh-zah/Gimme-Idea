'use client';

const enableRealtime = process.env.NEXT_PUBLIC_ENABLE_REALTIME === 'true';

export const featureFlags = {
  // Realtime can create a steady stream of Supabase egress, so it is opt-in.
  disableRealtime:
    process.env.NEXT_PUBLIC_DISABLE_REALTIME === 'true' || !enableRealtime,
};
