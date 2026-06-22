# Release Train

Architecture for promoting `dev` to production (`main`) and surfacing releases on the website.

## Branches

| Branch | Role |
|--------|------|
| `dev` | Default branch, staging, all feature PRs target here |
| `main` | Production deploy (Vercel) |

## Flow

```text
feature PR → dev (CI) → release-please opens Release PR → you review + merge → main (CI)
  → GitHub tag + Release → sync-main opens main→dev PR → dev aligned
```

1. **Feature work** merges to `dev` after CI passes.
2. **release-please** (`/.github/workflows/release-please.yml`) runs on every push to `dev`, aggregates conventional commits **since the last tag on `main`**, and opens/updates a **Release PR targeting `main`** with `CHANGELOG.md` and version bumps.
3. **You review and merge** the Release PR manually after CI passes. release-please then creates a **Git tag** and **GitHub Release**.
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

`main` is **protected**:

- **No direct pushes** — every change must go through a pull request (including admins).
- **Required CI** before merge: Typecheck, Test, Lint, Build.
- **No force-push or branch deletion** on `main`.

If `git push origin main` fails with a protected-branch error, that is expected. Ship via a Release PR instead.

### One-time bootstrap (already done)

`v0.1.0` on `main` marks the production baseline so release-please does not backfill the entire git history. Do not delete that tag.

## Manual override

- `workflow_dispatch` on **Release Please** (re-run release PR generation)
- `workflow_dispatch` on **Sync Main to Dev**

## Related docs

- [`AGENTS.md`](../../AGENTS.md) — branching policy
- [`CONTRIBUTING.md`](../../CONTRIBUTING.md) — contributor flow
