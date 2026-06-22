# Plan 005: Document release train and align AGENTS.md

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 9911ee9..HEAD -- AGENTS.md CONTRIBUTING.md .context/docs/`

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plans/002-unify-release-path.md
- **Category**: docs
- **Planned at**: commit `9911ee9`, 2026-06-23

## Why this matters

Documentation disagrees with automation:

| Source | Says |
| ------ | ---- |
| `CONTRIBUTING.md:107` | "open a PR from dev → main and merge **manually**" |
| `AGENTS.md:69` | After dev→main merge, **manually** merge main back into dev |
| PR #34 workflows | Automated promotion + reverse sync with auto-merge |

Without a single release-train doc, contributors and AI agents will follow the wrong path and re-introduce manual steps or fight automation.

## Current state

`AGENTS.md` branching section (lines 61–69) documents manual dev→main and manual re-sync.

`CONTRIBUTING.md` branching workflow (lines 91–109) documents manual promotion.

No `.context/docs/release-train.md` exists.

## Scope

**In scope**:

- Create `.context/docs/release-train.md`
- Update `AGENTS.md` branching section (replace manual re-sync bullet with automation reference)
- Update `CONTRIBUTING.md` step 4 to reference release-please / Release PR

**Out of scope**:

- Workflow YAML changes
- Vercel deploy docs

## Git workflow

- Branch: `advisor/005-release-train-docs`
- Commit: `docs(ci): document automated release train`

## Steps

### Step 1: Create release-train.md

Create `.context/docs/release-train.md` covering:

```markdown
# Release Train

## Branches
- `dev` — default branch, staging, all feature PRs target here
- `main` — production deploy (Vercel)

## Flow (after automation)
1. Feature PR → `dev` (CI required)
2. release-please aggregates conventional commits on `dev`, opens Release PR → `main`
3. CI on Release PR; auto-merge when green (branch protection)
4. Merge to `main` triggers Vercel production deploy
5. `sync-main.yml` opens `main` → `dev` PR to absorb merge commit
6. Weekly `weekly-sync.yml` opens content PR → `dev` (independent)

## When does main update?
Only when Release PR merges — not on every dev push.

## Manual override
Maintainers can `workflow_dispatch` sync workflows or merge Release PR manually if auto-merge disabled.
```

Adjust wording to match final workflow state from plan 002.

**Verify**: File exists; markdown lint if `bun run lint:md` available.

### Step 2: Update AGENTS.md

Replace manual re-sync bullet (line 69) with:

> Reverse sync from `main` to `dev` is automated via `sync-main.yml` when `main` is updated. See `.context/docs/release-train.md`.

**Verify**: `grep "sync-main" AGENTS.md` matches.

### Step 3: Update CONTRIBUTING.md

Change step 4 from manual dev→main to:

> When `dev` is stable, release-please opens a Release PR to `main`. Review changelog and merge when CI passes (auto-merge may apply).

**Verify**: No "merge manually" without qualification.

### Step 4: Cross-link from handoff if present

If `.context/handoff.md` mentions branching, add one-line pointer to release-train.md.

## Test plan

- `bun run lint:md` on changed files if script exists
- Human review: doc matches actual workflow files on branch

## Done criteria

- [ ] `.context/docs/release-train.md` created
- [ ] AGENTS.md and CONTRIBUTING.md aligned
- [ ] No contradictory "manual only" promotion language
- [ ] `plans/README.md` row 005 DONE

## STOP conditions

- Plan 002 chose different promotion model — rewrite release-train.md to match before merging docs PR

## Maintenance notes

- Any workflow change must update release-train.md in same PR
- Consider ADR if team explicitly rejects full automation
