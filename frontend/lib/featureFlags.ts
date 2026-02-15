'use client';

export const featureFlags = {
  disableRealtime: process.env.NEXT_PUBLIC_DISABLE_REALTIME === 'true',
};
