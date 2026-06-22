import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { QuestionDiscoveryItem } from '@/lib/content/types';

const {
  runSandboxMock,
  saveAttemptMock,
  updateSectionMock,
  markQuestionAnsweredMock,
  saveSelfGradeMock,
  toggleBookmarkMock,
} = vi.hoisted(() => ({
  runSandboxMock: vi.fn(),
  saveAttemptMock: vi.fn(),
  updateSectionMock: vi.fn(),
  markQuestionAnsweredMock: vi.fn(),
  saveSelfGradeMock: vi.fn(),
  toggleBookmarkMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ prefetch: vi.fn(), push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('motion/react', () => {
  const MotionDiv = ({ children }: { children: ReactNode }) => <div>{children}</div>;
  return {
    AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
    motion: {
      div: MotionDiv,
    },
  };
});

vi.mock('streamdown', () => ({
  Streamdown: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/editor/monaco-code-editor', () => ({
  MonacoCodeEditor: () => <div data-testid="monaco-editor" />,
}));

vi.mock('@/components/ide/dom-event-simulator', () => ({
  DomEventSimulator: () => <div data-testid="dom-event-simulator" />,
}));

vi.mock('@/components/ide/keyboard-hint-bar', () => ({
  KeyboardHintBar: () => <div data-testid="keyboard-hint-bar" />,
}));

vi.mock('@/components/ide/resources-panel', () => ({
  ResourcesPanel: () => <div data-testid="resources-panel" />,
}));

vi.mock('@/components/intent-prefetch-link', () => ({
  IntentPrefetchLink: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/scratchpad/scratchpad-context', () => ({
  useScratchpad: () => ({ openScratchpad: vi.fn() }),
}));

vi.mock('@/components/terminal/terminal-output', () => ({
  TerminalOutput: () => <div data-testid="terminal-output" />,
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    disabled,
    className,
  }: {
    children: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
  }) => (
    <button type="button" onClick={onClick} disabled={disabled} className={className}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/command', () => ({
  Command: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CommandDialog: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CommandEmpty: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CommandGroup: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CommandInput: () => <input />,
  CommandItem: ({ children, onSelect }: { children: ReactNode; onSelect?: () => void }) => (
    <button type="button" onClick={onSelect}>
      {children}
    </button>
  ),
  CommandList: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogDescription: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogTrigger: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  VisuallyHidden: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick }: { children: ReactNode; onClick?: () => void }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
  DropdownMenuSeparator: () => <hr />,
  DropdownMenuTrigger: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/resizable-panel', () => ({
  ResizableHandle: () => <div />,
  ResizablePanel: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  ResizablePanelGroup: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/visualization/timeline-chart', () => ({
  TimelineChart: () => <div data-testid="timeline-chart" />,
}));

vi.mock('@/components/visualization/visual-debugger', () => ({
  VisualDebugger: () => <div data-testid="visual-debugger" />,
}));

vi.mock('@/lib/content/query', () => ({
  applyServerFilters: (questions: unknown[]) => questions,
  applyStatusFilter: (questions: unknown[]) => questions,
  buildQuestionScopeQuery: () => '',
  parseQuestionScope: () => ({ status: 'all' }),
}));

vi.mock('@/lib/keyboard/use-question-keyboard', () => ({
  useQuestionKeyboard: () => undefined,
}));

vi.mock('@/lib/progress/progress-context', () => ({
  useProgress: () => ({ state: { questions: {} }, ready: true }),
}));

vi.mock('@/lib/progress/section-progress-store', () => {
  const useSectionProgressStore = ((selector: (state: unknown) => unknown) =>
    selector({
      updateSection: updateSectionMock,
      markQuestionAnswered: markQuestionAnsweredMock,
    })) as unknown as ((selector: (state: unknown) => unknown) => unknown) & {
    getState: () => { sections: Record<string, unknown> };
  };
  useSectionProgressStore.getState = () => ({ sections: {} });
  return { useSectionProgressStore };
});

vi.mock('@/lib/progress/use-question-progress', () => ({
  useQuestionProgress: () => ({
    item: { bookmarked: false },
    saveAttempt: saveAttemptMock,
    toggleBookmark: toggleBookmarkMock,
    saveSelfGrade: saveSelfGradeMock,
  }),
}));

vi.mock('@/lib/run/sandbox', () => ({
  runJavaScriptInEnhancedSandbox: runSandboxMock,
}));

vi.mock('@/lib/run/terminal', () => ({
  getPrimaryErrorMessage: () => 'runner-error',
  toTerminalLogEntries: () => [],
}));

import { QuestionIDEClient } from '@/components/ide/question-ide-client';

const baseQuestion = {
  id: 1,
  title: 'Question 1',
  difficulty: 'easy',
  tags: ['scope', 'closures'],
  promptMarkdown: 'Prompt',
  explanationMarkdown: 'Explanation',
  options: [
    { key: 'A', text: 'Option A' },
    { key: 'B', text: 'Option B' },
    { key: 'C', text: 'Option C' },
    { key: 'D', text: 'Option D' },
  ],
  correctOption: 'A',
  codeBlocks: [{ language: 'javascript', code: 'console.log("ok")' }],
  runnable: true,
  resources: [],
};

const questionIndex: QuestionDiscoveryItem[] = [
  {
    id: 1,
    slug: 'question-1',
    locale: 'en',
    title: 'Question 1',
    tags: ['scope'],
    difficulty: 'beginner',
    runnable: true,
    searchText: 'question 1',
    previewCode: 'console.log("ok")',
  },
];

describe('QuestionIDEClient auto-run behavior', () => {
  beforeEach(() => {
    runSandboxMock.mockReset();
    saveAttemptMock.mockReset();
    updateSectionMock.mockReset();
    markQuestionAnsweredMock.mockReset();
    saveSelfGradeMock.mockReset();
    toggleBookmarkMock.mockReset();

    runSandboxMock.mockResolvedValue({
      logs: [],
      timeline: [],
      enhancedTimeline: [],
      errors: [],
    });
  });

  it('auto-runs once when a quiz option is selected', async () => {
    render(<QuestionIDEClient question={baseQuestion as never} questionIndex={questionIndex} />);

    fireEvent.click(screen.getByRole('button', { name: /Option A/i }));

    await waitFor(() => expect(runSandboxMock).toHaveBeenCalledTimes(1));
  });

  it('auto-runs once when recall answer is submitted', async () => {
    render(<QuestionIDEClient question={baseQuestion as never} questionIndex={questionIndex} />);

    fireEvent.click(screen.getByRole('button', { name: 'hardMode' }));
    fireEvent.change(screen.getByPlaceholderText('typeOutput'), {
      target: { value: 'option a' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'submitAnswer' }));

    await waitFor(() => expect(runSandboxMock).toHaveBeenCalledTimes(1));
  });

  it('does not auto-run for static questions', async () => {
    const staticQuestion = {
      ...baseQuestion,
      runnable: false,
      codeBlocks: [{ language: 'text', code: 'const x = 1;' }],
    };

    render(<QuestionIDEClient question={staticQuestion as never} questionIndex={questionIndex} />);

    fireEvent.click(screen.getByRole('button', { name: /Option A/i }));

    await waitFor(() => {
      expect(runSandboxMock).toHaveBeenCalledTimes(0);
    });
  });

  it('still allows manual rerun after auto-run', async () => {
    render(<QuestionIDEClient question={baseQuestion as never} questionIndex={questionIndex} />);

    fireEvent.click(screen.getByRole('button', { name: /Option A/i }));
    await waitFor(() => expect(runSandboxMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Run Code' })).toBeEnabled());

    fireEvent.click(screen.getByRole('button', { name: 'Run Code' }));

    await waitFor(() => expect(runSandboxMock).toHaveBeenCalledTimes(2));
  });
});
