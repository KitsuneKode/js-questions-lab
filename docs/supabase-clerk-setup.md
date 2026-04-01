# Supabase + Clerk Integration Setup

Uses Supabase's native third-party auth (not the deprecated JWT template approach, which was retired April 2025).
Reference: [Clerk Supabase Integration](https://clerk.com/docs/integrations/databases/supabase)

## How It Works

Clerk session tokens are passed directly to Supabase via the `accessToken()` callback in `createClient()`.
Supabase validates them natively — no JWT secret sharing required.

```ts
// Server-side (apps/web/lib/supabase/server.ts)
createClient(url, key, {
  async accessToken() {
    return (await auth()).getToken(); // raw Clerk session token, no template
  },
});
```

## One-Time Setup Per Environment

### 1. Supabase Dashboard

1. Authentication → Third-party Auth → Add provider → **Clerk**
2. Paste your Clerk **Frontend API URL**
   - Dev: Clerk Dashboard → API Keys → "Frontend API URL" (e.g. `growing-marmot-6.clerk.accounts.dev`)
   - Prod: same, using your production Clerk instance
3. Save

### 2. Clerk Dashboard

1. Integrations → verify **Supabase** integration is enabled
2. Optional: delete the old `supabase` JWT template (no longer needed)

## Environment Variables

In this monorepo, the Next.js app reads runtime environment variables from
`apps/web/.env.local`. Start by copying `apps/web/.env.example`.

### Dev (`apps/web/.env.local`)

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=eyJhbGci...    # Supabase Dashboard → API → public key
```

`SUPABASE_SERVICE_ROLE_KEY` is **not needed at runtime** — only for admin migration scripts.

### Production (Vercel / deployment env)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=eyJhbGci...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

Use `pk_live_` / `sk_live_` Clerk keys in production (not `pk_test_`).

## Applying Migrations

```bash
# Link project (first time only)
bunx supabase link --project-ref YOUR_PROJECT_REF

# Apply all pending migrations
bunx supabase db push
```

Or paste migration SQL directly in Supabase Dashboard → SQL Editor.
Migrations live in `supabase/migrations/`.

## Local Dev (Supabase CLI)

`supabase/config.toml` configures Clerk third-party auth for local Supabase:

```toml
[auth.third_party.clerk]
enabled = true
domain = "your-dev.clerk.accounts.dev"   # your Clerk dev Frontend API URL
```

## RLS Policies

Both tables use `auth.jwt()->>'sub'` to extract the Clerk user ID from the JWT token.
This is the correct approach for Clerk third-party auth (not `auth.uid()` which is for Supabase native auth):

```sql
CREATE POLICY policy_name ON table_name FOR ALL
  TO authenticated
  USING (((SELECT auth.jwt()->>'sub') = user_id))
  WITH CHECK (((SELECT auth.jwt()->>'sub') = user_id));
```

The `user_id` column also defaults to the Clerk user ID on insert:

```sql
user_id TEXT NOT NULL DEFAULT (auth.jwt()->>'sub')
```

## Verifying Integration

1. Sign in to the app
2. Answer a question
3. Supabase Dashboard → Table Editor → `user_progress`
4. Confirm a row with your Clerk user ID in `user_id`
5. Sign out → `localStorage.clear()` in browser console
6. Sign back in → question should still show as answered (restored from Supabase)

## Troubleshooting

### 401 errors / "Failed to fetch server progress"

- Supabase dashboard: verify Clerk is configured as third-party auth provider
- Check `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` is set
- Browser Network tab: look for failed requests to your Supabase URL

### Sync not working after sign-in

- Browser DevTools Console: look for "Failed to sync" or "Sign-in sync failed" messages
- Ensure `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is valid (`pk_test_` or `pk_live_`)
- Confirm Supabase integration is enabled in Clerk dashboard

### RLS policy violations

- Ensure the Clerk Frontend API URL in Supabase matches your actual Clerk instance
- Verify `auth.jwt()->>'sub'` returns your Clerk user ID by running in SQL Editor:

  ```sql
  SELECT auth.jwt()->>'sub';
  ```

### "invalid input syntax for type uuid" error

This means the `user_id` column is defined as `UUID` instead of `TEXT`. Clerk user IDs
are strings like `user_3Bm30nuXVucNTfnrjYBhGTCnQHO`, not UUIDs. Re-run the migration
to fix the schema.
