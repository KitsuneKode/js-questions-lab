'use server';

import { auth } from '@clerk/nextjs/server';
import { getQuestionById } from '@/lib/content/loaders';
import {
  buildAuthoritativeAttemptResult,
  buildAuthoritativeSelfGradeResult,
  rebuildXPState,
} from '@/lib/engagement/engine';
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
  recallAnswer?: string | null;
  locale?: string;
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
  });

  const rows = result.xpEvents.map((event) => ({
    user_id: userId,
    question_id: event.questionId,
    event_type: event.eventType,
    xp_delta: event.xpDelta,
    created_at: event.timestamp,
  }));
  const supabase = createServerSupabaseClient();
  const [{ error: progressError }, xpInsertResult, { error: streakError }] = await Promise.all([
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
    rows.length > 0 ? supabase.from('xp_events').insert(rows) : Promise.resolve({ error: null }),
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

  if (rows.length > 0) {
    revalidateLeaderboardCaches();
  }

  return result;
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
