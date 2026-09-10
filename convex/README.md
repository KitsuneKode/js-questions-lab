# Convex engagement backend

Convex holds **engagement** data (progress sync, XP, streaks, leaderboard) for signed-in users. Guest practice stays in `localStorage`. Content remains SSG.

This directory is scaffolded but **not wired** to the Next.js app yet. Supabase remains the live backend until a follow-up PR flips `ENGAGEMENT_BACKEND`.

## Activate locally

1. **Create a Convex project** at [dashboard.convex.dev](https://dashboard.convex.dev).
2. **Clerk dashboard** → Integrations → Convex → enable. Note the JWT issuer domain (e.g. `https://your-app.clerk.accounts.dev`).
3. **Convex dashboard** → Settings → Environment variables → set `CLERK_JWT_ISSUER_DOMAIN` to that issuer URL.
4. From repo root:

   ```bash
   bun run convex:dev
   ```

   Log in when prompted, link the project, and let codegen create `convex/_generated/`.

5. Copy the deployment URL into `apps/web/.env.local`:

   ```bash
   NEXT_PUBLIC_CONVEX_URL=https://YOUR_DEPLOYMENT.convex.cloud
   ```

6. **Future PR:** add `ConvexProviderWithClerk` and route server actions through `ENGAGEMENT_BACKEND`.

## Scripts (repo root)

| Script                    | Purpose                                     |
| ------------------------- | ------------------------------------------- |
| `bun run convex:dev`      | Local dev — watches functions, syncs schema |
| `bun run convex:deploy`   | Production deploy only                      |

Do **not** use `convex deploy` during day-to-day development.

## Cloud coding agents

Set `CONVEX_AGENT_MODE=anonymous` in the agent environment so `convex dev` does not conflict with a developer's linked deployment. Local developers should log in normally without agent mode.

## Functions

- **`progress.ts`** — `listMine`, `upsertOne`, `upsertMany`
- **`xp.ts`** — `listEvents`, `appendEvents` (rebuilds totals from persisted events; does not take client `totalXp`), `getTotals`, `setDisplayName`
- **`streaks.ts`** — `getMine`, `upsertMine`
- **`leaderboard.ts`** — `weekly`, `allTime`, `myWeeklyPosition`, `myAllTimePosition`

See `.context/docs/plans/2026-07-10-supabase-to-convex.md` for the full migration plan.
