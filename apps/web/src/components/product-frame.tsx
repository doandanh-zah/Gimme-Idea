'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  Bell,
  Bookmark,
  BriefcaseBusiness,
  ChevronRight,
  CircleDollarSign,
  Globe2,
  Home,
  Lightbulb,
  LogOut,
  Menu,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Target,
  User,
  UserPlus,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Locale } from '@gimme-idea/contracts';
import { PostComposer } from '@/components/post-composer';

export type ShellLabels = {
  home: string;
  ideas: string;
  problems: string;
  bounties: string;
  talent: string;
  notifications: string;
  following: string;
  saved: string;
  profile: string;
  more: string;
  landing: string;
  community: string;
  settings: string;
  post: string;
  postIdea: string;
  postProblem: string;
  choosePostType: string;
  bookmarks: string;
  likes: string;
  search: string;
  searchPlaceholder: string;
  suggestions: string;
  account: string;
  guest: string;
  signedOut: string;
  switchAccounts: string;
  addAccount: string;
  wallet: string;
  notConnected: string;
  connectWallet: string;
  reconnectWallet: string;
  logout: string;
  menu: string;
  close: string;
  openApp: string;
  composerUnavailable: string;
  composerNote: string;
  exploreProblem: string;
  inspectIdea: string;
};

type OpenPanel = 'more' | 'post' | 'account' | 'mobile' | 'search' | null;
type ComposerType = 'idea' | 'problem' | null;

const iconSize = 21;

export function ProductFrame({
  locale,
  labels,
  children,
}: {
  locale: Locale;
  labels: ShellLabels;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);
  const [composer, setComposer] = useState<ComposerType>(null);
  const [query, setQuery] = useState('');
  const moreRef = useRef<HTMLDivElement>(null);
  const postRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const mobilePostRef = useRef<HTMLDivElement>(null);
  const postTriggerRef = useRef<HTMLButtonElement>(null);

  const isLanding = pathname === `/${locale}`;
  const otherLocale = locale === 'en' ? 'vi' : 'en';
  const languageHref = pathname.replace(/^\/(en|vi)(?=\/|$)/, `/${otherLocale}`);

  const navItems = [
    { label: labels.home, href: `/${locale}/home`, icon: Home, match: `/${locale}/home` },
    { label: labels.ideas, href: `/${locale}/ideas`, icon: Lightbulb, match: `/${locale}/ideas` },
    {
      label: labels.problems,
      href: `/${locale}/problems`,
      icon: Target,
      match: `/${locale}/problems`,
    },
    {
      label: labels.bounties,
      href: `/${locale}/bounties`,
      icon: CircleDollarSign,
      match: `/${locale}/bounties`,
    },
    {
      label: labels.talent,
      href: `/${locale}/talent`,
      icon: BriefcaseBusiness,
      match: `/${locale}/talent`,
    },
    {
      label: labels.notifications,
      href: `/${locale}/notifications`,
      icon: Bell,
      match: `/${locale}/notifications`,
      badge: '0',
    },
    {
      label: labels.following,
      href: `/${locale}/following`,
      icon: UserPlus,
      match: `/${locale}/following`,
    },
    {
      label: labels.saved,
      href: `/${locale}/saved`,
      icon: Bookmark,
      match: `/${locale}/saved`,
    },
    {
      label: labels.profile,
      href: `/${locale}/profile`,
      icon: User,
      match: `/${locale}/profile`,
    },
  ];

  const suggestions = useMemo(
    () => [
      {
        type: labels.problems,
        title: 'Restaurant food waste',
        href: `/${locale}/problems/restaurant-food-waste`,
      },
      {
        type: labels.ideas,
        title: 'Demand Pulse for Kitchens',
        href: `/${locale}/ideas/demand-pulse-for-kitchens`,
      },
    ],
    [labels.ideas, labels.problems, locale],
  );
  const filteredSuggestions = query.trim()
    ? suggestions.filter((item) => item.title.toLowerCase().includes(query.trim().toLowerCase()))
    : suggestions;

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (openPanel === 'more' && !moreRef.current?.contains(target)) setOpenPanel(null);
      if (
        openPanel === 'post' &&
        !postRef.current?.contains(target) &&
        !mobilePostRef.current?.contains(target)
      )
        setOpenPanel(null);
      if (openPanel === 'account' && !accountRef.current?.contains(target)) setOpenPanel(null);
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenPanel(null);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onEscape);
    };
  }, [openPanel]);

  const closePanels = () => setOpenPanel(null);
  const openComposer = (type: Exclude<ComposerType, null>) => {
    setOpenPanel(null);
    setComposer(type);
  };
  const handlePost = () => {
    if (pathname.startsWith(`/${locale}/ideas`)) return openComposer('idea');
    if (pathname.startsWith(`/${locale}/problems`)) return openComposer('problem');
    setOpenPanel((value) => (value === 'post' ? null : 'post'));
  };

  if (isLanding) {
    return (
      <div className="site-shell landing-only-shell" lang={locale}>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <header className="landing-header">
          <div className="landing-header-inner">
            <Link className="brand" href={`/${locale}`} aria-label="Gimme Idea landing page">
              <Image src="/brand/logo-gmi.png" alt="" width={36} height={36} priority />
              <span>GIMME IDEA</span>
            </Link>
            <div className="landing-header-actions">
              <Link className="landing-app-link" href={`/${locale}/home`}>
                {labels.openApp}
                <ChevronRight size={16} aria-hidden="true" />
              </Link>
              <Link className="locale-switch" href={`/${otherLocale}`} hrefLang={otherLocale}>
                {otherLocale.toUpperCase()}
              </Link>
            </div>
          </div>
        </header>
        {children}
        <footer className="site-footer">
          <span>GIMME IDEA / FOUNDATION 02</span>
          <span>PROBLEM → IDEA → PROJECT</span>
        </footer>
      </div>
    );
  }

  return (
    <div className="product-canvas" lang={locale}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <header className="mobile-product-header">
        <Link className="mobile-brand" href={`/${locale}/home`} aria-label="Gimme Idea home">
          <Image src="/brand/logo-gmi.png" alt="" width={32} height={32} priority />
          <span>GIMME IDEA</span>
        </Link>
        <div>
          <button
            type="button"
            className="icon-control"
            aria-label={labels.search}
            aria-expanded={openPanel === 'search'}
            onClick={() => setOpenPanel((value) => (value === 'search' ? null : 'search'))}
          >
            <Search size={19} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="icon-control"
            aria-label={labels.menu}
            aria-expanded={openPanel === 'mobile'}
            aria-controls="mobile-product-menu"
            onClick={() => setOpenPanel((value) => (value === 'mobile' ? null : 'mobile'))}
          >
            {openPanel === 'mobile' ? (
              <X size={20} aria-hidden="true" />
            ) : (
              <Menu size={20} aria-hidden="true" />
            )}
          </button>
        </div>
      </header>

      {openPanel === 'search' && (
        <div className="mobile-search-panel">
          <SearchBox
            id="mobile-global-search"
            labels={labels}
            query={query}
            setQuery={setQuery}
            suggestions={filteredSuggestions}
            onNavigate={closePanels}
          />
        </div>
      )}

      {openPanel === 'mobile' && (
        <div id="mobile-product-menu" className="mobile-product-menu">
          <nav aria-label="Mobile product navigation">
            {navItems.slice(3).map((item) => (
              <ShellNavLink
                key={item.href}
                item={item}
                active={pathname.startsWith(item.match)}
                onNavigate={closePanels}
              />
            ))}
            <Link href={`/${locale}/community`} onClick={closePanels}>
              <Users size={iconSize} aria-hidden="true" />
              <span>{labels.community}</span>
            </Link>
            <Link href={`/${locale}/settings`} onClick={closePanels}>
              <Settings size={iconSize} aria-hidden="true" />
              <span>{labels.settings}</span>
            </Link>
            <Link href={`/${locale}`} onClick={closePanels}>
              <Globe2 size={iconSize} aria-hidden="true" />
              <span>{labels.landing}</span>
            </Link>
          </nav>
          <div className="mobile-account-summary">
            <span className="guest-avatar">G</span>
            <span>
              <strong>{labels.guest}</strong>
              <small>{labels.signedOut}</small>
            </span>
            <small>{labels.notConnected}</small>
          </div>
        </div>
      )}

      {openPanel === 'post' && (
        <div ref={mobilePostRef} className="mobile-post-sheet" aria-label={labels.choosePostType}>
          <p>{labels.choosePostType}</p>
          <button type="button" onClick={() => openComposer('idea')}>
            <Lightbulb size={19} aria-hidden="true" />
            {labels.postIdea}
          </button>
          <button type="button" onClick={() => openComposer('problem')}>
            <Target size={19} aria-hidden="true" />
            {labels.postProblem}
          </button>
        </div>
      )}

      <div className="product-shell">
        <aside className="product-sidebar" aria-label="Product navigation">
          <div className="sidebar-inner">
            <Link className="sidebar-brand" href={`/${locale}/home`} aria-label="Gimme Idea home">
              <Image src="/brand/logo-gmi.png" alt="" width={40} height={40} priority />
              <span>GIMME IDEA</span>
            </Link>

            <nav className="sidebar-nav" aria-label="Primary navigation">
              {navItems.map((item) => (
                <ShellNavLink
                  key={item.href}
                  item={item}
                  active={pathname.startsWith(item.match)}
                  onNavigate={closePanels}
                />
              ))}

              <div className="sidebar-popover-anchor" ref={moreRef}>
                <button
                  type="button"
                  className={openPanel === 'more' ? 'sidebar-link is-active' : 'sidebar-link'}
                  aria-label={labels.more}
                  aria-expanded={openPanel === 'more'}
                  aria-controls="more-navigation"
                  onClick={() => setOpenPanel((value) => (value === 'more' ? null : 'more'))}
                >
                  <MoreHorizontal size={iconSize} aria-hidden="true" />
                  <span>{labels.more}</span>
                </button>
                {openPanel === 'more' && (
                  <div id="more-navigation" className="sidebar-popover sidebar-more-popover">
                    <Link href={`/${locale}`} onClick={closePanels}>
                      <Globe2 size={18} aria-hidden="true" />
                      {labels.landing}
                    </Link>
                    <Link href={`/${locale}/community`} onClick={closePanels}>
                      <Users size={18} aria-hidden="true" />
                      {labels.community}
                    </Link>
                    <Link href={`/${locale}/settings`} onClick={closePanels}>
                      <Settings size={18} aria-hidden="true" />
                      {labels.settings}
                    </Link>
                  </div>
                )}
              </div>
            </nav>

            <div className="post-control" ref={postRef}>
              {openPanel === 'post' && (
                <div className="sidebar-popover post-type-popover">
                  <p>{labels.choosePostType}</p>
                  <button type="button" onClick={() => openComposer('idea')}>
                    <Lightbulb size={18} aria-hidden="true" />
                    <span>{labels.postIdea}</span>
                  </button>
                  <button type="button" onClick={() => openComposer('problem')}>
                    <Target size={18} aria-hidden="true" />
                    <span>{labels.postProblem}</span>
                  </button>
                </div>
              )}
              <button
                ref={postTriggerRef}
                type="button"
                className="sidebar-post-button"
                aria-label={labels.post}
                aria-expanded={openPanel === 'post'}
                onClick={handlePost}
              >
                <Plus size={19} aria-hidden="true" />
                <span>{labels.post}</span>
              </button>
            </div>

            <div className="account-control" ref={accountRef}>
              {openPanel === 'account' && (
                <AccountPopover
                  labels={labels}
                  languageHref={languageHref}
                  otherLocale={otherLocale}
                />
              )}
              <button
                type="button"
                className="account-trigger"
                aria-label={labels.account}
                aria-expanded={openPanel === 'account'}
                aria-controls="account-popover"
                onClick={() => setOpenPanel((value) => (value === 'account' ? null : 'account'))}
              >
                <span className="guest-avatar">G</span>
                <span>
                  <strong>{labels.guest}</strong>
                  <small>{labels.signedOut}</small>
                </span>
                <MoreHorizontal size={18} aria-hidden="true" />
              </button>
            </div>
          </div>
        </aside>

        <div className="product-main">{children}</div>

        <aside className="discovery-rail" aria-label={labels.suggestions}>
          <div className="discovery-inner">
            <SearchBox
              id="desktop-global-search"
              labels={labels}
              query={query}
              setQuery={setQuery}
              suggestions={filteredSuggestions}
              onNavigate={closePanels}
            />
          </div>
        </aside>
      </div>

      <nav className="mobile-bottom-dock" aria-label="Mobile primary navigation">
        <ShellDockLink
          href={`/${locale}/home`}
          label={labels.home}
          icon={Home}
          active={pathname.startsWith(`/${locale}/home`)}
        />
        <ShellDockLink
          href={`/${locale}/ideas`}
          label={labels.ideas}
          icon={Lightbulb}
          active={pathname.startsWith(`/${locale}/ideas`)}
        />
        <button
          type="button"
          className="dock-post-button"
          onClick={handlePost}
          aria-label={labels.post}
        >
          <Plus size={23} aria-hidden="true" />
          <span>{labels.post}</span>
        </button>
        <ShellDockLink
          href={`/${locale}/problems`}
          label={labels.problems}
          icon={Target}
          active={pathname.startsWith(`/${locale}/problems`)}
        />
        <ShellDockLink
          href={`/${locale}/profile`}
          label={labels.profile}
          icon={User}
          active={pathname.startsWith(`/${locale}/profile`)}
        />
      </nav>

      <PostComposer
        type={composer}
        locale={locale}
        onClose={() => {
          setComposer(null);
          postTriggerRef.current?.focus();
        }}
      />
    </div>
  );
}

function ShellNavLink({
  item,
  active,
  onNavigate,
}: {
  item: {
    label: string;
    href: string;
    icon: typeof Home;
    badge?: string;
  };
  active: boolean;
  onNavigate: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={active ? 'sidebar-link is-active' : 'sidebar-link'}
      aria-label={item.label}
      aria-current={active ? 'page' : undefined}
      onClick={onNavigate}
    >
      <Icon size={iconSize} aria-hidden="true" />
      <span>{item.label}</span>
      {item.badge && <small aria-label={`${item.badge} unread`}>{item.badge}</small>}
    </Link>
  );
}

function ShellDockLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: typeof Home;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={active ? 'is-active' : ''}
      aria-current={active ? 'page' : undefined}
    >
      <Icon size={20} aria-hidden="true" />
      <span>{label}</span>
    </Link>
  );
}

function SearchBox({
  id,
  labels,
  query,
  setQuery,
  suggestions,
  onNavigate,
}: {
  id: string;
  labels: ShellLabels;
  query: string;
  setQuery: (value: string) => void;
  suggestions: { type: string; title: string; href: string }[];
  onNavigate: () => void;
}) {
  return (
    <div className="search-module">
      <form className="discovery-search" role="search" onSubmit={(event) => event.preventDefault()}>
        <label className="sr-only" htmlFor={id}>
          {labels.search}
        </label>
        <Search size={18} aria-hidden="true" />
        <input
          id={id}
          type="search"
          value={query}
          placeholder={labels.searchPlaceholder}
          autoComplete="off"
          onChange={(event) => setQuery(event.target.value)}
        />
      </form>
      <section className="suggestion-panel" aria-labelledby={`${id}-suggestions`}>
        <div className="rail-heading">
          <h2 id={`${id}-suggestions`}>{labels.suggestions}</h2>
          <span>{String(suggestions.length).padStart(2, '0')}</span>
        </div>
        {suggestions.length === 0 ? (
          <p className="rail-empty">No matching nodes.</p>
        ) : (
          <div className="suggestion-list">
            {suggestions.map((item) => (
              <Link key={item.href} href={item.href} onClick={onNavigate}>
                <small>{item.type}</small>
                <strong>{item.title}</strong>
                <ChevronRight size={16} aria-hidden="true" />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function AccountPopover({
  labels,
  languageHref,
  otherLocale,
}: {
  labels: ShellLabels;
  languageHref: string;
  otherLocale: string;
}) {
  return (
    <div id="account-popover" className="account-popover">
      <p>{labels.account}</p>
      <div className="account-row is-current">
        <span className="guest-avatar">G</span>
        <span>
          <strong>{labels.guest}</strong>
          <small>{labels.signedOut}</small>
        </span>
      </div>
      <button type="button" disabled>
        <UserPlus size={17} aria-hidden="true" />
        {labels.addAccount}
      </button>
      <div className="account-divider" />
      <div className="wallet-state">
        <span>
          <Wallet size={17} aria-hidden="true" />
          {labels.wallet}
        </span>
        <small>{labels.notConnected}</small>
      </div>
      <button type="button" disabled>
        <Wallet size={17} aria-hidden="true" />
        {labels.connectWallet}
      </button>
      <button type="button" disabled>
        <RefreshCw size={17} aria-hidden="true" />
        {labels.reconnectWallet}
      </button>
      <Link href={languageHref} hrefLang={otherLocale}>
        <Globe2 size={17} aria-hidden="true" />
        {otherLocale.toUpperCase()}
      </Link>
      <button type="button" disabled>
        <LogOut size={17} aria-hidden="true" />
        {labels.logout}
      </button>
    </div>
  );
}
