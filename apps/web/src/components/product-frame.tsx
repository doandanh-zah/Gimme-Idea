'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  Bell,
  Blocks,
  Bookmark,
  ChevronRight,
  CircleDollarSign,
  Globe2,
  Home,
  Lightbulb,
  LogOut,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  Target,
  User,
  UserPlus,
  Wallet,
  X,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Locale } from '@gimme-idea/contracts';
import { AuthDialog } from '@/components/auth-dialog';
import { PostComposer } from '@/components/post-composer';
import { WalletDialog } from '@/components/wallet-dialog';
import { useAuth } from '@/lib/auth';
import { formatUsdcAmount } from '@/lib/format-number';

export type ShellLabels = {
  home: string;
  projects: string;
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
  signIn: string;
  switchAccounts: string;
  addAccount: string;
  wallet: string;
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
  const router = useRouter();
  const auth = useAuth();
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);
  const [composer, setComposer] = useState<ComposerType>(null);
  const [query, setQuery] = useState('');
  const [compactNav, setCompactNav] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [walletDialogOpen, setWalletDialogOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const postRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const mobilePostRef = useRef<HTMLDivElement>(null);
  const postTriggerRef = useRef<HTMLButtonElement>(null);

  const isLanding = pathname === `/${locale}`;
  const otherLocale = locale === 'en' ? 'vi' : 'en';

  const navItems = [
    { label: labels.home, href: `/${locale}/home`, icon: Home, match: `/${locale}/home` },
    {
      label: labels.problems,
      href: `/${locale}/problems`,
      icon: Target,
      match: `/${locale}/problems`,
    },
    { label: labels.ideas, href: `/${locale}/ideas`, icon: Lightbulb, match: `/${locale}/ideas` },
    {
      label: labels.projects,
      href: `/${locale}/projects`,
      icon: Blocks,
      match: `/${locale}/projects`,
    },
    {
      label: labels.bounties,
      href: `/${locale}/bounties`,
      icon: CircleDollarSign,
      match: `/${locale}/bounties`,
    },
    {
      label: labels.saved,
      href: `/${locale}/saved`,
      icon: Bookmark,
      match: `/${locale}/saved`,
      groupStart: true,
    },
    {
      label: labels.notifications,
      href: `/${locale}/notifications`,
      icon: Bell,
      match: `/${locale}/notifications`,
      badge: '0',
    },
    {
      label: labels.profile,
      href: `/${locale}/profile`,
      icon: User,
      match: `/${locale}/profile`,
    },
  ];
  const overflowHrefs = new Set([`/${locale}/projects`, `/${locale}/bounties`, `/${locale}/saved`]);
  const primaryNav = compactNav
    ? navItems.filter((item) => !overflowHrefs.has(item.href))
    : navItems;
  const moreNav = compactNav ? navItems.filter((item) => overflowHrefs.has(item.href)) : [];
  const dockHrefs = new Set([
    `/${locale}/home`,
    `/${locale}/problems`,
    `/${locale}/bounties`,
    `/${locale}/profile`,
  ]);
  const mobileMenuItems = navItems.filter((item) => !dockHrefs.has(item.href));

  const suggestions = useMemo(
    () => [
      {
        type: labels.problems,
        title: 'Restaurant food waste',
        href: `/${locale}/problems/restaurant-food-waste`,
      },
      {
        type: labels.problems,
        title: 'Tenant repair visibility',
        href: `/${locale}/problems/tenant-repair-visibility`,
      },
      {
        type: labels.ideas,
        title: 'Demand Pulse for Kitchens',
        href: `/${locale}/ideas/demand-pulse-for-kitchens`,
      },
      {
        type: labels.projects,
        title: 'Pantry Pulse',
        href: `/${locale}/projects/pantry-pulse-archive`,
      },
      {
        type: labels.bounties,
        title: 'Restaurant demand Idea Bounty',
        href: `/${locale}/bounties/restaurant-demand-idea`,
      },
      {
        type: labels.bounties,
        title: 'FoodLoop Build Bounty',
        href: `/${locale}/bounties/foodloop-build`,
      },
    ],
    [labels.bounties, labels.ideas, labels.problems, labels.projects, locale],
  );
  const filteredSuggestions = query.trim()
    ? suggestions.filter((item) => item.title.toLowerCase().includes(query.trim().toLowerCase()))
    : suggestions;
  const accountName = auth.session?.displayName ?? labels.guest;
  const accountUsername = auth.session?.username ?? 'guest';
  const accountInitials = auth.session?.avatarInitials ?? 'G';
  const accountStatus = auth.session ? `@${accountUsername}` : labels.signedOut;
  const walletBalance = formatUsdcAmount(auth.wallet?.balanceUsdc ?? '0', 'compact');

  useEffect(() => {
    const media = window.matchMedia('(max-width: 1180px), (max-height: 780px)');
    const apply = () => setCompactNav(media.matches);
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    const openSignIn = () => {
      setOpenPanel(null);
      setAuthDialogOpen(true);
    };
    window.addEventListener('gimme-auth-required', openSignIn);
    return () => window.removeEventListener('gimme-auth-required', openSignIn);
  }, []);

  useEffect(() => {
    const openCreate = (event: Event) => {
      const detail = (event as CustomEvent<{ type?: ComposerType }>).detail;
      if (detail?.type === 'idea' || detail?.type === 'problem') {
        if (!auth.requireAuth('create')) return;
        setComposer(detail.type);
      }
    };
    window.addEventListener('gimme-open-create', openCreate);
    return () => window.removeEventListener('gimme-open-create', openCreate);
  }, [auth]);

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
  const openAuthDialog = () => {
    setOpenPanel(null);
    setAuthDialogOpen(true);
  };
  const openComposer = (type: Exclude<ComposerType, null>) => {
    if (!auth.requireAuth('post')) return;
    setOpenPanel(null);
    setComposer(type);
  };
  const handlePost = () => {
    if (!auth.requireAuth('post')) return;
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
            pathname={pathname}
            locale={locale}
            onSubmit={(value) => router.push(`/${locale}/search?q=${encodeURIComponent(value)}`)}
            onNavigate={closePanels}
          />
        </div>
      )}

      {openPanel === 'mobile' && (
        <div id="mobile-product-menu" className="mobile-product-menu">
          <nav aria-label="Mobile product navigation">
            {mobileMenuItems.map((item) => (
              <ShellNavLink
                key={item.href}
                item={item}
                active={pathname.startsWith(item.match)}
                onNavigate={closePanels}
              />
            ))}
            <Link href={`/${locale}/dashboard`} onClick={closePanels}>
              <Blocks size={iconSize} aria-hidden="true" />
              <span>{locale === 'vi' ? 'Company dashboard' : 'Company dashboard'}</span>
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
          {auth.isSignedIn ? (
            <div className="mobile-account-area">
              <button
                type="button"
                className="mobile-wallet-balance-button"
                aria-label={`${labels.wallet}: ${walletBalance.ariaLabel}`}
                onClick={() => setWalletDialogOpen(true)}
              >
                <Wallet size={19} aria-hidden="true" />
                <strong className="wallet-number">{walletBalance.display}</strong>
                <span>USDC</span>
              </button>
              <div className="mobile-account-summary">
                <span className="guest-avatar">{accountInitials}</span>
                <span>
                  <strong>{accountName}</strong>
                  <small>{accountStatus}</small>
                </span>
              </div>
            </div>
          ) : (
            <button type="button" className="mobile-sign-in-button" onClick={openAuthDialog}>
              <User size={19} aria-hidden="true" />
              {labels.signIn}
            </button>
          )}
        </div>
      )}

      {openPanel === 'post' && (
        <div ref={mobilePostRef} className="mobile-post-sheet" aria-label={labels.choosePostType}>
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
              {primaryNav.map((item) => (
                <ShellNavLink
                  key={item.href}
                  item={item}
                  active={pathname.startsWith(item.match)}
                  onNavigate={closePanels}
                />
              ))}
            </nav>

            <div className="sidebar-popover-anchor sidebar-more-control" ref={moreRef}>
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
                  {moreNav.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link key={item.href} href={item.href} onClick={closePanels}>
                        <Icon size={18} aria-hidden="true" />
                        {item.label}
                      </Link>
                    );
                  })}
                  <Link href={`/${locale}`} onClick={closePanels}>
                    <Globe2 size={18} aria-hidden="true" />
                    {labels.landing}
                  </Link>
                  <Link href={`/${locale}/dashboard`} onClick={closePanels}>
                    <Blocks size={18} aria-hidden="true" />
                    {locale === 'vi' ? 'Company dashboard' : 'Company dashboard'}
                  </Link>
                  <Link href={`/${locale}/settings`} onClick={closePanels}>
                    <Settings size={18} aria-hidden="true" />
                    {labels.settings}
                  </Link>
                </div>
              )}
            </div>

            <div className="post-control" ref={postRef}>
              {openPanel === 'post' && (
                <div className="sidebar-popover post-type-popover">
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
              {auth.isSignedIn && (
                <button
                  type="button"
                  className="sidebar-wallet-button"
                  aria-label={`${labels.wallet}: ${walletBalance.ariaLabel}`}
                  onClick={() => setWalletDialogOpen(true)}
                >
                  <Wallet size={19} aria-hidden="true" />
                  <strong className="wallet-number">{walletBalance.display}</strong>
                  <small>USDC</small>
                </button>
              )}
              {auth.isSignedIn && openPanel === 'account' && (
                <AccountPopover
                  labels={labels}
                  accountName={accountName}
                  accountUsername={accountUsername}
                  accountInitials={accountInitials}
                  onSignIn={openAuthDialog}
                  onLogout={auth.logout}
                />
              )}
              {auth.isSignedIn ? (
                <button
                  type="button"
                  className="account-trigger"
                  aria-label={labels.account}
                  aria-expanded={openPanel === 'account'}
                  aria-controls="account-popover"
                  onClick={() => setOpenPanel((value) => (value === 'account' ? null : 'account'))}
                >
                  <span className="guest-avatar">{accountInitials}</span>
                  <span>
                    <strong>{accountName}</strong>
                    <small>{accountStatus}</small>
                  </span>
                  <MoreHorizontal size={18} aria-hidden="true" />
                </button>
              ) : (
                <button type="button" className="sidebar-sign-in-button" onClick={openAuthDialog}>
                  <User size={19} aria-hidden="true" />
                  <span>{labels.signIn}</span>
                </button>
              )}
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
              pathname={pathname}
              locale={locale}
              onSubmit={(value) => router.push(`/${locale}/search?q=${encodeURIComponent(value)}`)}
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
          href={`/${locale}/problems`}
          label={labels.problems}
          icon={Target}
          active={pathname.startsWith(`/${locale}/problems`)}
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
          href={`/${locale}/bounties`}
          label={labels.bounties}
          icon={CircleDollarSign}
          active={pathname.startsWith(`/${locale}/bounties`)}
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
      <AuthDialog locale={locale} open={authDialogOpen} onClose={() => setAuthDialogOpen(false)} />
      <WalletDialog
        locale={locale}
        open={walletDialogOpen}
        onClose={() => setWalletDialogOpen(false)}
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
    groupStart?: boolean;
  };
  active: boolean;
  onNavigate: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={`${active ? 'sidebar-link is-active' : 'sidebar-link'}${item.groupStart ? ' is-group-start' : ''}`}
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
  pathname,
  locale,
  onSubmit,
  onNavigate,
}: {
  id: string;
  labels: ShellLabels;
  query: string;
  setQuery: (value: string) => void;
  suggestions: { type: string; title: string; href: string }[];
  pathname: string;
  locale: Locale;
  onSubmit: (value: string) => void;
  onNavigate: () => void;
}) {
  return (
    <div className="search-module">
      <form
        className="discovery-search"
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(query.trim());
          onNavigate();
        }}
      >
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
      {query.trim() ? (
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
      ) : (
        <ContextualIntelligence pathname={pathname} locale={locale} />
      )}
    </div>
  );
}

function ContextualIntelligence({ pathname, locale }: { pathname: string; locale: Locale }) {
  const vi = locale === 'vi';
  const context = pathname.includes('/bounties/')
    ? {
        label: 'STAGE',
        rows: [
          ['Idea competition', 'Direction first'],
          ['Build competition', 'Execution second'],
          ['Funding trust', 'Always explicit'],
        ],
      }
    : pathname.includes('/projects/')
      ? {
          label: 'CONTEXT',
          rows: [
            ['Original Problem', 'Always linked'],
            ['Source facts', 'Separated'],
            ['GI Research', 'Provenance shown'],
          ],
        }
      : pathname.includes('/ideas/')
        ? {
            label: 'LANDSCAPE',
            rows: [
              ['Related historical builds', '8'],
              ['Public Projects', '3'],
              ['Build opportunities', '1'],
            ],
          }
        : pathname.includes('/problems/')
          ? {
              label: 'RELATED INTELLIGENCE',
              rows: [
                ['Historical builds', '17'],
                ['Similar Problems', '8'],
                ['Active Bounties', '2'],
              ],
            }
          : {
              label: 'OPPORTUNITIES',
              rows: [
                ['Idea Bounties', '12'],
                ['Build Bounties', '7'],
                ['Historical builds', '5,000+'],
              ],
            };
  return (
    <section
      className="v1-context-rail"
      aria-label={vi ? 'Thông tin theo ngữ cảnh' : 'Contextual intelligence'}
    >
      <div className="rail-heading">
        <h2>{context.label}</h2>
      </div>
      <dl>
        {context.rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <Link href={`/${locale}/search`}>
        {vi ? 'Khám phá tất cả' : 'Explore all'} <ChevronRight size={15} aria-hidden="true" />
      </Link>
    </section>
  );
}

function AccountPopover({
  labels,
  accountName,
  accountUsername,
  accountInitials,
  onSignIn,
  onLogout,
}: {
  labels: ShellLabels;
  accountName: string;
  accountUsername: string;
  accountInitials: string;
  onSignIn: () => void;
  onLogout: () => Promise<void>;
}) {
  const [loggingOut, setLoggingOut] = useState(false);
  const logout = async () => {
    setLoggingOut(true);
    try {
      await onLogout();
    } catch {
      // Auth errors are normalized and shown by the shared auth state.
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div id="account-popover" className="account-popover">
      <p>{labels.account}</p>
      <div className="account-row is-current">
        <span className="guest-avatar">{accountInitials}</span>
        <span>
          <strong>{accountName}</strong>
          <small>@{accountUsername}</small>
        </span>
      </div>
      <button type="button" onClick={onSignIn}>
        <UserPlus size={17} aria-hidden="true" />
        {labels.switchAccounts}
      </button>
      <div className="account-divider" />
      <button
        type="button"
        disabled={loggingOut}
        aria-busy={loggingOut}
        onClick={() => void logout()}
      >
        <LogOut size={17} aria-hidden="true" />
        {labels.logout}
      </button>
    </div>
  );
}
