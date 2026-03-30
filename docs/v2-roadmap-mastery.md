# V2 Roadmap: The Interview Mastery Platform

This roadmap outlines the transformation of the platform from a single-repository quiz app into a comprehensive, multi-source JavaScript Interview Mastery platform.

## Core Philosophical Shifts

1. **Active Recall > Passive Recognition**: Move away from pure multiple-choice guessing to actual terminal-output prediction and self-grading.
2. **Curated Progression > Random Browsing**: Guide users through structured "Paths" rather than overwhelming them with a list of 1000+ questions.
3. **Data-Driven Retention (SRS)**: Implement Spaced Repetition so users actually retain what they learn for their interviews.
4. **Unified Knowledge Graph**: Ingest data from multiple famous repositories (e.g., Lydia Hallie, Sudheer J) into a single normalized format.

---

## Phase 1: Multi-Source Data Architecture

To support multiple repositories (like `sudheerj/javascript-interview-questions`), we need to decouple our content pipeline from a single README structure.

- **Unified Schema**: Update `QuestionRecord` to support various question types (Multiple Choice, Open Ended, Code Writing).
- **Source Adapters**:
  - `scripts/parsers/lydia.mjs`: Parses the existing repo.
  - `scripts/parsers/sudheer.mjs`: Parses the new repo.
- **Path Generation**: Introduce a `paths.json` or `playlists.json` that manually or programmatically groups questions from *all* sources into logical courses (e.g., "The Event Loop", "React Fundamentals", "Closures & Scope").

## Phase 2: Mandatory/Enhanced Auth & SRS Backend (Supabase) ✅ **COMPLETED (Track B)**

To provide real value (Spaced Repetition and Daily Stacks), we need persistent state.

- **Auth Strategy**: Keep basic browsing free, but gate "Mastery Mode" (SRS, Daily Stacks, Advanced Paths) behind authentication (Clerk).
- **Database Schema Updates (Supabase)**: ✅ Implemented
  - Table: `user_progress` (primary progress storage)
  - Table: `user_srs_progress` (optimized SRS queries)
  - Columns: `user_id`, `question_id`, `interval`, `repetition`, `ease_factor`, `next_review_date`.
- **SM-2 Algorithm**: ✅ Implemented in `lib/progress/srs.ts`
- **RLS Security**: ✅ Row Level Security enforced via Clerk JWT tokens
- **Client Integration**: ✅ Sync with race condition handling and per-item upsert
- **Setup Docs**: ✅ See `docs/supabase-clerk-setup.md`

**Implementation Details:**

- Migrations located in `supabase/migrations/`
- Native Clerk third-party auth (no JWT template required)
- Guest mode works without auth (localStorage only)
- Sync status tracking for better UX

## Phase 3: Active Recall & The "Interview Mode" UX

Multiple choice allows for process-of-elimination. Real interviews do not.

- **"Type the Output" Mode**: Hide A/B/C/D options. Provide a terminal-like text input where the user must type the exact `console.log` output.
- **Anki-style Self Grading**: After revealing the explanation, the user grades themselves:
  - 🔴 **Hard** (Forgot completely / Got it wrong) -> Review in 1 min.
  - 🟡 **Good** (Got it right but hesitated) -> Review in 1 day.
  - 🟢 **Easy** (Knew it instantly) -> Review in 4 days.
- **Hypothesis Testing**: Allow the user to run the code playground *before* submitting their final answer to encourage experimentation.

## Phase 4: Curated Paths & Dashboard Overhaul

The dashboard should act as a daily habit-tracker.

- **Daily Stack UI**: "You have 15 reviews and 5 new questions today."
- **Path UI**: A beautiful, linear map (similar to Duolingo or Codecademy) showing progression through "JavaScript Fundamentals" -> "Advanced Async" -> "DOM Manipulation".

## Phase 5: The Interviewer's Rubric & Advanced Visualizers

- **Glossary Tooltips**: Auto-link terms like "Temporal Dead Zone" or "Hoisting" in the explanations to a global glossary.
- **Interviewer's Notes**: A new section in the explanation: *"What the interviewer is actually looking for."*
- **Memory/Scope Visualizer**: Go beyond the Event Loop chart. Build a visualizer that shows Call Stack vs. Heap memory, and Lexical Scope chains for closure questions.

---

## Suggested Execution Order

1. **Phase 3 (Active Recall UX)**: Implement the Anki-style self-grading and "Type the Output" mode on the existing UI. It's the highest impact for learning.
2. **Phase 2 (Auth & SRS)**: ✅ **COMPLETED** - Wire the self-grading UI into Supabase and calculate review dates.
3. **Phase 1 (Multi-Source)**: Refactor the content pipeline and pull in the `sudheerj` repository.
4. **Phase 4 (Paths)**: Group the newly combined data into curated playlists.
5. **Phase 5 (Visualizers)**: Add the finishing touches and advanced pedagogical tools.

## Completed Implementation

**Track B (Phase 2: Auth & SRS Backend)** has been fully implemented:

- Supabase migrations with RLS policies
- Native Clerk third-party auth integration
- Per-item immediate sync (no queue, no race conditions)
- Guest mode support (no auth required)
- Sync status tracking and error recovery toasts

**Next Priority:** Phase 3 (Active Recall UX) — Implement "Type the Output" mode and Anki-style self-grading.
