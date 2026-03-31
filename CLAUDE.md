# CLAUDE.md

**Start here**: `AGENTS.md` → `docs/agent-handoff.md` → task-specific file

## Quick Context

- **Product**: Next.js 16 + Tailwind v4 + React 19 interview practice app
- **Content pipeline**: Parses Lydia Hallie's JS questions → multi-locale JSON
- **Runtime**: Worker-based snippet execution (no StackBlitz)
- **Guest-first**: Auth optional for sync, never required for learning

## Reading Order

1. `AGENTS.md` — topology, commands, important files
2. `docs/implementation-brief.md` — filters + progress tracking (Mar 2026)
3. `docs/v2-roadmap-mastery.md` — active recall roadmap
4. One focused implementation file

## Recent Work

✅ **Multi-select filters** — Tags/difficulties support multiple selections with scoped navigation  
✅ **Progress tracking** — Zustand store with Zod validation, mastery levels per topic  
✅ **Scoped prev/next** — Navigation respects active filters  

See `docs/implementation-brief.md` for details.

## Commands

```bash
bun run dev          # Development
bun run build        # Production build
bun run typecheck    # TypeScript check
bun run lint         # Biome lint
```

## What Not To Reintroduce

- StackBlitz runtime (removed for bundle size)
- Auth-gated learning flow (guest-first UX)
- JWT templates for Supabase (deprecated, use native Clerk auth)
- localStorage race conditions (use Zustand persistence)

---

*Keep context tight. Don't load generated JSON or unrelated route files.*
