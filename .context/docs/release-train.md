# Release Train

Architecture for promoting `dev` to production (`main`) and surfacing releases on the website.

## Branches

| Branch | Role |
|--------|------|
| `dev` | Default branch, staging, all feature PRs target here |
| `main` | Production deploy (Vercel) |

## Flow

```text
feature PR → dev (CI) → promote-dev opens dev→main PR → CI passes → auto-merge to main
  → release-please opens Release PR on main → auto-merge → GitHub tag + Release
  → sync-main opens main→dev PR → auto-merge to dev
```

1. **Feature work** merges to `dev` after CI passes.
2. **promote-dev** (`/.github/workflows/promote-dev.yml`) opens or refreshes a full-code `dev` → `main` PR and queues auto-merge. Branch protection keeps it blocked until Typecheck, Test, Lint, and Build pass.
3. **release-please** (`/.github/workflows/release-please.yml`) runs on pushes to `main`, opens/updates a Release PR on `main`, and queues auto-merge for the changelog/version bump.
4. After the Release PR lands, release-please creates the Git tag and GitHub Release.
5. **sync-main** (`/.github/workflows/sync-main.yml`) runs on every `push` to `main` and opens a PR to merge `main` back into `dev` (absorbs release metadata and merge commits). That PR is also queued for auto-merge.
6. **release-health** (`/.github/workflows/release-health.yml`) verifies the branch rules, baseline tag, automation token, and Release PR checks.
7. **weekly-sync** remains independent — content PRs target `dev`.

## When does `main` update?

Only when a **promotion PR auto-merges after green CI** — not by direct push. The release metadata PR may update `main` again shortly after promotion.

## Website integration

| Artifact | Consumer |
|----------|----------|
| `CHANGELOG.md` | `apps/web/lib/releases/parse-changelog.ts` at build time |
| `.release-please-manifest.json` | `getAppVersion()` for footer + release notes hero |
| GitHub Releases | Linked from `/[locale]/release-notes` |

## Secrets

| Secret | Purpose |
|--------|---------|
| `AUTOMATION_PAT` | Fine-grained PAT (contents + pull-requests write). Bot PRs need this to trigger CI. Workflows fail loudly if this secret is missing. |

Rotate `AUTOMATION_PAT` every 90–180 days.

## Branch protection

`main` and `dev` are **protected**:

- **No direct pushes** — every change must go through a pull request (including admins).
- **Required CI** before merge: Typecheck, Test, Lint, Build.
- **No force-push or branch deletion** on protected branches.

If `git push origin main` or `git push origin dev` fails with a protected-branch error, that is expected. Ship through a PR instead.

Run `bun run github:protect-branches` to reapply branch rules and `bun run github:check-release-train` to verify the release train.

### One-time bootstrap (already done)

`v0.1.0` on `main` marks the production baseline so release-please does not backfill the entire git history. Do not delete that tag.

## Manual override

- `workflow_dispatch` on **Release Please** (re-run release PR generation)
- `workflow_dispatch` on **Sync Main to Dev**
- `workflow_dispatch` on **Release Train Health**

Humans should only need to intervene when CI fails, a PR has conflicts, branch protection drifts, or `AUTOMATION_PAT` expires.

## Related docs

- [`AGENTS.md`](../../AGENTS.md) — branching policy
- [`CONTRIBUTING.md`](../../CONTRIBUTING.md) — contributor flow
