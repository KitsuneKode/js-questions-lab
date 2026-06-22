# Plan 003: Extract shared branch-sync composite action

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 9911ee9..HEAD -- .github/workflows/sync-main.yml .github/actions/`

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW
- **Depends on**: plans/002-unify-release-path.md
- **Category**: tech-debt
- **Planned at**: commit `9911ee9`, 2026-06-23

## Why this matters

`promote-dev.yml` and `sync-main.yml` duplicate the same shallow interface: diff two remote refs → find open PR → create PR or enable auto-merge. The **deletion test** fails — removing one workflow doesn't remove complexity; it reappears in the other. A composite action deepens the seam: callers pass `base`, `head`, `title`, `auto_merge`; implementation lives once.

After plan 002, only `sync-main.yml` remains for branch-sync — but weekly content PRs and future automations may need the same primitive. Build it now while the pattern is fresh.

## Current state

Duplicated shell block in both files (~30 lines):

```bash
if git diff --quiet origin/$BASE..origin/$HEAD; then exit 0; fi
EXISTING_PR=$(gh pr list --state open --base $BASE --head $HEAD ...)
gh pr create ... || gh pr merge --auto --merge
```

Inconsistencies today:

- `promote-dev.yml`: `permissions: contents: write`
- `sync-main.yml`: same
- `checkout@v4` vs CI's `checkout@v6`

## Scope

**In scope**:

- `.github/actions/branch-sync/action.yml` (create)
- `.github/workflows/sync-main.yml` (refactor to use composite)
- Optional: `workflow_call` reusable workflow if composite insufficient

**Out of scope**:

- release-please workflow
- weekly-sync.yml (uses peter-evans/create-pull-request — different interface)

## Git workflow

- Branch: `advisor/003-branch-sync-composite`
- Commit: `refactor(ci): extract branch-sync composite action`

## Steps

### Step 1: Create composite action

`.github/actions/branch-sync/action.yml`:

```yaml
name: Branch Sync PR
description: Open or refresh a sync PR between two branches and optionally enable auto-merge
inputs:
  base:
    description: Base branch (PR target)
    required: true
  head:
    description: Head branch (PR source)
    required: true
  title:
    description: PR title
    required: true
  body:
    description: PR body
    required: true
  auto_merge:
    description: Enable auto-merge when PR exists or after create
    required: false
    default: "true"
runs:
  using: composite
  steps:
    - shell: bash
      env:
        GH_TOKEN: ${{ github.token }}
        BASE: ${{ inputs.base }}
        HEAD: ${{ inputs.head }}
      run: |
        set -euo pipefail
        git fetch origin "$BASE" "$HEAD"
        if git diff --quiet "origin/$BASE..origin/$HEAD"; then
          echo "No changes between $BASE and $HEAD"
          exit 0
        fi
        EXISTING=$(gh pr list --state open --base "$BASE" --head "$HEAD" --json number --jq '.[0].number // empty')
        if [ -n "$EXISTING" ]; then
          echo "PR #$EXISTING already open"
          PR="$EXISTING"
        else
          PR=$(gh pr create --base "$BASE" --head "$HEAD" --title "${{ inputs.title }}" --body "${{ inputs.body }}" | grep -oE '[0-9]+$')
        fi
        if [ "${{ inputs.auto_merge }}" = "true" ]; then
          gh pr merge "$PR" --auto --merge || echo "Auto-merge not enabled or checks pending"
        fi
```

**Verify**: YAML valid; inputs documented.

### Step 2: Refactor sync-main.yml

```yaml
name: Sync Main to Dev
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pull-requests: write
concurrency:
  group: sync-main-to-dev
  cancel-in-progress: false
jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
        with:
          fetch-depth: 0
      - uses: ./.github/actions/branch-sync
        with:
          base: dev
          head: main
          title: "chore(sync): auto-sync main into dev"
          body: |
            Automated reverse sync after main updated.
            Keeps dev aligned with merge commits on main.
```

**Verify**: `actionlint .github/workflows/sync-main.yml .github/actions/branch-sync/action.yml`

### Step 3: Align action versions

Use `actions/checkout@v6` consistently in sync workflow.

## Test plan

- `workflow_dispatch` on sync-main after merging a test commit to main on fork OR document manual test on merge
- No Jest tests — optional: add `shellcheck` on embedded script in CI lint job (future)

## Done criteria

- [ ] Composite action exists and sync-main uses it
- [ ] No duplicated gh pr script in sync-main.yml
- [ ] `actionlint` clean
- [ ] `plans/README.md` row 003 DONE

## STOP conditions

- Composite action cannot run `gh` (permissions) — switch to reusable workflow with `secrets: inherit`
- `head: main` PR from Actions blocked by repo rules — report

## Maintenance notes

- Future promote automation (if reintroduced) should call same composite with `base: main`, `head: dev` reversed
- Update composite when GitHub changes `gh pr merge` flags
