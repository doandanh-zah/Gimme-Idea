'use client';
import { useEffect, useRef } from 'react';

export function Narrative({ items }: { items: readonly string[] }) {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!root.current || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const observer = new IntersectionObserver(
      async ([entry]) => {
        if (entry?.isIntersecting) {
          const { animate, stagger } = await import('animejs');
          animate(root.current!.querySelectorAll('.signal-step'), {
            opacity: [0, 1],
            y: [24, 0],
            delay: stagger(90),
            duration: 650,
            ease: 'out(3)',
          });
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(root.current);
    const steps = Array.from(root.current.querySelectorAll('.signal-step'));
    const stepObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = steps.indexOf(entry.target as HTMLElement);
          window.dispatchEvent(new CustomEvent('gimme-narrative-step', { detail: { index } }));
        }
      },
      { threshold: 0.58 },
    );
    steps.forEach((step) => stepObserver.observe(step));
    return () => {
      observer.disconnect();
      stepObserver.disconnect();
    };
  }, []);
  return (
    <section id="sequence" className="signal-sequence" ref={root}>
      <p className="sequence-index">LOOP / 01—07</p>
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
