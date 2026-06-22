# Plan 004: Add PAT for automation workflow chaining

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 9911ee9..HEAD -- .github/workflows/ .github/actions/`

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: MED — PAT is a credential; scope minimally and document rotation
- **Depends on**: plans/002-unify-release-path.md
- **Category**: dx
- **Planned at**: commit `9911ee9`, 2026-06-23

## Why this matters

GitHub's `GITHUB_TOKEN` has a known limitation: **pull requests created by the default token do not trigger other workflows** on `pull_request` or `push` events. After release-please or branch-sync opens a PR with `GITHUB_TOKEN`, CI may not run — auto-merge hangs forever waiting for checks that never start.

Reference implementations document this explicitly:

- [antonbabenko/deliberation `automated-release.yml`](https://github.com/antonbabenko/deliberation/blob/master/.github/workflows/automated-release.yml) — uses `RELEASE_TOKEN` fine-grained PAT
- [rishitank/animawatch `release.yml`](https://github.com/antonbabenko/deliberation) — `PAT_AUTO_MERGE` for release-please + auto-merge

**Only implement this plan if** plan 002 testing shows CI does not run on Release PRs or sync PRs opened by Actions.

## Current state

All automation workflows use `secrets.GITHUB_TOKEN` or implicit `github.token`.

No `RELEASE_TOKEN` / `AUTOMATION_PAT` secret documented.

## Scope

**In scope**:

- Repo secret `AUTOMATION_PAT` (fine-grained PAT — maintainer creates; executor documents steps, never commits value)
- Update `release-please.yml`, `sync-main.yml`, and `.github/actions/branch-sync` to use `secrets.AUTOMATION_PAT`
- `AGENTS.md` or `.context/docs/release-train.md` — PAT purpose + rotation note (no secret value)

**Out of scope**:

- Classic long-lived PAT with repo-wide access
- Changing CI workflow triggers

## Git workflow

- Branch: `advisor/004-automation-pat`
- Commit: `chore(ci): use automation PAT for workflow chaining`

## Steps

### Step 1: Maintainer creates fine-grained PAT

Document for maintainer (do not store token in repo):

1. GitHub → Settings → Developer settings → Fine-grained PAT
2. Repository access: only `js-questions-lab`
3. Permissions: Contents (read/write), Pull requests (read/write), Workflows (read) optional
4. Add as repo secret `AUTOMATION_PAT`

**Verify**: Secret exists in repo settings (name only — never echo value).

### Step 2: Wire PAT into workflows

In `release-please.yml`:

```yaml
token: ${{ secrets.AUTOMATION_PAT }}
```

In branch-sync composite `GH_TOKEN`:

```yaml
env:
  GH_TOKEN: ${{ secrets.AUTOMATION_PAT }}
```

**Verify**: `grep AUTOMATION_PAT .github` shows usages; no token string in git diff.

### Step 3: Validate workflow chaining

1. Merge a `fix:` commit to `dev`
2. Confirm Release PR opens **and** CI workflow runs on that PR
3. Merge Release PR to `main`
4. Confirm `sync-main` workflow runs on `push` to `main`
5. Confirm sync PR to `dev` gets CI

**Verify**: `gh run list --limit 5` shows CI triggered by bot PRs.

## Test plan

Manual integration test on dev branch after merge; document run URLs in PR.

## Done criteria

- [ ] `AUTOMATION_PAT` secret configured (maintainer confirmed)
- [ ] Workflows reference secret, not hardcoded token
- [ ] CI runs on automation-opened PRs (evidence: run URLs)
- [ ] `plans/README.md` row 004 DONE

## STOP conditions

- Fine-grained PAT still doesn't trigger workflows — stop; investigate `pull_request` types or GitHub App alternative
- Public fork PR from external contributor — PAT must not leak via workflow logs

## Maintenance notes

- Rotate PAT every 90–180 days; calendar reminder
- If GitHub ships token improvements, re-evaluate and delete PAT (update ADR/docs)

## Security

- Never log `GH_TOKEN`
- Reference secret name only in docs
- If PAT ever committed, rotate immediately
