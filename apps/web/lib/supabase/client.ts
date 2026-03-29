import { createClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase client for browser use with optional Clerk token injection.
 * Pass a `getToken` function from Clerk's `useSession` hook for authenticated requests.
 * Omit for anonymous/guest access.
 */
export function createBrowserSupabaseClient(getToken?: () => Promise<string | null>) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      async accessToken() {
        return getToken ? getToken() : null;
      },
    },
  );
}
