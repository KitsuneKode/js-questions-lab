# Content Pipeline

This project uses Lydia Hallie's `javascript-questions` repository as the canonical source for the question corpus, then transforms that source into generated JSON for the app.

## Source Of Truth

- Upstream source snapshot: `content/source/README.upstream.md`
- Parser: `scripts/parse-readme.mjs`
- Sync script: `scripts/sync-upstream.mjs`
- Generated outputs:
  - `content/generated/questions.v1.json`
  - `content/generated/manifest.v1.json`

The app contract is the generated JSON, but the canonical input is the synced upstream README snapshot.

## How The Flow Works

1. `bun run sync:upstream` fetches the latest upstream Lydia README.
2. `bun run parse:questions` parses that source into generated JSON.
3. `bun run content:refresh` runs both steps in sequence.
4. The Next.js app reads the generated JSON from `content/generated/`.

## What Not To Edit

- Do not manually edit `content/generated/questions.v1.json` or `manifest.v1.json`.
- Do not treat `content/source/README.upstream.md` as product copy or a normal editable markdown file. If the upstream content needs correction, prefer contributing to Lydia Hallie's repository.
