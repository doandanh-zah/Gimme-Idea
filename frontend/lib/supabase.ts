import { createClient } from "@supabase/supabase-js";

// Get Supabase configuration from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

export const hasSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey);

// Never hard-crash at module import time during build.
// Use safe placeholders so static generation can complete,
// while runtime env on Vercel should provide real values.
// NOTE: placeholders produce AuthApiError "Invalid API key" if used at runtime —
// always set NEXT_PUBLIC_SUPABASE_* in .env.local / Vercel before testing auth.
const resolvedSupabaseUrl = supabaseUrl || "https://example.supabase.co";
const resolvedSupabaseAnonKey = supabaseAnonKey || "public-anon-key";
export const supabaseProjectRef = (() => {
  try {
    return new URL(resolvedSupabaseUrl).hostname.split(".")[0] || null;
  } catch {
    return null;
  }
})();

export function clearSupabaseAuthStorage() {
  if (typeof window === "undefined") return;

  const storagePrefix = supabaseProjectRef ? `sb-${supabaseProjectRef}-` : "sb-";
  const clearStorage = (storage: Storage) => {
    for (let index = storage.length - 1; index >= 0; index -= 1) {
      const key = storage.key(index);
      if (key?.startsWith(storagePrefix)) {
        storage.removeItem(key);
      }
    }
  };

  clearStorage(window.localStorage);
  clearStorage(window.sessionStorage);
}

export function clearSupabaseAuthCallbackParams() {
  if (typeof window === "undefined") return;

  const url = new URL(window.location.href);
  let changed = false;

  if (url.hash) {
    url.hash = "";
    changed = true;
  }

  for (const key of ["code", "error", "error_code", "error_description", "state"]) {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key);
      changed = true;
    }
  }

  if (changed) {
    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
  }
}

export function isRecoverableSupabaseAuthError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";
  const normalized = message.toLowerCase();

  return (
    normalized.includes("invalid api key") ||
    normalized.includes("invalid jwt") ||
    normalized.includes("bad_jwt") ||
    normalized.includes("jwt expired") ||
    normalized.includes("refresh_token_not_found") ||
    normalized.includes("session_not_found") ||
    normalized.includes("malformed jwt")
  );
}

if (!hasSupabaseEnv && typeof window !== "undefined") {
  console.warn(
    "[supabase] Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY. Auth/data features will be unavailable until env vars are configured."
  );
}

// Create and export Supabase client
export const supabase = createClient(resolvedSupabaseUrl, resolvedSupabaseAnonKey, {
  auth: {
    persistSession: true, // Enable session persistence for Google OAuth
    autoRefreshToken: true,
    // OAuth callback URLs are handled explicitly in /auth/callback and AuthContext.
    detectSessionInUrl: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 2, // Reduced from 10 to minimize egress
    },
  },
  global: {
    headers: {
      "x-client-info": "gimme-idea-web", // Helps identify client in logs
    },
  },
});
