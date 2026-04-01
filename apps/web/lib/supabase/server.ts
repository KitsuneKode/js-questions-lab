import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Creates an authenticated Supabase server client using Clerk's native
 * third-party auth integration. No JWT template needed — Supabase trusts
 * raw Clerk session tokens directly via the third-party auth configuration
 * in the Supabase dashboard.
 */
export function createServerSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      'Supabase env vars are not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.',
    );
  }

  return createClient(url, key, {
    async accessToken() {
      // No template argument — native third-party auth passes the raw Clerk
      // session token. Supabase validates it via the configured Clerk domain.
      return (await auth()).getToken();
    },
  });
}
