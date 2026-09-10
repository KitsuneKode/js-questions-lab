import 'server-only';
import { createClient } from '@supabase/supabase-js';

/**
 * Service-role client for engagement writes. Bypasses RLS.
 * Never import this from a Client Component. Always set user_id from auth().
 */
export function createServiceRoleSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;

  if (!url || !key) {
    throw new Error(
      'SUPABASE_SECRET_KEY is required for engagement writes. Set it in the server environment; never expose it to the browser.',
    );
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
