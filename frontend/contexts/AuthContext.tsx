'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
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
  signOut: () => Promise<void>;
  setShowWalletPopup: (value: boolean) => void;
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
  const [isAdmin, setIsAdmin] = useState(false);

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
      const response = await apiClient.loginWithEmail({
        email: supabaseUser.email || '',
        authId: supabaseUser.id,
        username: supabaseUser.user_metadata?.name || supabaseUser.user_metadata?.full_name,
      });

      if (response.success && response.data) {
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

        return userData;
      } else {
        // API call failed - just clear user state, don't sign out from Supabase
        // This allows the user to retry or the app to retry
        console.warn('Login API failed:', response.error);
        setUser(null);
        setIsAdmin(false);
        localStorage.removeItem('auth_token');
        return null;
      }
    } catch (error) {
      console.error('Email login error:', error);
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
      if (typeof window !== 'undefined' && window.location.hash) {
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
          } else if (data.session) {
            // Clean up URL
            window.history.replaceState(null, '', window.location.pathname);
          }
        }
      }
    };

    handleHashFragment();

    // Get initial session and validate it with retry logic
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setIsLoading(false);
          return;
        }

        if (session?.user) {
          setSession(session);
          setSupabaseUser(session.user);
          
          // Try to validate session with backend with retry
          let result = await processEmailLogin(session.user, false);
          
          // If first attempt fails, wait a bit and retry once
          // This handles the case where backend is slow to respond
          if (!result) {
            console.log('First login attempt failed, retrying in 1s...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            result = await processEmailLogin(session.user, false);
          }
          
          if (!result) {
            // Backend validation failed after retry
            // User will see logged-in state from Supabase but won't have app data
            // They can manually logout or refresh to try again
            console.warn('Backend login failed after retry - user may need to re-login');
          }
        } else {
          // No session, make sure everything is cleared
          setUser(null);
          setSupabaseUser(null);
          setSession(null);
          localStorage.removeItem('auth_token');
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
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
      },
    });
    if (error) throw error;
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
        isAdmin,
        signInWithGoogle,
        signOut,
        setShowWalletPopup,
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
