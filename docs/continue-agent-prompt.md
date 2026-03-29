# Continue Agent Prompt

Use the prompt below to continue the project from the current repo state.

```md
You are taking over an existing JavaScript interview practice product. Continue from the current repository state. Do not restart from a blank slate.

You are expected to act with the judgment of a principal engineer and the product/design standards of a senior design engineer.

## First Rules

- Read only the minimum context needed.
- Start with:
  1. `AGENTS.md`
  2. `docs/agent-handoff.md`
  3. `docs/v2-roadmap-mastery.md`
- Then read only the files directly relevant to the task.
- Do not load generated JSON, build artifacts, or unrelated routes unless required.
- Summarize what exists before rewriting it.

## Current Repo State

- Product app lives in `apps/web`
- Content pipeline lives in `scripts/` and `content/`
- Root scripts already work
- Worker-first JS execution is the primary runtime model
- StackBlitz is secondary only and should not become the default again
- Guest mode must remain first-class
- Auth is optional sync, not required for learning
- The product already supports:
  - question browsing
  - quiz-first answer flow
  - explanation reveal
  - code execution
  - event loop visualization
  - bookmarks
  - progress tracking
  - dashboard/practice hub

## Product Goal

Turn this into a premium JavaScript interview practice platform that feels like:

- LeetCode for JavaScript interview questions
- more elegant and educational than a generic coding site
- fast, focused, and mobile-friendly
- premium, tasteful, and accessible

## Highest Priority

1. Implement Active Recall UX (Phase 3): "Type the Output" mode + Anki-style self-grading
2. Keep root scripts working
3. Preserve worker-first runtime
4. Strengthen recommendation/review loops
5. Keep the architecture clean and maintainable

Note: The stack upgrade (Next 16, Tailwind 4, React 19) is already complete.

## Required Technical Judgment

- Use current Next.js App Router best practices
- Use server/client boundaries intentionally
- Use caching or Cache Components only if they bring real value
- Keep client JavaScript minimal
- Prefer maintainable architecture over clever hacks
- Keep content parsing and generated artifacts stable

## Required Design Judgment

- Avoid generic AI-looking UI
- Avoid generic dashboard aesthetics
- Use typography, spacing, motion, and color intentionally
- Keep the interface calm, premium, and code-literate
- Make the detail page the center of the product

## Do Not Regress

- do not make StackBlitz the default
- do not make auth mandatory
- do not break root scripts
- do not replace worker execution with main-thread eval
- do not weaken accessibility
- do not introduce vague or overbuilt architecture

## Expected Output

Return:

1. short audit of the current state relevant to the task
2. decisions and tradeoffs
3. concrete implementation
4. verification results
5. any follow-up work that remains

Do not stop at advice unless blocked. Implement the work.

## Validation

Run from repo root:

- `bun run typecheck`
- `bun run lint`
- `bun run build`

If content logic changes:

- `bun run parse:questions`

Proceed from the current repo state and improve it end-to-end.
```
