'use client';

import { useMemo } from 'react';
import type { QuestionSummary } from '@/lib/content/types';
import {
  computeDailyActivity,
  computeOverallStats,
  computeTagStats,
  type DailyActivity,
  getContinueLearningSuggestion,
  getRecommendedSuggestion,
  getReviewQueue,
  getWeakestTopics,
  type OverallStats,
  type PracticeSuggestion,
  type TagStats,
} from '@/lib/progress/analytics';
import { computeTopicMastery, type TopicMastery } from '@/lib/progress/mastery';
import { useProgress } from '@/lib/progress/progress-context';
import { getTagQuestionCounts } from '@/lib/progress/tag-metadata';

export function useAnalytics(questions: QuestionSummary[]) {
  const { state, ready } = useProgress();

  const overall = useMemo<OverallStats>(() => computeOverallStats(state), [state]);

  const tagStats = useMemo<TagStats[]>(() => computeTagStats(state, questions), [state, questions]);

  const dailyActivity = useMemo<DailyActivity[]>(() => computeDailyActivity(state), [state]);

  const weakestTopics = useMemo<TagStats[]>(() => getWeakestTopics(tagStats), [tagStats]);

  const topicMastery = useMemo<TopicMastery[]>(() => {
    const catalog = getTagQuestionCounts();
    const questionTags = new Map(questions.map((q) => [q.id, q.tags]));
    return computeTopicMastery(tagStats, catalog, state, questionTags);
  }, [questions, state, tagStats]);

  const reviewQueue = useMemo<QuestionSummary[]>(
    () => getReviewQueue(state, questions),
    [state, questions],
  );

  const continueLearning = useMemo<PracticeSuggestion>(
    () => getContinueLearningSuggestion(state, questions),
    [state, questions],
  );

  const recommended = useMemo<PracticeSuggestion>(
    () => getRecommendedSuggestion(state, questions, weakestTopics),
    [questions, state, weakestTopics],
  );

  return {
    ready,
    overall,
    tagStats,
    dailyActivity,
    weakestTopics,
    topicMastery,
    reviewQueue,
    continueLearning,
    recommended,
  };
}
