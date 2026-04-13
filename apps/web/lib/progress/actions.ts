'use server';

import { auth } from '@clerk/nextjs/server';
import type { ProgressItem } from '@/lib/progress/storage';
import { createServerSupabaseClient } from '@/lib/supabase/server';

interface SupabaseProgressRow {
  user_id: string;
  question_id: number;
  attempts: ProgressItem['attempts'];
  bookmarked: boolean;
  srs_data: ProgressItem['srsData'] | null;
  updated_at: string;
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

export async function fetchServerProgress(): Promise<ProgressItem[]> {
  const { userId } = await auth();
  if (!userId) return [];

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('user_progress')
    .select('user_id, question_id, attempts, bookmarked, srs_data, updated_at')
    .eq('user_id', userId);

  if (error) {
    console.error('Failed to fetch server progress:', error.message);
    return [];
  }

  if (!Array.isArray(data)) return [];
  return (data as SupabaseProgressRow[]).map(toProgressItem);
}

export async function upsertSingleQuestion(item: ProgressItem): Promise<void> {
  const { userId } = await auth();
  if (!userId) return;

  const supabase = createServerSupabaseClient();
  const { data: existing } = await supabase
    .from('user_progress')
    .select('srs_data')
    .eq('user_id', userId)
    .eq('question_id', item.questionId)
    .maybeSingle();

  const { error } = await supabase.from('user_progress').upsert(
    {
      user_id: userId,
      question_id: item.questionId,
      attempts: item.attempts,
      bookmarked: item.bookmarked,
      srs_data: existing?.srs_data ?? null,
      updated_at: item.updatedAt,
    },
    { onConflict: 'user_id,question_id' },
  );

  if (error) {
    console.error('Failed to upsert question progress:', error.message);
    throw error;
  }
}

export async function syncProgressToServer(items: ProgressItem[]): Promise<void> {
  const { userId } = await auth();
  if (!userId || items.length === 0) return;

  const supabase = createServerSupabaseClient();
  const { data: existingRows } = await supabase
    .from('user_progress')
    .select('question_id, srs_data')
    .eq('user_id', userId)
    .in(
      'question_id',
      items.map((item) => item.questionId),
    );

  const existingSrsByQuestionId = new Map<number, ProgressItem['srsData'] | null>(
    (existingRows ?? []).map((row) => [
      row.question_id as number,
      row.srs_data as ProgressItem['srsData'] | null,
    ]),
  );

  const rows = items.map((item) => ({
    user_id: userId,
    question_id: item.questionId,
    attempts: item.attempts,
    bookmarked: item.bookmarked,
    srs_data: existingSrsByQuestionId.get(item.questionId) ?? null,
    updated_at: item.updatedAt,
  }));

  const { error } = await supabase
    .from('user_progress')
    .upsert(rows, { onConflict: 'user_id,question_id' });

  if (error) {
    console.error('Failed to sync progress to server:', error.message);
    throw error;
  }
}
