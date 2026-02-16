'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletReadyState } from '@solana/wallet-adapter-base';
import bs58 from 'bs58';
import { supabase } from '@/lib/supabase';
import { apiClient } from '@/lib/api-client';
import { User } from '@/lib/types';

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const [showWalletPopup, setShowWalletPopup] = useState(false);
  const [showWalletEmailPopup, setShowWalletEmailPopup] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const {
    wallets,
    select,
    connect,
    connected,
    publicKey,
    signMessage,
  } = useWallet();

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
      console.log('[Auth] Processing email login for:', supabaseUser.email);
      
      const response = await apiClient.loginWithEmail({
        email: supabaseUser.email || '',
        authId: supabaseUser.id,
        username: supabaseUser.user_metadata?.name || supabaseUser.user_metadata?.full_name,
      });

      console.log('[Auth] Login response:', response.success, response.error);

      if (response.success && response.data) {
        // Token should be saved automatically by apiFetch, but let's ensure it
        if (response.data.token) {
          localStorage.setItem('auth_token', response.data.token);
          console.log('[Auth] Token saved successfully');
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
        localStorage.removeItem('auth_token');
        return null;
      }
    } catch (error) {
      console.error('[Auth] Email login error:', error);
      setUser(null);
      setIsAdmin(false);
      localStorage.removeItem('auth_token');
      return null;
    }
  }, [checkAdminStatus]);

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
  }, [supabaseUser]);

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
      localStorage.removeItem('auth_token');
      
      // If there's a valid Supabase session, try to re-login to backend
      if (session?.user) {
        console.log('Attempting to refresh backend session...');
        const result = await processEmailLogin(session.user, false);
        if (result) {
          console.log('Backend session refreshed successfully');
        }
      }
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [session, processEmailLogin]);

  useEffect(() => {
    // Handle hash fragment from OAuth redirect (when Supabase redirects to root with hash)
    const handleHashFragment = async () => {
      if (typeof window === 'undefined') return;
      if (!window.location.hash) return;

      try {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken && refreshToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('Error setting session from hash:', error);
          }

          if (data?.session) {
            // Clean up URL after successful session set
            window.history.replaceState(null, '', window.location.pathname);
          }
        }
      } catch (err) {
        // Avoid "Uncaught (in promise) undefined" which can stall the app
        console.error('Error handling auth hash fragment:', err);
      }
    };

    handleHashFragment();

    // Get initial session and validate it with retry logic
    const initializeAuth = async () => {
      console.log('[Auth] Initializing auth...');
      
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        console.log('[Auth] Supabase session:', session ? 'found' : 'not found', error?.message);
        
        if (error) {
          console.error('[Auth] Error getting session:', error);
          setIsLoading(false);
          return;
        }

        if (session?.user) {
          console.log('[Auth] User from Supabase:', session.user.email);
          setSession(session);
          setSupabaseUser(session.user);
          
          // Check if we already have a valid token - try to get current user first
          const existingToken = localStorage.getItem('auth_token');
          console.log('[Auth] Existing token:', existingToken ? 'found' : 'not found');
          
          // If we have a token, try to get current user first (faster than full login)
          if (existingToken) {
            try {
              const userResponse = await apiClient.getCurrentUser();
              if (userResponse.success && userResponse.data) {
                console.log('[Auth] Existing session valid, user data fetched');
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
              console.log('[Auth] Existing token invalid, will re-login');
              localStorage.removeItem('auth_token');
            }
          }
          
          // No valid token, need to login with backend
          let result = await processEmailLogin(session.user, false);
          
          // If first attempt fails, wait a bit and retry once
          // This handles the case where backend is slow to respond
          if (!result) {
            console.log('[Auth] First login attempt failed, retrying in 500ms...');
            await new Promise(resolve => setTimeout(resolve, 500));
            result = await processEmailLogin(session.user, false);
          }
          
          if (!result) {
            // Backend validation failed after retry
            console.warn('[Auth] Backend login failed after retry - user may need to re-login');
          } else {
            console.log('[Auth] Login successful, token saved:', !!localStorage.getItem('auth_token'));
          }
        } else {
          // No Supabase session. Keep supporting wallet-first login via backend JWT.
          console.log('[Auth] No Supabase session found');
          setSupabaseUser(null);
          setSession(null);

          const existingToken = localStorage.getItem('auth_token');
          if (existingToken) {
            const userResponse = await apiClient.getCurrentUser();
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
              localStorage.removeItem('auth_token');
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
        localStorage.removeItem('auth_token');
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
          setIsLoading(true);
          // This is a NEW login - show popup if needed
          await processEmailLogin(session.user, true);
          setIsLoading(false);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsNewUser(false);
          setShowWalletPopup(false);
          setShowWalletEmailPopup(false);
          setIsAdmin(false);
          localStorage.removeItem('auth_token');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [processEmailLogin]);

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          // Force Google to show account selection even if only one account
          prompt: 'select_account',
          // Ensure fresh login
          access_type: 'offline',
        },
      },
    });
    if (error) throw error;
  };

  const signInWithWallet = async () => {
    try {
      setIsLoading(true);

      // Ensure wallet connected
      if (!connected || !publicKey) {
        const preferredWallet = wallets.find((w) =>
          w.adapter.name.toLowerCase().includes('phantom')
        ) || wallets.find((w) =>
          w.readyState === WalletReadyState.Installed || w.readyState === WalletReadyState.Loadable
        );

        if (!preferredWallet) {
          throw new Error('No Solana wallet found. Please install Phantom or Solflare.');
        }

        select(preferredWallet.adapter.name);
        await connect();
      }

      let activePublicKey = publicKey;
      let activeSignMessage = signMessage;

      // After connect(), hook state may still be catching up in the same tick.
      if ((!activePublicKey || !activeSignMessage) && connected) {
        const connectedAdapter = wallets.find((w) => w.adapter.connected)?.adapter as any;
        activePublicKey = connectedAdapter?.publicKey || activePublicKey;
        activeSignMessage = connectedAdapter?.signMessage || activeSignMessage;
      }

      if (!activePublicKey || !activeSignMessage) {
        throw new Error('Wallet not ready for signing. Please try again.');
      }

      const timestamp = new Date().toISOString();
      const walletAddress = activePublicKey.toBase58();
      const message = `Sign in to GimmeIdea\n\nTimestamp: ${timestamp}\nWallet: ${walletAddress}`;
      const encoded = new TextEncoder().encode(message);
      const signatureBytes = await activeSignMessage(encoded);
      const signature = bs58.encode(signatureBytes);

      const response = await apiClient.login({
        publicKey: walletAddress,
        signature,
        message,
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Wallet login failed');
      }

      localStorage.setItem('auth_token', response.data.token);

      const userData: User = {
        id: response.data.user.id,
        wallet: response.data.user.wallet || walletAddress,
        username: response.data.user.username,
        reputation: response.data.user.reputationScore || 0,
        balance: response.data.user.balance || 0,
        projects: [],
        avatar: response.data.user.avatar,
        coverImage: response.data.user.coverImage,
        bio: response.data.user.bio,
        socials: response.data.user.socialLinks,
        email: response.data.user.email,
        authProvider: response.data.user.authProvider || 'wallet',
        authId: response.data.user.authId,
        needsWalletConnect: response.data.user.needsWalletConnect || false,
      };

      setUser(userData);
      setIsNewUser((response.data.user.loginCount || 0) <= 1);
      setShowWalletPopup(false);
      setShowWalletEmailPopup((userData.authProvider || 'wallet') === 'wallet' && !userData.email);
      checkAdminStatus();
    } catch (error) {
      console.error('[Auth] Wallet login error:', error);
      throw error;
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
    // Always clear local state even if supabase signout fails
    setUser(null);
    setSupabaseUser(null);
    setSession(null);
    setIsNewUser(false);
    setShowWalletPopup(false);
    setShowWalletEmailPopup(false);
    setIsAdmin(false);
    localStorage.removeItem('auth_token');
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
