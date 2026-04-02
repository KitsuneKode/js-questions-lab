import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, expect, test, vi } from 'vitest';
import { ProgressProvider, useProgress } from '../../lib/progress/progress-context';
import { useSectionProgressStore } from '../../lib/progress/section-progress-store';

// Mock tag-metadata so we don't depend on actual content
vi.mock('../../lib/progress/tag-metadata', () => ({
  getQuestionTags: vi.fn((id) => {
    if (id === 1) return ['arrays', 'scope'];
    return [];
  }),
  getTagQuestionCounts: vi.fn(() => ({
    arrays: 10,
    scope: 5,
  })),
}));

// Mock auth to avoid actual auth logic running
vi.mock('../../lib/auth-utils', () => ({
  useSafeAuth: () => ({ isSignedIn: false }),
}));

beforeEach(() => {
  useSectionProgressStore.getState().resetAll();
  localStorage.clear();
});

test('answering a question updates both ProgressContext and SectionProgressStore', () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <ProgressProvider>{children}</ProgressProvider>
  );

  const { result } = renderHook(() => useProgress(), { wrapper });

  // Initially context is ready but no attempts for question 1
  act(() => {
    // We just wait for ready
  });

  act(() => {
    result.current.saveAttempt(1, 'A', 'correct');
  });

  // Verify ProgressContext was updated
  const q1Progress = result.current.state.questions['1'];
  expect(q1Progress).toBeDefined();
  expect(q1Progress.attempts.length).toBe(1);
  expect(q1Progress.attempts[0].status).toBe('correct');

  // Verify SectionProgressStore was updated
  const sectionStore = useSectionProgressStore.getState();
  const arraysSection = sectionStore.getSectionProgress('arrays');
  const scopeSection = sectionStore.getSectionProgress('scope');

  expect(arraysSection).toBeDefined();
  expect(arraysSection?.answeredQuestions).toBe(1);
  expect(arraysSection?.correctAnswers).toBe(1);
  expect(arraysSection?.totalQuestions).toBe(10);

  expect(scopeSection).toBeDefined();
  expect(scopeSection?.answeredQuestions).toBe(1);
  expect(scopeSection?.correctAnswers).toBe(1);
  expect(scopeSection?.totalQuestions).toBe(5);
});
