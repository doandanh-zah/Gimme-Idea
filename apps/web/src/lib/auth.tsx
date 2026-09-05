'use client';

import {
  PrivyProvider,
  getAccessToken as getPrivyAccessToken,
  useLogin,
  useLogout,
  usePrivy,
  type User as PrivyUser,
} from '@privy-io/react-auth';
import { useWallets as usePrivySolanaWallets } from '@privy-io/react-auth/solana';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export type AuthActor = {
  username: string;
  displayName: string;
  avatarUrl: string | null;
};

export type SocialAuthProvider = 'google' | 'x' | 'facebook';
export type AuthProviderName = 'dev' | SocialAuthProvider;

export type WalletActivity = {
  id: string;
  type: 'credit' | 'withdrawal';
  amountUsdc: string;
  occurredAt: string;
  label: string;
};

export type EmbeddedWallet = {
  kind: 'gimme-embedded';
  status: 'pending' | 'ready' | 'error';
  network: 'devnet';
  custody: 'privy-embedded' | 'development-server';
  address: string | null;
  smartWalletAddress: string | null;
  balanceUsdc: string;
  activities: WalletActivity[];
};

export type AuthSession = AuthActor & {
  id: string;
  createdAt: string;
  authProvider: AuthProviderName;
  avatarInitials: string;
  wallet: EmbeddedWallet;
};

type AuthContextValue = {
  hydrated: boolean;
  session: AuthSession | null;
  actor: AuthActor;
  isSignedIn: boolean;
  wallet: EmbeddedWallet | null;
  error: string | null;
  socialConfigured: boolean;
  socialReady: boolean;
  devAuthEnabled: boolean;
  signInSocial: (provider: SocialAuthProvider) => Promise<void>;
  signInMock: () => Promise<AuthSession>;
  requireAuth: (action?: string) => boolean;
  syncWalletUsdcBalance: (balanceUsdc: string) => void;
  logout: () => Promise<void>;
  clearError: () => void;
  getAccessToken: () => Promise<string | null>;
};

type DevMockResponse = {
  accessToken: string;
  user: {
    id: string;
    displayName: string;
    username: string;
    avatarUrl: string | null;
  };
  wallet: {
    address: string;
    network: 'devnet';
    custody: 'development-server';
  };
};

const AUTH_STORAGE_KEY = 'gimme-idea-auth-v3';
const DEV_TOKEN_STORAGE_KEY = 'gimme-idea-dev-access-token';
const PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3001';
const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID?.trim() ?? '';
const PRIVY_CLIENT_ID = process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID?.trim() ?? '';
const FACEBOOK_LOGIN_METHOD =
  (process.env.NEXT_PUBLIC_PRIVY_FACEBOOK_LOGIN_METHOD?.trim() as `privy:${string}` | undefined) ??
  'privy:facebook';
const DEV_AUTH_ENABLED =
  process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_ENABLE_DEV_AUTH === 'true';

const fallbackActor: AuthActor = {
  username: 'guest',
  displayName: 'Guest',
  avatarUrl: null,
};

async function fetchWithTransientRetry(input: RequestInfo | URL, init?: RequestInit) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const response = await fetch(input, init);
      if (response.status < 500 || attempt === 3) return response;
      lastError = new Error(`Server returned ${response.status}.`);
    } catch (caught) {
      lastError = caught;
      if (attempt === 3) throw caught;
    }
    await new Promise((resolve) => window.setTimeout(resolve, 100 * 2 ** attempt));
  }
  throw lastError instanceof Error ? lastError : new Error('Network request failed.');
}

const AuthContext = createContext<AuthContextValue | null>(null);

const socialProviderNames: Record<SocialAuthProvider, string> = {
  google: 'Google',
  x: 'X',
  facebook: 'Facebook',
};

function pendingWallet(custody: EmbeddedWallet['custody']): EmbeddedWallet {
  return {
    kind: 'gimme-embedded',
    status: 'pending',
    network: 'devnet',
    custody,
    address: null,
    smartWalletAddress: null,
    balanceUsdc: '0',
    activities: [],
  };
}

function normalizeUsername(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^@+/, '')
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24);
}

function initialsFor(value: string) {
  const initials = value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
  return initials || 'G';
}

function parseWallet(value: unknown): EmbeddedWallet {
  if (!value || typeof value !== 'object') return pendingWallet('privy-embedded');
  const wallet = value as Partial<EmbeddedWallet>;
  if (wallet.kind !== 'gimme-embedded') return pendingWallet('privy-embedded');
  return {
    kind: 'gimme-embedded',
    status: wallet.status === 'ready' || wallet.status === 'error' ? wallet.status : 'pending',
    network: 'devnet',
    custody: wallet.custody === 'development-server' ? 'development-server' : 'privy-embedded',
    address: typeof wallet.address === 'string' ? wallet.address : null,
    smartWalletAddress:
      typeof wallet.smartWalletAddress === 'string' ? wallet.smartWalletAddress : null,
    balanceUsdc: typeof wallet.balanceUsdc === 'string' ? wallet.balanceUsdc : '0',
    activities: Array.isArray(wallet.activities)
      ? wallet.activities.filter((activity): activity is WalletActivity =>
          Boolean(
            activity &&
            typeof activity.id === 'string' &&
            (activity.type === 'credit' || activity.type === 'withdrawal') &&
            typeof activity.amountUsdc === 'string' &&
            typeof activity.occurredAt === 'string' &&
            typeof activity.label === 'string',
          ),
        )
      : [],
  };
}

function readStoredSession(): AuthSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AuthSession>;
    if (!parsed.id || !parsed.displayName || !parsed.username || !parsed.createdAt) return null;
    if (
      parsed.authProvider !== 'dev' &&
      parsed.authProvider !== 'google' &&
      parsed.authProvider !== 'x' &&
      parsed.authProvider !== 'facebook'
    ) {
      return null;
    }
    return {
      id: parsed.id,
      displayName: parsed.displayName,
      username: normalizeUsername(parsed.username) || 'guest',
      avatarUrl: typeof parsed.avatarUrl === 'string' ? parsed.avatarUrl : null,
      avatarInitials: parsed.avatarInitials || initialsFor(parsed.displayName),
      createdAt: parsed.createdAt,
      authProvider: parsed.authProvider,
      wallet: parseWallet(parsed.wallet),
    };
  } catch {
    return null;
  }
}

function persistSession(session: AuthSession | null) {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem('gimme-idea-auth-v2');
  if (!session) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

function readDevToken() {
  return typeof window === 'undefined'
    ? null
    : window.sessionStorage.getItem(DEV_TOKEN_STORAGE_KEY);
}

export async function getCurrentAccessToken() {
  return readDevToken() ?? getPrivyAccessToken();
}

function persistDevToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) window.sessionStorage.setItem(DEV_TOKEN_STORAGE_KEY, token);
  else window.sessionStorage.removeItem(DEV_TOKEN_STORAGE_KEY);
}

async function syncServerActor(session: AuthSession, token: string) {
  const response = await fetchWithTransientRetry(`${PUBLIC_API_URL}/v1/me/sync`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      username: session.username,
      displayName: session.displayName,
      avatarUrl: session.avatarUrl,
      ...(session.wallet.address ? { rewardWalletAddress: session.wallet.address } : {}),
    }),
  });
  if (!response.ok) throw new Error(`Profile sync returned ${response.status}.`);
}

function devSessionFromResponse(response: DevMockResponse): AuthSession {
  return {
    id: `dev:${response.user.id}`,
    displayName: response.user.displayName,
    username: normalizeUsername(response.user.username) || 'devnet-builder',
    avatarUrl: response.user.avatarUrl,
    avatarInitials: initialsFor(response.user.displayName),
    createdAt: new Date().toISOString(),
    authProvider: 'dev',
    wallet: {
      kind: 'gimme-embedded',
      status: 'ready',
      network: 'devnet',
      custody: 'development-server',
      address: response.wallet.address,
      smartWalletAddress: null,
      balanceUsdc: '0',
      activities: [],
    },
  };
}

function customFacebookAccount(user: PrivyUser) {
  return user.linkedAccounts.find((account) => account.type === 'custom:facebook') as
    | {
        username?: string | null;
        name?: string | null;
        email?: string | null;
        profilePictureUrl?: string | null;
      }
    | undefined;
}

function sessionFromPrivyUser(user: PrivyUser, walletAddress: string | null): AuthSession {
  const facebook = customFacebookAccount(user);
  const authProvider: SocialAuthProvider = user.google ? 'google' : user.twitter ? 'x' : 'facebook';
  const displayName =
    user.google?.name ??
    user.twitter?.name ??
    facebook?.name ??
    user.google?.email?.split('@')[0] ??
    facebook?.email?.split('@')[0] ??
    `${socialProviderNames[authProvider]} user`;
  const requestedUsername =
    user.twitter?.username ??
    facebook?.username ??
    user.google?.email?.split('@')[0] ??
    `${authProvider}-${user.id.slice(-8)}`;
  return {
    id: `privy:${user.id}`,
    displayName,
    username: normalizeUsername(requestedUsername) || `builder-${user.id.slice(-8)}`,
    avatarUrl: user.twitter?.profilePictureUrl ?? facebook?.profilePictureUrl ?? null,
    avatarInitials: initialsFor(displayName),
    createdAt: user.createdAt.toISOString(),
    authProvider,
    wallet: {
      ...pendingWallet('privy-embedded'),
      status: walletAddress ? 'ready' : 'pending',
      address: walletAddress,
    },
  };
}

function useSharedSessionState() {
  const [hydrated, setHydrated] = useState(false);
  const [session, setSessionState] = useState<AuthSession | null>(null);
  const [error, setError] = useState<string | null>(null);

  const setSession = useCallback((next: AuthSession | null) => {
    setSessionState(next);
    persistSession(next);
  }, []);

  const signInMock = useCallback(async () => {
    setError(null);
    try {
      const response = await fetchWithTransientRetry(`${PUBLIC_API_URL}/v1/auth/mock`, {
        method: 'POST',
        headers: { accept: 'application/json' },
      });
      if (!response.ok) throw new Error(`Development account returned ${response.status}.`);
      const payload = (await response.json()) as DevMockResponse;
      if (!payload.accessToken || !payload.wallet?.address || payload.wallet.network !== 'devnet') {
        throw new Error('The development account did not return a valid Devnet wallet.');
      }
      const next = devSessionFromResponse(payload);
      persistDevToken(payload.accessToken);
      await syncServerActor(next, payload.accessToken);
      setSession(next);
      return next;
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : 'Could not start the Devnet test account.';
      setError(message);
      throw caught instanceof Error ? caught : new Error(message);
    }
  }, [setSession]);

  const requireAuth = useCallback(
    (action?: string) => {
      if (session) return true;
      window.dispatchEvent(new CustomEvent('gimme-auth-required', { detail: { action } }));
      return false;
    },
    [session],
  );

  const syncWalletUsdcBalance = useCallback((balanceUsdc: string) => {
    setSessionState((current) => {
      if (!current || current.wallet.balanceUsdc === balanceUsdc) return current;
      const next = { ...current, wallet: { ...current.wallet, balanceUsdc } };
      persistSession(next);
      return next;
    });
  }, []);

  return {
    hydrated,
    setHydrated,
    session,
    setSession,
    setSessionState,
    error,
    setError,
    signInMock,
    requireAuth,
    syncWalletUsdcBalance,
  };
}

function createContextValue(
  state: ReturnType<typeof useSharedSessionState>,
  options: {
    socialConfigured: boolean;
    socialReady: boolean;
    signInSocial: (provider: SocialAuthProvider) => Promise<void>;
    logout: () => Promise<void>;
  },
): AuthContextValue {
  return {
    hydrated: state.hydrated,
    session: state.session,
    actor: state.session
      ? {
          username: state.session.username,
          displayName: state.session.displayName,
          avatarUrl: state.session.avatarUrl,
        }
      : fallbackActor,
    isSignedIn: Boolean(state.session),
    wallet: state.session?.wallet ?? null,
    error: state.error,
    socialConfigured: options.socialConfigured,
    socialReady: options.socialReady,
    devAuthEnabled: DEV_AUTH_ENABLED,
    signInSocial: options.signInSocial,
    signInMock: state.signInMock,
    requireAuth: state.requireAuth,
    syncWalletUsdcBalance: state.syncWalletUsdcBalance,
    getAccessToken: async () =>
      state.session?.authProvider === 'dev' ? readDevToken() : getPrivyAccessToken(),
    logout: options.logout,
    clearError: () => state.setError(null),
  };
}

function MockOnlyAuthProvider({ children }: { children: ReactNode }) {
  const state = useSharedSessionState();
  const { setError, setHydrated, setSession, setSessionState } = state;

  useEffect(() => {
    setSessionState(readStoredSession());
    setHydrated(true);
  }, [setHydrated, setSessionState]);

  const signInSocial = useCallback(
    async (provider: SocialAuthProvider) => {
      const message = `${socialProviderNames[provider]} sign-in needs NEXT_PUBLIC_PRIVY_APP_ID.`;
      setError(message);
      throw new Error(message);
    },
    [setError],
  );

  const logout = useCallback(async () => {
    persistDevToken(null);
    setSession(null);
  }, [setSession]);
  const value = useMemo(
    () =>
      createContextValue(state, {
        socialConfigured: false,
        socialReady: true,
        signInSocial,
        logout,
      }),
    [logout, signInSocial, state],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function PrivyAuthBridge({ children }: { children: ReactNode }) {
  const privy = usePrivy();
  const { wallets } = usePrivySolanaWallets();
  const { logout: logoutPrivy } = useLogout();
  const state = useSharedSessionState();
  const { setError, setHydrated, setSession, setSessionState } = state;
  const embeddedWallet = wallets.find((wallet) => wallet.standardWallet.name === 'Privy');
  const lastServerSync = useRef<string | null>(null);

  const { login } = useLogin({
    onError: (caught) => {
      setError(typeof caught === 'string' ? caught : 'Could not start social sign-in.');
    },
  });

  useEffect(() => {
    if (!privy.ready) return;
    if (privy.authenticated && privy.user) {
      const next = sessionFromPrivyUser(privy.user, embeddedWallet?.address ?? null);
      setSession(next);
      const syncKey = `${privy.user.id}:${embeddedWallet?.address ?? ''}`;
      if (lastServerSync.current !== syncKey) {
        lastServerSync.current = syncKey;
        void getPrivyAccessToken()
          .then((token) => (token ? syncServerActor(next, token) : undefined))
          .catch((caught) => {
            lastServerSync.current = null;
            setError(
              caught instanceof Error
                ? caught.message
                : 'Could not sync the authenticated profile.',
            );
          });
      }
    } else {
      lastServerSync.current = null;
      const stored = readStoredSession();
      setSessionState(stored?.authProvider === 'dev' ? stored : null);
      if (stored?.authProvider !== 'dev') persistSession(null);
    }
    setHydrated(true);
  }, [
    embeddedWallet?.address,
    privy.authenticated,
    privy.ready,
    privy.user,
    setError,
    setHydrated,
    setSession,
    setSessionState,
  ]);

  const signInSocial = useCallback(
    async (provider: SocialAuthProvider) => {
      setError(null);
      if (!privy.ready) {
        const message = 'Social sign-in is still loading. Please try again.';
        setError(message);
        throw new Error(message);
      }
      const method =
        provider === 'google' ? 'google' : provider === 'x' ? 'twitter' : FACEBOOK_LOGIN_METHOD;
      login({ loginMethods: [method] });
    },
    [login, privy.ready, setError],
  );

  const logout = useCallback(async () => {
    setError(null);
    if (privy.authenticated) await logoutPrivy();
    setSession(null);
    persistDevToken(null);
  }, [logoutPrivy, privy.authenticated, setError, setSession]);

  const value = useMemo(
    () =>
      createContextValue(state, {
        socialConfigured: true,
        socialReady: privy.ready,
        signInSocial,
        logout,
      }),
    [logout, privy.ready, signInSocial, state],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  if (!PRIVY_APP_ID) return <MockOnlyAuthProvider>{children}</MockOnlyAuthProvider>;
  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      clientId={PRIVY_CLIENT_ID || undefined}
      config={{
        loginMethods: ['google', 'twitter', FACEBOOK_LOGIN_METHOD],
        appearance: {
          theme: 'dark',
          accentColor: '#9945FF',
          logo: '/brand/logo-gmi.png',
          landingHeader: 'Sign in to Gimme Idea',
          loginMessage: 'Your Solana wallet is created automatically after social sign-in.',
          showWalletLoginFirst: false,
          walletChainType: 'solana-only',
        },
        embeddedWallets: {
          solana: { createOnLogin: 'users-without-wallets' },
        },
      }}
    >
      <PrivyAuthBridge>{children}</PrivyAuthBridge>
    </PrivyProvider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider.');
  return value;
}

export function formatWalletAddress(address: string) {
  if (address.length <= 12) return address;
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}
