import type { QuestionRecord } from '@/lib/content/types';
import type { ProgressItem, ProgressState } from '@/lib/progress/storage';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface QuestionStats {
  questionId: number;
  totalAttempts: number;
  correctCount: number;
  accuracy: number;
  lastAttemptedAt: string | null;
  lastStatus: 'correct' | 'incorrect' | null;
}

export interface TagStats {
  tag: string;
  totalAttempts: number;
  correctCount: number;
  accuracy: number;
  questionCount: number;
}

export interface OverallStats {
  totalAnswered: number;
  totalCorrect: number;
  totalAttempts: number;
  overallAccuracy: number;
  bookmarkedCount: number;
  currentStreak: number;
  longestStreak: number;
}

export interface DailyActivity {
  date: string;
  attempts: number;
  correct: number;
}

export interface PracticeSuggestion {
  question: QuestionRecord | null;
  label: string;
  description: string;
}

// ---------------------------------------------------------------------------
// Pure computation functions
// ---------------------------------------------------------------------------

export function computeQuestionStats(item: ProgressItem): QuestionStats {
  const totalAttempts = item.attempts.length;
  const correctCount = item.attempts.filter((a) => a.status === 'correct').length;
  const lastAttempt = item.attempts[totalAttempts - 1] ?? null;

  return {
    questionId: item.questionId,
    totalAttempts,
    correctCount,
    accuracy: totalAttempts > 0 ? correctCount / totalAttempts : 0,
    lastAttemptedAt: lastAttempt?.attemptedAt ?? null,
    lastStatus: lastAttempt?.status ?? null,
  };
}

export function computeTagStats(progress: ProgressState, questions: QuestionRecord[]): TagStats[] {
  const tagMap = new Map<string, { attempts: number; correct: number; questions: Set<number> }>();

  const questionTagMap = new Map<number, string[]>();
  for (const q of questions) {
    questionTagMap.set(q.id, q.tags);
  }

  for (const item of Object.values(progress.questions)) {
    const tags = questionTagMap.get(item.questionId) ?? [];
    for (const tag of tags) {
      let entry = tagMap.get(tag);
      if (!entry) {
        entry = { attempts: 0, correct: 0, questions: new Set() };
        tagMap.set(tag, entry);
      }
      entry.questions.add(item.questionId);
      entry.attempts += item.attempts.length;
      entry.correct += item.attempts.filter((a) => a.status === 'correct').length;
    }
  }

  return Array.from(tagMap.entries())
    .map(([tag, data]) => ({
      tag,
      totalAttempts: data.attempts,
      correctCount: data.correct,
      accuracy: data.attempts > 0 ? data.correct / data.attempts : 0,
      questionCount: data.questions.size,
    }))
    .sort((a, b) => b.totalAttempts - a.totalAttempts);
}

export function computeOverallStats(progress: ProgressState): OverallStats {
  const items = Object.values(progress.questions);
  let totalAttempts = 0;
  let totalCorrect = 0;
  let bookmarkedCount = 0;
  let totalAnswered = 0;

  for (const item of items) {
    if (item.attempts.length > 0) {
      totalAnswered++;
      totalAttempts += item.attempts.length;
      totalCorrect += item.attempts.filter((a) => a.status === 'correct').length;
    }
    if (item.bookmarked) bookmarkedCount++;
  }

  const { current, longest } = computeStreak(progress);

  return {
    totalAnswered,
    totalCorrect,
    totalAttempts,
    overallAccuracy: totalAttempts > 0 ? totalCorrect / totalAttempts : 0,
    bookmarkedCount,
    currentStreak: current,
    longestStreak: longest,
  };
}

export function computeStreak(progress: ProgressState): { current: number; longest: number } {
  const daySet = new Set<string>();

  for (const item of Object.values(progress.questions)) {
    for (const attempt of item.attempts) {
      daySet.add(attempt.attemptedAt.slice(0, 10));
    }
  }

  if (daySet.size === 0) return { current: 0, longest: 0 };

  const days = Array.from(daySet).sort();
  let longest = 1;
  let currentRun = 1;

  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1]);
    const curr = new Date(days[i]);
    const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);

    if (Math.round(diff) === 1) {
      currentRun++;
      if (currentRun > longest) longest = currentRun;
    } else {
      currentRun = 1;
    }
  }

  // Check if the current streak includes today or yesterday
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const lastDay = days[days.length - 1];

  let current = 0;
  if (lastDay === today || lastDay === yesterday) {
    current = 1;
    for (let i = days.length - 2; i >= 0; i--) {
      const prev = new Date(days[i]);
      const curr = new Date(days[i + 1]);
      const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      if (Math.round(diff) === 1) {
        current++;
      } else {
        break;
      }
    }
  }

  return { current, longest };
}

export function computeDailyActivity(progress: ProgressState): DailyActivity[] {
  const dayMap = new Map<string, { attempts: number; correct: number }>();

  for (const item of Object.values(progress.questions)) {
    for (const attempt of item.attempts) {
      const date = attempt.attemptedAt.slice(0, 10);
      let entry = dayMap.get(date);
      if (!entry) {
        entry = { attempts: 0, correct: 0 };
        dayMap.set(date, entry);
      }
      entry.attempts++;
      if (attempt.status === 'correct') entry.correct++;
    }
  }

  return Array.from(dayMap.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function getWeakestTopics(tagStats: TagStats[], limit = 5): TagStats[] {
  return tagStats
    .filter((t) => t.totalAttempts >= 2)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, limit);
}

export function getReviewQueue(
  progress: ProgressState,
  questions: QuestionRecord[],
  limit = 10,
): QuestionRecord[] {
  const now = new Date();

  interface ScoredQuestion {
    question: QuestionRecord;
    overdueDays: number;
    priority: number; // For fallback
  }

  const scored: ScoredQuestion[] = [];

  for (const q of questions) {
    const item = progress.questions[String(q.id)];

    if (!item || item.attempts.length === 0) {
      continue; // Unanswered questions are not reviews
    }

    if (item.srsData?.nextReviewDate) {
      const reviewDate = new Date(item.srsData.nextReviewDate);
      const diffMs = now.getTime() - reviewDate.getTime();

      // If diffMs > 0, the review is due or overdue
      if (diffMs > 0) {
        const overdueDays = diffMs / (1000 * 60 * 60 * 24);
        scored.push({ question: q, overdueDays, priority: 10 }); // High priority if managed by SRS
      }
    } else {
      // Fallback for items answered before SRS was implemented (legacy logic)
      const lastAttempt = item.attempts[item.attempts.length - 1];
      const lastTime = new Date(lastAttempt.attemptedAt).getTime();
      const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;

      if (lastAttempt.status === 'incorrect') {
        scored.push({ question: q, overdueDays: 0, priority: 3 });
      } else if (lastTime < sevenDaysAgo) {
        scored.push({ question: q, overdueDays: 0, priority: 2 });
      }
    }
  }

  return (
    scored
      // Sort primarily by priority (SRS vs Legacy), then by how many days overdue
      .sort((a, b) => b.priority - a.priority || b.overdueDays - a.overdueDays)
      .slice(0, limit)
      .map((s) => s.question)
  );
}

export function getContinueLearningSuggestion(
  progress: ProgressState,
  questions: QuestionRecord[],
): PracticeSuggestion {
  const attempted = Object.values(progress.questions)
    .filter((item) => item.attempts.length > 0)
    .sort((a, b) => {
      const aTime = new Date(a.updatedAt).getTime();
      const bTime = new Date(b.updatedAt).getTime();
      return bTime - aTime;
    });

  const latest = attempted[0];
  if (!latest) {
    return {
      question: questions[0] ?? null,
      label: 'Start your first run',
      description: 'Pick an early question and get one answer on the board.',
    };
  }

  const target = questions.find((question) => question.id === latest.questionId) ?? null;

  return {
    question: target,
    label: 'Continue where you left off',
    description: 'Jump back into your most recently touched question and finish the loop.',
  };
}

export function getRecommendedSuggestion(
  progress: ProgressState,
  questions: QuestionRecord[],
  weakestTopics: TagStats[],
): PracticeSuggestion {
  const attemptedIds = new Set(
    Object.values(progress.questions)
      .filter((item) => item.attempts.length > 0)
      .map((item) => item.questionId),
  );

  const weakestTag = weakestTopics[0]?.tag ?? null;
  const topicCandidate = weakestTag
    ? questions.find(
        (question) => question.tags.includes(weakestTag) && !attemptedIds.has(question.id),
      )
    : null;

  if (topicCandidate) {
    return {
      question: topicCandidate,
      label: `Sharpen ${weakestTag}`,
      description: 'Target your weakest topic with a fresh question before moving on.',
    };
  }

  const nextFresh = questions.find((question) => !attemptedIds.has(question.id)) ?? null;

  return {
    question: nextFresh,
    label: 'Next best question',
    description: 'Keep forward momentum with the next unanswered problem.',
  };
}
