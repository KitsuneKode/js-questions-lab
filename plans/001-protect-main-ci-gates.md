# Plan 001: Protect main with required CI gates

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 9911ee9..HEAD -- .github/workflows/ci.yml`
> If CI workflow changed since this plan was written, re-read required job names before configuring branch protection.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: MED — misconfigured protection can block all merges until fixed
- **Depends on**: none
- **Category**: dx
- **Planned at**: commit `9911ee9`, 2026-06-23

## Why this matters

`chore/auto-sync-workflows` enables `gh pr merge --auto` on dev→main and main→dev PRs. As of 2026-06-23, **`main` has no branch protection** (`gh api repos/{owner}/{repo}/branches/main/protection` returns 404). Auto-merge can therefore land on production without CI passing. Production deploys from `main` (per `AGENTS.md`). This plan adds the gate that makes automation safe.

## Current state

- `.github/workflows/ci.yml` — runs on `push` to `dev` and `pull_request` to `dev`/`main`. Jobs: `Detect changes`, `Typecheck`, `Test`, `Lint`, `E2E` (conditional), `Build`.
- `.github/workflows/promote-dev.yml` — scheduled dev→main PR + `--auto --merge` (on branch, not merged).
- `.github/workflows/sync-main.yml` — on `push` to `main`, main→dev PR + auto-merge.
- Repo default branch: `dev`. Production branch: `main`.

Required checks to enable (minimum for promotion PRs):

- `Typecheck`, `Test`, `Lint`, `Build` from CI workflow
- Optionally `Vercel` / `CodeRabbit` if always present on PRs (verify on a recent PR like #36)

## Commands you will need

| Purpose | Command | Expected on success |
| ------- | ------- | ------------------- |
| Verify unprotected | `gh api repos/KitsuneKode/js-questions-lab/branches/main/protection` | 404 before, 200 after |
| List workflows | `gh workflow list` | CI workflow visible |
| Typecheck (local sanity) | `bun run typecheck` | exit 0 |

## Scope

**In scope**:

- GitHub repository branch protection rules for `main` (via `gh api` or GitHub UI — document what was applied)
- Optional: protection for `dev` (require PR + CI, no direct push)
- Short note in `AGENTS.md` branching section describing required checks

**Out of scope**:

- Changing workflow YAML logic (plans 002–004)
- Vercel project settings
- Enabling auto-merge repo setting (assume already on; verify)

## Git workflow

- Branch: `advisor/001-branch-protection`
- Commit message style: `chore(ci): require CI on main before merge` (conventional, matches repo)
- Do NOT merge PR #34 until this plan is done or protection is applied on GitHub before merge

## Steps

### Step 1: Inventory required status checks

On a recent green PR to `dev` (e.g. #36), list check names:

```bash
gh pr checks 36 --json name,state --jq '.[] | select(.state=="SUCCESS") | .name'
```

Record exact names — branch protection is case-sensitive.

**Verify**: At least `Typecheck`, `Test`, `Lint`, `Build` appear.

### Step 2: Enable repo "Allow auto-merge"

GitHub → Settings → General → Pull Requests → **Allow auto-merge** enabled.

**Verify**: Setting visible in UI or document confirmation from maintainer.

### Step 3: Protect `main`

Apply via GitHub UI or API:

- Require pull request before merging
- Require status checks to pass: `Typecheck`, `Test`, `Lint`, `Build`
- Do not allow bypass for admins (recommended for production)
- Restrict who can push to `main` (maintainers only)

Example API shape (adjust check names to step 1 output):

```bash
# Maintainer applies via UI if API payload is unfamiliar — document outcome either way.
```

**Verify**: `gh api repos/KitsuneKode/js-questions-lab/branches/main/protection` returns protection config with required checks.

### Step 4: Optional — protect `dev`

- Require PR, require same CI checks, allow merge queue optional
- Keeps feature flow consistent with CONTRIBUTING.md

**Verify**: Direct push to `dev` blocked for non-bypass users (test with a noop commit attempt or settings screenshot).

### Step 5: Update AGENTS.md

In "Branching & CI/CD Workflow", add one bullet: `main` requires CI checks; auto-merge waits for green before promotion.

**Verify**: `grep -n "branch protection\|required CI" AGENTS.md` finds the new text.

## Test plan

- Open a draft PR dev→main (or use workflow_dispatch after 002) and confirm checks run
- Confirm auto-merge stays queued until all required checks pass
- No new unit tests — this is repo configuration

## Done criteria

- [ ] `main` branch protection active with ≥4 CI required checks
- [ ] Auto-merge enabled at repo level
- [ ] `AGENTS.md` documents the gate
- [ ] `plans/README.md` row 001 marked DONE

## STOP conditions

- Required check names differ between PRs (flaky optional checks) — stop and stabilize CI job naming first
- Protection blocks emergency hotfix — report and propose admin-bypass policy instead of improvising

## Maintenance notes

- If CI job names change in `ci.yml`, update branch protection the same PR
- Vercel check name changes with project renames — re-verify after Vercel moves
