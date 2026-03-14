# Next 16 + Tailwind 4 Migration Guide

This migration should be done as a coherent pass. Do not partially upgrade the stack and leave the repo in a mixed state.

## Goals

- Upgrade to Next.js 16
- Upgrade to Tailwind CSS v4
- Refresh shadcn-compatible structure and styling patterns
- Preserve working root scripts
- Preserve the current worker-first runtime and product behavior

## Why This Matters

- The app is currently stable enough for a controlled upgrade.
- The next major round of product polish should happen on the target stack, not the old one.
- Tailwind v4 and current Next patterns will reduce friction for future work if adopted cleanly.

## Pre-Migration Checklist

Before changing dependencies:

- read `AGENTS.md`
- read `docs/agent-handoff.md`
- read `docs/rebuild-roadmap.md`
- inspect `apps/web/package.json`
- inspect `apps/web/app/layout.tsx`
- inspect `apps/web/app/globals.css`
- inspect the main question route and runtime files only if needed

Do not load unrelated files unless the migration touches them.

## Migration Principles

- Keep the migration isolated from broad UX rewrites.
- If a visual regression appears, fix it in the migration pass instead of leaving TODO debt.
- Preserve app behavior first, then improve the ergonomics.
- Keep root-level commands functional throughout.

## Next.js 16 Guidance

Use current stable features intentionally:

- keep server/client boundaries explicit
- move logic server-side when possible
- keep client-heavy interaction localized
- consider cache and revalidation features where they actually reduce repeated work
- use Suspense/streaming only when it improves the user experience

Avoid:

- adding caching complexity without measurable benefit
- turning every route into a client-heavy surface

## Tailwind v4 Guidance

- migrate to v4 conventions fully
- keep theme/token logic clear and centralized
- remove legacy config assumptions where possible
- verify all shadcn-style primitives still behave correctly

Pay special attention to:

- global styles
- CSS variable strategy
- theme tokens
- utility usage that changed between versions

## shadcn Guidance

- keep the structure compatible with current shadcn expectations
- avoid turning the app into stock shadcn visuals
- use shadcn as a base layer, not as the design identity

## Files Likely To Be Touched

- `apps/web/package.json`
- `apps/web/app/globals.css`
- `apps/web/app/layout.tsx`
- `apps/web/components.json`
- lint/config files in `apps/web`
- Tailwind-related config files if still present

## Post-Migration Validation

Run from repo root:

- `bun run typecheck`
- `bun run lint`
- `bun run build`

Also verify manually:

- landing page renders correctly
- questions list renders correctly
- question detail page renders correctly
- code playground still runs supported snippets
- progress/bookmark/recommendation states still work
- dashboard layout did not regress

## Known Risks

- styling regressions in global tokens or utility usage
- lint config drift during framework upgrade
- over-eager client/server refactors during migration
- introducing cache behavior without clear invalidation semantics

## Recommended Migration Sequence

1. update dependencies
2. fix config and tooling
3. restore build/typecheck/lint
4. fix styling regressions
5. validate primary routes
6. only then consider design refinements on top

## Completion Criteria

- root scripts still work
- major routes are visually intact
- worker-first runtime still works
- guest mode still works
- no known framework-level breakage remains
