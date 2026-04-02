import { z } from 'zod/v4';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * Zod schema for section progress data
 * Tracks user progress across different question categories/tags
 */
const SectionProgressSchema = z.object({
  // Map of tag -> progress data
  sections: z.record(
    z.string(), // tag name
    z.object({
      totalQuestions: z.number().int().min(0),
      answeredQuestions: z.number().int().min(0),
      correctAnswers: z.number().int().min(0),
      lastPracticedAt: z.number().optional(), // timestamp
      masteryLevel: z.enum(['not_started', 'learning', 'practicing', 'mastered']),
    }),
  ),
  // Last updated timestamp
  updatedAt: z.number(),
});

export type SectionProgressData = z.infer<typeof SectionProgressSchema>;

export type MasteryLevel = SectionProgressData['sections'][string]['masteryLevel'];

interface SectionProgressState {
  sections: SectionProgressData['sections'];
  updatedAt: number;
  preferredMode: 'quiz' | 'hard';

  // Actions
  updateSection: (tag: string, updates: Partial<SectionProgressData['sections'][string]>) => void;
  markQuestionAnswered: (tag: string, isCorrect: boolean) => void;
  getSectionProgress: (tag: string) => SectionProgressData['sections'][string] | undefined;
  getAllSections: () => SectionProgressData['sections'];
  resetSection: (tag: string) => void;
  resetAll: () => void;
  setPreferredMode: (mode: 'quiz' | 'hard') => void;
}

const initialState: Omit<
  SectionProgressState,
  | 'updatedAt'
  | 'updateSection'
  | 'markQuestionAnswered'
  | 'getSectionProgress'
  | 'getAllSections'
  | 'resetSection'
  | 'resetAll'
  | 'setPreferredMode'
> = {
  sections: {},
  preferredMode: 'quiz',
};

export const useSectionProgressStore = create<SectionProgressState>()(
  persist(
    (set, get) => ({
      ...initialState,
      updatedAt: Date.now(),

      setPreferredMode: (mode) => {
        set({ preferredMode: mode, updatedAt: Date.now() });
      },

      updateSection: (tag, updates) => {
        set((state) => {
          const currentSection = state.sections[tag] || {
            totalQuestions: 0,
            answeredQuestions: 0,
            correctAnswers: 0,
            masteryLevel: 'not_started' as MasteryLevel,
          };

          const updatedSection = {
            ...currentSection,
            ...updates,
          };

          // Auto-calculate mastery level if not provided
          if (!updates.masteryLevel) {
            // Use answeredQuestions as denominator (actual accuracy), not totalQuestions
            const accuracy =
              updatedSection.answeredQuestions > 0
                ? updatedSection.correctAnswers / updatedSection.answeredQuestions
                : 0;
            const completionRatio =
              updatedSection.totalQuestions > 0
                ? updatedSection.answeredQuestions / updatedSection.totalQuestions
                : 0;

            if (completionRatio === 0) {
              updatedSection.masteryLevel = 'not_started';
            } else if (accuracy < 0.5) {
              updatedSection.masteryLevel = 'learning';
            } else if (accuracy < 0.8) {
              updatedSection.masteryLevel = 'practicing';
            } else if (completionRatio >= 0.8 && accuracy >= 0.8) {
              // Require both high accuracy AND high completion for mastered
              updatedSection.masteryLevel = 'mastered';
            } else {
              updatedSection.masteryLevel = 'practicing';
            }
          }

          return {
            sections: {
              ...state.sections,
              [tag]: updatedSection,
            },
            updatedAt: Date.now(),
          };
        });
      },

      markQuestionAnswered: (tag, isCorrect) => {
        set((state) => {
          const currentSection = state.sections[tag] || {
            totalQuestions: 0,
            answeredQuestions: 0,
            correctAnswers: 0,
            masteryLevel: 'not_started' as MasteryLevel,
          };

          const updatedSection = {
            ...currentSection,
            answeredQuestions: currentSection.answeredQuestions + 1,
            correctAnswers: isCorrect
              ? currentSection.correctAnswers + 1
              : currentSection.correctAnswers,
            lastPracticedAt: Date.now(),
          };

          // Calculate mastery level using correct formula (accuracy / answeredQuestions)
          const accuracy =
            updatedSection.answeredQuestions > 0
              ? updatedSection.correctAnswers / updatedSection.answeredQuestions
              : 0;
          const completionRatio =
            updatedSection.totalQuestions > 0
              ? updatedSection.answeredQuestions / updatedSection.totalQuestions
              : 0;

          if (completionRatio === 0) {
            updatedSection.masteryLevel = 'not_started';
          } else if (accuracy < 0.5) {
            updatedSection.masteryLevel = 'learning';
          } else if (accuracy < 0.8) {
            updatedSection.masteryLevel = 'practicing';
          } else if (completionRatio >= 0.8 && accuracy >= 0.8) {
            updatedSection.masteryLevel = 'mastered';
          } else {
            updatedSection.masteryLevel = 'practicing';
          }

          return {
            sections: {
              ...state.sections,
              [tag]: updatedSection,
            },
            updatedAt: Date.now(),
          };
        });
      },

      getSectionProgress: (tag) => {
        return get().sections[tag];
      },

      getAllSections: () => {
        return get().sections;
      },

      resetSection: (tag) => {
        set((state) => {
          const newSections = { ...state.sections };
          delete newSections[tag];
          return {
            sections: newSections,
            updatedAt: Date.now(),
          };
        });
      },

      resetAll: () => {
        set({
          sections: {},
          updatedAt: Date.now(),
        });
      },
    }),
    {
      name: 'section-progress-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sections: state.sections,
        updatedAt: state.updatedAt,
        preferredMode: state.preferredMode,
      }),
      version: 1,
    },
  ),
);

// Helper hook for getting section statistics
export function useSectionStats(tag: string) {
  const section = useSectionProgressStore((state) => state.sections[tag]);

  if (!section) {
    return {
      totalQuestions: 0,
      answeredQuestions: 0,
      correctAnswers: 0,
      accuracy: 0,
      masteryLevel: 'not_started' as MasteryLevel,
      lastPracticedAt: undefined,
      completionPercentage: 0,
    };
  }

  const accuracy =
    section.answeredQuestions > 0 ? (section.correctAnswers / section.answeredQuestions) * 100 : 0;

  const completionPercentage =
    section.totalQuestions > 0 ? (section.answeredQuestions / section.totalQuestions) * 100 : 0;

  return {
    ...section,
    accuracy,
    completionPercentage,
  };
}

// Helper to get all sections with stats
export function useAllSectionStats() {
  const sections = useSectionProgressStore((state) => state.sections);

  return Object.entries(sections).map(([tag, data]) => {
    const accuracy =
      data.answeredQuestions > 0 ? (data.correctAnswers / data.answeredQuestions) * 100 : 0;

    const completionPercentage =
      data.totalQuestions > 0 ? (data.answeredQuestions / data.totalQuestions) * 100 : 0;

    return {
      tag,
      ...data,
      accuracy,
      completionPercentage,
    };
  });
}
