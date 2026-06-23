# Content Pipeline

This project uses Lydia Hallie's `javascript-questions` repository as the canonical source for the question corpus, then transforms that source into generated JSON for the app.

## Source Of Truth

- Upstream source snapshot: `content/source/README.upstream.md`
- Parser: `scripts/parse-readme.mjs`
- Sync script: `scripts/sync-upstream.mjs`
- Generated outputs:
  - Primary output: `content/generated/locales/{locale}/questions.v1.json`
  - Primary output: `content/generated/locales/{locale}/manifest.v1.json`
  - Locale index: `content/generated/locales/index.json`
  - Legacy compatibility outputs: `content/generated/questions.v1.json` and
    `content/generated/manifest.v1.json`

The app contract is the generated JSON, but the canonical input is the synced upstream README snapshot.

## How The Flow Works

1. `bun run sync:upstream` fetches the latest upstream Lydia README.
2. `bun run parse:questions` parses that source into generated JSON.
3. `bun run content:refresh` runs both steps in sequence.
4. The Next.js app reads the generated JSON from `content/generated/`.

## Weekly Upstream Sync

The weekly workflow follows a semantic sync contract:

- The upstream commit recorded in `content/source/upstream-meta.json` is the preflight gate. If the upstream commit is unchanged, `bun run sync:upstream` exits without rewriting tracked source files or metadata.
- Generated content is deterministic for no-op runs. Tracked JSON should not change just because the parser ran again.
- `bun run content:check-sync-diff` classifies the post-refresh working tree before a PR is opened. Timestamp-only or metadata-only diffs are intentionally ignored.
- `.github/workflows/weekly-sync.yml` opens a PR only when semantic content files changed, using `AUTOMATION_PAT` so required CI runs on the bot branch.
- Weekly content PRs are not auto-merged by default. Upstream question text and answers are educational content, so meaningful changes should still get a human review.

Use the generated PR body as the review entry point. It includes the upstream commit, locale question-count deltas, semantic files changed, and metadata-only files changed.

## What Not To Edit

- Do not manually edit anything inside `content/generated/`, including locale-aware outputs under
  `content/generated/locales/`.
- Do not treat `content/source/README.upstream.md` as product copy or a normal editable markdown file. If the upstream content needs correction, prefer contributing to Lydia Hallie's repository.
