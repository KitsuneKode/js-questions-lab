# Convex Foundation

Schema and Clerk auth config for the authenticated sync layer. Supabase remains the live backend until cutover.

## Next steps

See `.context/docs/convex-migration.md` for the full phased plan.

1. Run `bun run convex:dev` from `apps/web` (use `CONVEX_AGENT_MODE=anonymous` for cloud agents).
1. Set `CLERK_JWT_ISSUER_DOMAIN` in the Convex dashboard.
1. Implement shadow-write mutations for `recordAttempt`.
1. Cut over `ProgressProvider` server actions.
1. Retire Supabase.

## Out of scope

Do not put SSG question content, the worker sandbox, or guest localStorage here.
