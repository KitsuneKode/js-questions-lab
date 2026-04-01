import { createClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase client for browser use with optional Clerk token injection.
 * Uses native third-party auth — no JWT template required.
 */
export function createBrowserSupabaseClient(getToken?: () => Promise<string | null>) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      'Supabase env vars are not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.',
    );
  }

  return createClient(url, key, {
    async accessToken() {
      return getToken ? getToken() : null;
    },
  });
}
