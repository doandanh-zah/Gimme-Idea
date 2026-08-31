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
    return () => observer.disconnect();
  }, []);
  return (
    <section id="sequence" className="signal-sequence" ref={root}>
      <p className="sequence-index">PROCESS / 01—06</p>
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
