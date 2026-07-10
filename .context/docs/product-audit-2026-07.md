# Product Audit: Feedback Loops, Leaderboard & Convex Migration

**Date**: 2026-07-09  
**Branch**: `cursor/product-audit-convex-leaderboard-2df2`  
**Scope**: Code-backed audit of engagement, response storage, analytics, and backend migration readiness  
**Status**: Findings + recommended roadmap (no code cutover in this doc)

---

## 1. Executive Verdict

The learning surface (SSG questions, worker sandbox, guest progress) is solid. The engagement layer is **half-built**: XP/streak math and server writes exist, but the leaderboard feels broken, rich user responses are discarded, and dashboard stats tell inconsistent stories.

**Highest-leverage work (in order):**

1. Fix the feedback loop — store what users actually type/select, hydrate the IDE from history.
2. Make the leaderboard competitive — identity, guest→auth XP merge, error surfacing, “you” row.
3. Unify analytics — one streak, one level, one mastery model.
4. Migrate authenticated sync to Convex **before** building PRD Phase 2–6 on Supabase twice.

---

## 2. Current Architecture (as shipped)

```
Guest practice          Signed-in practice
──────────────          ──────────────────
localStorage            Server Actions → Supabase
  progress_v2_*           user_progress
  xp_v2_*                 xp_events + user_xp_totals
  streak_v2_*             user_streaks
section-progress (local, never synced)

Content: SSG from content/generated/ (no DB)
Runtime: Worker sandbox (browser-only)
Auth: Clerk optional (guest-first)
Realtime: none (leaderboard = 60s unstable_cache + revalidateTag)
Convex: not present
```

**Key modules**

| Concern | Path |
|--------|------|
| Attempt schema | `apps/web/lib/progress/storage.ts` |
| Client state | `apps/web/lib/progress/progress-context.tsx` |
| Question UX | `apps/web/components/ide/question-ide-client.tsx` |
| Server grading | `apps/web/lib/engagement/engine.ts` |
| Server writes | `apps/web/lib/engagement/actions.ts` |
| Leaderboard | `apps/web/lib/engagement/leaderboard.ts` + page |
| Analytics | `apps/web/lib/progress/analytics.ts` |
| Schema | `supabase/migrations/*` |

---

## 3. Feedback & Response Storage — Critical Gaps

### What we store today

```ts
AttemptRecord {
  selected: 'A' | 'B' | 'C' | 'D' | null;
  status: 'correct' | 'incorrect';
  attemptedAt: string;
}
```

Plus bookmarks, optional SRS after Hard/Good/Easy, XP events, streaks.

### What users provide but we throw away

| Signal | Where collected | Fate |
|--------|-----------------|------|
| Freeform recall text | Active recall submit | Graded, then discarded |
| Error taxonomy (`misread`, `forgot`, `wrong_concept`, `guess`) | Post-wrong UI | Gates self-grade only — never persisted |
| Self-grade choice history | Hard/Good/Easy | Updates SRS schedule only — no audit log |
| Editor / scratchpad / run output | IDE state | Lost on navigation |
| Time-on-question, explanation opens | — | Not tracked |

### UX bugs that amplify “low feedback”

1. **No hydrate on revisit** — `isAnswered` is ephemeral UI state. Remounting the question shows a blank quiz even when attempts exist → duplicate attempts, weak learning loop.
2. **`correctOption: null` questions** — recall submit never calls `saveAttempt`.
3. **Self-grade is optional** — skip Hard/Good/Easy → SRS never advances; review queue falls back to heuristics.
4. **Guest → sign-in data loss** — progress attempts merge; **guest XP/streak deleted**; **guest SRS stripped** on server upsert (`syncProgressToServer` keeps existing server `srs_data` only).
5. **Section mastery double-count** — `progress-context` increments all tags and IDE also increments primary tag; section store is device-local and diverges from `tagStats`.

### Recommended response model (backward-compatible)

Extend `AttemptRecord` (and Supabase/Convex JSON):

```ts
AttemptRecord {
  selected: 'A' | 'B' | 'C' | 'D' | null;
  status: AnswerStatus;
  attemptedAt: string;
  // NEW
  mode?: 'quiz' | 'recall';
  responseText?: string;      // freeform recall (cap length)
  errorType?: 'misread' | 'forgot' | 'wrong_concept' | 'guess';
  selfGrade?: 'hard' | 'good' | 'easy';
  timeMs?: number;
  submissionId?: string;      // idempotency / analytics join
}
```

Populate `xp_events.metadata` with `{ mode, errorType }` (hash `responseText` if PII-sensitive).

**Product rule:** every user commitment (option, typed answer, error reason, self-grade) must be durable and visible on revisit.

---

## 4. Leaderboard — Why It “Doesn’t Work”

The board is **wired to real Supabase RPCs**, not mocks. It fails as a product for these reasons:

| Failure mode | Evidence |
|--------------|----------|
| Silent empty state | RPC errors → `[]` → “No entries yet” (`leaderboard.ts`) |
| Crash without env | Readonly client throws if Supabase URL/key missing |
| Guests never appear | `recordAttempt` returns `null` when unsigned |
| Guest XP lost on sign-in | `clearGuestData` after progress merge — no XP backfill |
| Everyone is “Anonymous” | SQL hardcodes `'Anonymous'::text` — no `user_profiles` |
| Thin competitive card | No avatar, streak, Pro badge, tabs, guest CTA (PRD §5.3) |
| “You” only if top 50 | Position RPCs exist; UI doesn’t show out-of-page rank |
| No snapshots/cron | Live aggregate only; PRD `leaderboard_snapshots` missing |

### Senior-level leaderboard target

Treat the leaderboard as the **sign-up funnel**, not a vanity table:

1. **Identity** — `user_profiles` (display name + anonymous toggle); Clerk avatar when not anonymous.
2. **Integrity** — server-authoritative XP only; merge guest XP on first sign-in via idempotent `submission_id` replay.
3. **Honesty** — surface fetch errors; empty state with CTA (“Answer 1 question signed-in to appear”).
4. **Presence** — sticky “Your rank” row even when outside top N; weekly + all-time tabs.
5. **Signals** — weekly XP, streak flame, level badge; Pro later.
6. **Anti-abuse** — keep cooldown/mastery caps; rate-limit attempts; never trust client XP totals.
7. **Observability** — log RPC failures; smoke test in CI against real RPCs (today verification docs are stale vs views→RPCs).

### Stats / graphs improvements

| Issue | Fix |
|-------|-----|
| Two level systems (XP levels vs `answered/15`) | Single XP level everywhere |
| Two streak sources (engagement vs analytics recompute) | Prefer `user_streaks` / `streakState` as source of truth |
| Analytics ignore Supabase XP | Dashboard XP widget already uses engagement; charts should not invent parallel progression |
| Hardcoded `155` question count | Derive from content loader |
| Topic radar only | Add mastery path grid (PRD §5.4) from `tagStats` |
| Activity heatmap is good | Keep; add weekly XP sparkline once XP history is trusted |

---

## 5. Knowledge Graph & Mastery

### Today

- Flat tags on questions; related = tag overlap.
- `tagStats` accuracy; local section mastery heuristics.
- No prerequisites, no concept edges, no path UI.

### Practical “knowledge graph” (don’t overbuild)

Avoid a full graph DB. Ship a **content-side concept map**:

```json
{
  "concepts": [
    { "id": "closures", "prereqs": ["scope", "functions"], "tags": ["scope", "fundamentals"] }
  ]
}
```

Derive:

- Locked → Exploring → Developing → Proficient → Mastered (PRD thresholds from existing `tagStats`).
- “Next best question” = weakest unlocked concept with due SRS items first.
- Related questions = shared concepts + prereq distance, not only tag overlap.

Store concept mastery as **derived views** from attempts (Convex query or client `useAnalytics`), not a second write path — unless you need cross-device section sync.

---

## 6. Convex Migration Process

### Why Convex fits *this* product

| Need | Supabase today | Convex fit |
|------|----------------|------------|
| Progress sync | Server actions + RLS | Mutations + reactive queries |
| XP event log | `xp_events` + recursive SQL weekly | Mutations + indexed queries; single TS source of truth |
| Leaderboard | RPC + 60s cache | Live `useQuery` top-N |
| Future AI sessions | Not built | Actions (`"use node"`) for Claude etc. |
| Content / SSG / workers | — | **Stay out of Convex** |

Clerk stays as IdP. Guest localStorage stays until sign-in. Static question corpus stays SSG.

### What not to migrate

- `content/generated/` and `/api/questions` (static)
- Worker sandbox
- Guest-only practice
- Contact form (Web3Forms)
- Visual debugger

### Phased cutover (recommended)

```
Phase 0  Decide: new PRD tables land on Convex only (no more Supabase schema for profiles/AI)
Phase 1  Add convex/ schema mirroring userProgress, xpEvents, userStreaks, userProfiles
         Wire Clerk JWT → ctx.auth.getUserIdentity()
         Share pure TS: engine.ts, scoring.ts, streak calculator
Phase 2  Shadow write: dual-write recordAttempt; compare leaderboard outputs in tests
Phase 3  Progress cutover: swap fetch/sync/upsert behind ProgressProvider
         One-time export script Supabase → Convex
Phase 4  Engagement cutover: XP, streaks, leaderboard queries; drop unstable_cache
Phase 5  Build profiles, mastery UI, AI actions, interview_sessions on Convex
Phase 6  Remove @supabase/supabase-js, migrations freeze, env cleanup
```

### Schema sketch (Convex)

```ts
// conceptual — implement in convex/schema.ts when starting Phase 1
userProfiles: defineTable({
  userId: v.string(),          // Clerk sub
  displayName: v.optional(v.string()),
  isAnonymous: v.boolean(),
  updatedAt: v.number(),
}).index("by_user", ["userId"]),

userProgress: defineTable({
  userId: v.string(),
  questionId: v.number(),
  attempts: v.array(v.object({ /* AttemptRecord v2 */ })),
  bookmarked: v.boolean(),
  srsData: v.optional(v.object({ /* SRSData */ })),
  updatedAt: v.number(),
}).index("by_user", ["userId"])
  .index("by_user_question", ["userId", "questionId"]),

xpEvents: defineTable({
  userId: v.string(),
  questionId: v.optional(v.number()),
  eventType: v.string(),
  xpDelta: v.number(),
  submissionId: v.string(),
  eventIndex: v.number(),
  metadata: v.optional(v.object({
    mode: v.optional(v.string()),
    errorType: v.optional(v.string()),
  })),
  createdAt: v.number(),
}).index("by_user_created", ["userId", "createdAt"])
  .index("by_submission", ["userId", "submissionId", "eventIndex"]),

userStreaks: defineTable({
  userId: v.string(),
  currentStreak: v.number(),
  longestStreak: v.number(),
  lastActivityDate: v.string(),
  shieldUsedAt: v.optional(v.number()),
}).index("by_user", ["userId"]),
```

Weekly leaderboard: query XP events since Monday UTC (or maintain `weeklyXp` denormalized in a mutation) — **one place** for the “floor at 0” rule (today split between TS and recursive SQL).

### Risks

- Production rows in Supabase need export/import.
- Weekly XP semantics must not drift during dual-write.
- Engagement v1 is live while PRD 2–6 unbuilt — **migrate now** so you don’t implement profiles/AI twice.
- CI currently uses placeholder Supabase URLs; add Convex agent-mode / test deployment for integration tests.

### Effort characterization (technical, not calendar)

| Subsystem | Invasiveness | Notes |
|-----------|--------------|-------|
| Auth wiring | Medium | Clerk → Convex identity; drop Supabase `accessToken` |
| Progress | Medium | 3 actions + ProgressProvider merge logic |
| XP + weekly floor | Medium–High | Must collapse SQL+TS into one mutation path |
| Leaderboard | Medium | Replace RPCs + cache; still need product UI work |
| New PRD (profiles, AI) | Greenfield | Prefer Convex-only |

---

## 7. Prioritized Roadmap

### P0 — Trust & feedback (ship first)

- [ ] Extend `AttemptRecord` + persist recall text, errorType, mode, timeMs
- [ ] Hydrate IDE from last attempt; explicit “Try again”
- [ ] Fix guest→auth: merge SRS; replay guest XP events (idempotent)
- [ ] Fix `correctOption: null` attempt recording
- [ ] Leaderboard: error UI, guest CTA, display names (`user_profiles`), sticky “your rank”
- [ ] Unify streak + level on `/progress`

### P1 — Competitive loop

- [ ] Leaderboard card: avatar, streak, level (match PRD aesthetic — Linear-dense, not gamey)
- [ ] Guest top-10 preview + sign-up CTA
- [ ] Anonymous toggle in settings
- [ ] Mastery path grid from `tagStats`
- [ ] Auto-default SRS grade when user skips self-grade (configurable)

### P2 — Convex foundation

- [ ] Phase 0–1 setup + shared scoring in Convex mutations
- [ ] Shadow dual-write + export script
- [ ] Cut over progress + engagement; retire Supabase

### P3 — Knowledge & Pro

- [ ] Concept map JSON + recommendation engine
- [ ] AI grader / explain (Convex actions)
- [ ] Interview sessions storage
- [ ] Pro entitlements (Clerk metadata) + Lemon Squeezy webhook

---

## 8. Usability Principles (senior product bar)

1. **Every answer leaves a trace** the user can see later.
2. **Signed-in must feel dramatically better than guest** — leaderboard identity + sync reliability are the funnel (PRD insight still correct).
3. **One source of truth per concept** — XP level, streak, mastery; kill parallel counters.
4. **Guest data is sacred until merged** — never `clearGuestData` before successful backfill.
5. **Empty states teach the next action** — not “No entries yet.”
6. **SSG for content, reactive for identity** — don’t put the question corpus in the DB.
7. **Build new backend features once** — Convex for remaining PRD; don’t extend Supabase for profiles/AI if migration is decided.

---

## 9. Out of Scope for This Audit Doc

- Implementing Convex or leaderboard fixes (follow-up PRs)
- Lemon Squeezy / Stream / ElevenLabs setup
- Content corpus expansion beyond Lydia snapshot

---

## 10. Suggested Follow-up PRs

1. `fix/attempt-record-v2` — schema + hydrate + errorType persistence  
2. `fix/guest-xp-srs-merge` — sign-in integrity  
3. `fix/leaderboard-product` — profiles, errors, your-rank, CTA  
4. `chore/convex-foundation` — schema + Clerk + shadow writes  
5. `feat/mastery-paths` — dashboard grid + concept map v0
