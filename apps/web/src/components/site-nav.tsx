'use client';

import Link from 'next/link';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import type { Locale } from '@gimme-idea/contracts';

type NavCopy = {
  home: string;
  problems: string;
  ideas: string;
  menu: string;
  close: string;
  explore: string;
  homeHint: string;
  problemHint: string;
  ideaHint: string;
};

export function SiteNav({ locale, labels }: { locale: Locale; labels: NavCopy }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const otherLocale = locale === 'en' ? 'vi' : 'en';
  const languageHref = pathname.replace(/^\/(en|vi)(?=\/|$)/, `/${otherLocale}`);
  const items = [
    {
      index: '00',
      label: labels.home,
      hint: labels.homeHint,
      href: `/${locale}`,
      active: pathname === `/${locale}`,
    },
    {
      index: '01',
      label: labels.problems,
      hint: labels.problemHint,
      href: `/${locale}/problems/restaurant-food-waste`,
      active: pathname.startsWith(`/${locale}/problems/`),
    },
    {
      index: '02',
      label: labels.ideas,
      hint: labels.ideaHint,
      href: `/${locale}/ideas/demand-pulse-for-kitchens`,
      active: pathname.startsWith(`/${locale}/ideas/`),
    },
  ];

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [open]);

  return (
    <div className="nav-shell">
      <nav className="desktop-nav" aria-label="Primary navigation">
        {items.map((item) => (
          <Link
            key={item.href}
            className={item.active ? 'nav-link is-active' : 'nav-link'}
            href={item.href}
            aria-current={item.active ? 'page' : undefined}
          >
            <span>{item.index}</span>
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="nav-utilities">
        <Link
          className="locale-switch"
          href={languageHref || `/${otherLocale}`}
          hrefLang={otherLocale}
          aria-label={`Switch language to ${otherLocale === 'en' ? 'English' : 'Tiếng Việt'}`}
        >
          {otherLocale.toUpperCase()}
        </Link>
        <button
          ref={trigger}
          className="menu-trigger"
          type="button"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((value) => !value)}
        >
          <span>{open ? labels.close : labels.menu}</span>
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>
      <nav
        id="mobile-menu"
        className={open ? 'mobile-menu is-open' : 'mobile-menu'}
        aria-label="Mobile navigation"
        aria-hidden={!open}
      >
        <p>{labels.explore}</p>
        <div>
          {items.map((item) => (
            <Link
              key={item.href}
              className={item.active ? 'mobile-nav-link is-active' : 'mobile-nav-link'}
              href={item.href}
              aria-current={item.active ? 'page' : undefined}
              tabIndex={open ? 0 : -1}
              onClick={() => setOpen(false)}
            >
              <span>{item.index}</span>
              <strong>{item.label}</strong>
              <small>{item.hint}</small>
              <ArrowUpRight size={18} />
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
