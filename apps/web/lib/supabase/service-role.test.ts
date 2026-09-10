import { afterEach, describe, expect, it } from 'vitest';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/service-role';

describe('createServiceRoleSupabaseClient', () => {
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalKey = process.env.SUPABASE_SECRET_KEY;

  afterEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    process.env.SUPABASE_SECRET_KEY = originalKey;
  });

  it('throws when the secret key is missing', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    delete process.env.SUPABASE_SECRET_KEY;
    expect(() => createServiceRoleSupabaseClient()).toThrow(/SUPABASE_SECRET_KEY/);
  });
});
