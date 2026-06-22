# Release Train

Architecture for promoting `dev` to production (`main`) and surfacing releases on the website.

## Branches

| Branch | Role |
|--------|------|
| `dev` | Default branch, staging, all feature PRs target here |
| `main` | Production deploy (Vercel) |

## Flow

```text
feature PR → dev (CI) → release-please opens Release PR → main (CI + auto-merge)
  → GitHub tag + Release → sync-main opens main→dev PR → dev aligned
```

1. **Feature work** merges to `dev` after CI passes.
2. **release-please** (`/.github/workflows/release-please.yml`) runs on every push to `dev`, aggregates conventional commits, and opens/updates a **Release PR targeting `main`** with `CHANGELOG.md` and version bumps.
3. When the Release PR merges (auto-merge after required checks), release-please creates a **Git tag** and **GitHub Release**.
4. **sync-main** (`/.github/workflows/sync-main.yml`) runs on every `push` to `main` and opens a PR to merge `main` back into `dev` (absorbs the merge commit).
5. **weekly-sync** remains independent — content PRs target `dev`.

## When does `main` update?

Only when a **Release PR merges** — not on a timer and not on every `dev` push.

## Website integration

| Artifact | Consumer |
|----------|----------|
| `CHANGELOG.md` | `apps/web/lib/releases/parse-changelog.ts` at build time |
| `.release-please-manifest.json` | `getAppVersion()` for footer + release notes hero |
| GitHub Releases | Linked from `/[locale]/release-notes` |

## Secrets

| Secret | Purpose |
|--------|---------|
| `AUTOMATION_PAT` | Fine-grained PAT (contents + pull-requests write). Bot PRs need this to trigger CI; falls back to `GITHUB_TOKEN` if unset. |

Rotate `AUTOMATION_PAT` every 90–180 days.

## Branch protection

`main` requires PR + passing checks: Typecheck, Test, Lint, Build. Auto-merge waits for green CI.

## Manual override

- `workflow_dispatch` on **Sync Main to Dev**
- Merge Release PR manually if auto-merge is disabled

## Related docs

- [`AGENTS.md`](../../AGENTS.md) — branching policy
- [`CONTRIBUTING.md`](../../CONTRIBUTING.md) — contributor flow
