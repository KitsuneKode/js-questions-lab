# JS Questions Lab

> Practice JavaScript interview questions like a product, not a static README.

JS Questions Lab turns Lydia Hallie's `javascript-questions` dataset into an interactive study
experience with runnable code, explanation-first learning, event-loop visualization, and progress
tracking.

> [!NOTE]
> This repository is both a product app and a content pipeline.
> The app lives in `apps/web`, while the canonical source content lives in
> `content/source/README.upstream.md`.

## ✨ At A Glance

| Topic | Details |
| --- | --- |
| 🎯 Goal | Make JavaScript interview practice feel focused, interactive, and repeatable |
| 🧠 Core loop | Browse -> answer -> reveal -> run -> inspect -> review |
| ⚙️ Runtime | Worker-based client-side sandbox for runnable snippets |
| 🧾 Source | Lydia Hallie's `javascript-questions` synced into `content/source/README.upstream.md` |
| 💾 Progress | Local-first by default, with optional auth and sync layers |

## Why This Exists

The original Lydia Hallie repo is an incredible knowledge source, but reading a long markdown file
is a very different experience from practicing for interviews. This project is about turning that
source material into something you can actively use:

- 🔍 find questions quickly
- 📝 commit to an answer before seeing the explanation
- ▶️ run the snippet in a browser-friendly sandbox
- 🧭 inspect async behavior with visual feedback
- 🔁 come back later through progress and review loops

## 🧩 What You Can Do

- Browse a focused question library instead of scrolling through one giant document
- Read explanations in a cleaner product surface
- Run JavaScript snippets in a client-side worker sandbox
- Use the event-loop visualizer for runtime-heavy questions
- Track progress locally and keep guest mode fully usable

## 🛠️ Stack

- Next.js 16 App Router
- React 19
- Tailwind CSS v4
- Bun workspaces and root scripts
- `streamdown` for safe client-side markdown rendering
- Clerk and Supabase as optional identity and sync layers

## 📁 Repo Map

```text
apps/web            Next.js app for the product experience
content/source      Synced upstream source snapshot
content/generated   Parsed JSON consumed by the app
scripts             Sync and parsing scripts
docs                Handoff notes, roadmaps, and supporting references
```

## 🚀 Getting Started

### 1. Prerequisites

- Bun `1.3.9`
- Node.js `18+`

### 2. Install Dependencies

```bash
bun install
```

### 3. Optional Environment Setup

Guest mode is the default experience. If you want to test auth or sync features, copy
`apps/web/.env.example` to `apps/web/.env.local` and provide the Clerk and Supabase values.
You can leave the placeholders in place if you want to stay in guest mode locally.

For Supabase + Clerk integration details, see `docs/supabase-clerk-setup.md`.

### 4. Run The App

```bash
bun run dev
```

Then open `http://localhost:3000`.

## 🧪 Core Commands

| Command | What it does |
| --- | --- |
| `bun run dev` | Start the app in development mode |
| `bun run build` | Create a production build |
| `bun run start` | Run the production build |
| `bun run lint` | Run the repo lint checks |
| `bun run typecheck` | Run TypeScript checks |
| `bun run parse:questions` | Parse the synced upstream source into generated JSON |
| `bun run sync:upstream` | Refresh the upstream Lydia source snapshot |
| `bun run content:refresh` | Sync upstream content and regenerate JSON in one step |

### Database Setup (Optional)

If using Supabase for progress sync:

```bash
# Link to your Supabase project
bunx supabase link --project-ref your-project-id

# Apply migrations
bunx supabase db push
```

Migrations are located in `supabase/migrations/` and include:

- `user_progress` table with Row Level Security
- `user_srs_progress` table for optimized SRS queries
- RLS policies enforced via Clerk JWT tokens

## 📚 Documentation Map

| Doc | Why you would read it |
| --- | --- |
| `CONTRIBUTING.md` | Setup, workflow, validation, and PR expectations |
| `docs/content-pipeline.md` | Source-of-truth, sync flow, parser flow, and generated artifact rules |
| `docs/agent-handoff.md` | Current repo state, guardrails, and engineering context |
| `docs/v2-roadmap-mastery.md` | The next major product direction |
| `docs/supabase-clerk-setup.md` | Auth and sync integration setup |

## 🎯 Current Focus

- Active recall modes that move beyond passive multiple choice
- Stronger review loops and spaced repetition
- Curated paths and better recommendation flows
- Deeper visual explanations for runtime-heavy concepts

## 🌱 Future Improvements

- Richer explanation context and related-reference linking
- Offline or PWA-friendly workflows
- Multi-source content ingestion beyond the Lydia dataset

## 🙏 Source Content And Attribution

This project is built on top of
[Lydia Hallie's `javascript-questions`](https://github.com/lydiahallie/javascript-questions).

The canonical source snapshot in this repo lives at `content/source/README.upstream.md`, and the
app reads generated data from `content/generated/`.

> [!IMPORTANT]
> Do not edit generated files directly.
> If the source material itself needs correction, prefer the upstream repository or a documented
> local overlay strategy instead of hand-editing the synced snapshot.

## 🤝 Contributing

Contributions are welcome across the app, docs, tooling, and product polish.

Start with `CONTRIBUTING.md` for:

- local setup
- validation commands
- content-pipeline rules
- PR expectations
