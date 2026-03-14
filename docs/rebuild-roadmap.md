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

## Milestone 1: Platform Upgrade

Objective:

- Move the app to Next.js 16, Tailwind CSS v4, and current shadcn-compatible patterns without breaking the working product.

Deliverables:

- updated dependencies
- working root scripts
- clean build, lint, and typecheck
- migration notes for any framework-level changes
- modernized lint config if practical during the same pass

Guardrails:

- do not mix large UX rewrites into the same PR unless required by the migration
- preserve worker-first runtime behavior
- preserve guest-mode functionality

## Milestone 2: Practice Surface Refinement

Objective:

- Make the question detail page feel like a focused JavaScript practice workstation.

Deliverables:

- stronger layout hierarchy
- clearer split between prompt, answer state, explanation, editor, output, and timeline
- better desktop split-pane behavior
- better mobile stacking and sticky actions
- reduced unnecessary client-side weight

Guardrails:

- avoid dashboard-style card clutter
- do not bury the prompt beneath secondary actions
- keep the explanation easy to scan

## Milestone 3: Review And Recommendation Loop

Objective:

- Make the product feel habit-forming and useful between sessions.

Deliverables:

- continue learning shelf
- stronger next best question recommendation
- weak-topic targeting
- bookmarks/review queue improvements
- lightweight session momentum or streak cues if they remain tasteful

Guardrails:

- progress features should feel helpful, not gamified noise
- do not add motivational gimmicks that compete with learning clarity

## Milestone 4: Design System Tightening

Objective:

- Establish a more premium, more coherent visual system.

Deliverables:

- tokenized color/type/spacing/radius/shadow/motion system
- better typography hierarchy
- more confident layout rhythm
- stronger focus and hover states
- refined dark/light or single-theme strategy with accessibility intact

Guardrails:

- do not introduce visual novelty without purpose
- avoid generic gradient-heavy SaaS aesthetics

## Milestone 5: Runtime And Sandbox Decisions

Objective:

- Finish the runtime story and remove unnecessary complexity.

Deliverables:

- improved worker-runner messaging and behavior
- clear unsupported-snippet UX
- decision on whether StackBlitz remains or is removed
- cleaner runtime interfaces and tests

Guardrails:

- keep worker-first execution as the default
- do not reintroduce main-thread eval
- do not make external IDEs the core experience

## Milestone 6: Content And Product Depth

Objective:

- Make the knowledge layer richer and safer without destabilizing the parser.

Deliverables:

- stronger parser validation
- better tags/metadata if needed
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
