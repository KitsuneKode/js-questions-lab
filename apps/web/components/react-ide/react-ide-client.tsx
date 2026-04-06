'use client';

import {
  SandpackConsole,
  SandpackPreview,
  SandpackProvider,
  useSandpack,
} from '@codesandbox/sandpack-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { MonacoCodeEditor } from '@/components/editor/monaco-code-editor';
import { ResourcesPanel } from '@/components/ide/resources-panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ReactQuestion } from '@/lib/content/types';
import { useProgress } from '@/lib/progress/progress-context';
import type { Grade } from '@/lib/progress/srs';
import { cn } from '@/lib/utils';
import { darkForgeTheme } from './dark-forge-theme';
import { PhaseTabs, type ReactIDEPhase } from './phase-tabs';
import { SandpackFileTabs } from './sandpack-file-tabs';

type WorkspaceView = 'editor' | 'preview' | 'console';

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
  const [workspaceView, setWorkspaceView] = useState<WorkspaceView>('editor');
  const { saveAttempt, saveSelfGrade, state: progressState } = useProgress();

  const existingProgress = progressState.questions[question.id];
  const isAlreadyAttempted = (existingProgress?.attempts?.length ?? 0) > 0;

  useEffect(() => {
    if (isAlreadyAttempted) {
      setHasAttempted(true);
    }
  }, [isAlreadyAttempted]);

  useEffect(() => {
    if (!question.previewVisible && workspaceView === 'preview') {
      setWorkspaceView('console');
    }
  }, [question.previewVisible, workspaceView]);

  const sourceName = question.source?.repo.split('/').at(-1) ?? null;
  const sandpackFiles = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(question.starterCode).map(([filename, code]) => [`/${filename}`, { code }]),
      ),
    [question.starterCode],
  );

  function handleMarkDone() {
    setHasAttempted(true);
    setPhase('review');
    saveAttempt(question.id as unknown as number, null, 'correct', {
      difficulty: question.difficulty,
    });
  }

  function handleViewSolution(updateFile: (filePath: string, code: string) => void) {
    setSolutionViewed(true);
    setHasAttempted(true);
    setPhase('review');

    for (const [file, code] of Object.entries(question.solutionCode)) {
      updateFile(`/${file}`, code);
    }

    saveAttempt(question.id as unknown as number, null, 'incorrect', {
      difficulty: question.difficulty,
    });
  }

  function handleGrade(grade: Grade) {
    saveSelfGrade(question.id as unknown as number, grade);
  }

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
        workspaceView={workspaceView}
        onWorkspaceViewChange={setWorkspaceView}
        onMarkDone={handleMarkDone}
        onViewSolution={handleViewSolution}
        onGrade={handleGrade}
        sourceName={sourceName}
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
  workspaceView: WorkspaceView;
  onWorkspaceViewChange: (view: WorkspaceView) => void;
  onMarkDone: () => void;
  onViewSolution: (updateFile: (filePath: string, code: string) => void) => void;
  onGrade: (grade: Grade) => void;
  sourceName: string | null;
}

function ReactIDELayout({
  question,
  phase,
  onPhaseChange,
  solutionViewed,
  hasAttempted,
  workspaceView,
  onWorkspaceViewChange,
  onMarkDone,
  onViewSolution,
  onGrade,
  sourceName,
}: ReactIDELayoutProps) {
  const { sandpack } = useSandpack();

  const difficultyClass = {
    beginner: 'border-green-500/30 bg-green-500/10 text-green-400',
    intermediate: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    advanced: 'border-red-500/30 bg-red-500/10 text-red-400',
  }[question.difficulty];

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-void text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.08),transparent_28%),radial-gradient(circle_at_85%_20%,rgba(56,189,248,0.08),transparent_22%)]" />

      <div className="relative border-b border-border/60 bg-surface/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-4 lg:flex-row lg:items-end lg:justify-between lg:px-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">
              <span>React Practice</span>
              <span className="text-border">/</span>
              <span>{phase}</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-2xl leading-none text-foreground md:text-3xl">
                {question.title}
              </h1>
              <Badge className={difficultyClass}>{question.difficulty}</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-border/50 bg-elevated/70 px-3 py-1 text-[11px] text-secondary">
                {question.category}
              </span>
              {question.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-border/40 bg-background/60 px-2.5 py-1 text-[11px] font-mono text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
              {sourceName && (
                <span className="rounded-full border border-primary/20 bg-primary/8 px-3 py-1 text-[11px] text-primary">
                  Source: {sourceName}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:items-end">
            <PhaseTabs phase={phase} onPhaseChange={onPhaseChange} hasAttempted={hasAttempted} />

            {phase === 'build' && (
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center rounded-full border border-border/50 bg-background/70 p-1">
                  {(['editor', 'preview', 'console'] as const)
                    .filter((view) => question.previewVisible || view !== 'preview')
                    .map((view) => (
                      <button
                        key={view}
                        type="button"
                        onClick={() => onWorkspaceViewChange(view)}
                        className={cn(
                          'rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors',
                          workspaceView === view
                            ? 'bg-primary/15 text-primary'
                            : 'text-muted-foreground hover:text-foreground',
                        )}
                      >
                        {view}
                      </button>
                    ))}
                </div>

                <Button onClick={onMarkDone} size="sm" className="h-9">
                  Mark as done
                </Button>
                <Button
                  onClick={() => onViewSolution(sandpack.updateFile)}
                  variant="ghost"
                  size="sm"
                  className="h-9 border border-border/50 bg-background/65 text-muted-foreground hover:bg-background hover:text-foreground"
                >
                  Show solution
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {phase === 'read' && (
          <motion.div
            key="read"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
            className="relative flex-1 overflow-y-auto"
          >
            <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[minmax(300px,0.78fr)_minmax(0,1.22fr)] lg:px-6">
              <section className="rounded-[28px] border border-primary/15 bg-linear-to-br from-primary/12 via-surface/95 to-surface/80 p-6 shadow-[0_30px_90px_-45px_rgba(245,158,11,0.65)]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">
                  Before you build
                </p>
                <div className="mt-6 space-y-5">
                  <div>
                    <p className="text-sm text-secondary">
                      Read the mental model first, then step into the workbench with the starter
                      files already loaded.
                    </p>
                  </div>

                  <div className="grid gap-3">
                    <div className="rounded-2xl border border-border/50 bg-background/55 p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                        Entry file
                      </p>
                      <p className="mt-2 font-mono text-sm text-foreground">{question.entryFile}</p>
                    </div>
                    <div className="rounded-2xl border border-border/50 bg-background/55 p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                        Files
                      </p>
                      <p className="mt-2 text-sm text-foreground">
                        {Object.keys(question.starterCode).length} starter files loaded into the
                        workbench.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border/50 bg-background/55 p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                        Live canvas
                      </p>
                      <p className="mt-2 text-sm text-foreground">
                        {question.previewVisible
                          ? 'This challenge includes a rendered preview and console output.'
                          : 'This challenge focuses on code behavior, so console output is the primary feedback loop.'}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                {question.context && (
                  <div className="rounded-[28px] border border-border/60 bg-surface/85 p-6 shadow-[0_30px_80px_-55px_rgba(0,0,0,0.8)]">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">
                      Concept briefing
                    </p>
                    <p className="mt-4 max-w-3xl text-base leading-8 text-secondary">
                      {question.context}
                    </p>
                  </div>
                )}

                <div className="rounded-[28px] border border-border/60 bg-surface/90 p-6 shadow-[0_30px_80px_-55px_rgba(0,0,0,0.9)]">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">
                    Build prompt
                  </p>
                  <p className="mt-4 text-lg leading-8 text-foreground">{question.prompt}</p>

                  <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-muted-foreground">
                      The goal is simple: understand the pattern, shape the code, then review your
                      confidence honestly.
                    </p>
                    <Button onClick={() => onPhaseChange('build')} className="min-w-44">
                      Enter workbench
                    </Button>
                  </div>
                </div>
              </section>
            </div>
          </motion.div>
        )}

        {phase === 'build' && (
          <motion.div
            key="build"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="relative flex flex-1 flex-col overflow-hidden"
          >
            <div className="mx-auto flex h-full w-full max-w-[1600px] flex-1 flex-col overflow-hidden px-3 py-3 md:px-4 md:py-4 lg:px-6">
              <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[30px] border border-border/60 bg-surface/90 shadow-[0_32px_90px_-60px_rgba(0,0,0,1)]">
                <div className="border-b border-border/50 bg-linear-to-r from-background/96 via-surface/90 to-background/82 px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">
                        {workspaceView === 'editor'
                          ? 'Code studio'
                          : workspaceView === 'preview'
                            ? 'Preview stage'
                            : 'Console stream'}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {workspaceView === 'editor'
                          ? 'Use the entire surface for code. This is the main workspace.'
                          : workspaceView === 'preview'
                            ? 'Render the component at full size so it feels like a real app surface.'
                            : 'Inspect logs and runtime behavior without sacrificing screen real estate.'}
                      </p>
                    </div>
                    <span className="rounded-full border border-border/50 bg-background/70 px-3 py-1 text-[11px] font-mono text-muted-foreground">
                      {workspaceView === 'editor'
                        ? `${Object.keys(question.starterCode).length} files`
                        : workspaceView}
                    </span>
                  </div>
                </div>

                <AnimatePresence mode="wait" initial={false}>
                  {workspaceView === 'editor' && (
                    <motion.div
                      key="workspace-editor"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                      className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#0d0d12]"
                    >
                      <SandpackFileTabs solutionViewed={solutionViewed} />
                      <div className="min-h-0 flex-1">
                        <MonacoBridge />
                      </div>
                    </motion.div>
                  )}

                  {workspaceView === 'preview' && question.previewVisible && (
                    <motion.div
                      key="workspace-preview"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                      className="flex min-h-0 flex-1 flex-col bg-white"
                    >
                      <SandpackPreview showNavigator={false} showRefreshButton={false} />
                    </motion.div>
                  )}

                  {workspaceView === 'console' && (
                    <motion.div
                      key="workspace-console"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                      className="flex min-h-0 flex-1 flex-col bg-[#050505]"
                    >
                      <SandpackConsole />
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>
            </div>
          </motion.div>
        )}

        {phase === 'review' && (
          <motion.div
            key="review"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
            className="relative flex-1 overflow-y-auto"
          >
            <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.2fr)] lg:px-6">
              <section className="rounded-[28px] border border-primary/15 bg-linear-to-br from-primary/12 via-surface/95 to-surface/85 p-6 shadow-[0_32px_90px_-55px_rgba(245,158,11,0.5)]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">
                  Session recap
                </p>
                <div className="mt-5 space-y-4">
                  <div className="rounded-2xl border border-border/50 bg-background/55 p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                      Outcome
                    </p>
                    <p className="mt-2 text-sm leading-6 text-foreground">
                      {solutionViewed
                        ? 'You revealed the reference implementation. That is still useful learning; now lock in how difficult this felt.'
                        : 'You made it through the exercise in the workbench. Use the grade to tell the review system how sticky the concept feels.'}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border/50 bg-background/55 p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                      Next behavior
                    </p>
                    <p className="mt-2 text-sm leading-6 text-foreground">
                      Hard means bring this back soon. Got it means normal spacing. Easy pushes the
                      next review further out.
                    </p>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <div className="rounded-[28px] border border-border/60 bg-surface/90 p-6 shadow-[0_30px_80px_-55px_rgba(0,0,0,0.95)]">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">
                    Self-grade
                  </p>
                  <p className="mt-3 text-sm leading-6 text-secondary">
                    Choose the grade that matches how independently you could reason through this
                    React pattern.
                  </p>

                  <div className="mt-6 grid gap-3 md:grid-cols-3">
                    {[
                      {
                        id: 'hard' as const,
                        title: 'Hard',
                        description: 'Needed more support than expected.',
                      },
                      {
                        id: 'good' as const,
                        title: 'Got it',
                        description: 'Solid understanding with a few pauses.',
                      },
                      {
                        id: 'easy' as const,
                        title: 'Easy',
                        description: 'Felt natural and repeatable.',
                      },
                    ].map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => onGrade(option.id)}
                        className="rounded-[24px] border border-border/60 bg-background/60 p-4 text-left transition-colors hover:border-primary/35 hover:bg-primary/8"
                      >
                        <p className="text-sm font-semibold text-foreground">{option.title}</p>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          {option.description}
                        </p>
                      </button>
                    ))}
                  </div>

                  {!solutionViewed && (
                    <Button
                      variant="ghost"
                      onClick={() => onViewSolution(sandpack.updateFile)}
                      className="mt-6 border border-border/50 bg-background/65 hover:bg-background"
                    >
                      View solution
                    </Button>
                  )}
                </div>

                {question.resources && question.resources.length > 0 && (
                  <div className="rounded-[28px] border border-border/60 bg-surface/90 p-3 shadow-[0_24px_70px_-60px_rgba(0,0,0,0.95)]">
                    <ResourcesPanel resources={question.resources} />
                  </div>
                )}
              </section>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
