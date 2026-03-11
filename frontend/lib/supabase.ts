import { createClient } from "@supabase/supabase-js";

// Get Supabase configuration from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const hasSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey);

// Never hard-crash at module import time during build.
// Use safe placeholders so static generation can complete,
// while runtime env on Vercel should provide real values.
const resolvedSupabaseUrl = supabaseUrl ?? "https://example.supabase.co";
const resolvedSupabaseAnonKey = supabaseAnonKey ?? "public-anon-key";

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
    detectSessionInUrl: true,
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
