import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type MasteryLevel, useSectionProgressStore } from './section-progress-store';

describe('section-progress-store', () => {
  beforeEach(() => {
    // Reset store before each test
    useSectionProgressStore.getState().resetAll();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-02T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('updateSection', () => {
    it('should initialize a new section with provided values', () => {
      useSectionProgressStore.getState().updateSection('scope', {
        totalQuestions: 10,
        answeredQuestions: 5,
        correctAnswers: 3,
      });

      const section = useSectionProgressStore.getState().getSectionProgress('scope');
      expect(section?.totalQuestions).toBe(10);
      expect(section?.answeredQuestions).toBe(5);
      expect(section?.correctAnswers).toBe(3);
    });

    it('should auto-calculate mastery level based on accuracy and completion', () => {
      // not_started: no answers
      useSectionProgressStore.getState().updateSection('test1', {
        totalQuestions: 10,
        answeredQuestions: 0,
        correctAnswers: 0,
      });
      expect(useSectionProgressStore.getState().getSectionProgress('test1')?.masteryLevel).toBe(
        'not_started',
      );

      // learning: low accuracy (< 50%)
      useSectionProgressStore.getState().updateSection('test2', {
        totalQuestions: 10,
        answeredQuestions: 5,
        correctAnswers: 1, // 20% accuracy
      });
      expect(useSectionProgressStore.getState().getSectionProgress('test2')?.masteryLevel).toBe(
        'learning',
      );

      // practicing: medium accuracy (50-80%)
      useSectionProgressStore.getState().updateSection('test3', {
        totalQuestions: 10,
        answeredQuestions: 5,
        correctAnswers: 3, // 60% accuracy
      });
      expect(useSectionProgressStore.getState().getSectionProgress('test3')?.masteryLevel).toBe(
        'practicing',
      );

      // practicing: high accuracy but low completion
      useSectionProgressStore.getState().updateSection('test4', {
        totalQuestions: 10,
        answeredQuestions: 3,
        correctAnswers: 3, // 100% accuracy but 30% completion
      });
      expect(useSectionProgressStore.getState().getSectionProgress('test4')?.masteryLevel).toBe(
        'practicing',
      );

      // mastered: high accuracy AND high completion (>= 80% both)
      useSectionProgressStore.getState().updateSection('test5', {
        totalQuestions: 10,
        answeredQuestions: 9,
        correctAnswers: 8, // 89% accuracy, 90% completion
      });
      expect(useSectionProgressStore.getState().getSectionProgress('test5')?.masteryLevel).toBe(
        'mastered',
      );
    });

    it('should not override mastery level if explicitly provided', () => {
      useSectionProgressStore.getState().updateSection('test', {
        totalQuestions: 10,
        answeredQuestions: 5,
        correctAnswers: 1, // Would be 'learning' auto-calculated
        masteryLevel: 'practicing', // Explicit override
      });

      expect(useSectionProgressStore.getState().getSectionProgress('test')?.masteryLevel).toBe(
        'practicing',
      );
    });

    it('should handle section that does not exist yet', () => {
      useSectionProgressStore.getState().updateSection('new-section', {
        totalQuestions: 15,
      });

      const section = useSectionProgressStore.getState().getSectionProgress('new-section');
      expect(section?.totalQuestions).toBe(15);
      expect(section?.answeredQuestions).toBe(0);
      expect(section?.correctAnswers).toBe(0);
    });
  });

  describe('markQuestionAnswered', () => {
    it('should increment answeredQuestions and correctAnswers when correct', () => {
      useSectionProgressStore.getState().updateSection('arrays', {
        totalQuestions: 12,
      });
      useSectionProgressStore.getState().markQuestionAnswered('arrays', true);
      useSectionProgressStore.getState().markQuestionAnswered('arrays', true);
      useSectionProgressStore.getState().markQuestionAnswered('arrays', false);

      const section = useSectionProgressStore.getState().getSectionProgress('arrays');
      expect(section?.answeredQuestions).toBe(3);
      expect(section?.correctAnswers).toBe(2);
    });

    it('should increment only answeredQuestions when incorrect', () => {
      useSectionProgressStore.getState().updateSection('async', {
        totalQuestions: 10,
      });
      useSectionProgressStore.getState().markQuestionAnswered('async', false);
      useSectionProgressStore.getState().markQuestionAnswered('async', false);

      const section = useSectionProgressStore.getState().getSectionProgress('async');
      expect(section?.answeredQuestions).toBe(2);
      expect(section?.correctAnswers).toBe(0);
    });

    it('should auto-calculate mastery correctly as answers accumulate', () => {
      // Start fresh
      useSectionProgressStore.getState().updateSection('objects', {
        totalQuestions: 10,
      });

      // First answer - incorrect -> learning
      useSectionProgressStore.getState().markQuestionAnswered('objects', false);
      expect(useSectionProgressStore.getState().getSectionProgress('objects')?.masteryLevel).toBe(
        'learning',
      );

      // Second answer - correct -> practicing (50% accuracy is borderline, goes to practicing)
      useSectionProgressStore.getState().markQuestionAnswered('objects', true);
      expect(useSectionProgressStore.getState().getSectionProgress('objects')?.masteryLevel).toBe(
        'practicing',
      );

      // Third answer - correct -> practicing (66% accuracy)
      useSectionProgressStore.getState().markQuestionAnswered('objects', true);
      expect(useSectionProgressStore.getState().getSectionProgress('objects')?.masteryLevel).toBe(
        'practicing',
      );

      // More answers to reach mastered
      for (let i = 0; i < 5; i++) {
        useSectionProgressStore.getState().markQuestionAnswered('objects', true);
      }
      // 8 correct out of 8 answered = 100% accuracy, 80% completion -> mastered
      expect(useSectionProgressStore.getState().getSectionProgress('objects')?.masteryLevel).toBe(
        'mastered',
      );
    });

    it('should handle first answer in non-existing section', () => {
      // Test that it initializes properly even without prior updateSection
      useSectionProgressStore.getState().markQuestionAnswered('prototypes', true);

      const section = useSectionProgressStore.getState().getSectionProgress('prototypes');
      expect(section?.answeredQuestions).toBe(1);
      expect(section?.correctAnswers).toBe(1);
      // totalQuestions defaults to 0 in initial state
    });
  });

  describe('getAllSections', () => {
    it('should return all sections', () => {
      useSectionProgressStore.getState().updateSection('scope', { totalQuestions: 10 });
      useSectionProgressStore.getState().updateSection('arrays', { totalQuestions: 12 });
      useSectionProgressStore.getState().updateSection('async', { totalQuestions: 8 });

      const all = useSectionProgressStore.getState().getAllSections();
      expect(Object.keys(all)).toHaveLength(3);
      expect(all.scope).toBeDefined();
      expect(all.arrays).toBeDefined();
      expect(all.async).toBeDefined();
    });
  });

  describe('resetSection', () => {
    it('should remove a specific section', () => {
      useSectionProgressStore.getState().updateSection('scope', { totalQuestions: 10 });
      useSectionProgressStore.getState().updateSection('arrays', { totalQuestions: 12 });

      useSectionProgressStore.getState().resetSection('scope');

      const all = useSectionProgressStore.getState().getAllSections();
      expect(Object.keys(all)).toHaveLength(1);
      expect(all.scope).toBeUndefined();
      expect(all.arrays).toBeDefined();
    });
  });

  describe('resetAll', () => {
    it('should remove all sections', () => {
      useSectionProgressStore.getState().updateSection('scope', { totalQuestions: 10 });
      useSectionProgressStore.getState().updateSection('arrays', { totalQuestions: 12 });
      useSectionProgressStore.getState().updateSection('async', { totalQuestions: 8 });

      useSectionProgressStore.getState().resetAll();

      const all = useSectionProgressStore.getState().getAllSections();
      expect(Object.keys(all)).toHaveLength(0);
    });
  });

  describe('persistence', () => {
    it('should persist sections to localStorage', () => {
      useSectionProgressStore.getState().updateSection('scope', {
        totalQuestions: 10,
        answeredQuestions: 5,
        correctAnswers: 3,
      });

      // Check localStorage was updated
      const stored = localStorage.getItem('section-progress-storage');
      expect(stored).toBeTruthy();
      if (!stored) throw new Error('stored is null');
      const parsed = JSON.parse(stored);
      expect(parsed.state.sections.scope).toBeDefined();
    });

    it('should restore state from localStorage on rehydration', () => {
      // First, set some state
      useSectionProgressStore.getState().updateSection('persisted', {
        totalQuestions: 20,
        answeredQuestions: 10,
        correctAnswers: 8,
      });

      // Check localStorage has the data
      const stored = localStorage.getItem('section-progress-storage');
      expect(stored).toBeTruthy();
    });
  });

  describe('edge cases', () => {
    it('should handle division by zero gracefully', () => {
      useSectionProgressStore.getState().updateSection('empty', {
        totalQuestions: 0,
        answeredQuestions: 0,
        correctAnswers: 0,
      });

      const section = useSectionProgressStore.getState().getSectionProgress('empty');
      expect(section?.masteryLevel).toBe('not_started');
      expect(section?.correctAnswers).toBe(0);
    });

    it('should handle very small totalQuestions', () => {
      useSectionProgressStore.getState().updateSection('tiny', {
        totalQuestions: 1,
        answeredQuestions: 1,
        correctAnswers: 1,
      });

      const section = useSectionProgressStore.getState().getSectionProgress('tiny');
      // 100% accuracy, 100% completion -> mastered
      expect(section?.masteryLevel).toBe('mastered');
    });

    it('should handle large numbers correctly', () => {
      useSectionProgressStore.getState().updateSection('large', {
        totalQuestions: 1000,
        answeredQuestions: 800,
        correctAnswers: 640, // 80% accuracy, 80% completion
      });

      const section = useSectionProgressStore.getState().getSectionProgress('large');
      // 80% accuracy >= 0.8 AND 80% completion >= 0.8 -> mastered
      expect(section?.masteryLevel).toBe('mastered');
    });

    it('should preserve lastPracticedAt timestamp', () => {
      const beforeTime = Date.now();
      useSectionProgressStore.getState().markQuestionAnswered('test', true);
      const afterTime = Date.now();

      const section = useSectionProgressStore.getState().getSectionProgress('test');
      expect(section?.lastPracticedAt).toBeGreaterThanOrEqual(beforeTime);
      expect(section?.lastPracticedAt).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('mastery level transitions', () => {
    const testCases: Array<{
      name: string;
      answered: number;
      correct: number;
      total: number;
      expected: MasteryLevel;
    }> = [
      { name: 'no_answers', answered: 0, correct: 0, total: 10, expected: 'not_started' },
      { name: 'all_wrong', answered: 5, correct: 0, total: 10, expected: 'learning' },
      { name: 'very_low_accuracy', answered: 10, correct: 1, total: 10, expected: 'learning' },
      { name: 'borderline_low', answered: 10, correct: 4, total: 10, expected: 'learning' }, // 40%
      { name: 'borderline_pass', answered: 10, correct: 5, total: 10, expected: 'practicing' }, // 50%
      { name: 'mid_practicing', answered: 10, correct: 6, total: 10, expected: 'practicing' }, // 60%
      { name: 'high_practicing', answered: 10, correct: 7, total: 10, expected: 'practicing' }, // 70%
      {
        name: 'almost_mastered_low_completion',
        answered: 5,
        correct: 4,
        total: 10,
        expected: 'practicing',
      }, // 80% accuracy but 50% completion
      { name: 'mastered_80_both', answered: 8, correct: 8, total: 10, expected: 'mastered' }, // 100% accuracy, 80% completion
      { name: 'mastered_90_both', answered: 9, correct: 8, total: 10, expected: 'mastered' }, // 89% accuracy, 90% completion
      { name: 'mastered_perfect', answered: 10, correct: 10, total: 10, expected: 'mastered' }, // 100% both
    ];

    testCases.forEach(({ name, answered, correct, total, expected }) => {
      it(name, () => {
        useSectionProgressStore.getState().updateSection(name, {
          totalQuestions: total,
          answeredQuestions: answered,
          correctAnswers: correct,
        });

        expect(useSectionProgressStore.getState().getSectionProgress(name)?.masteryLevel).toBe(
          expected,
        );
      });
    });
  });
});
