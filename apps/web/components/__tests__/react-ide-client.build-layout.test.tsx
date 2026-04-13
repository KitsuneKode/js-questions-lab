import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactQuestion } from '@/lib/content/types';

const {
  sandpackState,
  saveAttemptMock,
  saveSelfGradeMock,
  sandpackProviderMock,
  sandpackPreviewMock,
} = vi.hoisted(() => ({
  sandpackState: {
    activeFile: '/useToggle.ts',
    files: {
      '/App.tsx': { code: 'export default function App(){ return null; }' },
      '/useToggle.ts': {
        code: 'export function useToggle(){ return [false, () => {}] as const; }',
      },
    },
    updateFile: vi.fn(),
    setActiveFile: vi.fn(),
  },
  saveAttemptMock: vi.fn(),
  saveSelfGradeMock: vi.fn(),
  sandpackProviderMock: vi.fn(),
  sandpackPreviewMock: vi.fn(),
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

vi.mock('@codesandbox/sandpack-react', () => ({
  SandpackProvider: ({ children, ...props }: { children: ReactNode }) => {
    sandpackProviderMock(props);
    return <div data-testid="sandpack-provider">{children}</div>;
  },
  SandpackFileExplorer: () => <div data-testid="sandpack-file-explorer" />,
  SandpackPreview: (props: unknown) => {
    sandpackPreviewMock(props);
    return <div data-testid="sandpack-preview" />;
  },
  SandpackConsole: () => <div data-testid="sandpack-console" />,
  useSandpack: () => ({ sandpack: sandpackState }),
}));

vi.mock('@/components/editor/monaco-code-editor', () => ({
  MonacoCodeEditor: () => <div data-testid="monaco-editor" />,
}));

vi.mock('@/components/ui/resizable-panel', () => ({
  ResizableHandle: () => <div data-testid="resizable-handle" />,
  ResizablePanel: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  ResizablePanelGroup: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ide/resources-panel', () => ({
  ResourcesPanel: () => <div data-testid="resources-panel" />,
}));

vi.mock('@/lib/progress/progress-context', () => ({
  useProgress: () => ({
    state: { version: 2, questions: {} },
    reactState: { version: 1, questions: {} },
    ready: true,
    syncStatus: 'idle' as const,
    saveAttempt: saveAttemptMock,
    saveSelfGrade: saveSelfGradeMock,
    saveReactAttempt: saveAttemptMock,
    saveReactSelfGrade: saveSelfGradeMock,
    toggleBookmark: vi.fn(),
    xpState: {
      version: 1,
      totalXP: 0,
      lastEarnedDate: null,
      events: [],
    },
    streakState: {
      version: 1,
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: null,
    },
  }),
}));

import { ReactIDEClient } from '@/components/react-ide/react-ide-client';

const question: ReactQuestion = {
  id: 'react-toggle',
  title: 'Build a useToggle Hook',
  difficulty: 'beginner',
  tags: ['hooks', 'state'],
  category: 'hook',
  prompt: 'Build a toggle hook.',
  context: 'Custom hooks are reusable logic.',
  starterCode: {
    'App.tsx': 'export default function App(){ return null; }',
    'useToggle.ts': 'export function useToggle(){ return [false, () => {}] as const; }',
  },
  entryFile: 'useToggle.ts',
  solutionCode: {
    'App.tsx': 'export default function App(){ return null; }',
    'useToggle.ts': 'export function useToggle(){ return [true, () => {}] as const; }',
  },
  previewVisible: true,
  sandpackTemplate: 'react-ts',
  resources: [],
};

describe('ReactIDEClient build layout', () => {
  beforeEach(() => {
    sandpackState.activeFile = '/useToggle.ts';
    sandpackState.updateFile.mockReset();
    sandpackState.setActiveFile.mockReset();
    saveAttemptMock.mockReset();
    saveSelfGradeMock.mockReset();
    sandpackProviderMock.mockReset();
    sandpackPreviewMock.mockReset();
  });

  it('renders editor, preview, and console in build split mode', () => {
    render(<ReactIDEClient question={question} />);

    fireEvent.click(screen.getByRole('button', { name: /Open Workbench/i }));

    expect(screen.getByTestId('sandpack-file-explorer')).toBeInTheDocument();
    expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    expect(screen.getByTestId('sandpack-preview')).toBeInTheDocument();
    expect(screen.getByTestId('sandpack-console')).toBeInTheDocument();
  });

  it('injects preview base styles and hides the open-in-codesandbox action', () => {
    render(<ReactIDEClient question={question} />);

    const providerProps = sandpackProviderMock.mock.calls[0]?.[0] as {
      files: Record<string, { code: string }>;
    };

    expect(providerProps.files['/styles.css']?.code).toContain('background-color: #ffffff');
    expect(providerProps.files['/styles.css']?.code).toContain('.h-64 { height: 16rem; }');
    expect(providerProps.files['/useToggle.ts']?.code).toContain("import './styles.css';");

    fireEvent.click(screen.getByRole('button', { name: /Open Workbench/i }));

    const previewProps = sandpackPreviewMock.mock.calls[0]?.[0] as {
      showOpenInCodeSandbox?: boolean;
    };

    expect(previewProps.showOpenInCodeSandbox).toBe(false);
  });
});
