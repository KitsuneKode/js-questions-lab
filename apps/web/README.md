# JS Interview Atlas (apps/web)

## Run locally

```bash
bun install
bun run dev
```

## Build

```bash
bun run build
bun run start
```

## Data source

This app reads generated content from repository root:

- `content/generated/questions.v1.json`
- `content/generated/manifest.v1.json`

Refresh content from root:

```bash
bun run parse:questions
# or
bun run content:refresh
```
