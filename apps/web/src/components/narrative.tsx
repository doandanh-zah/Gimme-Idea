'use client';
import { setNarrativeStage } from '@/lib/narrative-stage';
import { useEffect, useRef } from 'react';

export function Narrative({ items }: { items: readonly string[] }) {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!root.current) return;
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    let disposed = false;
    let animation: { revert: () => void } | undefined;
    const observer = new IntersectionObserver(
      async ([entry]) => {
        if (!entry?.isIntersecting || media.matches) return;
        observer.disconnect();
        const started = performance.now();
        const anime = await import('animejs').catch(() => null);
        if (!anime || performance.now() - started > 150) return;
        const { animate, stagger } = anime;
        if (disposed || media.matches || !root.current) return;
        animation = animate(root.current.querySelectorAll('.signal-step'), {
          opacity: [0.5, 1],
          y: [12, 0],
          delay: stagger(45),
          duration: 350,
          ease: 'out(3)',
        });
      },
      { threshold: 0.1 },
    );
    observer.observe(root.current);
    const steps = Array.from(root.current.querySelectorAll('.signal-step'));
    const stepObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) {
            const index = steps.indexOf(entry.target as HTMLElement);
            setNarrativeStage(index);
          }
      },
      { rootMargin: '-20% 0px -30% 0px', threshold: 0.5 },
    );
    steps.forEach((step) => stepObserver.observe(step));
    const stop = () => {
      if (media.matches) animation?.revert();
    };
    media.addEventListener('change', stop);
    return () => {
      disposed = true;
      animation?.revert();
      observer.disconnect();
      stepObserver.disconnect();
      media.removeEventListener('change', stop);
    };
  }, []);
  return (
    <section id="sequence" className="signal-sequence" ref={root}>
      <p className="sequence-index">PROBLEM → IDEA → BUILD</p>
      <ol>
        {items.map((item, index) => (
          <li className="signal-step" key={item}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <strong>{item}</strong>
            <i aria-hidden="true" />
          </li>
        ))}
      </ol>
    </section>
  );
}
