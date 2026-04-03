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

## Troubleshooting

- **401 errors / "Failed to fetch server progress"**: Verify Clerk is configured as third-party auth provider in Supabase Dashboard.
- **"invalid input syntax for type uuid" error**: Ensure the `user_id` column is defined as `TEXT`. Clerk user IDs are strings (e.g. `user_3Bm...`), not UUIDs.
