'use server';

import { randomUUID } from 'node:crypto';
import { auth } from '@clerk/nextjs/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getQuestionById } from '@/lib/content/loaders';
import { normalizeDisplayName } from '@/lib/engagement/display-name';
import {
  buildAuthoritativeAttemptResult,
  buildAuthoritativeSelfGradeResult,
  rebuildXPState,
} from '@/lib/engagement/engine';
import {
  clampReplayAttemptedAt,
  type GuestAttemptReplay,
  resolveReplayAttemptedAt,
} from '@/lib/engagement/guest-replay';
import { revalidateLeaderboardCaches } from '@/lib/engagement/leaderboard-cache';
import { srsClearSubmissionId } from '@/lib/engagement/srs-clear';
import { DEFAULT_LOCALE, isValidLocale, type LocaleCode } from '@/lib/i18n/config';
import type { Grade } from '@/lib/progress/srs';
import type { ProgressItem } from '@/lib/progress/storage';
import { defaultStreakState, type StreakState } from '@/lib/streaks/calculator';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/service-role';
import { buildSrsClearEvent, SRS_CLEAR_XP, type XPEvent } from '@/lib/xp/scoring';
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
  replay?: { attemptedAt: string };
  mode?: 'quiz' | 'recall';
  timeMs?: number;
  errorType?: 'misread' | 'forgot' | 'wrong_concept' | 'guess';
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

async function readXPEvents(supabase: SupabaseClient, userId: string): Promise<XPEvent[]> {
  const { data, error } = await supabase
    .from('xp_events')
    .select('question_id, event_type, xp_delta, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }
  if (!Array.isArray(data)) {
    throw new Error('Failed to fetch XP events');
  }

  return (data as XPEventRow[]).map(toXPEvent);
}

async function fetchXPEvents(userId: string): Promise<XPEvent[]> {
  try {
    return await readXPEvents(createServerSupabaseClient(), userId);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Failed to fetch XP events:', message);
    return [];
  }
}

export async function fetchXPState(): Promise<XPState> {
  const { userId } = await auth();
  if (!userId) return defaultXPState;

  return rebuildXPState(await fetchXPEvents(userId));
}

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

  const now = new Date();
  let answeredAt = now.toISOString();
  if (input.replay) {
    const clamped = clampReplayAttemptedAt(input.replay.attemptedAt, now);
    if (!clamped) return null;
    answeredAt = clamped;
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
    answeredAt,
    mode: input.mode,
    timeMs: input.timeMs,
    submissionId,
  });

  const rows = result.xpEvents.map((event, index) => ({
    user_id: userId,
    submission_id: submissionId,
    event_index: index,
    question_id: event.questionId,
    event_type: event.eventType,
    xp_delta: event.xpDelta,
    created_at: event.timestamp,
    metadata: {
      mode: input.mode ?? (input.recallAnswer ? 'recall' : 'quiz'),
      ...(input.errorType ? { errorType: input.errorType } : {}),
    },
  }));
  const supabase = createServiceRoleSupabaseClient();
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

  const xpState = rebuildXPState(await readXPEvents(supabase, userId));
  const { error: totalsError } = await supabase.from('user_xp_totals').upsert(
    {
      user_id: userId,
      total_xp: xpState.totalXP,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );
  if (totalsError) {
    console.error('Failed to upsert XP totals:', totalsError.message);
    throw totalsError;
  }

  if (rows.length > 0) {
    revalidateLeaderboardCaches();
  }

  return { ...result, xpState };
}

export async function awardSrsClearBonus(questionId: number): Promise<XPState | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const today = new Date().toISOString().slice(0, 10);
  const submissionId = srsClearSubmissionId(questionId, today);
  const event = buildSrsClearEvent(questionId);
  const supabase = createServiceRoleSupabaseClient();

  const { error: xpError } = await supabase.from('xp_events').upsert(
    [
      {
        user_id: userId,
        submission_id: submissionId,
        event_index: 0,
        question_id: questionId,
        event_type: event.eventType,
        xp_delta: SRS_CLEAR_XP,
        created_at: event.timestamp,
      },
    ],
    { onConflict: 'user_id,submission_id,event_index', ignoreDuplicates: true },
  );
  if (xpError) throw xpError;

  const next = rebuildXPState(await readXPEvents(supabase, userId));
  const { error: totalsError } = await supabase.from('user_xp_totals').upsert(
    {
      user_id: userId,
      total_xp: next.totalXP,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );
  if (totalsError) throw totalsError;

  revalidateLeaderboardCaches();
  return next;
}

export async function applyServerSelfGrade(
  questionId: number,
  grade: Grade,
  errorType?: 'misread' | 'forgot' | 'wrong_concept' | 'guess',
): Promise<ProgressItem | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const progressItems = await fetchProgressRows(userId);
  const previousProgress = progressItems.find((item) => item.questionId === questionId);
  const result = buildAuthoritativeSelfGradeResult({
    questionId,
    previousProgress,
    grade,
    errorType,
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

  const supabase = createServiceRoleSupabaseClient();
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

// Callers should replay BEFORE bookmark sync so attempt arrays are server-authored.
export async function replayGuestAttempts(
  attempts: GuestAttemptReplay[],
  locale?: string,
): Promise<{ xpState: XPState; streakState: StreakState } | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const now = new Date();
  const localeCode = toLocaleCode(locale);
  const supabase = createServiceRoleSupabaseClient();

  const [progressItems, xpEvents, streakState, submissionResult] = await Promise.all([
    fetchProgressRows(userId),
    fetchXPEvents(userId),
    fetchStreak(),
    supabase.from('xp_events').select('submission_id').eq('user_id', userId),
  ]);

  if (submissionResult.error) {
    throw submissionResult.error;
  }

  const seenSubmissions = new Set(
    (submissionResult.data ?? [])
      .map((row) => row.submission_id)
      .filter((id): id is string => typeof id === 'string' && id.length > 0),
  );

  const progressById = new Map(progressItems.map((item) => [item.questionId, item]));
  let xpState = rebuildXPState(xpEvents);
  let nextStreak = streakState ?? defaultStreakState;
  const progressWrites = new Map<number, ProgressItem>();
  const xpRows: Array<{
    user_id: string;
    submission_id: string;
    event_index: number;
    question_id: number;
    event_type: XPEvent['eventType'];
    xp_delta: number;
    created_at: string;
    metadata: { mode: 'quiz'; source: 'guest_replay' };
  }> = [];

  const toReplay = [...attempts]
    .sort((a, b) => a.attemptedAt.localeCompare(b.attemptedAt))
    .slice(0, 200);

  for (const attempt of toReplay) {
    const answeredAt = resolveReplayAttemptedAt(attempt, now, {
      questionExists: Boolean(
        getQuestionById(localeCode, attempt.questionId) ??
          getQuestionById(DEFAULT_LOCALE, attempt.questionId),
      ),
      alreadyPersisted: seenSubmissions.has(attempt.submissionId),
    });
    if (!answeredAt) continue;

    const question =
      getQuestionById(localeCode, attempt.questionId) ??
      getQuestionById(DEFAULT_LOCALE, attempt.questionId);
    if (!question) continue;

    const result = buildAuthoritativeAttemptResult({
      question,
      previousProgress: progressById.get(attempt.questionId),
      previousXPState: xpState,
      previousStreakState: nextStreak,
      selected: attempt.selected,
      answeredAt,
      submissionId: attempt.submissionId,
    });

    progressById.set(attempt.questionId, result.progressItem);
    progressWrites.set(attempt.questionId, result.progressItem);
    xpState = result.xpState;
    nextStreak = result.streakState;
    seenSubmissions.add(attempt.submissionId);

    result.xpEvents.forEach((event, index) => {
      xpRows.push({
        user_id: userId,
        submission_id: attempt.submissionId,
        event_index: index,
        question_id: event.questionId,
        event_type: event.eventType,
        xp_delta: event.xpDelta,
        created_at: event.timestamp,
        metadata: { mode: 'quiz', source: 'guest_replay' },
      });
    });
  }

  if (progressWrites.size === 0 && xpRows.length === 0) {
    return { xpState, streakState: nextStreak };
  }

  const [{ error: progressError }, xpInsertResult, { error: streakError }] = await Promise.all([
    progressWrites.size > 0
      ? supabase.from('user_progress').upsert(
          [...progressWrites.values()].map((item) => ({
            user_id: userId,
            question_id: item.questionId,
            attempts: item.attempts,
            bookmarked: item.bookmarked,
            srs_data: item.srsData ?? null,
            updated_at: item.updatedAt,
          })),
          { onConflict: 'user_id,question_id' },
        )
      : Promise.resolve({ error: null }),
    xpRows.length > 0
      ? supabase.from('xp_events').upsert(xpRows, {
          onConflict: 'user_id,submission_id,event_index',
          ignoreDuplicates: true,
        })
      : Promise.resolve({ error: null }),
    supabase.from('user_streaks').upsert(
      {
        user_id: userId,
        current_streak: nextStreak.currentStreak,
        longest_streak: nextStreak.longestStreak,
        last_activity_date: nextStreak.lastActivityDate,
        updated_at: now.toISOString(),
      },
      { onConflict: 'user_id' },
    ),
  ]);

  if (progressError) throw progressError;
  if (xpInsertResult.error) throw xpInsertResult.error;
  if (streakError) throw streakError;

  const persisted = rebuildXPState(await readXPEvents(supabase, userId));
  const { error: totalsError } = await supabase.from('user_xp_totals').upsert(
    {
      user_id: userId,
      total_xp: persisted.totalXP,
      updated_at: now.toISOString(),
    },
    { onConflict: 'user_id' },
  );
  if (totalsError) throw totalsError;

  if (xpRows.length > 0) {
    revalidateLeaderboardCaches();
  }

  return { xpState: persisted, streakState: nextStreak };
}

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

  const reader = createServerSupabaseClient();
  const writer = createServiceRoleSupabaseClient();
  const { data: existing } = await reader
    .from('user_xp_totals')
    .select('total_xp')
    .eq('user_id', userId)
    .maybeSingle();

  const { error } = await writer.from('user_xp_totals').upsert(
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
