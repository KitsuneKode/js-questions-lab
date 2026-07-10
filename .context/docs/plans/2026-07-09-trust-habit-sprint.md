# Trust + Habit Sprint Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make logged-in progress trustworthy (guest XP/streak/SRS survive sign-in), unify dashboard progression UI, ship a Daily Review habit loop with `srs_clear` XP, then polish the leaderboard as a sign-up funnel.

**Architecture:** Keep guest-first localStorage + optional Supabase sync. Sign-in becomes a full engagement merge (progress + XP replay via idempotent `recordAttempt` + streak merge + SRS preserve), not progress-only. Dashboard and review surfaces read one source of truth from `useProgress()` (`xpState`, `streakState`) and shared analytics helpers. Daily Review reuses existing question scoping (`status=review`) instead of inventing a parallel IDE.

**Tech Stack:** Next.js 16 App Router, React 19, Vitest, Clerk auth, Supabase (`user_progress`, `xp_events`, `user_streaks`, `user_xp_totals`), existing engagement engine (`apps/web/lib/engagement/`).

**Branch:** `cursor/trust-habit-sprint-360d` off `dev`. Prefer one PR with sequential commits per phase; split PRs only if review load demands it.

**Out of scope (defer):** Pro tier, AI interview, streak shield, playlists/paths, `/dashboard` + `/progress` IA merge, Clerk avatars on leaderboard.

---

## File map

| File | Responsibility |
|------|----------------|
| `apps/web/lib/streaks/merge.ts` | Pure `mergeStreakStates(guest, server)` |
| `apps/web/lib/engagement/guest-replay.ts` | Pure helpers: flatten guest attempts, stable `submissionId`, decide what to replay |
| `apps/web/lib/engagement/actions.ts` | `upsertStreak`, `replayGuestAttempts` server actions |
| `apps/web/lib/progress/actions.ts` | Preserve guest `srsData` when newer on sync |
| `apps/web/lib/progress/progress-context.tsx` | Sign-in effect: read guest XP/streak, replay, merge, then clear |
| `apps/web/lib/progress/analytics.ts` | Optional streak override; shared `countDueReviews` |
| `apps/web/lib/progress/use-analytics.ts` | Pass `streakState` into overall stats |
| `apps/web/components/dashboard/overview-cards.tsx` | Real XP level + dynamic total questions |
| `apps/web/components/dashboard/dashboard-shell.tsx` | Pass `questions.length` + XP into overview |
| `apps/web/components/dashboard/review-badge.tsx` | Align count with review-queue logic |
| `apps/web/lib/content/query.ts` | Add `status=review` listing status |
| `apps/web/app/[locale]/(app)/review/page.tsx` | Daily Review entry that redirects into scoped practice |
| `apps/web/lib/xp/scoring.ts` | `awardSrsClearBonus` (+25) |
| `apps/web/lib/engagement/engine.ts` | Wire `srs_clear` when queue clears after grade |
| `apps/web/components/leaderboard/leaderboard-table.tsx` | Guest CTA + clearer XP labeling |
| `supabase/migrations/YYYYMMDDHHMMSS_leaderboard_display_name.sql` | Prefer profile display name over hardcoded Anonymous |

---

## Phase 0 — CI baseline

### Task 0: Verify green before feature work

**Files:** none (verification only)

- [ ] **Step 1: Install toolchain if needed**

```bash
# From repo root. Prefer bun (packageManager: bun@1.3.9).
command -v bun || curl -fsSL https://bun.sh/install | bash
bun install
```

- [ ] **Step 2: Run CI-parity checks**

```bash
bun run typecheck
bun run test
bun run lint
```

Expected: all pass. If any fail on clean `dev`, fix those first in a separate `fix/` commit before Phase 1.

- [ ] **Step 3: Create feature branch**

```bash
git checkout dev
git pull origin dev
git checkout -b cursor/trust-habit-sprint-360d
```

- [ ] **Step 4: Commit plan doc (this file)**

```bash
git add docs/superpowers/plans/2026-07-09-trust-habit-sprint.md
git commit -m "docs: add trust + habit sprint implementation plan"
```

---

## Phase 1 — Guest → sign-in engagement sync

### Task 1: Pure streak merge helper

**Files:**
- Create: `apps/web/lib/streaks/merge.ts`
- Test: `apps/web/lib/__tests__/streak-merge.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
import { describe, expect, it } from 'vitest';
import { defaultStreakState, type StreakState } from '@/lib/streaks/calculator';
import { mergeStreakStates } from '@/lib/streaks/merge';

function streak(partial: Partial<StreakState>): StreakState {
  return { ...defaultStreakState, ...partial };
}

describe('mergeStreakStates', () => {
  it('keeps the longer current streak when dates are consecutive-compatible', () => {
    const guest = streak({
      currentStreak: 5,
      longestStreak: 5,
      lastActivityDate: '2026-07-09',
    });
    const server = streak({
      currentStreak: 2,
      longestStreak: 10,
      lastActivityDate: '2026-07-08',
    });

    const merged = mergeStreakStates(guest, server, '2026-07-09');
    expect(merged.currentStreak).toBe(5);
    expect(merged.longestStreak).toBe(10);
    expect(merged.lastActivityDate).toBe('2026-07-09');
  });

  it('prefers the more recent lastActivityDate when streaks conflict', () => {
    const guest = streak({
      currentStreak: 3,
      longestStreak: 3,
      lastActivityDate: '2026-07-01',
    });
    const server = streak({
      currentStreak: 1,
      longestStreak: 1,
      lastActivityDate: '2026-07-09',
    });

    const merged = mergeStreakStates(guest, server, '2026-07-09');
    expect(merged.lastActivityDate).toBe('2026-07-09');
    expect(merged.currentStreak).toBe(1);
    expect(merged.longestStreak).toBe(3);
  });

  it('returns default when both empty', () => {
    expect(mergeStreakStates(defaultStreakState, defaultStreakState, '2026-07-09')).toEqual(
      defaultStreakState,
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd apps/web && bunx vitest run lib/__tests__/streak-merge.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement merge helper**

```typescript
// apps/web/lib/streaks/merge.ts
import { defaultStreakState, type StreakState } from '@/lib/streaks/calculator';

function dayDiff(a: string, b: string): number {
  const ms = new Date(a).getTime() - new Date(b).getTime();
  return Math.round(ms / 86_400_000);
}

/**
 * Merge guest + server streak for sign-in.
 * - longestStreak: max of both
 * - lastActivityDate: most recent non-null
 * - currentStreak: take the side whose lastActivityDate is more recent
 *   (if tied, take the larger currentStreak), then zero it out if the
 *   activity is older than yesterday relative to `today`.
 */
export function mergeStreakStates(
  guest: StreakState,
  server: StreakState,
  today: string,
): StreakState {
  const candidates = [guest, server].filter((s) => s.lastActivityDate);
  if (candidates.length === 0) return defaultStreakState;

  const byRecency = [...candidates].sort((a, b) =>
    (b.lastActivityDate ?? '').localeCompare(a.lastActivityDate ?? ''),
  );
  const primary = byRecency[0]!;
  const secondary = byRecency[1];

  let currentStreak = primary.currentStreak;
  if (
    secondary &&
    primary.lastActivityDate === secondary.lastActivityDate &&
    secondary.currentStreak > currentStreak
  ) {
    currentStreak = secondary.currentStreak;
  }

  const last = primary.lastActivityDate!;
  const age = dayDiff(today, last);
  if (age > 1) {
    currentStreak = 0;
  }

  return {
    version: Math.max(guest.version, server.version, 1),
    currentStreak,
    longestStreak: Math.max(guest.longestStreak, server.longestStreak, currentStreak),
    lastActivityDate: last,
  };
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
cd apps/web && bunx vitest run lib/__tests__/streak-merge.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/streaks/merge.ts apps/web/lib/__tests__/streak-merge.test.ts
git commit -m "feat(streaks): add guest/server streak merge helper"
```

---

### Task 2: Guest attempt replay helpers (pure)

**Files:**
- Create: `apps/web/lib/engagement/guest-replay.ts`
- Test: `apps/web/lib/__tests__/guest-replay.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
import { describe, expect, it } from 'vitest';
import {
  buildGuestSubmissionId,
  listGuestAttemptsToReplay,
} from '@/lib/engagement/guest-replay';
import type { ProgressItem, ProgressState } from '@/lib/progress/storage';

function item(partial: Partial<ProgressItem> & { questionId: number }): ProgressItem {
  return {
    attempts: [],
    bookmarked: false,
    updatedAt: '2026-07-09T12:00:00.000Z',
    ...partial,
  };
}

describe('guest-replay', () => {
  it('builds a stable submissionId from questionId + attemptedAt', () => {
    expect(buildGuestSubmissionId(7, '2026-07-09T12:00:00.000Z')).toBe(
      'guest:7:2026-07-09T12:00:00.000Z',
    );
  });

  it('replays guest attempts that are missing or newer than server', () => {
    const guest: ProgressState = {
      version: 1,
      questions: {
        '7': item({
          questionId: 7,
          attempts: [
            { selected: 'A', status: 'incorrect', attemptedAt: '2026-07-08T10:00:00.000Z' },
            { selected: 'B', status: 'correct', attemptedAt: '2026-07-09T10:00:00.000Z' },
          ],
          updatedAt: '2026-07-09T10:00:00.000Z',
        }),
        '8': item({
          questionId: 8,
          attempts: [{ selected: 'C', status: 'correct', attemptedAt: '2026-07-09T11:00:00.000Z' }],
          updatedAt: '2026-07-09T11:00:00.000Z',
        }),
      },
    };

    const serverItems: ProgressItem[] = [
      item({
        questionId: 7,
        attempts: [
          { selected: 'A', status: 'incorrect', attemptedAt: '2026-07-08T10:00:00.000Z' },
        ],
        updatedAt: '2026-07-08T10:00:00.000Z',
      }),
    ];

    const replay = listGuestAttemptsToReplay(guest, serverItems);
    expect(replay.map((r) => ({ q: r.questionId, at: r.attemptedAt, selected: r.selected }))).toEqual([
      { q: 7, at: '2026-07-09T10:00:00.000Z', selected: 'B' },
      { q: 8, at: '2026-07-09T11:00:00.000Z', selected: 'C' },
    ]);
  });

  it('returns empty when guest has nothing newer', () => {
    const guest: ProgressState = {
      version: 1,
      questions: {
        '7': item({
          questionId: 7,
          attempts: [{ selected: 'B', status: 'correct', attemptedAt: '2026-07-08T10:00:00.000Z' }],
          updatedAt: '2026-07-08T10:00:00.000Z',
        }),
      },
    };
    const serverItems: ProgressItem[] = [
      item({
        questionId: 7,
        attempts: [{ selected: 'B', status: 'correct', attemptedAt: '2026-07-08T10:00:00.000Z' }],
        updatedAt: '2026-07-09T12:00:00.000Z',
      }),
    ];
    expect(listGuestAttemptsToReplay(guest, serverItems)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
cd apps/web && bunx vitest run lib/__tests__/guest-replay.test.ts
```

- [ ] **Step 3: Implement**

```typescript
// apps/web/lib/engagement/guest-replay.ts
import type { AttemptRecord, ProgressItem, ProgressState } from '@/lib/progress/storage';

export interface GuestAttemptReplay {
  questionId: number;
  selected: AttemptRecord['selected'];
  attemptedAt: string;
  submissionId: string;
}

export function buildGuestSubmissionId(questionId: number, attemptedAt: string): string {
  return `guest:${questionId}:${attemptedAt}`;
}

/**
 * Decide which guest attempts should be replayed through recordAttempt.
 * Strategy: if guest item is missing on server OR guest.updatedAt is newer,
 * replay every guest attempt whose attemptedAt is not already present on the
 * server item (match on attemptedAt string).
 */
export function listGuestAttemptsToReplay(
  guest: ProgressState,
  serverItems: ProgressItem[],
): GuestAttemptReplay[] {
  const serverById = new Map(serverItems.map((item) => [item.questionId, item]));
  const out: GuestAttemptReplay[] = [];

  for (const localItem of Object.values(guest.questions)) {
    const serverItem = serverById.get(localItem.questionId);
    const guestIsNewer =
      !serverItem || new Date(localItem.updatedAt) > new Date(serverItem.updatedAt);
    if (!guestIsNewer) continue;

    const serverAttemptTimes = new Set(
      (serverItem?.attempts ?? []).map((a) => a.attemptedAt),
    );

    for (const attempt of localItem.attempts) {
      if (serverAttemptTimes.has(attempt.attemptedAt)) continue;
      out.push({
        questionId: localItem.questionId,
        selected: attempt.selected,
        attemptedAt: attempt.attemptedAt,
        submissionId: buildGuestSubmissionId(localItem.questionId, attempt.attemptedAt),
      });
    }
  }

  return out.sort((a, b) => a.attemptedAt.localeCompare(b.attemptedAt));
}
```

- [ ] **Step 4: Run — expect PASS**

```bash
cd apps/web && bunx vitest run lib/__tests__/guest-replay.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/engagement/guest-replay.ts apps/web/lib/__tests__/guest-replay.test.ts
git commit -m "feat(engagement): add guest attempt replay helpers"
```

---

### Task 3: Server actions — upsertStreak + replayGuestAttempts

**Files:**
- Modify: `apps/web/lib/engagement/actions.ts`
- Modify: `apps/web/lib/progress/actions.ts` (preserve guest SRS)
- Test: extend `apps/web/lib/__tests__/guest-replay.test.ts` is enough for pure logic; action wiring covered in Task 4 integration test with mocks

- [ ] **Step 1: Preserve guest SRS in `syncProgressToServer`**

In `apps/web/lib/progress/actions.ts`, change the upsert row mapping so guest SRS is not discarded when the guest item is the source:

```typescript
// Replace srs_data line that always prefers existing server SRS:
srs_data: item.srsData ?? existingSrsByQuestionId.get(item.questionId) ?? null,
```

Rationale: when sign-in pushes `localNewer` items, those items carry guest `srsData` that must land on the server.

- [ ] **Step 2: Add `upsertStreak` to `engagement/actions.ts`**

```typescript
export async function upsertStreak(state: StreakState): Promise<StreakState | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from('user_streaks').upsert(
    {
      user_id: userId,
      current_streak: state.currentStreak,
      longest_streak: state.longestStreak,
      last_activity_date: state.lastActivityDate,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );

  if (error) {
    console.error('Failed to upsert streak:', error.message);
    throw error;
  }

  return state;
}
```

- [ ] **Step 3: Add `replayGuestAttempts`**

```typescript
import type { GuestAttemptReplay } from '@/lib/engagement/guest-replay';

export async function replayGuestAttempts(
  attempts: GuestAttemptReplay[],
  locale?: string,
): Promise<{ xpState: XPState; streakState: StreakState } | null> {
  const { userId } = await auth();
  if (!userId) return null;

  let last: RecordAttemptResult | null = null;
  for (const attempt of attempts) {
    last = await recordAttempt({
      questionId: attempt.questionId,
      selected: attempt.selected,
      submissionId: attempt.submissionId,
      locale,
    });
  }

  if (!last) {
    const [xpState, streakState] = await Promise.all([fetchXPState(), fetchStreak()]);
    return {
      xpState,
      streakState: streakState ?? defaultStreakState,
    };
  }

  return { xpState: last.xpState, streakState: last.streakState };
}
```

Notes:
- `recordAttempt` already upserts XP with `onConflict: user_id,submission_id,event_index` + `ignoreDuplicates: true`, so replaying the same guest submissionId is safe.
- Chronological order matters for streak/first-answer-today bonuses — `listGuestAttemptsToReplay` already sorts by `attemptedAt`.

- [ ] **Step 4: Typecheck**

```bash
bun run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/engagement/actions.ts apps/web/lib/progress/actions.ts
git commit -m "feat(engagement): add streak upsert and guest attempt replay actions"
```

---

### Task 4: Wire sign-in effect in ProgressProvider

**Files:**
- Modify: `apps/web/lib/progress/progress-context.tsx` (sign-in `useEffect` ~231–291)
- Test: `apps/web/lib/progress/progress-context.sign-in.test.tsx`

- [ ] **Step 1: Write failing integration-style test**

Follow `apps/web/components/ide/progress-integration.test.tsx` patterns:

```typescript
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProgressProvider, useProgress } from '@/lib/progress/progress-context';
import { writeProgress } from '@/lib/progress/storage';
import { writeXP } from '@/lib/xp/storage';
import { writeStreak } from '@/lib/streaks/storage';

const replayGuestAttempts = vi.fn();
const upsertStreak = vi.fn();
const syncProgressToServer = vi.fn();
const fetchServerProgress = vi.fn();
const fetchXPState = vi.fn();
const fetchStreak = vi.fn();

vi.mock('@/lib/auth-utils', () => ({
  useSafeAuth: () => ({ isSignedIn: true }),
}));

vi.mock('@/lib/engagement/actions', () => ({
  recordAttempt: vi.fn(),
  applyServerSelfGrade: vi.fn(),
  fetchXPState: (...args: unknown[]) => fetchXPState(...args),
  fetchStreak: (...args: unknown[]) => fetchStreak(...args),
  replayGuestAttempts: (...args: unknown[]) => replayGuestAttempts(...args),
  upsertStreak: (...args: unknown[]) => upsertStreak(...args),
}));

vi.mock('@/lib/progress/actions', () => ({
  fetchServerProgress: (...args: unknown[]) => fetchServerProgress(...args),
  syncProgressToServer: (...args: unknown[]) => syncProgressToServer(...args),
}));

// Seed guest SID + localStorage in beforeEach, then assert:
// - replayGuestAttempts called with guest attempts
// - upsertStreak called with merged streak
// - clearGuestData removed old keys
```

Assert at minimum:
1. `replayGuestAttempts` is invoked when guest has newer attempts
2. Final `xpState` / `streakState` come from replay/merge results (not raw empty server overwrite alone)
3. Guest localStorage keys for the old SID are cleared

- [ ] **Step 2: Run — expect FAIL** (replay not called)

```bash
cd apps/web && bunx vitest run lib/progress/progress-context.sign-in.test.tsx
```

- [ ] **Step 3: Rewrite sign-in effect**

Replace the body of the sign-in `useEffect` in `progress-context.tsx` with this flow:

```typescript
const guestProgress = guestSid ? readProgress(guestSid) : defaultProgressState;
const guestXP = guestSid ? readXP(guestSid) : defaultXPState;
const guestStreak = guestSid ? readStreak(guestSid) : defaultStreakState;

const [serverItems, serverXP, serverStreak] = await Promise.all([
  fetchServerProgress(),
  fetchXPState(),
  fetchStreak(),
]);

dispatch({ type: 'merge', serverItems });

// 1) Sync newer progress rows (including SRS)
const localNewer: ProgressItem[] = [];
for (const localItem of Object.values(guestProgress.questions)) {
  const serverItem = serverItems.find((s) => s.questionId === localItem.questionId);
  if (!serverItem || new Date(localItem.updatedAt) > new Date(serverItem.updatedAt)) {
    localNewer.push(localItem);
  }
}
if (localNewer.length > 0) {
  await syncProgressToServer(localNewer);
}

// 2) Replay guest attempts → authoritative XP + streak from engine
const toReplay = listGuestAttemptsToReplay(guestProgress, serverItems);
let nextXP = serverXP;
let nextStreak = serverStreak ?? defaultStreakState;

if (toReplay.length > 0) {
  const replayed = await replayGuestAttempts(toReplay);
  if (replayed) {
    nextXP = replayed.xpState;
    nextStreak = replayed.streakState;
  }
} else if (guestXP.events.length > 0 && serverXP.events.length === 0) {
  // Edge: guest has XP events but no replayable attempt delta (should be rare).
  // Prefer server after empty replay; do not invent XP without attempts.
  nextXP = serverXP;
}

// 3) Merge streaks (guest calendar streak vs post-replay server streak)
const today = new Date().toISOString().slice(0, 10);
const mergedStreak = mergeStreakStates(guestStreak, nextStreak, today);
await upsertStreak(mergedStreak);

setXPState(nextXP);
setStreakState(mergedStreak);

// 4) Consume guest session
if (guestSid) {
  clearGuestData(guestSid);
  guestSidRef.current = rotateGuestSid();
}
```

Import new helpers at top of file.

- [ ] **Step 4: Run sign-in test + existing progress integration tests**

```bash
cd apps/web && bunx vitest run lib/progress/progress-context.sign-in.test.tsx components/ide/progress-integration.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/progress/progress-context.tsx apps/web/lib/progress/progress-context.sign-in.test.tsx
git commit -m "feat(progress): replay guest XP and merge streaks on sign-in"
```

---

## Phase 2 — Unify dashboard progression UI

### Task 5: OverallStats accepts authoritative streak

**Files:**
- Modify: `apps/web/lib/progress/analytics.ts`
- Modify: `apps/web/lib/progress/use-analytics.ts`
- Test: `apps/web/lib/progress/analytics.test.ts`

- [ ] **Step 1: Extend `computeOverallStats`**

```typescript
export function computeOverallStats(
  progress: ProgressState,
  streakOverride?: Pick<StreakState, 'currentStreak' | 'longestStreak'>,
): OverallStats {
  // ... existing answered/accuracy loop ...

  const streak = streakOverride
    ? { current: streakOverride.currentStreak, longest: streakOverride.longestStreak }
    : computeStreak(progress);

  return {
    totalAnswered,
    totalCorrect,
    totalAttempts,
    overallAccuracy: totalAttempts > 0 ? totalCorrect / totalAttempts : 0,
    bookmarkedCount,
    currentStreak: streak.current,
    longestStreak: streak.longest,
  };
}
```

- [ ] **Step 2: Wire in `use-analytics.ts`**

```typescript
const { state, ready, streakState } = useProgress();

const overall = useMemo<OverallStats>(
  () => computeOverallStats(state, streakState),
  [state, streakState],
);
```

- [ ] **Step 3: Add/extend analytics tests** proving override wins over attempt-derived streak

- [ ] **Step 4: Commit**

```bash
git add apps/web/lib/progress/analytics.ts apps/web/lib/progress/use-analytics.ts apps/web/lib/progress/analytics.test.ts
git commit -m "fix(dashboard): use engagement streakState for overall stats"
```

---

### Task 6: Replace fake level + hardcoded 155 in OverviewCards

**Files:**
- Modify: `apps/web/components/dashboard/overview-cards.tsx`
- Modify: `apps/web/components/dashboard/dashboard-shell.tsx`
- Test: `apps/web/components/__tests__/overview-cards.test.tsx` (new)

- [ ] **Step 1: Change props**

```typescript
interface OverviewCardsProps {
  overall: OverallStats;
  totalQuestions: number;
  totalXP: number;
}
```

- [ ] **Step 2: Replace fake level math**

```typescript
import { getLevelInfo } from '@/lib/xp/levels';

const level = getLevelInfo(totalXP);
const progressPercent =
  totalQuestions > 0 ? Math.round((overall.totalAnswered / totalQuestions) * 100) : 0;
```

Update UI copy:
- Show `level.name` / `Level {level.level}` instead of `answered/15`
- Show XP band progress (`level.progress`) for “to next level”
- Keep accuracy + streak cards, but streak already comes from unified `overall`

- [ ] **Step 3: Pass props from `DashboardShell`**

```typescript
const { xpState } = useProgress();
// ...
<OverviewCards
  overall={overall}
  totalQuestions={questions.length}
  totalXP={xpState.totalXP}
/>
```

- [ ] **Step 4: Component test** — mock `useTranslations`, assert no `155`, assert level name from XP (e.g. 0 XP → Apprentice; 500 → Practitioner)

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/dashboard/overview-cards.tsx apps/web/components/dashboard/dashboard-shell.tsx apps/web/components/__tests__/overview-cards.test.tsx
git commit -m "fix(dashboard): align overview cards with XP levels and real totals"
```

---

## Phase 3 — Daily Review habit loop

### Task 7: Shared due-review counting + ReviewBadge alignment

**Files:**
- Modify: `apps/web/lib/progress/analytics.ts` — export `countDueReviews(progress, questions?)`
- Modify: `apps/web/components/dashboard/review-badge.tsx`
- Test: `apps/web/components/dashboard/review-badge.test.tsx`

- [ ] **Step 1: Extract shared counter**

```typescript
/** Count items due for review. When questions is omitted, count SRS-due only. */
export function countDueReviews(
  progress: ProgressState,
  questions?: QuestionSummary[],
): number {
  if (!questions) {
    const now = Date.now();
    return Object.values(progress.questions).filter((item) => {
      if (!item.srsData?.nextReviewDate) return false;
      return new Date(item.srsData.nextReviewDate).getTime() <= now;
    }).length;
  }
  return getReviewQueue(progress, questions, Number.POSITIVE_INFINITY).length;
}
```

- [ ] **Step 2: Update `ReviewBadge` to use `countDueReviews(state)`** (keep header badge lightweight; SRS-only is OK for nav, but document that `/review` uses full queue including legacy)

- [ ] **Step 3: Update review-badge tests**

- [ ] **Step 4: Commit**

```bash
git add apps/web/lib/progress/analytics.ts apps/web/components/dashboard/review-badge.tsx apps/web/components/dashboard/review-badge.test.tsx
git commit -m "refactor(progress): share due-review counting helper"
```

---

### Task 8: Add `status=review` question scope

**Files:**
- Modify: `apps/web/lib/content/query.ts`
- Test: `apps/web/lib/content/query.test.ts`
- Modify: `apps/web/components/ide/question-ide-client.tsx` (scoped nav already freezes status filters — verify `review` works)

- [ ] **Step 1: Extend `ListingStatus`**

```typescript
export type ListingStatus = 'all' | 'answered' | 'unanswered' | 'bookmarked' | 'review';
```

Update `normalizeStatus` to accept `'review'`.

- [ ] **Step 2: Extend `applyStatusFilter`**

`applyStatusFilter` currently has no question list SRS awareness beyond progress. For `review`, callers must pre-filter OR we change the signature.

**Preferred approach (minimal IDE churn):** keep `applyStatusFilter` for answered/unanswered/bookmarked, and add:

```typescript
export function applyReviewFilter<T extends Pick<QuestionSummary, 'id'>>(
  questions: T[],
  progress: ProgressState,
): T[] {
  const dueIds = new Set(
    getReviewQueue(progress, questions as QuestionSummary[], Number.POSITIVE_INFINITY).map(
      (q) => q.id,
    ),
  );
  return questions.filter((q) => dueIds.has(q.id));
}
```

Wire in `questions-client-wrapper.tsx` and `question-ide-client.tsx` where status filters apply:

```typescript
if (scope.status === 'review') {
  filtered = applyReviewFilter(filtered, progressQuestions);
} else {
  filtered = applyStatusFilter(filtered, scope.status, progressQuestions);
}
```

- [ ] **Step 3: Tests for parse + filter**

- [ ] **Step 4: Commit**

```bash
git add apps/web/lib/content/query.ts apps/web/lib/content/query.test.ts apps/web/components/questions-client-wrapper.tsx apps/web/components/ide/question-ide-client.tsx
git commit -m "feat(questions): add status=review scope for daily review practice"
```

---

### Task 9: `/review` entry route + dashboard CTA

**Files:**
- Create: `apps/web/app/[locale]/(app)/review/page.tsx`
- Modify: `apps/web/components/dashboard/dashboard-shell.tsx` — primary CTA → `/review`
- Modify: `apps/web/components/dashboard/review-queue.tsx` — “Start review” links to `/review` or first due question with `?status=review`
- Modify: `apps/web/lib/site-config.ts` if nav should include Review (optional; Progress badge may be enough)

- [ ] **Step 1: Create review page**

Client-friendly pattern: static shell that redirects into the first due question, or lists the queue.

Minimal useful version:

```tsx
// apps/web/app/[locale]/(app)/review/page.tsx
import { setRequestLocale } from 'next-intl/server';
import { ReviewStartClient } from '@/components/dashboard/review-start-client';
import { getQuestionSummaries } from '@/lib/content/loaders';
import type { LocaleCode } from '@/lib/i18n/config';

export const dynamic = 'force-static';

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ locale: LocaleCode }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const questions = getQuestionSummaries(locale);
  return <ReviewStartClient locale={locale} questions={questions} />;
}
```

`ReviewStartClient`:
- `useAnalytics(questions)` → `reviewQueue`
- If empty: empty state + link to `/questions`
- If non-empty: primary button to `withLocale(locale, `/questions/${reviewQueue[0].id}?status=review`)`

- [ ] **Step 2: Update dashboard urgent suggestion / ReviewQueue header CTA to `/review`**

- [ ] **Step 3: After answering in IDE with `status=review`, prev/next stay inside due set** (already handled by scoped navigation freeze — verify with a focused test or manual check)

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/[locale]/\(app\)/review/page.tsx apps/web/components/dashboard/review-start-client.tsx apps/web/components/dashboard/dashboard-shell.tsx apps/web/components/dashboard/review-queue.tsx
git commit -m "feat(review): add daily review entry route and dashboard CTA"
```

---

### Task 10: Award `srs_clear` XP (+25)

**Files:**
- Modify: `apps/web/lib/xp/scoring.ts`
- Modify: `apps/web/lib/engagement/engine.ts` and/or `progress-context.tsx` `saveSelfGrade`
- Modify: `apps/web/lib/engagement/actions.ts` if server path needs a dedicated write
- Test: `apps/web/lib/__tests__/xp-scoring.test.ts`

- [ ] **Step 1: Add pure helper**

```typescript
export const SRS_CLEAR_XP = 25;

export function buildSrsClearEvent(questionId: number, timestamp = new Date().toISOString()): XPEvent {
  return {
    questionId,
    xpDelta: SRS_CLEAR_XP,
    eventType: 'srs_clear',
    timestamp,
  };
}
```

- [ ] **Step 2: Tests**

```typescript
it('builds srs_clear event with +25', () => {
  const event = buildSrsClearEvent(3, '2026-07-09T12:00:00.000Z');
  expect(event).toEqual({
    questionId: 3,
    xpDelta: 25,
    eventType: 'srs_clear',
    timestamp: '2026-07-09T12:00:00.000Z',
  });
});
```

- [ ] **Step 3: Award on self-grade when queue transitions to empty**

In guest `saveSelfGrade` path and server `applyServerSelfGrade` follow-up:

1. Snapshot `dueBefore = countDueReviews(state, allQuestionSummaries?)` — if question list unavailable client-side, use SRS-only count for both before/after (consistent).
2. Apply grade.
3. If `dueBefore > 0 && dueAfter === 0`, append `buildSrsClearEvent(questionId)` via `applyXPEvents` (guest) or insert into `xp_events` + update totals (auth).

**Auth path recommendation:** extend `applyServerSelfGrade` to return `{ progressItem, xpEvents? }` OR add `awardSrsClearIfNeeded(questionId)` called from context after grade when local due count hits 0. Prefer keeping award in `progress-context.tsx` after both guest and auth grade succeed, with a small server action `appendXPEvents(events)` that upserts with a synthetic `submissionId` like `srs-clear:${date}:${questionId}`.

- [ ] **Step 4: Commit**

```bash
git add apps/web/lib/xp/scoring.ts apps/web/lib/__tests__/xp-scoring.test.ts apps/web/lib/progress/progress-context.tsx apps/web/lib/engagement/actions.ts
git commit -m "feat(xp): award srs_clear bonus when review queue is cleared"
```

---

### Task 11: Prompt self-grade after MCQ (light touch)

**Files:**
- Modify: `apps/web/components/ide/question-ide-client.tsx`
- Test: `apps/web/components/ide/question-ide-client.test.tsx`

- [ ] **Step 1: When `status=review` (or always after first MCQ submit), keep self-grade panel visible and slightly emphasized**

Do **not** auto-fire a grade. Require explicit Hard/Good/Easy so SRS quality stays honest.

Optional UX: if user navigates next without grading during review mode, show a subtle inline reminder (“Grade this review to update your schedule”).

- [ ] **Step 2: Test that self-grade controls render after answer in review scope**

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/ide/question-ide-client.tsx apps/web/components/ide/question-ide-client.test.tsx
git commit -m "feat(ide): emphasize self-grade during review sessions"
```

---

## Phase 4 — Leaderboard as sign-up funnel (V1 polish)

### Task 12: Stop hardcoding Anonymous in RPCs (profile-ready)

**Files:**
- Create: `supabase/migrations/<timestamp>_leaderboard_display_name.sql`
- Modify: `apps/web/lib/engagement/leaderboard.ts` if row shape gains fields
- Modify: `apps/web/components/leaderboard/leaderboard-table.tsx`
- Modify: `apps/web/app/[locale]/(app)/leaderboard/page.tsx`
- Test: `apps/web/lib/__tests__/leaderboard.test.ts`

**V1 approach (no full profiles UI yet):**

1. Add nullable `display_name text` column on `user_xp_totals` (or small `user_profiles` table with `user_id`, `display_name`, `is_anonymous`).
2. Update weekly/all-time RPCs:

```sql
COALESCE(
  NULLIF(p.display_name, ''),
  'Anonymous'
) AS display_name
```

3. Add server action `setDisplayName(name: string)` later; for this sprint, RPC fallback alone is enough if column exists — names stay Anonymous until users can set them in a follow-up.

**If adding a settings field is too large for this sprint:** still ship UI polish (Task 13) and leave a migration stub comment. Prefer shipping the column + COALESCE now so the next PR only needs a settings form.

- [ ] **Step 1: Migration + regenerate types if the repo does that**
- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/*_leaderboard_display_name.sql apps/web/lib/engagement/leaderboard.ts
git commit -m "feat(leaderboard): prefer profile display_name over hardcoded Anonymous"
```

---

### Task 13: Leaderboard UI — streak column + guest CTA

**Files:**
- Modify RPC / `LeaderboardEntry` to include `currentStreak` (join `user_streaks`)
- Modify: `apps/web/components/leaderboard/leaderboard-table.tsx`
- Modify: `apps/web/lib/progress/use-guest-prompt.ts` optional: also nudge from leaderboard page

- [ ] **Step 1: Extend entry type**

```typescript
export interface LeaderboardEntry {
  position: number;
  displayName: string;
  totalXP: number;
  level: number;
  levelName: string;
  rank: number;
  currentStreak: number;
}
```

- [ ] **Step 2: Table columns** — name, level, XP, streak flame

- [ ] **Step 3: Guest CTA row** under table when `!isSignedIn`: “Sign in to claim your rank” linking to Clerk sign-up

- [ ] **Step 4: Commit**

```bash
git add apps/web/lib/engagement/leaderboard.ts apps/web/components/leaderboard/leaderboard-table.tsx apps/web/app/[locale]/\(app\)/leaderboard/page.tsx supabase/migrations/*
git commit -m "feat(leaderboard): show streaks and guest sign-up CTA"
```

---

## Phase 5 — Verification + handoff

### Task 14: Full regression + handoff update

- [ ] **Step 1: Run full suite**

```bash
bun run typecheck
bun run test
bun run lint
bun run build
```

- [ ] **Step 2: Manual smoke checklist**

1. As guest: answer 3 questions across 2 days (fake timers or change system date in unit tests already cover streak; manually answer several).
2. Sign in → XP total increases (or matches guest), streak non-zero, progress present.
3. `/progress` overview level matches header XP badge.
4. `/review` → opens due question with `?status=review` → grade → queue shrinks; clearing last item awards +25 once.
5. `/leaderboard` loads; guest sees CTA.

- [ ] **Step 3: Update `.context/handoff.md`**

Document Done / Next / Key files for this sprint.

- [ ] **Step 4: Push + open PR to `dev`**

```bash
git push -u origin cursor/trust-habit-sprint-360d
```

PR title: `feat: trust + habit sprint (sign-in sync, dashboard unify, daily review)`

PR body should list phases and test plan above.

---

## Execution order (summary)

| Order | Task | Outcome |
|------:|------|---------|
| 0 | CI baseline + branch | Safe starting point |
| 1–4 | Sign-in sync | Guest XP/streak/SRS survive login |
| 5–6 | Dashboard unify | One progression system |
| 7–11 | Daily Review | Habit loop + `srs_clear` |
| 12–13 | Leaderboard polish | Stronger sign-up funnel |
| 14 | Verify + PR | Ship to `dev` |

---

## Spec coverage check

| Requirement | Task(s) |
|-------------|---------|
| Guest XP survives sign-in | 2, 3, 4 |
| Guest streak survives sign-in | 1, 3, 4 |
| Guest SRS not dropped | 3 (`progress/actions.ts`) |
| Dashboard streak matches badges | 5 |
| Overview uses real XP levels + real totals | 6 |
| Daily review practice surface | 8, 9 |
| Review badge / queue consistency | 7 |
| `srs_clear` +25 | 10 |
| Self-grade emphasized in review | 11 |
| Leaderboard names + streak + guest CTA | 12, 13 |
| CI/build verification | 0, 14 |
| Pro / AI / shield | Explicitly out of scope |

## Risk notes

- **Replay XP ≠ guest local XP total:** Replaying through `recordAttempt` recomputes XP with server rules (cooldown, first-answer-today). Totals may differ slightly from guest localStorage; that is correct — server engine is authoritative.
- **Large guest histories:** Sequential `recordAttempt` loops can be slow. Cap replay at e.g. 200 attempts and sync remaining progress rows without XP if needed; document in code.
- **`status=review` + SSG:** Review page can be static shell; filtering is client-side from progress — same pattern as `/progress`.
