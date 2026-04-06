# PRD: Next 16 Cache Modernization

## Why this should be a separate PR

The app can benefit from Next 16's newer cache model, but enabling it safely is not a one-line change.

During the leaderboard optimization work, we verified that:

- `use cache` requires `cacheComponents: true`
- `cacheComponents: true` is not compatible with the repo's current route segment config exports such as `dynamic = 'force-static'`, `dynamic = 'force-dynamic'`, and `dynamicParams = false`
- the app also still emits a Turbopack NFT tracing warning through `llms-full.txt -> content loaders -> next.config.ts`

That means a true Cache Components migration should be done as an intentional performance PR, not piggybacked onto feature work.

## Goals

- adopt Next 16 Cache Components where they create real wins
- replace legacy route-segment rendering flags with the modern cache model
- preserve current SSG behavior for content-heavy routes
- keep auth-sensitive pages correct under Clerk + Supabase
- eliminate the noisy Turbopack file-tracing warning from content loading

## Non-goals

- redesigning product flows
- changing question content structure
- replacing Clerk or Supabase auth
- broad UI refactors unrelated to rendering/data fetching

## Current pain points

### 1. Modern cache APIs are blocked by rendering config

Many pages and routes still export:

- `dynamic = 'force-static'`
- `dynamic = 'force-dynamic'`
- `dynamicParams = false`

Those exports work today, but they block a repo-wide move to Cache Components.

### 2. Data caching is inconsistent

Some pages are naturally static, some are dynamic because of auth, and some would benefit from shared server caching. Right now that policy is spread across route config instead of being encoded close to the data functions.

### 3. Content tracing is broader than intended

The current build warns that a file trace is pulling in more of the project than intended around `loaders.ts` and `llms-full.txt`.

## Proposed outcome

After this PR:

- static content routes use Cache Components and `use cache` where appropriate
- auth-dependent routes keep runtime-sensitive reads outside cached scopes
- reusable data helpers use `cacheTag` and targeted invalidation where needed
- route segment config exports are removed or minimized
- content loader tracing is narrowed so the build no longer warns about whole-project tracing

## Scope

### Track 1: Rendering config cleanup

- audit every route exporting `dynamic` or `dynamicParams`
- replace static uses with Cache Components-compatible patterns
- keep truly request-bound routes dynamic through runtime APIs instead of segment flags

### Track 2: Data-layer caching

- convert shared read models to `use cache` where they do not depend on cookies/headers
- keep viewer-specific auth reads outside cached scopes and pass plain args when needed
- define tags for invalidation-sensitive data such as engagement, progress, and discovery summaries

### Track 3: Content loader tracing cleanup

- isolate filesystem reads used by content generation and `llms-full.txt`
- ensure `outputFileTracingIncludes` points only at the generated content subtree
- avoid pulling config/runtime files into the trace unintentionally

## Implementation plan

### Phase 1: Route inventory

- list every page/route exporting route segment config
- classify each as static, auth-dynamic, or hybrid
- identify which ones can migrate immediately without behavior change

### Phase 2: Static route migration

- migrate clearly static pages first:
  - landing
  - question listing
  - question detail
  - credits/contact
  - public API content routes
- replace segment config usage with Cache Components-compatible data functions

### Phase 3: Hybrid/auth route migration

- migrate routes like dashboard, progress, and leaderboard
- keep auth reads outside cached scopes
- cache only shared, non-user-specific data

### Phase 4: Trace cleanup

- tighten loader-side filesystem access
- re-check Turbopack NFT output
- document the approved pattern for future content-backed routes

## Acceptance criteria

- `bun run typecheck` passes
- `bun run build` passes with Cache Components enabled
- no incompatible route segment config exports remain on migrated routes
- shared read models use explicit cache boundaries
- auth-sensitive routes still reflect signed-in state correctly
- the current NFT tracing warning is removed or materially reduced

## Risks

- accidental caching of auth-sensitive reads
- over-migration of dynamic routes that still need request-time behavior
- invalidation bugs if tags are added inconsistently
- subtle SEO regressions if static/public routes change rendering mode incorrectly

## Testing plan

- route-by-route `bun run build`
- verify locale prerender output remains intact
- verify signed-in dashboard/progress/leaderboard behavior manually
- verify content APIs and `llms-full.txt` output still match expected source data
- add regression tests for any new cache helpers that transform domain data

## Recommended branch / PR shape

- branch name: `chore/next16-cache-modernization`
- target: `dev`
- keep it as a dedicated performance/architecture PR
- avoid mixing product features into it
