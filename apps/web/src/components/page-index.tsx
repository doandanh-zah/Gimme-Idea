'use client';
import { useEffect, useState } from 'react';

type IndexItem = {
  index: string;
  label: string;
  href: `#${string}`;
};

export function PageIndex({ label, items }: { label: string; items: IndexItem[] }) {
  const [active, setActive] = useState('');
  useEffect(() => {
    const targets = items
      .map((item) => document.getElementById(item.href.slice(1)))
      .filter((node): node is HTMLElement => !!node);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(`#${visible[0].target.id}`);
      },
      { rootMargin: '-15% 0px -60% 0px', threshold: 0 },
    );
    targets.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [items]);
  return (
    <nav className="page-index" aria-label={label}>
      <p>{label}</p>
      <ol>
        {items.map((item) => (
          <li key={item.href}>
            <a
              href={item.href}
              aria-current={active === item.href ? 'location' : undefined}
              onClick={() => setActive(item.href)}
            >
              <span>{item.index}</span>
              {item.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
