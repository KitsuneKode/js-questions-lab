# Plan 002: Resolve release-please vs promote-dev conflict

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 9911ee9..HEAD -- .github/workflows/promote-dev.yml .github/workflows/release-please.yml .github/workflows/sync-main.yml package.json`

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED — wrong choice ships duplicate releases or blocks promotion
- **Depends on**: plans/001-protect-main-ci-gates.md
- **Category**: tech-debt
- **Planned at**: commit `9911ee9`, 2026-06-23

## Why this matters

PR #34 introduces **two independent paths** from `dev` to `main`:

1. `promote-dev.yml` — cron every 2 days, opens `dev`→`main` PR, auto-merge
2. `release-please.yml` — on every push to `dev`, `release-type: node`, `target-branch: dev`

These compete: release-please expects a **Release PR** with changelog/version bumps merged to trigger tags; promote-dev merges **the entire dev branch** on a schedule. release-please is also **incomplete** — no `release-please-config.json`, no `.release-please-manifest.json`, only `version: 0.1.0` added to root `package.json`.

Industry pattern (googleapis/release-please, antonbabenko/deliberation): release-please opens Release PR → CI → merge → tag + GitHub Release → optional reverse sync. Scheduled raw dev→main promotion is a different model.

**Recommended decision (this plan):** Use release-please as the sole promotion path to `main`; **delete** `promote-dev.yml` cron; keep `sync-main.yml` for post-merge alignment.

## Current state

`promote-dev.yml` (lines 22–52):

```yaml
# Opens dev→main PR, gh pr merge --auto --merge
```

`release-please.yml` (full file, 19 lines):

```yaml
on:
  push:
    branches:
      - dev
jobs:
  release-please:
    steps:
      - uses: googleapis/release-please-action@v4
        with:
          release-type: node
          target-branch: dev
```

`sync-main.yml` — on `push` to `main`, opens `main`→`dev` PR with auto-merge (keep).

Repo uses conventional commits (`@commitlint/config-conventional` in root `package.json`).

## Commands you will need

| Purpose | Command | Expected on success |
| ------- | ------- | ------------------- |
| Typecheck | `bun run typecheck` | exit 0 |
| Test | `bun run test` | exit 0 |
| Lint | `bun run lint` | exit 0 |
| Validate workflow syntax | `actionlint .github/workflows/*.yml` | exit 0 (install if missing) |

## Scope

**In scope**:

- `.github/workflows/release-please.yml` — complete config, target `main` for Release PR base
- `release-please-config.json` (create)
- `.release-please-manifest.json` (create)
- `CHANGELOG.md` (create, can be empty header initially)
- Delete `.github/workflows/promote-dev.yml`
- Update `sync-main.yml` only if event ordering needs comment

**Out of scope**:

- Composite action extraction (plan 003)
- PAT secret (plan 004) — use `GITHUB_TOKEN` first; note limitation in PR body
- Weekly content sync workflow

## Git workflow

- Branch: `advisor/002-unify-release-path`
- Base: `chore/auto-sync-workflows` or `dev` after #34 merges — prefer stacking on #34 branch
- Commit example: `chore(ci): use release-please as sole dev-to-main promotion`

## Steps

### Step 1: Add release-please config files

Create `release-please-config.json`:

```json
{
  "$schema": "https://raw.githubusercontent.com/googleapis/release-please/main/schemas/config.json",
  "packages": {
    ".": {
      "release-type": "node",
      "changelog-path": "CHANGELOG.md"
    }
  }
}
```

Create `.release-please-manifest.json`:

```json
{
  ".": "0.1.0"
}
```

Create `CHANGELOG.md` with standard release-please header if empty.

**Verify**: Files exist; JSON valid (`jq . release-please-config.json`).

### Step 2: Rewrite release-please workflow

Replace `.github/workflows/release-please.yml`:

```yaml
name: Release Please

on:
  push:
    branches:
      - dev

permissions:
  contents: write
  pull-requests: write

jobs:
  release-please:
    runs-on: ubuntu-latest
    steps:
      - uses: googleapis/release-please-action@v4
        id: release
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          config-file: release-please-config.json
          manifest-file: .release-please-manifest.json
          target-branch: main
```

Add optional auto-merge step (only after plan 001):

```yaml
      - name: Enable auto-merge on Release PR
        if: ${{ steps.release.outputs.prs_created == 'true' }}
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          PR_NUMBER=$(echo '${{ steps.release.outputs.prs }}' | jq -r '.[0].number')
          gh pr merge "$PR_NUMBER" --auto --merge
```

**Verify**: `actionlint` passes; `target-branch` is `main`.

### Step 3: Delete promote-dev.yml

Remove `.github/workflows/promote-dev.yml` entirely.

**Verify**: `grep -r promote-dev .github` returns nothing.

### Step 4: Confirm sync-main.yml still valid

`sync-main.yml` should remain triggered on `push` to `main` — when Release PR merges, merge commit lands on `main` and reverse-sync opens `main`→`dev` PR.

Add workflow `concurrency` to prevent overlapping sync PRs:

```yaml
concurrency:
  group: sync-main-to-dev
  cancel-in-progress: false
```

**Verify**: Read file; trigger is `push: branches: [main]`.

### Step 5: Document promotion timing in PR description

Explain when `main` updates:

- Not on every dev push — only when Release PR merges (release-please aggregates conventional commits)
- Reverse sync runs on each `main` push
- Content weekly PRs still target `dev` first

## Test plan

- Dry-run: push a `fix:` commit to a test branch, cherry-pick workflow files, run `workflow_dispatch` if added
- After merge to dev: verify release-please opens/updates Release PR targeting `main`
- Model after googleapis/release-please-action README examples

## Done criteria

- [ ] `promote-dev.yml` deleted
- [ ] release-please config + manifest present
- [ ] Release PR targets `main`, not `dev`
- [ ] `bun run typecheck && bun run test && bun run lint` exit 0
- [ ] `plans/README.md` row 002 marked DONE

## STOP conditions

- release-please opens PR against wrong branch — stop, fix `target-branch`
- Release PR never gets CI checks (GITHUB_TOKEN limitation) — stop, escalate to plan 004
- Maintainer rejects release-please model — stop and document alternative (keep promote-dev, delete release-please) before proceeding

## Maintenance notes

- Squash-merge feature PRs to `dev` so release-please changelog stays clean (per release-please README)
- After dev→main Release merge, verify sync-main PR opens; if not, implement plan 004 PAT

## Reference repos

- [googleapis/release-please-action](https://github.com/googleapis/release-please-action) — canonical Release PR flow
- [antonbabenko/deliberation `.github/workflows/automated-release.yml`](https://github.com/antonbabenko/deliberation/blob/master/.github/workflows/automated-release.yml) — PAT + auto-merge + validation checks documented in comments
