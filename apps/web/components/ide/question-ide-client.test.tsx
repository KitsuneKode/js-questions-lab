import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type * as React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    prefetch: vi.fn(),
    push: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('motion/react', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: React.ComponentProps<'div'>) => <div {...props}>{children}</div>,
  },
}));

vi.mock('streamdown', () => ({
  Streamdown: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/editor/monaco-code-editor', () => ({
  MonacoCodeEditor: ({ value }: { value: string }) => <pre>{value}</pre>,
}));

vi.mock('@/components/ide/dom-event-simulator', () => ({
  DomEventSimulator: () => <div>dom-simulator</div>,
}));

vi.mock('@/components/ide/keyboard-hint-bar', () => ({
  KeyboardHintBar: () => <div>keyboard-hints</div>,
}));

vi.mock('@/components/ide/resources-panel', () => ({
  ResourcesPanel: () => <div>resources</div>,
}));

vi.mock('@/components/intent-prefetch-link', () => ({
  IntentPrefetchLink: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('@/components/scratchpad/scratchpad-context', () => ({
  useScratchpad: () => ({
    openScratchpad: vi.fn(),
  }),
}));

vi.mock('@/components/terminal/terminal-output', () => ({
  TerminalOutput: ({
    logs,
    emptyMessage,
  }: {
    logs: Array<{ content: string }>;
    emptyMessage?: string;
  }) => <div>{logs.length > 0 ? logs.map((log) => log.content).join('\n') : emptyMessage}</div>,
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }: React.ComponentProps<'span'>) => (
    <span {...props}>{children}</span>
  ),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: React.ComponentProps<'button'>) => (
    <button type="button" {...props}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/command', () => ({
  Command: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CommandDialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CommandEmpty: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CommandGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CommandInput: ({
    value,
    onValueChange,
    placeholder,
  }: {
    value?: string;
    onValueChange?: (value: string) => void;
    placeholder?: string;
  }) => (
    <input
      aria-label={placeholder ?? 'command-input'}
      value={value}
      onChange={(event) => onValueChange?.(event.target.value)}
    />
  ),
  CommandItem: ({
    children,
    onSelect,
  }: {
    children: React.ReactNode;
    onSelect?: (value: string) => void;
  }) => (
    <button type="button" onClick={() => onSelect?.('')}>
      {children}
    </button>
  ),
  CommandList: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  VisuallyHidden: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick }: React.ComponentProps<'button'>) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
  DropdownMenuSeparator: () => <hr />,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/ui/resizable-panel', () => ({
  ResizableHandle: () => <div />,
  ResizablePanel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ResizablePanelGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/visualization/timeline-chart', () => ({
  TimelineChart: () => <div>timeline</div>,
}));

vi.mock('@/components/visualization/visual-debugger', () => ({
  VisualDebugger: () => <div>visual-debugger</div>,
}));

vi.mock('@/lib/content/query', () => ({
  applyServerFilters: (items: unknown[]) => items,
  applyStatusFilter: (items: unknown[]) => items,
  buildQuestionScopeQuery: () => '',
  parseQuestionScope: () => ({
    status: 'all',
  }),
}));

vi.mock('@/lib/keyboard/use-question-keyboard', () => ({
  useQuestionKeyboard: () => {},
}));

vi.mock('@/lib/progress/progress-context', () => ({
  useProgress: () => ({
    state: { questions: {} },
    ready: true,
  }),
}));

vi.mock('@/lib/progress/section-progress-store', () => {
  const state = {
    sections: {} as Record<
      string,
      {
        totalQuestions: number;
        answeredQuestions: number;
        correctAnswers: number;
        masteryLevel: 'not_started' | 'learning' | 'practicing' | 'mastered';
        lastPracticedAt?: number;
      }
    >,
    updatedAt: Date.now(),
    updateSection: vi.fn(),
    markQuestionAnswered: vi.fn(),
    getSectionProgress: vi.fn(),
    getAllSections: vi.fn(() => ({})),
    resetSection: vi.fn(),
    resetAll: vi.fn(),
  };
  const useSectionProgressStore = ((selector: (value: typeof state) => unknown) =>
    selector(
      state,
    )) as typeof import('@/lib/progress/section-progress-store').useSectionProgressStore;
  useSectionProgressStore.getState = () => state;

  return {
    useSectionProgressStore,
  };
});

vi.mock('@/lib/progress/use-question-progress', () => ({
  useQuestionProgress: () => ({
    item: { bookmarked: false },
    saveAttempt: vi.fn(),
    toggleBookmark: vi.fn(),
    saveSelfGrade: vi.fn(),
  }),
}));

vi.mock('@/lib/run/sandbox', () => ({
  runJavaScript: vi.fn(),
}));

import { runJavaScript } from '@/lib/run/sandbox';
import { QuestionIDEClient } from './question-ide-client';

const runJavaScriptMock = vi.mocked(runJavaScript);

const baseQuestion = {
  id: 2,
  slug: 'whats-the-output',
  locale: 'en',
  title: "What's the output?",
  promptMarkdown: 'Choose the correct answer.',
  codeBlocks: [
    {
      id: 'code-1',
      order: 0,
      language: 'javascript',
      code: `
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 1);
}

for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 1);
}
      `.trim(),
    },
  ],
  explanationCodeBlocks: [],
  options: [
    { key: 'A' as const, text: '0 1 2 and 0 1 2' },
    { key: 'B' as const, text: '0 1 2 and 3 3 3' },
    { key: 'C' as const, text: '3 3 3 and 0 1 2' },
    { key: 'D' as const, text: '3 3 3 and 3 3 3' },
  ],
  correctOption: 'C' as const,
  explanationMarkdown: 'Because `var` is function-scoped and `let` is block-scoped.',
  images: [],
  tags: ['scope'],
  difficulty: 'beginner' as const,
  runnable: true,
  runtime: { kind: 'javascript' as const },
  resources: [],
  source: {
    startLineHint: null,
  },
};

describe('QuestionIDEClient autorun', () => {
  beforeEach(() => {
    runJavaScriptMock.mockReset();
    runJavaScriptMock.mockResolvedValue({
      logs: ['3', '3', '3', '0', '1', '2'],
      errors: [],
      timeline: [],
      enhancedTimeline: [],
    });
  });

  it('autoruns the javascript snippet after selecting an option', async () => {
    render(<QuestionIDEClient question={baseQuestion} locale="en" />);

    fireEvent.click(screen.getByRole('button', { name: /3 3 3 and 0 1 2/i }));

    await waitFor(() => {
      expect(runJavaScriptMock).toHaveBeenCalledTimes(1);
    });

    expect(runJavaScriptMock).toHaveBeenCalledWith(baseQuestion.codeBlocks[0]?.code, {
      enableTracing: true,
    });
    expect(screen.getByTestId('question-terminal')).toHaveTextContent('3');
  });

  it('autoruns after submitting a recall answer', async () => {
    render(<QuestionIDEClient question={baseQuestion} locale="en" />);

    fireEvent.click(screen.getByRole('button', { name: 'hardMode' }));
    fireEvent.change(screen.getByPlaceholderText('typeOutput'), {
      target: { value: '3 3 3 and 0 1 2' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'submitAnswer' }));

    await waitFor(() => {
      expect(runJavaScriptMock).toHaveBeenCalledTimes(1);
    });
  });
});
