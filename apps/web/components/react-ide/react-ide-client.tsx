'use client';

import {
  SandpackConsole,
  SandpackPreview,
  SandpackProvider,
  useSandpack,
} from '@codesandbox/sandpack-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { MonacoCodeEditor } from '@/components/editor/monaco-code-editor';
import { ResourcesPanel } from '@/components/ide/resources-panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ReactQuestion } from '@/lib/content/types';
import { useProgress } from '@/lib/progress/progress-context';
import type { Grade } from '@/lib/progress/srs';
import { darkForgeTheme } from './dark-forge-theme';
import { PhaseTabs, type ReactIDEPhase } from './phase-tabs';
import { SandpackFileTabs } from './sandpack-file-tabs';

interface ReactIDEClientProps {
  question: ReactQuestion;
}

function toEditorLanguage(filePath: string): 'javascript' | 'typescript' | 'html' {
  if (filePath.endsWith('.html')) return 'html';
  if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) return 'javascript';
  return 'typescript';
}

function MonacoBridge() {
  const { sandpack } = useSandpack();
  const activeFile = sandpack.activeFile;
  const code = sandpack.files[activeFile]?.code ?? '';

  return (
    <MonacoCodeEditor
      path={activeFile}
      value={code}
      language={toEditorLanguage(activeFile)}
      onChange={(value) => sandpack.updateFile(activeFile, value)}
    />
  );
}

export function ReactIDEClient({ question }: ReactIDEClientProps) {
  const [phase, setPhase] = useState<ReactIDEPhase>('read');
  const [solutionViewed, setSolutionViewed] = useState(false);
  const [hasAttempted, setHasAttempted] = useState(false);
  const { saveAttempt, saveSelfGrade, state: progressState } = useProgress();

  const existingProgress = progressState.questions[question.id];
  const isAlreadyAttempted = (existingProgress?.attempts?.length ?? 0) > 0;

  useEffect(() => {
    if (isAlreadyAttempted) {
      setHasAttempted(true);
    }
  }, [isAlreadyAttempted]);

  const handleMarkDone = useCallback(() => {
    setHasAttempted(true);
    setPhase('review');
    saveAttempt(question.id as unknown as number, null, 'correct', {
      difficulty: question.difficulty,
    });
  }, [question.id, question.difficulty, saveAttempt]);

  const handleViewSolution = useCallback(
    (updateFile: (filePath: string, code: string) => void) => {
      setSolutionViewed(true);
      setHasAttempted(true);
      setPhase('review');

      for (const [file, code] of Object.entries(question.solutionCode)) {
        updateFile(`/${file}`, code);
      }

      saveAttempt(question.id as unknown as number, null, 'incorrect', {
        difficulty: question.difficulty,
      });
    },
    [question.id, question.difficulty, question.solutionCode, saveAttempt],
  );

  const handleGrade = useCallback(
    (grade: Grade) => {
      saveSelfGrade(question.id as unknown as number, grade);
    },
    [question.id, saveSelfGrade],
  );

  const sandpackFiles = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(question.starterCode).map(([filename, code]) => [`/${filename}`, { code }]),
      ),
    [question.starterCode],
  );

  return (
    <SandpackProvider
      template={question.sandpackTemplate}
      files={sandpackFiles}
      options={{ activeFile: `/${question.entryFile}` }}
      theme={darkForgeTheme}
    >
      <ReactIDELayout
        question={question}
        phase={phase}
        onPhaseChange={setPhase}
        solutionViewed={solutionViewed}
        hasAttempted={hasAttempted}
        onMarkDone={handleMarkDone}
        onViewSolution={handleViewSolution}
        onGrade={handleGrade}
      />
    </SandpackProvider>
  );
}

interface ReactIDELayoutProps {
  question: ReactQuestion;
  phase: ReactIDEPhase;
  onPhaseChange: (phase: ReactIDEPhase) => void;
  solutionViewed: boolean;
  hasAttempted: boolean;
  onMarkDone: () => void;
  onViewSolution: (updateFile: (filePath: string, code: string) => void) => void;
  onGrade: (grade: Grade) => void;
}

function ReactIDELayout({
  question,
  phase,
  onPhaseChange,
  solutionViewed,
  hasAttempted,
  onMarkDone,
  onViewSolution,
  onGrade,
}: ReactIDELayoutProps) {
  const { sandpack } = useSandpack();

  const difficultyClass = {
    beginner: 'border-green-500/30 bg-green-500/10 text-green-400',
    intermediate: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    advanced: 'border-red-500/30 bg-red-500/10 text-red-400',
  }[question.difficulty];

  return (
    <div className="flex h-full flex-col bg-void text-foreground">
      <div className="flex items-center justify-between border-b border-border/60 bg-surface/60 px-4 py-3">
        <PhaseTabs phase={phase} onPhaseChange={onPhaseChange} hasAttempted={hasAttempted} />
        <Badge className={difficultyClass}>{question.difficulty}</Badge>
      </div>

      {phase === 'read' && (
        <div className="mx-auto w-full max-w-3xl flex-1 overflow-y-auto p-6">
          <h1 className="font-display text-3xl text-foreground">{question.title}</h1>
          {question.context && (
            <p className="mt-4 leading-relaxed text-secondary">{question.context}</p>
          )}
          <div className="mt-6 rounded-xl border border-border/50 bg-surface/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              Your Task
            </p>
            <p className="mt-2 text-sm leading-relaxed text-foreground">{question.prompt}</p>
          </div>
          <Button onClick={() => onPhaseChange('build')} className="mt-6 w-full">
            Ready to build
          </Button>
        </div>
      )}

      {phase === 'build' && (
        <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
          <div className="flex h-1/2 flex-col border-b border-border/60 lg:h-auto lg:w-1/2 lg:border-r lg:border-b-0">
            <SandpackFileTabs solutionViewed={solutionViewed} />
            <div className="min-h-0 flex-1">
              <MonacoBridge />
            </div>
          </div>

          <div className="flex h-1/2 flex-col lg:h-auto lg:w-1/2">
            {question.previewVisible && (
              <div className="flex-1 border-b border-border/60 bg-white">
                <SandpackPreview showNavigator={false} showRefreshButton={false} />
              </div>
            )}
            <div className={question.previewVisible ? 'h-40' : 'flex-1'}>
              <SandpackConsole />
            </div>
          </div>
        </div>
      )}

      {phase === 'build' && (
        <div className="flex items-center gap-3 border-t border-border/60 bg-surface/60 px-4 py-3">
          <Button onClick={onMarkDone} size="sm">
            Mark as Done
          </Button>
          <Button
            onClick={() => onViewSolution(sandpack.updateFile)}
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
          >
            I&apos;m stuck, show solution
          </Button>
        </div>
      )}

      {phase === 'review' && (
        <div className="mx-auto w-full max-w-3xl flex-1 overflow-y-auto p-6">
          <h2 className="text-xl font-semibold text-foreground">How did it go?</h2>
          <p className="mt-2 text-sm text-secondary">
            Save your self-grade to schedule the next review.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Button variant="outline" onClick={() => onGrade('hard')}>
              Hard
            </Button>
            <Button variant="outline" onClick={() => onGrade('good')}>
              Got it
            </Button>
            <Button variant="outline" onClick={() => onGrade('easy')}>
              Easy
            </Button>
          </div>

          {!solutionViewed && (
            <Button
              variant="ghost"
              onClick={() => onViewSolution(sandpack.updateFile)}
              className="mt-5 w-full"
            >
              View Solution
            </Button>
          )}

          {question.resources && question.resources.length > 0 && (
            <div className="mt-6">
              <ResourcesPanel resources={question.resources} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
