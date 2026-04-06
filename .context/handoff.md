---
updated: 2026-04-07T00:00:00Z
branch: feat/react-platform
session_name: React Practice Platform — Phase B/C/D/F implementation
context_pressure: high
---

## Done

- Merged PR #25: guest session ID fix (fix/guest-session-isolation → dev)
- Audited both PRDs against codebase — full status table established
- Created branch `feat/react-platform` off `dev`
- Wrote full implementation plan: `docs/superpowers/plans/2026-04-07-react-platform.md`

## In Progress

- Nothing committed to `feat/react-platform` yet — plan written, execution not started

## Blocked

- Session limit hit before parallel agents could be dispatched

## Next

- [ ] Read plan first: `docs/superpowers/plans/2026-04-07-react-platform.md` (has every file path, exact code, commit messages)
- [ ] Task 1 (independent): Credits page `apps/web/app/[locale]/credits/page.tsx` — add 4 entries (Sandpack, react-patterns, Stream, ElevenLabs)
- [ ] Task 2 (independent): ReactQuestion type in `apps/web/lib/content/types.ts` + 10 seed JSONs in `content/generated/react/en/` + `content/generated/react/manifest.json`
- [ ] Task 3 (after Task 2): `apps/web/lib/content/react-loaders.ts` + tests + `scripts/parse-react-patterns.mjs` + `parse:react` script in root `package.json`
- [ ] Task 4 (after Task 2 types): Install `@codesandbox/sandpack-react`, create all files in `apps/web/components/react-ide/`
- [ ] Task 5 (after Tasks 3+4): React routes — `apps/web/app/[locale]/react/page.tsx` + `apps/web/app/[locale]/react/[id]/page.tsx` + loading.tsx
- [ ] Task 6 (after Task 5): Add React nav link to site header, remove Coming Soon from landing bento
- [ ] Open PR: feat/react-platform → dev

## Decisions

- Seed content over submodule: 10 handcrafted questions, not git submodule — avoids CI complexity
- React IDs are strings: "react-counter" etc — no collision with numeric JS question IDs
- No new ProgressItem schema: React IDs slot into existing store as-is (PRD section 6.6)
- SSG-only: force-static on all React routes, same as JS questions
- Sandpack lazy-loaded: next/dynamic ssr:false, same pattern as question-ide-dynamic.tsx
- i18n: React content English-only, no new locale files needed for phases B-D

## Key Files

- Plan (read first): `docs/superpowers/plans/2026-04-07-react-platform.md`
- Loader pattern to mirror: `apps/web/lib/content/loaders.ts`
- Dynamic IDE pattern: `apps/web/components/ide/question-ide-dynamic.tsx`
- IDE client structure ref: `apps/web/components/ide/question-ide-client.tsx`
- Types to extend: `apps/web/lib/content/types.ts`
- Credits page: `apps/web/app/[locale]/credits/page.tsx`
- Landing bento: `apps/web/components/landing/react-bento-section.tsx`
- Site header: `apps/web/components/site-header.tsx`
- Content output dir: `content/generated/` (create react/en/ subdir)
- Root scripts file: `package.json`
- Test runner: cd apps/web && npx vitest run
- TS check: cd apps/web && node_modules/.bin/tsc --noEmit
