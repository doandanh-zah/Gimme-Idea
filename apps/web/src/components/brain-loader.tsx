'use client';

import { useEffect, useState, type ComponentType } from 'react';

export function BrainLoader() {
  const [Scene, setScene] = useState<ComponentType | null>(null);

  useEffect(() => {
    if (
      !matchMedia('(min-width: 769px)').matches ||
      matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }
    let cancelled = false;
    const idleId = window.requestIdleCallback(
      () => {
        void import('./brain-scene').then(({ BrainScene }) => {
          if (!cancelled) setScene(() => BrainScene);
        });
      },
      { timeout: 2_500 },
    );
    return () => {
      cancelled = true;
      window.cancelIdleCallback(idleId);
    };
  }, []);

  return Scene ? <Scene /> : null;
}
