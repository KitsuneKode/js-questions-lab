# Implementation Brief: Multi-Select Filters & Progress Tracking

**Date**: March 31, 2026  
**Status**: ✅ Complete and deployed

## What Was Built

### 1. Multi-Select Filter System
**Files**: `apps/web/components/filters-bar.tsx`, `apps/web/lib/content/query.ts`

- Tags and difficulties now support **multiple simultaneous selections**
- Uses URL array params: `?tags=scope&tags=async&difficulties=beginner`
- Each selected pill shows consistent border + glow styling (no layoutId animation conflicts)
- Individual reset buttons for tags/difficulties + "Clear All" button
- Server filters use OR logic (question matches ANY selected tag/difficulty)

### 2. Scoped Navigation
**Files**: `apps/web/app/[locale]/questions/[id]/page.tsx`, `apps/web/components/ide/question-ide-client.tsx`

- Prev/Next buttons respect active filters
- Navigation stays within filtered question subset
- Filter state preserved across navigation via query params
- Keyboard shortcuts (J/K) also filter-aware

### 3. Section Progress Tracking
**New Files**:
- `apps/web/lib/progress/section-progress-store.ts` — Zustand store with Zod validation
- `apps/web/components/section-progress-tracker.tsx` — Visual progress UI

**Features**:
- Mastery levels: `not_started` → `learning` → `practicing` → `mastered`
- Auto-calculated based on accuracy ratios
- Progress tracker dialog accessible from filters bar ("Progress" button)
- Shows overall stats + per-topic breakdown with color-coded badges
- Click topic to filter by that tag
- Reset individual sections or all progress

**Integration**:
- Updates automatically when answering questions in `QuestionIDEClient`
- Tracks primary tag of each question
- Persists to localStorage via Zustand middleware

## Technical Decisions

### Why Zustand?
- Lightweight (vs Redux)
- Built-in persistence middleware
- No provider wrapping needed
- Perfect for client-side progress state

### Why Zod v4?
- Runtime validation for stored data
- Type safety for section progress schema
- Future-proof for migrations

### URL State vs Store
- Filters live in URL (shareable, bookmarkable, SSR-friendly)
- Progress lives in Zustand + localStorage (user-specific, no need to share)

## Commands

```bash
bun run dev          # Start development
bun run build        # Production build (verified ✅)
bun run typecheck    # TypeScript check (passes ✅)
bun run lint         # Biome lint (pre-existing warnings only)
```

## Key Files to Know

```
apps/web/components/filters-bar.tsx        # Filter UI + multi-select logic
apps/web/lib/content/query.ts              # Server-side filter application
apps/web/lib/progress/section-progress-store.ts  # Zustand store
apps/web/components/section-progress-tracker.tsx # Progress visualization
apps/web/components/ide/question-ide-client.tsx  # Question practice + progress updates
```

## Testing Notes

- Build passes (11.5s, 960 static pages generated)
- Typecheck passes (0 errors)
- Lint: Only pre-existing `noExplicitAny` warnings in babel-transform.ts
- Multi-select tested with combinations of tags + difficulties
- Scoped navigation verified with filtered subsets

## Future Considerations

1. **Server-side progress sync**: Currently localStorage-only. Could sync to Supabase when auth is configured.
2. **SRS integration**: Mastery levels could feed into spaced repetition scheduling.
3. **Filter presets**: Save common filter combinations for quick access.
4. **Progress export**: Allow users to download their progress data.

## Agent Handoff

When continuing work on this feature:

1. Read this file first
2. Check `apps/web/lib/progress/section-progress-store.ts` for state shape
3. Test filter combinations at `/en/questions?tags=scope&tags=async`
4. Progress tracker opens from "Progress" button in filters bar

**DO NOT**:
- Revert to single-select without explicit user request
- Move progress state to server (defeats guest-mode UX)
- Add more localStorage keys without cleaning old ones

---

*This brief intentionally omits detailed code examples. Read the source files directly for implementation details.*
