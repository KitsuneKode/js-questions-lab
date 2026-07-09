---
updated: 2026-07-09T20:45:00Z
branch: cursor/practice-ux-improvements-52e0
session_name: practice-ux-improvements
context_pressure: medium
---

# Session Handoff

## Done

- Fixed sticky/fixed navbar on question pages: chrome auto-hides on `/questions/[id]` (nested IDE scroll), shared hysteresis helper, aligned viewport height to `100dvh`
- Scratchpad: localStorage persistence + copy / download / import toolbar actions
- Mobile Question IDE: Prompt / Code / Answer tabs below `md`, compact header, loading skeleton match
- Leaderboard polish: avatar initials, optional streak/Pro fields, guest sign-in CTA
- Enriched `/dashboard` with review, leaderboard, saved, and paths links
- Populated `content/resources.json` for high-traffic questions
- Daily review CTA on `/progress` dashboard shell
- Guided practice paths at `/paths` with curated topic sequences
- Removed hardcoded `totalQuestions = 155` (uses corpus length)
- IDE i18n: moved hardcoded English strings to message catalogs
- Keyboard hint bar uses translated scratchpad label; hidden on mobile

## In Progress

- None — Wave 1–3 practice/retention/content depth items from the roadmap are implemented in this branch

## Blocked

- None

## Next

- Run `bun run typecheck` + `bun run test` before merge
- Manual check: question page chrome hide, phone-width IDE tabs, scratchpad import/export
- Future: Pro/payments/AI (Wave 4), React Sandpack platform content pipeline

## Decisions

- Question detail routes hide global chrome while IDE fills the viewport; reveal after below-fold scroll
- Scratchpad persistence is guest-local only (no cloud sync yet)
- Practice paths are curated ID lists over the existing Lydia corpus (no new content format)
- Leaderboard social fields are optional until RPCs expose streak/pro/avatar

## Key Files

- `apps/web/lib/chrome/scroll-hide.ts`
- `apps/web/lib/scratchpad/storage.ts`
- `apps/web/components/ide/question-ide-client.tsx`
- `apps/web/components/scratchpad/*`
- `apps/web/lib/content/practice-paths.ts`
- `apps/web/app/[locale]/(app)/paths/page.tsx`
- `content/resources.json`
- `apps/web/components/dashboard/dashboard-shell.tsx`
- `apps/web/components/leaderboard/leaderboard-table.tsx`
