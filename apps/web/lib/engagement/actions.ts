'use server';

import { randomUUID } from 'node:crypto';
import { auth } from '@clerk/nextjs/server';
import { getQuestionById } from '@/lib/content/loaders';
import { normalizeDisplayName } from '@/lib/engagement/display-name';
import {
  buildAuthoritativeAttemptResult,
  buildAuthoritativeSelfGradeResult,
  rebuildXPState,
} from '@/lib/engagement/engine';
import type { GuestAttemptReplay } from '@/lib/engagement/guest-replay';
import { revalidateLeaderboardCaches } from '@/lib/engagement/leaderboard-cache';
import { DEFAULT_LOCALE, isValidLocale, type LocaleCode } from '@/lib/i18n/config';
import type { Grade } from '@/lib/progress/srs';
import type { ProgressItem } from '@/lib/progress/storage';
import { defaultStreakState, type StreakState } from '@/lib/streaks/calculator';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { XPEvent } from '@/lib/xp/scoring';
import { defaultXPState, type XPState } from '@/lib/xp/storage';

interface SupabaseProgressRow {
  user_id: string;
  question_id: number;
  attempts: ProgressItem['attempts'];
  bookmarked: boolean;
  srs_data: ProgressItem['srsData'] | null;
  updated_at: string;
}

interface XPEventRow {
  question_id: number;
  event_type: XPEvent['eventType'];
  xp_delta: number;
  created_at: string;
}

interface RecordAttemptInput {
  questionId: number;
  selected: ProgressItem['attempts'][number]['selected'];
  submissionId?: string;
  recallAnswer?: string | null;
  locale?: string;
  answeredAt?: string;
}

export interface RecordAttemptResult {
  progressItem: ProgressItem;
  xpState: XPState;
  streakState: StreakState;
  xpEvents: XPEvent[];
}

function toProgressItem(row: SupabaseProgressRow): ProgressItem {
  return {
    questionId: row.question_id,
    attempts: row.attempts,
    bookmarked: row.bookmarked,
    srsData: row.srs_data ?? undefined,
    updatedAt: row.updated_at,
  };
}

function toXPEvent(row: XPEventRow): XPEvent {
  return {
    questionId: row.question_id,
    eventType: row.event_type,
    xpDelta: row.xp_delta,
    timestamp: row.created_at,
  };
}

function toLocaleCode(locale?: string): LocaleCode {
  return locale && isValidLocale(locale) ? locale : DEFAULT_LOCALE;
}

async function fetchProgressRows(userId: string): Promise<ProgressItem[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('user_progress')
    .select('user_id, question_id, attempts, bookmarked, srs_data, updated_at')
    .eq('user_id', userId);

  if (error || !Array.isArray(data)) {
    console.error('Failed to fetch server progress:', error?.message);
    return [];
  }

  return (data as SupabaseProgressRow[]).map(toProgressItem);
}

async function fetchXPEvents(userId: string): Promise<XPEvent[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('xp_events')
    .select('question_id, event_type, xp_delta, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error || !Array.isArray(data)) {
    console.error('Failed to fetch XP events:', error?.message);
    return [];
  }

  return (data as XPEventRow[]).map(toXPEvent);
}

// ---------------------------------------------------------------------------
// Fetch engagement state
// ---------------------------------------------------------------------------

export async function fetchXPState(): Promise<XPState> {
  const { userId } = await auth();
  if (!userId) return defaultXPState;

  return rebuildXPState(await fetchXPEvents(userId));
}

// ---------------------------------------------------------------------------
// Server-authoritative attempt + SRS writes
// ---------------------------------------------------------------------------

export async function recordAttempt(
  input: RecordAttemptInput,
): Promise<RecordAttemptResult | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const submissionId = input.submissionId ?? randomUUID();
  const locale = toLocaleCode(input.locale);
  const question =
    getQuestionById(locale, input.questionId) ?? getQuestionById(DEFAULT_LOCALE, input.questionId);
  if (!question) {
    throw new Error(`Question not found: ${input.questionId}`);
  }

  const [progressItems, xpEvents, streakState] = await Promise.all([
    fetchProgressRows(userId),
    fetchXPEvents(userId),
    fetchStreak(),
  ]);

  const previousProgress = progressItems.find((item) => item.questionId === input.questionId);
  const result = buildAuthoritativeAttemptResult({
    question,
    previousProgress,
    previousXPState: rebuildXPState(xpEvents),
    previousStreakState: streakState ?? defaultStreakState,
    selected: input.selected,
    recallAnswer: input.recallAnswer,
    answeredAt: input.answeredAt,
  });

  const rows = result.xpEvents.map((event, index) => ({
    user_id: userId,
    submission_id: submissionId,
    event_index: index,
    question_id: event.questionId,
    event_type: event.eventType,
    xp_delta: event.xpDelta,
    created_at: event.timestamp,
  }));
  const supabase = createServerSupabaseClient();
  const [{ error: progressError }, xpInsertResult, { error: streakError }, { error: totalsError }] =
    await Promise.all([
      supabase.from('user_progress').upsert(
        {
          user_id: userId,
          question_id: result.progressItem.questionId,
          attempts: result.progressItem.attempts,
          bookmarked: result.progressItem.bookmarked,
          srs_data: result.progressItem.srsData ?? null,
          updated_at: result.progressItem.updatedAt,
        },
        { onConflict: 'user_id,question_id' },
      ),
      rows.length > 0
        ? supabase.from('xp_events').upsert(rows, {
            onConflict: 'user_id,submission_id,event_index',
            ignoreDuplicates: true,
          })
        : Promise.resolve({ error: null }),
      supabase.from('user_streaks').upsert(
        {
          user_id: userId,
          current_streak: result.streakState.currentStreak,
          longest_streak: result.streakState.longestStreak,
          last_activity_date: result.streakState.lastActivityDate,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      ),
      supabase.from('user_xp_totals').upsert(
        {
          user_id: userId,
          total_xp: result.xpState.totalXP,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      ),
    ]);

  if (progressError) {
    console.error('Failed to upsert question progress:', progressError.message);
    throw progressError;
  }

  if (xpInsertResult.error) {
    console.error('Failed to insert XP events:', xpInsertResult.error.message);
    throw xpInsertResult.error;
  }

  if (streakError) {
    console.error('Failed to upsert streak:', streakError.message);
    throw streakError;
  }

  if (totalsError) {
    console.error('Failed to upsert XP totals:', totalsError.message);
    throw totalsError;
  }

  if (rows.length > 0) {
    revalidateLeaderboardCaches();
  }

  return result;
}

export async function appendXPEvents(
  events: XPEvent[],
  submissionId: string,
): Promise<XPState | null> {
  const { userId } = await auth();
  if (!userId || events.length === 0) return null;

  const supabase = createServerSupabaseClient();
  const rows = events.map((event, index) => ({
    user_id: userId,
    submission_id: submissionId,
    event_index: index,
    question_id: event.questionId,
    event_type: event.eventType,
    xp_delta: event.xpDelta,
    created_at: event.timestamp,
  }));

  const existing = await fetchXPEvents(userId);
  const next = rebuildXPState([...existing, ...events]);

  const [{ error: xpError }, { error: totalsError }] = await Promise.all([
    supabase.from('xp_events').upsert(rows, {
      onConflict: 'user_id,submission_id,event_index',
      ignoreDuplicates: true,
    }),
    supabase.from('user_xp_totals').upsert(
      {
        user_id: userId,
        total_xp: next.totalXP,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    ),
  ]);

  if (xpError) throw xpError;
  if (totalsError) throw totalsError;

  revalidateLeaderboardCaches();
  return next;
}

export async function applyServerSelfGrade(
  questionId: number,
  grade: Grade,
): Promise<ProgressItem | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const progressItems = await fetchProgressRows(userId);
  const previousProgress = progressItems.find((item) => item.questionId === questionId);
  const result = buildAuthoritativeSelfGradeResult({
    questionId,
    previousProgress,
    grade,
  });

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from('user_progress').upsert(
    {
      user_id: userId,
      question_id: result.questionId,
      attempts: result.attempts,
      bookmarked: result.bookmarked,
      srs_data: result.srsData ?? null,
      updated_at: result.updatedAt,
    },
    { onConflict: 'user_id,question_id' },
  );

  if (error) {
    console.error('Failed to sync graded progress:', error.message);
    throw error;
  }

  return result;
}

// ---------------------------------------------------------------------------
// Fetch streak (for server-side merge on sign-in)
// ---------------------------------------------------------------------------

export async function fetchStreak(): Promise<StreakState | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('user_streaks')
    .select('current_streak, longest_streak, last_activity_date')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;

  return {
    version: 1,
    currentStreak: data.current_streak,
    longestStreak: data.longest_streak,
    lastActivityDate: data.last_activity_date ?? null,
  };
}

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

// Callers should replay BEFORE syncProgressToServer, or sync after replay, to avoid duplicate attempts (recordAttempt appends).
export async function replayGuestAttempts(
  attempts: GuestAttemptReplay[],
  locale?: string,
): Promise<{ xpState: XPState; streakState: StreakState } | null> {
  const { userId } = await auth();
  if (!userId) return null;

  let toReplay = attempts;
  if (attempts.length > 200) {
    console.warn(
      `replayGuestAttempts: truncating ${attempts.length - 200} attempts (cap 200); full arrays still sync via progress`,
    );
    toReplay = attempts.slice(0, 200);
  }

  let last: RecordAttemptResult | null = null;
  for (const attempt of toReplay) {
    last = await recordAttempt({
      questionId: attempt.questionId,
      selected: attempt.selected,
      submissionId: attempt.submissionId,
      locale,
      answeredAt: attempt.attemptedAt,
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

// ---------------------------------------------------------------------------
// Leaderboard display name
// ---------------------------------------------------------------------------

export async function fetchDisplayName(): Promise<string | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('user_xp_totals')
    .select('display_name')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch display name:', error.message);
    return null;
  }

  return data?.display_name ?? null;
}

export async function setDisplayName(
  rawName: string,
): Promise<{ ok: true; displayName: string } | { ok: false; error: string }> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: 'Not signed in' };

  const normalized = normalizeDisplayName(rawName);
  if (!normalized.ok) return normalized;

  const supabase = createServerSupabaseClient();
  const { data: existing } = await supabase
    .from('user_xp_totals')
    .select('total_xp')
    .eq('user_id', userId)
    .maybeSingle();

  const { error } = await supabase.from('user_xp_totals').upsert(
    {
      user_id: userId,
      total_xp: existing?.total_xp ?? 0,
      display_name: normalized.displayName,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );

  if (error) {
    console.error('Failed to set display name:', error.message);
    return { ok: false, error: 'Could not save display name' };
  }

  revalidateLeaderboardCaches();
  return { ok: true, displayName: normalized.displayName };
}
