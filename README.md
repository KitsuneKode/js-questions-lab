# JS Questions Lab

> A productized practice experience built on Lydia Hallie's JavaScript questions.

JS Questions Lab turns the well-known `javascript-questions` repository into an interactive
learning product with active recall, runnable snippets, event-loop visualization, local-first
progress tracking, and optional cloud sync.

This repository is not just a website and it is not just a content mirror. It is both:

- a Next.js application in `apps/web`
- a content pipeline rooted in the synced upstream source

## What This Repo Is

JS Questions Lab is designed for several audiences at once:

- Site users: people practicing JavaScript interview questions in a faster feedback loop
- Product and design collaborators: people shaping UX, learning flow, onboarding, and retention
- Contributors: engineers improving the app, docs, tooling, and pipeline
- Upstream-aware maintainers: people who need a clear boundary between original source material and
  product-specific layers

## What Problem It Solves

Lydia Hallie's original repository is one of the best JavaScript learning resources on the internet.
But reading a long README is a different activity than practicing under interview conditions.

This project turns that source into a product flow:

1. Browse a curated library of questions
2. Commit to an answer before seeing the explanation
3. Run the snippet when relevant
4. Inspect runtime behavior and event-loop details
5. Track progress and come back through review loops

## At A Glance

| Topic | Details |
| --- | --- |
| Product goal | Make JavaScript interview practice feel focused, fast, and repeatable |
| Core loop | Browse -> answer -> reveal -> run -> inspect -> review |
| Rendering model | Static-first for content, dynamic only where auth or sync truly needs it |
| Runtime model | Worker-based client-side execution for runnable snippets |
| Persistence | Local-first progress with optional Clerk + Supabase sync |
| i18n | Locale-prefixed routes with `next-intl` |
| Source content | Synced from Lydia Hallie's original repository |

## Source Of Truth

The canonical source content in this repository is:

- `content/source/README.upstream.md`

This file is a synced snapshot of Lydia Hallie's upstream repository and is treated as the source of
truth for the question corpus.

Generated artifacts are derived from it:

- `content/generated/questions.v1.json`
- `content/generated/manifest.v1.json`
- `content/generated/locales/*`

> [!IMPORTANT]
> Do not manually edit generated content files.
>
> If you need to change source material, prefer:
>
> - an upstream fix
> - a documented local overlay strategy
> - or a parser/content-pipeline update

## Important Upstream Note

Because this project builds on the original source, the historical context of that source still
matters:

> [!NOTE]
> This repo was created in 2019 and the questions provided here are therefore based on the
> JavaScript syntax and behavior at that time. Since JavaScript is a constantly evolving language,
> there are newer language features that are not covered by the questions here.

That note is relevant here too. JS Questions Lab modernizes the learning experience, but it does not
pretend the original question set was authored against today's full JavaScript surface area.

## What Users Get

- A cleaner question library instead of one giant markdown scroll
- Answer-first practice instead of passive reading
- Runnable snippets in a browser-friendly worker sandbox
- Event-loop and runtime visualization where it adds learning value
- Local-first progress that works without account creation
- Optional authentication and sync for persistence across devices
- Multi-locale support for six pilot locales

## What Contributors Should Know

- The app lives in `apps/web`
- The upstream source snapshot lives in `content/source`
- Generated content lives in `content/generated`
- The parser and sync scripts live in `scripts`
- Local-first guest usability is a deliberate product choice
- Worker-based snippet execution is a deliberate architectural choice

## Architecture Summary

### App

- Next.js 16 App Router
- React 19
- Tailwind CSS v4
- Static-first rendering for content-heavy routes
- Dynamic rendering only where auth or personalized server behavior needs it

### Content Pipeline

- Sync upstream source into `content/source/README.upstream.md`
- Parse the source into structured JSON
- Load generated JSON at build time
- Render localized question experiences without requiring a content backend

### Persistence

- Local browser storage is the primary persistence layer
- Clerk provides optional identity
- Supabase provides optional sync storage

## Repo Map

```text
apps/web                 Product app (Next.js)
content/source           Canonical synced upstream source snapshot
content/generated        Parsed/generated question data and manifests
scripts                  Upstream sync + parsing pipeline
supabase                 Migrations and sync-related backend setup
CONTRIBUTING.md          Contribution workflow and expectations
AGENTS.md                Current engineering context for coding agents
```

## Getting Started

### Prerequisites

- Bun `1.3.9`
- Node.js `18+`

### Install

```bash
bun install
```

### Run The App

```bash
bun run dev
```

Then open `http://localhost:3000`.

### Optional Auth / Sync Setup

Guest mode works by default.

If you want to test authentication or progress sync:

1. Copy `apps/web/.env.example` to `apps/web/.env.local`
2. Fill in Clerk and Supabase values
3. Review `docs/supabase-clerk-setup.md`

## Core Commands

| Command | Purpose |
| --- | --- |
| `bun run dev` | Start local development |
| `bun run build` | Build the app for production |
| `bun run start` | Start the production build |
| `bun run lint` | Run repo lint checks |
| `bun run typecheck` | Run TypeScript checks |
| `bun run sync:upstream` | Refresh the upstream source snapshot |
| `bun run parse:questions` | Parse source content into generated JSON |
| `bun run content:refresh` | Sync upstream and regenerate content |

## Product Direction

The product aims for:

- a LeetCode-like JavaScript interview practice feel
- premium but restrained design
- a fast answer -> feedback -> retry loop
- excellent mobile ergonomics
- strong explanation + visualization pairing

The product avoids:

- auth-first UX
- runtime-model sprawl
- generic dashboard bloat
- turning the upstream source into an untraceable fork

## For Product Managers And Designers

This repo is especially useful if you want to reason about:

- onboarding and activation for learners
- retention loops through review, streaks, and recommendations
- static-first content delivery with selective personalization
- how learning UX can become more interactive without losing source fidelity

## For Lydia / Upstream-Aware Reviewers

This project is built with explicit attribution and source integrity in mind.

- Original questions and explanations come from Lydia Hallie's work
- The source snapshot remains traceable in this repository
- Product-specific UX, runtime tooling, and progress systems are layered on top
- Generated files are derived artifacts, not a new canonical source

## Docs To Read Next

| File | Why it matters |
| --- | --- |
| `CONTRIBUTING.md` | Setup, validation, workflow, and PR guidance |
| `AGENTS.md` | Current repo guardrails and architecture context |
| `docs/agent-handoff.md` | Current implementation state |
| `docs/v2-roadmap-mastery.md` | Active product direction |
| `docs/supabase-clerk-setup.md` | Auth + sync integration details |

## Contributing

Contributions are welcome across:

- product UX
- frontend implementation
- content pipeline improvements
- auth and sync flows
- docs and onboarding
- performance and rendering strategy

Start with `CONTRIBUTING.md`.

## Attribution

JS Questions Lab is built on top of
[Lydia Hallie's `javascript-questions`](https://github.com/lydiahallie/javascript-questions).

The educational source material belongs to that original work and its contributors. This repository
adds the product layer around it: interface design, practice flow, visualization, runtime tooling,
progress systems, and localization infrastructure.
