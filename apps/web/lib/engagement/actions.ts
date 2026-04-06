'use server';

import { auth } from '@clerk/nextjs/server';
import type { StreakState } from '@/lib/streaks/calculator';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { XPEvent } from '@/lib/xp/scoring';

// ---------------------------------------------------------------------------
// XP events
// ---------------------------------------------------------------------------

export async function insertXPEvents(events: XPEvent[]): Promise<void> {
  const { userId } = await auth();
  if (!userId || events.length === 0) return;

  const supabase = createServerSupabaseClient();
  const rows = events.map((e) => ({
    user_id: userId,
    question_id: e.questionId,
    event_type: e.eventType,
    xp_delta: e.xpDelta,
    created_at: e.timestamp,
  }));

  const { error } = await supabase.from('xp_events').insert(rows);
  if (error) {
    console.error('Failed to insert XP events:', error.message);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Streak sync
// ---------------------------------------------------------------------------

export async function upsertStreak(streak: StreakState): Promise<void> {
  const { userId } = await auth();
  if (!userId) return;

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from('user_streaks').upsert(
    {
      user_id: userId,
      current_streak: streak.currentStreak,
      longest_streak: streak.longestStreak,
      last_activity_date: streak.lastActivityDate,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );

  if (error) {
    console.error('Failed to upsert streak:', error.message);
    throw error;
  }
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
