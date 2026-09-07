'use client';
import { useNotificationCount } from '@/lib/use-notification-count';

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
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import type { Locale } from '@gimme-idea/contracts';
import { AuthDialog } from '@/components/auth-dialog';
import { PostComposer } from '@/components/post-composer';
import { WalletDialog } from '@/components/wallet-dialog';
import { browserRequest } from '@/lib/api';
import { publicEntityHref } from '@/lib/domain/routes';
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
  const unreadCount = useNotificationCount();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [problemContext, setProblemContext] = useState('');
  const openerRef = useRef<HTMLElement | null>(null);
  const handledCreateRoute = useRef('');
  const pendingCreate = useRef<{ type: 'idea' | 'problem'; problemId?: string } | null>(null);
  const auth = useAuth();
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);
  const [composer, setComposer] = useState<ComposerType>(null);
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [compactNav, setCompactNav] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [walletDialogOpen, setWalletDialogOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const postRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const mobilePostRef = useRef<HTMLDivElement>(null);
  const postTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const isLanding = pathname === `/${locale}`;
  const otherLocale = locale === 'en' ? 'vi' : 'en';
  const focused =
    pathname.split('/').filter(Boolean).length > 2 ||
    /\/(dashboard|settings|profile|saved|notifications|search|terms|privacy)$/.test(pathname);

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
      badge: unreadCount ? String(unreadCount) : undefined,
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
    `/${locale}/ideas`,
  ]);
  const mobileMenuItems = navItems.filter((item) => !dockHrefs.has(item.href));

  const [filteredSuggestions, setSuggestions] = useState<
    { type: string; title: string; href: string }[]
  >([]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset the external resource state for a new request.
    setQuery(searchParams.get('q') ?? '');
  }, [searchParams]);
  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset the external resource state for a new request.
    setSuggestions([]);
    if (!query.trim()) return;
    const timer = window.setTimeout(() => {
      void browserRequest<{ type: string; title: string; slug: string }[]>(
        `/v1/search?q=${encodeURIComponent(query)}&limit=6`,
        { signal: controller.signal },
      )
        .then((rows) => {
          if (!controller.signal.aborted)
            setSuggestions(
              (rows ?? []).flatMap((row) => {
                const href = publicEntityHref(locale, row.type, row.slug);
                return href ? [{ type: row.type, title: row.title, href }] : [];
              }),
            );
        })
        .catch(() => {
          if (!controller.signal.aborted) setSuggestions([]);
        });
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, locale]);
  const localeHref = `/${otherLocale}${pathname.slice(locale.length + 1)}${searchParams.size ? `?${searchParams}` : ''}`;
  const accountName = auth.session?.displayName ?? labels.guest;
  const accountUsername = auth.session?.username ?? 'guest';
  const accountInitials = auth.session?.avatarInitials ?? 'G';
  const accountStatus = auth.session ? `@${accountUsername}` : labels.signedOut;
  const walletBalance = formatUsdcAmount(auth.wallet?.balanceUsdc ?? '0', 'compact');

  useEffect(() => {
    const media = window.matchMedia('(max-width: 1280px)');
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
      const detail = (event as CustomEvent<{ type?: ComposerType; problemId?: string }>).detail;
      if (detail?.type === 'idea' || detail?.type === 'problem') {
        openerRef.current =
          document.activeElement instanceof HTMLElement ? document.activeElement : null;
        pendingCreate.current = { type: detail.type, problemId: detail.problemId };
        if (!auth.requireAuth('create')) return;
        setProblemContext(detail.problemId ?? '');
        setComposer(detail.type);
        pendingCreate.current = null;
      }
    };
    window.addEventListener('gimme-open-create', openCreate);
    return () => window.removeEventListener('gimme-open-create', openCreate);
  }, [auth]);

  useEffect(() => {
    if (!auth.hydrated) return;
    const match = pathname.match(/\/create\/(idea|problem)$/);
    if (!match) {
      handledCreateRoute.current = '';
      return;
    }
    const routeKey = `${pathname}?${searchParams}`;
    if (handledCreateRoute.current === routeKey) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      handledCreateRoute.current = routeKey;
      window.dispatchEvent(
        new CustomEvent('gimme-open-create', {
          detail: { type: match[1], problemId: searchParams.get('problemId') ?? '' },
        }),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [auth.hydrated, pathname, searchParams]);

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

  useEffect(() => {
    if (auth.isSignedIn && pendingCreate.current) {
      const intent = pendingCreate.current;
      pendingCreate.current = null;
      setAuthDialogOpen(false);
      setProblemContext(intent.problemId ?? '');
      setComposer(intent.type);
    }
  }, [auth.isSignedIn]);

  const closePanels = () => setOpenPanel(null);
  const openAuthDialog = () => {
    setOpenPanel(null);
    setAuthDialogOpen(true);
  };
  const openComposer = (type: Exclude<ComposerType, null>) => {
    openerRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    pendingCreate.current = { type };
    if (!auth.requireAuth('post')) return;
    pendingCreate.current = null;
    setProblemContext('');
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
          {locale === 'vi' ? 'Đến nội dung chính' : 'Skip to content'}
        </a>
        <header className="landing-header">
          <div className="landing-header-inner">
            <Link className="brand" href={`/${locale}`} aria-label="Gimme Idea landing page">
              <Image src="/brand/logo-gmi.png" alt="" width={36} height={36} priority />
              <span>GIMME IDEA</span>
            </Link>
            <nav
              className="landing-links"
              aria-label={locale === 'vi' ? 'Điều hướng chính' : 'Main navigation'}
            >
              <Link href={`/${locale}/problems`}>{labels.problems}</Link>
              <Link href={`/${locale}/ideas`}>{labels.ideas}</Link>
              <Link href={`/${locale}/bounties`}>{labels.bounties}</Link>
            </nav>
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
          <span>GIMME IDEA</span>
          <span>PROBLEM → IDEA → PROJECT</span>
        </footer>
      </div>
    );
  }

  return (
    <div className="product-canvas" lang={locale}>
      <a className="skip-link" href="#main">
        {locale === 'vi' ? 'Đến nội dung chính' : 'Skip to content'}
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
              <span>{locale === 'vi' ? 'Quản lý doanh nghiệp' : 'Company dashboard'}</span>
            </Link>
            <Link
              href={localeHref}
              onClick={(event) => {
                event.preventDefault();
                router.push(`${localeHref}${window.location.hash}`);
                closePanels();
              }}
              lang={otherLocale}
            >
              <Globe2 size={iconSize} aria-hidden="true" />
              <span>{otherLocale.toUpperCase()}</span>
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

      <div className={`product-shell${focused ? ' is-focused' : ''}`}>
        <aside className="product-sidebar" aria-label="Product navigation">
          <div className="sidebar-inner">
            <Link className="sidebar-brand" href={`/${locale}/home`} aria-label="Gimme Idea home">
              <Image src="/brand/logo-gmi.png" alt="" width={40} height={40} priority />
              <span>GIMME IDEA</span>
            </Link>

            <p className="sidebar-section-label">{locale === 'vi' ? 'KHÁM PHÁ' : 'DISCOVER'}</p>
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
                    {locale === 'vi' ? 'Quản lý doanh nghiệp' : 'Company dashboard'}
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

        <div className="product-main">
          <header className="workspace-topbar">
            <Link className="workspace-breadcrumb" href={`/${locale}/home`}>
              <span className="network-dot" />
              {locale === 'vi' ? 'Mạng lưới ý tưởng' : 'The problem network'}
            </Link>
            <form role="search" className="workspace-search" action={`/${locale}/search`}>
              <Search size={17} aria-hidden="true" />
              <label className="sr-only" htmlFor="workspace-search">
                {labels.search}
              </label>
              <input
                id="workspace-search"
                type="search"
                name="q"
                defaultValue={searchParams.get('q') ?? ''}
                key={searchParams.get('q') ?? ''}
                placeholder={labels.searchPlaceholder}
                autoComplete="off"
              />
              <button type="submit" aria-label={labels.search}>
                <ChevronRight size={16} aria-hidden="true" />
              </button>
            </form>
            <Link
              className="workspace-locale"
              href={localeHref}
              onClick={(event) => {
                if (window.location.hash) {
                  event.preventDefault();
                  router.push(localeHref + window.location.hash);
                }
              }}
              hrefLang={otherLocale}
            >
              {otherLocale.toUpperCase()}
            </Link>
          </header>
          {children}
        </div>

        <aside className="discovery-rail" aria-label={labels.suggestions}>
          <div className="discovery-inner">
            <section className="rail-company">
              <span className="rail-company-icon">
                <Blocks size={24} aria-hidden="true" />
              </span>
              <p className="v1-kicker">
                {locale === 'vi' ? 'CHO DOANH NGHIỆP' : 'FOR ORGANIZATIONS'}
              </p>
              <h2>
                {locale === 'vi'
                  ? 'Vấn đề của bạn. Góc nhìn mới.'
                  : 'Your challenge. Fresh perspectives.'}
              </h2>
              <p>
                {locale === 'vi'
                  ? 'Đăng vấn đề và tìm người có thể giải quyết.'
                  : 'Share a real problem. Find the people who can solve it.'}
              </p>
              <Link href={`/${locale}/create/problem`}>
                {labels.postProblem}
                <ChevronRight size={17} aria-hidden="true" />
              </Link>
            </section>
            <div className="rail-footer">
              <span>Gimme Idea</span>
              <Link
                href={localeHref}
                onClick={(event) => {
                  if (window.location.hash) {
                    event.preventDefault();
                    router.push(localeHref + window.location.hash);
                  }
                }}
              >
                {otherLocale === 'vi' ? 'Tiếng Việt' : 'English'}
              </Link>
            </div>
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
          href={`/${locale}/bounties`}
          label={labels.bounties}
          icon={CircleDollarSign}
          active={pathname.startsWith(`/${locale}/bounties`)}
        />
      </nav>

      {composer && (
        <PostComposer
          key={`${auth.session?.id}:${composer}:${problemContext}`}
          initialProblem={problemContext}
          type={composer}
          locale={locale}
          onClose={() => {
            setComposer(null);
            const opener = openerRef.current;
            requestAnimationFrame(() => {
              if (opener?.isConnected && opener.getClientRects().length) opener.focus();
              else {
                const heading = document.querySelector<HTMLElement>('#main h1');
                if (heading) {
                  heading.tabIndex = -1;
                  heading.focus();
                }
              }
            });
          }}
        />
      )}
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
      aria-label={
        item.badge
          ? `${item.label}, ${item.badge} ${item.href.startsWith('/vi/') ? 'chưa đọc' : 'unread'}`
          : item.label
      }
      aria-current={active ? 'page' : undefined}
      onClick={onNavigate}
    >
      <Icon size={iconSize} aria-hidden="true" />
      <span>{item.label}</span>
      {item.badge && (
        <small aria-label={`${item.badge} ${item.href.startsWith('/vi/') ? 'chưa đọc' : 'unread'}`}>
          {item.badge}
        </small>
      )}
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
            <p className="rail-empty">
              {locale === 'vi'
                ? 'Không có gợi ý. Nhấn Enter để tìm trong toàn bộ mạng lưới.'
                : 'No suggestions. Press Enter to search the network.'}
            </p>
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
  const isBounty = pathname.includes('/bounties');
  const steps = isBounty
    ? [
        {
          href: '/bounties?stage=idea',
          icon: Lightbulb,
          title: vi ? 'Đề xuất hướng giải' : 'Propose a direction',
          body: vi ? 'Idea Bounty · Bài gửi riêng tư' : 'Idea Bounty · Private proposals',
        },
        {
          href: '/bounties?stage=build',
          icon: Blocks,
          title: vi ? 'Chứng minh khả năng' : 'Prove the execution',
          body: vi ? 'Build Bounty · Theo điều khoản' : 'Build Bounty · Terms-based access',
        },
      ]
    : [
        {
          href: '/problems',
          icon: Target,
          title: vi ? 'Bắt đầu với vấn đề' : 'Start with a problem',
          body: vi ? 'Hiểu điều cần giải quyết' : 'Understand what needs solving',
        },
        {
          href: '/ideas',
          icon: Lightbulb,
          title: vi ? 'Khám phá hướng giải' : 'Explore different directions',
          body: vi ? 'Ý tưởng gắn với bối cảnh thật' : 'Ideas rooted in real context',
        },
        {
          href: '/projects',
          icon: Blocks,
          title: vi ? 'Học từ những bản build' : 'Learn from real builds',
          body: vi ? 'Điều đã thử và bài học để lại' : 'What was tried. What was learned.',
        },
      ];
  return (
    <section
      className="network-guide"
      aria-label={vi ? 'Lối đi trong mạng lưới' : 'Explore the network'}
    >
      <p className="v1-kicker">
        {isBounty
          ? vi
            ? 'HAI GIAI ĐOẠN'
            : 'TWO STAGES'
          : vi
            ? 'KẾT NỐI CÁC ĐIỂM'
            : 'CONNECT THE DOTS'}
      </p>
      <h2>
        {isBounty
          ? vi
            ? 'Từ hướng giải đến thực thi.'
            : 'Direction, then execution.'
          : vi
            ? 'Mọi bản build đều có khởi đầu.'
            : 'Every build starts somewhere.'}
      </h2>
      <div className="network-guide-steps">
        {steps.map(({ href, icon: Icon, title, body }, index) => (
          <Link key={href} href={`/${locale}${href}`}>
            <span className={`guide-node node-${index}`}>
              <Icon size={19} aria-hidden="true" />
            </span>
            <span>
              <strong>{title}</strong>
              <small>{body}</small>
            </span>
            <ChevronRight size={15} aria-hidden="true" />
          </Link>
        ))}
      </div>
      <p className="network-guide-note">
        {vi
          ? 'Ý tưởng công khai để chia sẻ. Bài dự thi riêng tư để cạnh tranh.'
          : 'Public ideas for sharing. Private submissions for competing.'}
      </p>
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
