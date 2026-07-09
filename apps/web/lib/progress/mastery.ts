import type { TagStats } from '@/lib/progress/analytics';
import type { ProgressState } from '@/lib/progress/storage';

/**
 * Topic mastery states from the engagement PRD (§5.4).
 * Computed from tag attempt stats — content-agnostic.
 */
export type MasteryState = 'locked' | 'exploring' | 'developing' | 'proficient' | 'mastered';

export interface TopicMastery {
  tag: string;
  state: MasteryState;
  answered: number;
  totalInCatalog: number;
  accuracy: number;
  srsReady: boolean;
}

const MASTERED_MIN_ANSWERED = 10;
const MASTERED_MIN_ACCURACY = 0.85;
const PROFICIENT_MIN_ANSWERED = 10;
const PROFICIENT_MIN_ACCURACY = 0.7;
const DEVELOPING_MIN_ANSWERED = 5;
const DEVELOPING_MIN_ACCURACY = 0.4;
const MASTERED_MIN_SRS_INTERVAL_DAYS = 14;

export function computeMasteryState(
  answered: number,
  accuracy: number,
  srsReady: boolean,
): MasteryState {
  if (answered <= 0) return 'locked';

  if (answered >= MASTERED_MIN_ANSWERED && accuracy >= MASTERED_MIN_ACCURACY && srsReady) {
    return 'mastered';
  }

  if (answered >= PROFICIENT_MIN_ANSWERED && accuracy >= PROFICIENT_MIN_ACCURACY) {
    return 'proficient';
  }

  if (answered >= DEVELOPING_MIN_ANSWERED && accuracy >= DEVELOPING_MIN_ACCURACY) {
    return 'developing';
  }

  return 'exploring';
}

function topicHasMatureSrs(
  tag: string,
  progress: ProgressState,
  questionTags: Map<number, string[]>,
): boolean {
  for (const item of Object.values(progress.questions)) {
    const tags = questionTags.get(item.questionId) ?? [];
    if (!tags.includes(tag)) continue;
    if ((item.srsData?.interval ?? 0) >= MASTERED_MIN_SRS_INTERVAL_DAYS) {
      return true;
    }
  }
  return false;
}

/**
 * Build mastery rows for every catalog tag, merging attempt stats when present.
 */
export function computeTopicMastery(
  tagStats: TagStats[],
  catalogCounts: Record<string, number>,
  progress: ProgressState,
  questionTags: Map<number, string[]>,
): TopicMastery[] {
  const statsByTag = new Map(tagStats.map((stat) => [stat.tag, stat]));
  const tags = new Set([...Object.keys(catalogCounts), ...statsByTag.keys()]);

  return Array.from(tags)
    .map((tag) => {
      const stats = statsByTag.get(tag);
      const answered = stats?.questionCount ?? 0;
      const accuracy = stats?.accuracy ?? 0;
      const srsReady = topicHasMatureSrs(tag, progress, questionTags);
      return {
        tag,
        state: computeMasteryState(answered, accuracy, srsReady),
        answered,
        totalInCatalog: catalogCounts[tag] ?? answered,
        accuracy,
        srsReady,
      };
    })
    .sort((a, b) => {
      const order: Record<MasteryState, number> = {
        mastered: 0,
        proficient: 1,
        developing: 2,
        exploring: 3,
        locked: 4,
      };
      return order[a.state] - order[b.state] || a.tag.localeCompare(b.tag);
    });
}
