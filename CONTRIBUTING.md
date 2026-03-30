# Contributing To JS Questions Lab

Thanks for contributing. This repo contains both the product app and the content pipeline that
feeds it, so a small amount of structure helps keep changes safe.

## Before You Start

- Use Bun `1.3.9`
- Use Node.js `18+`
- Run commands from the repository root unless a section explicitly says otherwise
- Treat `content/source/README.upstream.md` as the synced upstream snapshot, not as normal project
  copy
- Treat `content/generated/*.json` as generated artifacts, not hand-edited source files

## Local Setup

Install dependencies:

```bash
bun install
```

For optional auth and sync features, copy `.env.example` to `.env.local` and provide Clerk and
Supabase values. Guest mode should remain usable without auth.

See `docs/supabase-clerk-setup.md` for detailed setup instructions for the Supabase + Clerk integration.

Run the app:

```bash
bun run dev
```

## Repo Guide

- `apps/web`: product app
- `content/source`: upstream source snapshot
- `content/generated`: parsed question data and manifest
- `scripts`: sync and parsing scripts
- `docs`: roadmap, handoff, and supporting project docs

## Common Contribution Paths

### Product And UI Work

- Make app or design changes in `apps/web`
- Keep the learning loop tight: prompt, answer, explain, run, review
- Preserve the worker-first runtime model for snippet execution
- Include screenshots or short recordings in the PR when the UI changes

### Documentation Work

- Keep root `README.md` project-focused and concise
- Put contributor process in `CONTRIBUTING.md`
- Put content-source and generation rules in `docs/content-pipeline.md`
- Avoid duplicating the same guidance across multiple docs unless it serves a different audience

### Content Pipeline Work

- Update `scripts/` when changing sync or parsing behavior
- Run `bun run parse:questions` when parser or source-shape logic changes
- Verify that generated output remains compatible with the app
- Document any contract changes clearly in the PR

## Content Source Rules

- Do not edit `content/generated/questions.v1.json`
- Do not edit `content/generated/manifest.v1.json`
- Do not directly hand-edit `content/source/README.upstream.md` as product content
- If a correction belongs to Lydia Hallie's original dataset, prefer an upstream PR or document the
  need for a local overlay strategy

See `docs/content-pipeline.md` for the full sync and generation flow.

## Validation

Run the checks that match your change:

```bash
bun run lint
bun run typecheck
bun run build
```

If you changed sync or parsing logic, also run:

```bash
bun run parse:questions
```

## Branching Workflow

All new work follows a feature → dev → main flow:

```text
feat/your-feature  →  PR to dev  →  CI passes  →  merge  →  PR to main  →  merge
```

1. **Create a branch** with a `feat/`, `fix/`, or `chore/` prefix:

   ```bash
   git checkout -b feat/your-feature
   ```

2. **Push and open a PR** targeting the `dev` branch — CI will run typecheck, lint, and build automatically.
3. **After CI passes** and you're happy with the result, merge to `dev`.
4. **When `dev` is stable**, open a PR from `dev` → `main` and merge manually.

Never commit feature work directly to `main`.

## Pull Requests

Please include:

- a short summary of what changed and why
- the area affected: app, docs, content pipeline, or mixed
- validation results for the commands you ran
- screenshots for UI changes
- notes on any content-pipeline impact

## Keep In Mind

- Avoid reintroducing multiple competing runtime models
- Keep guest mode first-class
- Do not weaken the content pipeline contract
- Prefer clear, maintainable changes over broad speculative rewrites
