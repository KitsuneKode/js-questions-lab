# Rebuild Roadmap

This roadmap is for continuing the current product without restarting from zero.

## Guiding Principle

Keep the learning loop strong:

1. find a question quickly
2. commit to an answer
3. understand the explanation
4. run or tweak the code
5. revisit through progress and review cues

Everything below should strengthen that loop.

## Milestone 1: Platform Upgrade (Completed)

Objective:

- Move the app to Next.js 16, Tailwind CSS v4, and current shadcn-compatible patterns without breaking the working product.

## Milestone 2: Practice Surface Refinement (Completed)

Objective:

- Make the question detail page feel like a focused JavaScript practice workstation.

## Milestone 3: Review And Recommendation Loop (Completed)

Objective:

- Make the product feel habit-forming and useful between sessions.

## Milestone 4: Design System Tightening (Completed)

Objective:

- Establish a more premium, more coherent visual system.

## Milestone 5: Runtime And Sandbox Decisions (Completed)

Objective:

- Finish the runtime story and remove unnecessary complexity.

Deliverables:

- improved worker-runner messaging and behavior (mocked browser globals natively)
- decision on whether StackBlitz remains or is removed (removed to reduce bundle size)
- cleaner runtime interfaces and tests

Operational notes:

- Keep the default runtime browser-native and worker-first.
- Do not pursue full Node.js compatibility in the browser as a product requirement.
- If stronger isolation is needed in the future, treat it as a separate server-side or host-managed runtime track instead of complicating the default practice loop.

## Milestone 6: Content And Product Depth (Completed)

Objective:

- Make the knowledge layer richer and safer without destabilizing the parser.

Deliverables:

- stronger parser validation
- Client-side Markdown rendering using Vercel's `streamdown` to cleanly render markdown without dangerously setting HTML.
- improved explanation formatting or related-question connections
- integrity checks around generated content

Guardrails:

- generated content remains the app contract
- upstream README remains source material, not hand-edited product state

## Suggested Execution Order

1. platform upgrade
2. question detail page refinement
3. runtime cleanup decision
4. recommendation/review improvements
5. design system tightening
6. content metadata improvements

## Validation For Every Major Pass

Run from repo root:

- `bun run typecheck`
- `bun run lint`
- `bun run build`

If content logic changes:

- `bun run parse:questions`

## Context Management Notes

- Read only the files needed for the current milestone.
- Do not load generated JSON unless changing parsing or data shape.
- Do not read broad swaths of components before identifying the exact route/feature under change.
- Summarize current behavior before rewriting it.
