'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { hasSupabaseEnv, supabase } from '@/lib/supabase';
import { apiClient } from '@/lib/api-client';
import { User } from '@/lib/types';
import { logger } from '@/lib/logger';
import {
  clearBackendSessionHints,
  hasBackendSessionHint,
  hasLegacyAuthToken,
  markBackendSessionPresent,
} from '@/lib/session';

type NativeBridge = {
  isNativeApp: boolean;
  App?: {
    addListener: (eventName: 'appUrlOpen', listenerFunc: (event: { url: string }) => void | Promise<void>) => Promise<{ remove: () => void }>;
  };
  Browser?: {
    open: (options: { url: string; windowName?: string }) => Promise<void>;
    close: () => Promise<void>;
  };
};

async function loadNativeBridge(): Promise<NativeBridge> {
  if (typeof window === 'undefined') {
    return { isNativeApp: false };
  }

  const capacitor = (window as Window & {
    Capacitor?: { isNativePlatform?: () => boolean };
  }).Capacitor;

  if (!capacitor?.isNativePlatform?.()) {
    return { isNativeApp: false };
  }

  const [{ App }, { Browser }] = await Promise.all([
    import('@capacitor/app'),
    import('@capacitor/browser'),
  ]);

  return { isNativeApp: true, App, Browser };
}

interface AuthContextType {
  supabaseUser: SupabaseUser | null;
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isNewUser: boolean;
  showWalletPopup: boolean;
  isAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithWallet: () => Promise<void>;
  signInWithAgentKey: (secretKey: string) => Promise<void>;
  registerAgentAccount: (username: string, keyName?: string) => Promise<string>;
  signOut: () => Promise<void>;
  setShowWalletPopup: (value: boolean) => void;
  showWalletEmailPopup: boolean;
  setShowWalletEmailPopup: (value: boolean) => void;
  updateWalletEmail: (email?: string) => Promise<boolean>;
  setIsNewUser: (value: boolean) => void;
  setUser: (user: User | null) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const authUsersAreEquivalent = (a: User | null, b: User | null): boolean => {
  if (a === b) return true;
  if (!a || !b) return a === b;

  return (
    a.id === b.id &&
    a.wallet === b.wallet &&
    a.username === b.username &&
    a.reputation === b.reputation &&
    a.balance === b.balance &&
    a.avatar === b.avatar &&
    a.coverImage === b.coverImage &&
    a.bio === b.bio &&
    a.email === b.email &&
    a.authProvider === b.authProvider &&
    a.authId === b.authId &&
    a.needsWalletConnect === b.needsWalletConnect
  );
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const [showWalletPopup, setShowWalletPopup] = useState(false);
  const [showWalletEmailPopup, setShowWalletEmailPopup] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const userRef = useRef<User | null>(null);
  const setUser = useCallback((nextUser: User | null) => {
    setUserState((currentUser) =>
      authUsersAreEquivalent(currentUser, nextUser) ? currentUser : nextUser
    );
  }, []);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Check if current user is admin
  const checkAdminStatus = useCallback(async () => {
    try {
      const response = await apiClient.getAdminStatus();
      if (response.success && response.data) {
        setIsAdmin(response.data.isAdmin);
      } else {
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('Failed to check admin status:', error);
      setIsAdmin(false);
    }
  }, []);

  const processEmailLogin = useCallback(async (supabaseUser: SupabaseUser, isNewLogin: boolean = false): Promise<User | null> => {
    try {
      logger.debug('[Auth] Processing email login for:', supabaseUser.email);

      const response = await apiClient.loginWithEmail({
        email: supabaseUser.email || '',
        authId: supabaseUser.id,
        username: supabaseUser.user_metadata?.name || supabaseUser.user_metadata?.full_name,
      });

      logger.debug('[Auth] Login response:', response.success, response.error);

      if (response.success && response.data) {
        // Backend sets the JWT as an httpOnly cookie; keep only a non-sensitive hint.
        if (response.data.token) {
          markBackendSessionPresent();
          logger.debug('[Auth] Backend session cookie established');
        }

        const userData: User = {
          id: response.data.user.id,
          wallet: response.data.user.wallet || '',
          username: response.data.user.username,
          reputation: response.data.user.reputationScore || 0,
          balance: response.data.user.balance || 0,
          projects: [],
          avatar: response.data.user.avatar,
          coverImage: response.data.user.coverImage,
          bio: response.data.user.bio,
          socials: response.data.user.socialLinks,
          email: response.data.user.email,
          authProvider: response.data.user.authProvider || 'google',
          authId: response.data.user.authId,
          needsWalletConnect: response.data.user.needsWalletConnect,
        };

        setUser(userData);
        setIsNewUser(response.data.isNewUser);

        // Check admin status after login
        checkAdminStatus();

        // Only show wallet popup on NEW login (not session restore)
        // And only if user needs wallet connect
        if (isNewLogin && (response.data.isNewUser || response.data.user.needsWalletConnect)) {
          setShowWalletPopup(true);
        }
        // Google flow does not need wallet-email prompt.
        setShowWalletEmailPopup(false);

        return userData;
      } else {
        // API call failed - just clear user state, don't sign out from Supabase
        // This allows the user to retry or the app to retry
        console.warn('[Auth] Login API failed:', response.error);
        setUser(null);
        setIsAdmin(false);
        clearBackendSessionHints();
        return null;
      }
    } catch (error) {
      console.error('[Auth] Email login error:', error);
      setUser(null);
      setIsAdmin(false);
      clearBackendSessionHints();
      return null;
    }
  }, [checkAdminStatus, setUser]);

  const refreshUser = useCallback(async () => {
    if (!supabaseUser) return;

    try {
      const response = await apiClient.getCurrentUser();
      if (response.success && response.data) {
        const userData: User = {
          id: response.data.id,
          wallet: response.data.wallet || '',
          username: response.data.username,
          reputation: response.data.reputationScore || 0,
          balance: response.data.balance || 0,
          projects: [],
          avatar: response.data.avatar,
          coverImage: response.data.coverImage,
          bio: response.data.bio,
          socials: response.data.socialLinks,
          email: response.data.email,
          authProvider: response.data.authProvider || 'google',
          authId: response.data.authId,
          needsWalletConnect: response.data.needsWalletConnect,
        };
        setUser(userData);
      }
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  }, [supabaseUser, setUser]);

  // Handle auth:unauthorized event from API client
  // This means the backend JWT is invalid/expired
  useEffect(() => {
    const handleUnauthorized = async () => {
      console.warn('Backend session expired - clearing app state');
      // Only clear app-level state, don't touch Supabase session
      setUser(null);
      setIsNewUser(false);
      setShowWalletPopup(false);
      setShowWalletEmailPopup(false);
      setIsAdmin(false);
      clearBackendSessionHints();

      // If there's a valid Supabase session, try to re-login to backend
      if (session?.user) {
        logger.debug('Attempting to refresh backend session...');
        const result = await processEmailLogin(session.user, false);
        if (result) {
          logger.debug('Backend session refreshed successfully');
        }
      }
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [session, processEmailLogin]);

  useEffect(() => {
    const clearAuthHashFromUrl = () => {
      if (typeof window === 'undefined') return;
      if (!window.location.hash) return;
      // Strip OAuth tokens / errors from the URL so a reload does not re-apply them.
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    };

    // Handle hash fragment from OAuth redirect (when Supabase redirects to root with hash)
    const handleHashFragment = async () => {
      if (typeof window === 'undefined') return;
      if (!window.location.hash) return;
      if (!hasSupabaseEnv) {
        console.warn('[Auth] OAuth hash present but Supabase env is not configured.');
        clearAuthHashFromUrl();
        return;
      }

      try {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const hashError = hashParams.get('error_description') || hashParams.get('error');

        if (hashError) {
          console.error('[Auth] OAuth redirect error:', hashError);
          clearAuthHashFromUrl();
          return;
        }

        if (accessToken && refreshToken) {
          // detectSessionInUrl already processes the hash on getSession(); this is a
          // fallback for redirects that land on routes where that did not run first.
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            // Invalid API key usually means wrong/missing NEXT_PUBLIC_SUPABASE_ANON_KEY
            // at build/runtime, not a bad user password.
            console.error('Error setting session from hash:', error.message || error);
            if (
              error.message?.toLowerCase().includes('invalid api key') ||
              error.message?.toLowerCase().includes('bad_jwt')
            ) {
              try {
                await supabase.auth.signOut({ scope: 'local' });
              } catch {
                // ignore cleanup failures
              }
            }
          }

          // Always clear tokens from the URL (success or failure) to avoid loops.
          clearAuthHashFromUrl();

          if (data?.session) {
            // Session applied; AuthContext listeners handle user hydration.
          }
        }
      } catch (err) {
        // Avoid "Uncaught (in promise) undefined" which can stall the app
        console.error('Error handling auth hash fragment:', err);
        clearAuthHashFromUrl();
      }
    };

    // Handle OAuth deep link in Capacitor (com.gimmeidea.app://auth/callback#access_token=...)
    const handleAppUrlOpen = async (event: { url: string }) => {
      try {
        if (!event?.url) return;
        const url = event.url;
        if (!url.startsWith('com.gimmeidea.app://auth/callback')) return;

        const hashIndex = url.indexOf('#');
        if (hashIndex === -1) return;

        const hashParams = new URLSearchParams(url.substring(hashIndex + 1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) {
            console.error('Error setting session from deep link:', error);
          }
        }

        const nativeBridge = await loadNativeBridge();
        await nativeBridge.Browser?.close();
      } catch (err) {
        console.error('Error handling appUrlOpen:', err);
      }
    };

    handleHashFragment();
    let appUrlOpenListener: { remove: () => void } | null = null;
    let cancelled = false;

    loadNativeBridge()
      .then((nativeBridge) => {
        if (cancelled || !nativeBridge.isNativeApp || !nativeBridge.App) {
          return;
        }

        return nativeBridge.App.addListener('appUrlOpen', handleAppUrlOpen);
      })
      .then((listener) => {
        if (listener) {
          appUrlOpenListener = listener;
        }
      })
      .catch((error) => {
        console.error('Failed to initialize native auth bridge:', error);
      });

    // Get initial session and validate it with retry logic
    const initializeAuth = async () => {
      logger.debug('[Auth] Initializing auth...');

      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        logger.debug('[Auth] Supabase session:', session ? 'found' : 'not found', error?.message);

        if (error) {
          console.error('[Auth] Error getting session:', error.message || error);
          // Stale/corrupt local session or bad anon key — drop local auth so the UI recovers.
          if (
            error.message?.toLowerCase().includes('invalid api key') ||
            error.message?.toLowerCase().includes('invalid jwt') ||
            error.message?.toLowerCase().includes('bad_jwt')
          ) {
            try {
              await supabase.auth.signOut({ scope: 'local' });
            } catch {
              // ignore
            }
          }
          setSession(null);
          setSupabaseUser(null);
          setIsLoading(false);
          return;
        }

        if (session?.user) {
          logger.debug('[Auth] User from Supabase:', session.user.email);
          setSession(session);
          setSupabaseUser(session.user);

          // Check if we already have a backend session cookie or legacy token.
          const hasBackendSession = hasBackendSessionHint() || hasLegacyAuthToken();
          logger.debug('[Auth] Existing backend session:', hasBackendSession ? 'hint found' : 'not found');

          // If we have a backend session hint, try to get current user first.
          if (hasBackendSession) {
            try {
              const userResponse = await apiClient.getCurrentUser({ suppressAuthEvent: true });
              if (userResponse.success && userResponse.data) {
                logger.debug('[Auth] Existing session valid, user data fetched');
                const userData: User = {
                  id: userResponse.data.id,
                  wallet: userResponse.data.wallet || '',
                  username: userResponse.data.username,
                  reputation: userResponse.data.reputationScore || 0,
                  balance: userResponse.data.balance || 0,
                  projects: [],
                  avatar: userResponse.data.avatar,
                  coverImage: userResponse.data.coverImage,
                  bio: userResponse.data.bio,
                  socials: userResponse.data.socialLinks,
                  email: userResponse.data.email,
                  authProvider: userResponse.data.authProvider || 'google',
                  authId: userResponse.data.authId,
                  needsWalletConnect: userResponse.data.needsWalletConnect,
                };
                setUser(userData);
                checkAdminStatus();
                setIsLoading(false);
                return;
              }
            } catch (e) {
              logger.debug('[Auth] Existing backend session invalid, will re-login');
              clearBackendSessionHints();
            }
          }

          // No valid token, need to login with backend
          let result = await processEmailLogin(session.user, false);

          // If first attempt fails, wait a bit and retry once
          // This handles the case where backend is slow to respond
          if (!result) {
            logger.debug('[Auth] First login attempt failed, retrying in 500ms...');
            await new Promise(resolve => setTimeout(resolve, 500));
            result = await processEmailLogin(session.user, false);
          }

          if (!result) {
            // Backend validation failed after retry
            console.warn('[Auth] Backend login failed after retry - user may need to re-login');
          } else {
            logger.debug('[Auth] Login successful, backend session established');
          }
        } else {
          // No Supabase session. Keep supporting wallet-first login via backend JWT.
          logger.debug('[Auth] No Supabase session found');
          setSupabaseUser(null);
          setSession(null);

          const hasBackendSession = hasBackendSessionHint() || hasLegacyAuthToken();
          if (hasBackendSession) {
            const userResponse = await apiClient.getCurrentUser({ suppressAuthEvent: true });
            if (userResponse.success && userResponse.data) {
              const walletUser: User = {
                id: userResponse.data.id,
                wallet: userResponse.data.wallet || '',
                username: userResponse.data.username,
                reputation: userResponse.data.reputationScore || 0,
                balance: userResponse.data.balance || 0,
                projects: [],
                avatar: userResponse.data.avatar,
                coverImage: userResponse.data.coverImage,
                bio: userResponse.data.bio,
                socials: userResponse.data.socialLinks,
                email: userResponse.data.email,
                authProvider: userResponse.data.authProvider || 'wallet',
                authId: userResponse.data.authId,
                needsWalletConnect: userResponse.data.needsWalletConnect,
              };
              setUser(walletUser);
              checkAdminStatus();
              if ((walletUser.authProvider || 'wallet') === 'wallet' && !walletUser.email) {
                setShowWalletEmailPopup(true);
              }
            } else {
              clearBackendSessionHints();
              setUser(null);
            }
          } else {
            setUser(null);
          }
        }
      } catch (error) {
        console.error('[Auth] Auth initialization error:', error);
        // On error, just clear user data but keep Supabase session
        setUser(null);
        clearBackendSessionHints();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setSupabaseUser(session?.user ?? null);

        if (event === 'SIGNED_IN' && session?.user) {
          // Supabase can emit SIGNED_IN on tab focus/session refresh.
          // If app user + backend token are already present, skip re-login to prevent UI flicker.
          const hasBackendSession = hasBackendSessionHint() || hasLegacyAuthToken();
          const hasHydratedUser = !!userRef.current;
          if (hasHydratedUser && hasBackendSession) {
            return;
          }

          const shouldShowLoading = !hasHydratedUser;
          if (shouldShowLoading) {
            setIsLoading(true);
          }
          // Only treat as a brand-new login when app has no user and no backend session.
          await processEmailLogin(session.user, !hasHydratedUser && !hasBackendSession);
          if (shouldShowLoading) {
            setIsLoading(false);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsNewUser(false);
          setShowWalletPopup(false);
          setShowWalletEmailPopup(false);
          setIsAdmin(false);
          clearBackendSessionHints();
        }
      }
    );

    return () => {
      cancelled = true;
      if (appUrlOpenListener) {
        appUrlOpenListener.remove();
      }
      subscription.unsubscribe();
    };
  }, [processEmailLogin]);

  const signInWithGoogle = async () => {
    const nativeBridge = await loadNativeBridge();
    const isNativeApp = nativeBridge.isNativeApp;
    const redirectUri = isNativeApp
      ? 'com.gimmeidea.app://auth/callback'
      : `${window.location.origin}/auth/callback`;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUri,
        ...(isNativeApp ? { skipBrowserRedirect: true } : {}),
        queryParams: {
          prompt: 'select_account',
          access_type: 'offline',
        },
      },
    });

    if (error) throw error;

    if (isNativeApp && data?.url && nativeBridge.Browser) {
      // Open OAuth in in-app browser (avoids jumping to external browser).
      await nativeBridge.Browser.open({ url: data.url, windowName: '_self' });
    }
  };

  const signInWithWallet = async () => {
    setShowWalletPopup(true);
  };

  const mapUser = (src: any, fallbackProvider: 'wallet' | 'google' | 'agent' = 'wallet'): User => ({
    id: src.id,
    wallet: src.wallet || '',
    username: src.username,
    reputation: src.reputationScore || 0,
    balance: src.balance || 0,
    projects: [],
    avatar: src.avatar,
    coverImage: src.coverImage,
    bio: src.bio,
    socials: src.socialLinks,
    email: src.email,
    authProvider: src.authProvider || fallbackProvider,
    authId: src.authId,
    needsWalletConnect: src.needsWalletConnect,
  });

  const signInWithAgentKey = async (secretKey: string): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await apiClient.loginAgent({ secretKey });
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Agent login failed');
      }

      markBackendSessionPresent();
      setUser(mapUser(response.data.user, 'agent'));
      setIsNewUser(false);
      setShowWalletPopup(false);
      setShowWalletEmailPopup(false);
      checkAdminStatus();
    } finally {
      setIsLoading(false);
    }
  };

  const registerAgentAccount = async (username: string, keyName?: string): Promise<string> => {
    setIsLoading(true);
    try {
      const response = await apiClient.registerAgent({ username, keyName });
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Agent register failed');
      }

      markBackendSessionPresent();
      setUser(mapUser(response.data.user, 'agent'));
      setIsNewUser(true);
      setShowWalletPopup(false);
      setShowWalletEmailPopup(false);
      checkAdminStatus();

      return response.data.secretKey;
    } finally {
      setIsLoading(false);
    }
  };

  const updateWalletEmail = async (email?: string): Promise<boolean> => {
    try {
      const response = await apiClient.updateWalletEmail({ email });
      if (!response.success || !response.data) {
        return false;
      }

      const updatedUser: User = {
        id: response.data.id,
        wallet: response.data.wallet || '',
        username: response.data.username,
        reputation: response.data.reputationScore || 0,
        balance: response.data.balance || 0,
        projects: [],
        avatar: response.data.avatar,
        coverImage: response.data.coverImage,
        bio: response.data.bio,
        socials: response.data.socialLinks,
        email: response.data.email,
        authProvider: response.data.authProvider || 'wallet',
        authId: response.data.authId,
        needsWalletConnect: response.data.needsWalletConnect,
      };

      setUser(updatedUser);
      setShowWalletEmailPopup((updatedUser.authProvider || 'wallet') === 'wallet' && !updatedUser.email);
      return true;
    } catch (error) {
      console.error('[Auth] updateWalletEmail error:', error);
      return false;
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Backend logout error:', error);
    }
    // Always clear local state even if supabase signout fails
    setUser(null);
    setSupabaseUser(null);
    setSession(null);
    setIsNewUser(false);
    setShowWalletPopup(false);
    setShowWalletEmailPopup(false);
    setIsAdmin(false);
    clearBackendSessionHints();
    // Clear any other cached data
    localStorage.removeItem('gimme_ai_chat_sessions');
  };

  return (
    <AuthContext.Provider
      value={{
        supabaseUser,
        session,
        user,
        isLoading,
        isNewUser,
        showWalletPopup,
        showWalletEmailPopup,
        isAdmin,
        signInWithGoogle,
        signInWithWallet,
        signInWithAgentKey,
        registerAgentAccount,
        signOut,
        setShowWalletPopup,
        setShowWalletEmailPopup,
        updateWalletEmail,
        setIsNewUser,
        setUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
