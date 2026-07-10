---
updated: 2026-07-10T04:20:00Z
branch: feat/cloud-pr-consolidation
session_name: cloud-pr-consolidation
context_pressure: medium
---

# Session Handoff

## Done

### Product audit
- Wrote `.context/docs/product-audit-2026-07.md` with prioritized roadmap

### Trust + habit sprint (#79)
- Guest XP/streak/SRS survive sign-in (replay before clear; hydrate guard)
- Dashboard uses real XP levels + one streak source
- Daily Review (`/review`, `?status=review`, `srs_clear` +25)
- Leaderboard streaks + display-name settings
- Convex engagement scaffold (not cut over) at repo-root `convex/`

### Guest middleware (#77)
- Skip Clerk middleware on placeholder keys; skip next-intl for `/api`

## In Progress

- Consolidating cloud PRs onto `feat/cloud-pr-consolidation` for `dev`
- Still to land: #72 attempt hydrate, #75 mastery paths, #78 practice UX + design polish

## Blocked

- Full Convex cutover needs: Convex project, `bun run convex:dev`, Clerk Convex integration, `NEXT_PUBLIC_CONVEX_URL`

## Next

1. Cherry-pick #72 attempt-record hydrate + #75 mastery grid
2. Merge #78 practice UX; resolve leaderboard/dashboard conflicts favoring #79 data
3. Dark Forge/shadcn polish (display-name form, streak chrome, path eyebrows)
4. Close superseded #73 #74 #76
5. Typecheck/test and open PR → `dev`

## Decisions

- #79 is engagement source of truth; close #73/#74/#76 as superseded
- Migrate engagement only to Convex; keep content SSG + guest localStorage + Clerk
- Prefer shadcn Input/Label/Button over raw form controls; no orange-400 flame chrome

## Key Files

- `.context/docs/product-audit-2026-07.md`
- `apps/web/lib/progress/progress-context.tsx`
- `apps/web/components/dashboard/display-name-form.tsx`
- `convex/schema.ts`, `convex/progress.ts`, `convex/xp.ts`
- `.context/docs/plans/2026-07-10-supabase-to-convex.md`
