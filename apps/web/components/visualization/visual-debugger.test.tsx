import { act, fireEvent, render, screen } from '@testing-library/react';
import type * as React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReplayStep } from '@/lib/visualization/replay-engine';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: { count?: number }) =>
    key === 'stepsCount' ? `${values?.count ?? 0} STEPS` : key,
}));

vi.mock('motion/react', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({
      children,
      initial: _initial,
      animate: _animate,
      exit: _exit,
      transition: _transition,
      layout: _layout,
      ...props
    }: React.ComponentProps<'div'> & {
      initial?: unknown;
      animate?: unknown;
      exit?: unknown;
      transition?: unknown;
      layout?: unknown;
    }) => <div {...props}>{children}</div>,
  },
}));

vi.mock('@/lib/visualization/replay-engine', () => ({
  buildEnhancedReplaySteps: vi.fn(),
}));

vi.mock('@/lib/visualization/playback-speed', async () => {
  const actual = await vi.importActual<typeof import('@/lib/visualization/playback-speed')>(
    '@/lib/visualization/playback-speed',
  );

  return {
    ...actual,
    getReplayStepDelay: vi.fn(actual.getReplayStepDelay),
  };
});

vi.mock('./debugger-call-stack', () => ({
  DebuggerCallStack: () => <div>call-stack</div>,
}));

vi.mock('./debugger-code-panel', () => ({
  DebuggerCodePanel: ({ currentLine }: { currentLine?: number }) => (
    <div data-testid="current-line">{currentLine ?? 'none'}</div>
  ),
}));

vi.mock('./debugger-queues', () => ({
  DebuggerQueues: () => <div>queues</div>,
}));

vi.mock('./debugger-web-apis', () => ({
  DebuggerWebApis: () => <div>web-apis</div>,
}));

vi.mock('./debugger-event-loop', () => ({
  DebuggerEventLoop: () => <div>event-loop</div>,
}));

import { getReplayStepDelay } from '@/lib/visualization/playback-speed';
import { buildEnhancedReplaySteps } from '@/lib/visualization/replay-engine';
import { VisualDebugger } from './visual-debugger';

const buildEnhancedReplayStepsMock = vi.mocked(buildEnhancedReplaySteps);
const getReplayStepDelayMock = vi.mocked(getReplayStepDelay);

function createReplayStep(index: number, durationMs = 1000) {
  return {
    key: `step-${index}`,
    event: {
      id: index,
      at: index * 10,
      kind: 'sync',
      phase: 'start',
      label: `step-${index}`,
    },
    title: `Step ${index}`,
    caption: `Caption ${index}`,
    badge: `Badge ${index}`,
    badgeColor: 'pink',
    durationMs,
    atOffset: index * 10,
    currentLine: index,
    snapshot: {
      callStack: [],
      webApis: [],
      microtaskQueue: [],
      taskQueue: [],
      console: [],
      eventLoopPhase: 'idle',
    },
  } satisfies ReplayStep;
}

describe('VisualDebugger playback', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    HTMLElement.prototype.scrollIntoView = vi.fn();

    buildEnhancedReplayStepsMock.mockReset();
    getReplayStepDelayMock.mockReset();
    buildEnhancedReplayStepsMock.mockReturnValue([
      createReplayStep(1),
      createReplayStep(2),
      createReplayStep(3),
    ]);
    getReplayStepDelayMock.mockImplementation((_durationMs: number, speed: string) => {
      if (speed === 'fast') return 60;
      if (speed === 'slow') return 180;
      return 120;
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('uses replay speed to drive autoplay and stops on the final step', async () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );

    render(<VisualDebugger code="console.log('x')" enhancedTimeline={[]} />);

    fireEvent.click(screen.getByTitle('Play'));

    await act(async () => {});
    expect(getReplayStepDelayMock).toHaveBeenCalledWith(1000, 'normal');

    await act(async () => {
      vi.advanceTimersByTime(120);
    });

    expect(screen.getByTestId('current-line')).toHaveTextContent('2');

    fireEvent.click(screen.getByRole('radio', { name: 'Fast' }));

    await act(async () => {});
    expect(getReplayStepDelayMock).toHaveBeenCalledWith(1000, 'fast');

    await act(async () => {
      vi.advanceTimersByTime(60);
    });

    expect(screen.getByTestId('current-line')).toHaveTextContent('3');
    expect(screen.getByTitle('Play')).toBeEnabled();
  });

  it('disables playback controls when reduced motion is preferred', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation(() => ({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );

    render(<VisualDebugger code="console.log('x')" enhancedTimeline={[]} />);

    expect(screen.getByRole('radio', { name: 'Slow' })).toBeDisabled();
    expect(screen.getByRole('radio', { name: 'Normal' })).toBeDisabled();
    expect(screen.getByRole('radio', { name: 'Fast' })).toBeDisabled();
    expect(screen.getByTitle('Play')).toBeDisabled();
    expect(getReplayStepDelayMock).not.toHaveBeenCalled();
  });
});
