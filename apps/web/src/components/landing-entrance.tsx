'use client';
import { useEffect, useRef, type ReactNode } from 'react';

export function LandingEntrance({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    if (media.matches || !root.current) return;
    const started = performance.now();
    let disposed = false;
    let animation: { revert: () => void } | undefined;
    const stop = () => {
      if (media.matches) animation?.revert();
    };
    media.addEventListener('change', stop);
    void import('animejs')
      .then(({ animate, stagger }) => {
        if (disposed || media.matches || !root.current || performance.now() - started > 150) return;
        animation = animate(root.current.querySelectorAll('[data-entrance]'), {
          y: [14, 0],
          duration: 400,
          delay: stagger(55),
          ease: 'out(3)',
        });
      })
      .catch(() => undefined);
    return () => {
      disposed = true;
      animation?.revert();
      media.removeEventListener('change', stop);
    };
  }, []);
  return <div ref={root}>{children}</div>;
}
