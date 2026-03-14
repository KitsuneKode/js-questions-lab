# Agent Handoff

## Repository Shape

- `README.md`: upstream source material from Lydia Hallie
- `content/source/README.upstream.md`: local synced source copy
- `content/generated/*.json`: parsed structured content used by the app
- `scripts/parse-readme.mjs`: parser/generator
- `scripts/sync-upstream.mjs`: upstream sync
- `apps/web`: product app

## Current Status Snapshot

### Stable Enough To Build On

- Root scripts work from the repository root.
- The content pipeline is usable and produces generated JSON artifacts.
- The question list and question detail flows are in place.
- A worker-first JavaScript runtime exists and is directionally correct.
- Local-first progress tracking is wired through the app.
- The dashboard has recommendation and review-oriented primitives instead of a purely decorative shell.

### Not Finished Yet

- The stack is still on Next 15 and Tailwind 3 instead of the target Next 16 and Tailwind 4.
- The current question detail page still feels more like an app screen than a deeply focused practice environment.
- StackBlitz support still exists in the dependency graph and product surface even though it is no longer the preferred model.
- ESLint is in compatibility mode and should be modernized during the stack upgrade.
- The design language is heading in the right direction, but the app still needs more restraint, hierarchy, and confidence to feel truly premium.

## Current Technical State

### Working

- Root scripts work from repo root.
- Build succeeds.
- Typecheck succeeds.
- Lint succeeds.
- Content generation succeeds.
- Question library, question detail, dashboard, auth shell, and credits page all render.

### Key Decisions Already Implemented

- Worker-first JavaScript runner in `apps/web/lib/run/sandbox.ts`
- StackBlitz only as optional full-sandbox fallback in `apps/web/components/code-playground.tsx`
- Progress state centralized in `apps/web/lib/progress/progress-context.tsx`
- Dashboard upgraded into a practice hub with:
  - continue learning
  - next recommendation
  - review queue
  - weakest topics
  - bookmarks

### Current Root Commands

Run these from the repository root:

- `bun run dev`
- `bun run build`
- `bun run start`
- `bun run lint`
- `bun run typecheck`
- `bun run parse:questions`
- `bun run sync:upstream`
- `bun run content:refresh`

## UX/Product Intent

This product should feel like:

- JavaScript interview prep with LeetCode energy
- fast and clear, not bloated
- premium and tasteful, not flashy
- helpful for both quick practice sessions and longer learning loops
- focused on rapid answer -> feedback -> retry cycles

The strongest path through the product is:

1. discover a question quickly
2. answer it before seeing the explanation
3. inspect the explanation
4. run or tweak the snippet
5. visualize async/runtime behavior
6. return later through progress/review cues

## Where The Codebase Is Still Uneven

### Stack / Platform

- Still on Next 15 and Tailwind 3.
- shadcn structure exists, but not yet refreshed for the Next 16 / Tailwind 4 target.
- Next 16 migration should make use of current App Router best practices, lean server/client boundaries, and selective modern caching features where they actually help.
- ESLint is currently using `.eslintrc` compatibility mode. This is acceptable short-term, but should be modernized during the upgrade pass.

### Runtime / Playground

- Worker runner is the correct default direction.
- The remaining decision is whether StackBlitz support should stay at all.
- If it stays, keep it hidden behind explicit user intent.
- Do not reintroduce embedded external IDE as the default experience.

### Design

- The app is directionally premium, but not fully there yet.
- The question detail page still needs a more confident, focused, split-pane practice feel.
- The dashboard is useful, but could feel more intentional and less “analytics panel”.

### State / Data

- Local-first progress is the right default.
- Guest mode should remain first-class.
- Auth should continue to be optional enhancement for sync.

## Product Principles For The Next Agent

- Favor one strong learning workflow over multiple competing modes.
- Make progress feel earned and useful, not decorative.
- Keep the practice loop tight: prompt -> commit -> explain -> run -> review.
- Treat explanation clarity as a product feature, not just content rendering.
- Prefer fewer, better interactions over dashboard clutter.
- Preserve trust: fast UI, clear attribution, predictable behavior.

## Recommended Next Engineering Sequence

1. Next 16 + Tailwind 4 migration
2. Modernize shadcn setup for that stack
3. Tighten question detail page layout and reduce client weight
4. Decide whether to keep or remove StackBlitz completely
5. Add stronger recommendation/review loops on the landing page
6. Add better content metadata and parser validation where helpful

## Open Decisions

- Should StackBlitz remain as an optional export path, or be removed entirely after the worker runner matures further?
- Should the list page stay paginated by default, or offer a user-controlled infinite mode on top of pagination?
- Should the dashboard become the signed-in home only, with the public landing page carrying more of the product narrative?

If making one of these calls, document the reasoning in the PR or handoff notes.

## Guardrails For Future Agents

- Do not collapse the app into generic dashboard aesthetics.
- Do not make auth mandatory.
- Do not lose root-level script ergonomics.
- Do not treat the upstream README as editable product content; the generated JSON is the app contract.
- Do not weaken the parser without adding validation.
- Do not replace worker execution with main-thread eval.

## Validation Checklist

Before handing off changes, run:

- `bun run typecheck`
- `bun run lint`
- `bun run build`
- `bun run parse:questions`

If changing content pipeline:

- verify generated JSON shape
- verify question count continuity
- verify question detail pages still render correctly

## Helpful Product Principles

- Bias for fast interaction loops.
- Keep explanations readable and code-focused.
- Make review and revisit behavior feel natural.
- Prefer one strong workflow over three mediocre ones.
- Every extra feature should strengthen practice, not distract from it.

## Useful Files To Read First

- `AGENTS.md`
- `CLAUDE.md`
- `apps/web/app/questions/[id]/page.tsx`
- `apps/web/components/question-client-shell.tsx`
- `apps/web/components/code-playground.tsx`
- `apps/web/lib/run/sandbox.ts`
- `apps/web/lib/progress/progress-context.tsx`
