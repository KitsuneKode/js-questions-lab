'use client';

import {
  SandpackConsole,
  SandpackPreview,
  SandpackProvider,
  useActiveCode,
  useSandpack,
} from '@codesandbox/sandpack-react';
import {
  IconChevronDown,
  IconChevronUp,
  IconCode,
  IconColumns,
  IconEye,
  IconFolder,
  IconInfoCircle,
  IconTerminal2,
} from '@tabler/icons-react';
import { AnimatePresence, motion } from 'motion/react';
import * as prettierBabel from 'prettier/plugins/babel';
import * as prettierEstree from 'prettier/plugins/estree';
import * as prettier from 'prettier/standalone';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Streamdown } from 'streamdown';
import { CodeMirrorEditor } from '@/components/editor/codemirror-editor';
import { ResourcesPanel } from '@/components/ide/resources-panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable-panel';
import type { ReactQuestion } from '@/lib/content/types';
import { useProgress } from '@/lib/progress/progress-context';
import type { Grade } from '@/lib/progress/srs';
import { cn } from '@/lib/utils';
import { CustomFileTree } from './custom-file-tree';
import { darkForgeTheme } from './dark-forge-theme';
import { PhaseTabs, type ReactIDEPhase } from './phase-tabs';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type LayoutMode = 'split' | 'editor' | 'preview' | 'console';

interface ReactIDEClientProps {
  question: ReactQuestion;
}

// ---------------------------------------------------------------------------
// Main IDE wrapper
// ---------------------------------------------------------------------------

export function ReactIDEClient({ question }: ReactIDEClientProps) {
  const [phase, setPhase] = useState<ReactIDEPhase>('build');
  const [isProblemModalOpen, setIsProblemModalOpen] = useState(true);
  const [solutionViewed, setSolutionViewed] = useState(false);
  const [hasAttempted, setHasAttempted] = useState(false);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('split');
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const { saveReactAttempt, saveReactSelfGrade, reactState } = useProgress();

  const existingProgress = reactState.questions[question.id];
  const isAlreadyAttempted = (existingProgress?.attempts?.length ?? 0) > 0;

  useEffect(() => {
    if (isAlreadyAttempted) setHasAttempted(true);
  }, [isAlreadyAttempted]);

  // Mobile: default to editor-only
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setLayoutMode('editor');
    }
  }, []);

  const sandpackFiles = useMemo(() => {
    const result = Object.fromEntries(
      Object.entries(question.starterCode).map(([filename, code]) => [`/${filename}`, { code }]),
    );

    // Ensure there's a stable React entrypoint for the preview iframe.
    // Sandpack templates provide defaults, but these can drift; supplying our own
    // entry guarantees preview renders for "previewVisible" questions.
    if (!result['/index.tsx']) {
      result['/index.tsx'] = {
        code: `import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: '#ef4444', fontFamily: 'monospace' }}>
          <h2>Runtime Error</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>{this.state.error?.toString()}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>,
  );
}
`,
      };
    }

    // Sandpack templates expect /App.tsx to exist (rendered by the template entry).
    // If a question uses a different entry file, provide a thin App wrapper so the
    // preview reliably renders something instead of a blank screen.
    if (!result['/App.tsx'] && question.entryFile && result[`/${question.entryFile}`]) {
      const importedName = 'Exercise';
      result['/App.tsx'] = {
        code: `import ${importedName} from './${question.entryFile}';\n\nexport default function App() {\n  return <${importedName} />;\n}\n`,
      };
    }

    // Inject a small base stylesheet so seeded React exercises render
    // predictably even when they use Tailwind-like utility classes.
    const stylesCode = `
html, body, #root {
  min-height: 100%;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background-color: #ffffff;
  color: #111827;
  font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
  line-height: 1.5;
}

button {
  font: inherit;
  cursor: pointer;
}

.fixed { position: fixed; }
.inset-0 { inset: 0; }
.top-1\\/2 { top: 50%; }
.left-1\\/2 { left: 50%; }
.z-50 { z-index: 50; }
.flex { display: flex; }
.flex-col { flex-direction: column; }
.items-center { align-items: center; }
.gap-2 { gap: 0.5rem; }
.gap-4 { gap: 1rem; }
.p-2 { padding: 0.5rem; }
.p-6 { padding: 1.5rem; }
.p-8 { padding: 2rem; }
.mt-2 { margin-top: 0.5rem; }
.mt-4 { margin-top: 1rem; }
.mb-2 { margin-bottom: 0.5rem; }
.h-64 { height: 16rem; }
.min-w-64 { min-width: 16rem; }
.rounded { border-radius: 0.25rem; }
.rounded-lg { border-radius: 0.5rem; }
.border { border: 1px solid #d1d5db; }
.bg-white { background: #ffffff; }
.bg-black\\/50 { background: rgba(0, 0, 0, 0.5); }
.font-bold { font-weight: 700; }
.text-sm { font-size: 0.875rem; }
.text-lg { font-size: 1.125rem; }
.text-4xl { font-size: 2.25rem; line-height: 1; }
.text-gray-500 { color: #6b7280; }
.text-red-500 { color: #ef4444; }
.underline { text-decoration: underline; }
.-translate-x-1\\/2 { transform: translateX(-50%); }
.-translate-y-1\\/2 { transform: translateY(-50%); }
      `.trim();

    result['/styles.css'] = { code: stylesCode };

    // Pass the styles to the entry file (e.g. App.tsx or index.tsx)
    const entryKey = `/${question.entryFile}`;
    if (result[entryKey] && !result[entryKey].code.includes('styles.css')) {
      result[entryKey].code = `import './styles.css';\n${result[entryKey].code}`;
    }

    return result;
  }, [question.starterCode, question.entryFile]);

  function handleMarkDone() {
    setHasAttempted(true);
    setPhase('review');
    saveReactAttempt(question.id, 'correct');
  }

  function handleViewSolution() {
    setSolutionViewed(true);
    setHasAttempted(true);
    // Stay in build phase so they can actually look at the solution tabs
    saveReactAttempt(question.id, 'incorrect');
  }

  function handleGrade(grade: Grade) {
    saveReactSelfGrade(question.id, grade);
  }

  return (
    <div className="react-ide-root flex flex-col flex-1 h-full w-full min-h-0 relative">
      <SandpackProvider
        template={question.sandpackTemplate}
        files={sandpackFiles}
        options={{ activeFile: `/${question.entryFile}` }}
        theme={darkForgeTheme}
      >
        <IDELayout
          question={question}
          phase={phase}
          onPhaseChange={setPhase}
          solutionViewed={solutionViewed}
          hasAttempted={hasAttempted}
          layoutMode={layoutMode}
          onLayoutModeChange={setLayoutMode}
          onMarkDone={handleMarkDone}
          onViewSolution={handleViewSolution}
          onGrade={handleGrade}
          isProblemModalOpen={isProblemModalOpen}
          setIsProblemModalOpen={setIsProblemModalOpen}
          isConsoleOpen={isConsoleOpen}
          setIsConsoleOpen={setIsConsoleOpen}
        />
      </SandpackProvider>
    </div>
  );
}

// ---------------------------------------------------------------------------
// IDE Layout (inside SandpackProvider so useSandpack() works)
// ---------------------------------------------------------------------------

interface IDELayoutProps {
  question: ReactQuestion;
  phase: ReactIDEPhase;
  onPhaseChange: (phase: ReactIDEPhase) => void;
  solutionViewed: boolean;
  hasAttempted: boolean;
  layoutMode: LayoutMode;
  onLayoutModeChange: (mode: LayoutMode) => void;
  onMarkDone: () => void;
  onViewSolution: () => void;
  onGrade: (grade: Grade) => void;
  isProblemModalOpen: boolean;
  setIsProblemModalOpen: (open: boolean) => void;
  isConsoleOpen: boolean;
  setIsConsoleOpen: (open: boolean) => void;
}

function IDELayout({
  question,
  phase,
  onPhaseChange,
  solutionViewed,
  hasAttempted,
  layoutMode,
  onLayoutModeChange,
  onMarkDone,
  onViewSolution,
  onGrade,
  isProblemModalOpen,
  setIsProblemModalOpen,
  isConsoleOpen,
  setIsConsoleOpen,
}: IDELayoutProps) {
  const { sandpack } = useSandpack();
  const [viewMode, setViewMode] = useState<'problem' | 'solution'>('problem');
  const userFilesRef = useRef<Record<string, string>>({});

  function toggleMode(mode: 'problem' | 'solution') {
    if (mode === viewMode) return;

    if (mode === 'solution') {
      const currentCode: Record<string, string> = {};
      for (const [path, file] of Object.entries(sandpack.files)) {
        currentCode[path.replace(/^\//, '')] = file.code;
      }
      userFilesRef.current = currentCode;

      for (const [file, code] of Object.entries(question.solutionCode)) {
        sandpack.updateFile(`/${file}`, code);
      }
    } else {
      for (const [file, code] of Object.entries(userFilesRef.current)) {
        sandpack.updateFile(`/${file}`, code);
      }
    }
    setViewMode(mode);
  }

  function handleViewSolutionClick() {
    toggleMode('solution');
    onViewSolution();
  }

  const difficultyClass = {
    beginner: 'border-green-500/30 bg-green-500/10 text-green-400',
    intermediate: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    advanced: 'border-red-500/30 bg-red-500/10 text-red-400',
  }[question.difficulty];

  const layoutOptions: Array<{
    id: LayoutMode;
    icon: typeof IconColumns;
    label: string;
  }> = [
    { id: 'split', icon: IconColumns, label: 'Split view' },
    { id: 'editor', icon: IconCode, label: 'Editor only' },
    ...(question.previewVisible
      ? [{ id: 'preview' as const, icon: IconEye, label: 'Preview only' }]
      : []),
    { id: 'console', icon: IconTerminal2, label: 'Console only' },
  ];

  return (
    <div className="relative flex flex-1 flex-col w-full h-full min-h-0 overflow-hidden bg-void text-foreground">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.06),transparent_28%),radial-gradient(circle_at_85%_20%,rgba(56,189,248,0.06),transparent_22%)]" />

      {/* ── Compact header ── */}
      <div className="relative z-10 shrink-0 flex-none flex flex-wrap items-center gap-3 border-b border-border/50 bg-background/80 px-4 py-2 backdrop-blur-xl lg:px-5">
        {/* Left: title + badge */}
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <span className="hidden text-[10px] font-semibold uppercase tracking-[0.22em] text-primary/60 sm:inline">
            React
          </span>
          <span className="hidden text-border/40 sm:inline">/</span>
          <h1 className="truncate text-sm font-medium leading-none text-foreground">
            {question.title}
          </h1>
          <Badge className={cn('shrink-0 text-[10px]', difficultyClass)}>
            {question.difficulty}
          </Badge>
        </div>

        {/* Center: phase tabs */}
        <PhaseTabs phase={phase} onPhaseChange={onPhaseChange} hasAttempted={hasAttempted} />

        {/* Right: build-phase controls */}
        {phase === 'build' && (
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-3 text-xs border border-border/40 bg-surface hover:bg-surface/80 text-foreground"
              onClick={() => setIsProblemModalOpen(true)}
            >
              <IconInfoCircle className="mr-1.5 h-3.5 w-3.5 text-primary" />
              Requirements
            </Button>

            <div className="h-4 w-px bg-border/40 mx-1" />

            {/* Layout mode toggle */}
            <div className="hidden items-center rounded-md border border-border/40 bg-background/60 p-0.5 lg:inline-flex">
              {layoutOptions.map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => onLayoutModeChange(id)}
                  title={label}
                  className={cn(
                    'rounded p-1.5 transition-colors active:scale-[0.95]',
                    layoutMode === id
                      ? 'bg-primary/12 text-primary'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </button>
              ))}
            </div>

            <div className="h-4 w-px bg-border/40" />

            <Button onClick={onMarkDone} size="sm" className="h-7 px-3 text-xs">
              Done
            </Button>
            {!solutionViewed && (
              <Button
                onClick={handleViewSolutionClick}
                variant="ghost"
                size="sm"
                className="h-7 border border-border/40 bg-transparent px-3 text-xs text-muted-foreground hover:border-border/70 hover:text-foreground transition-all active:scale-[0.97]"
              >
                Solution
              </Button>
            )}
          </div>
        )}
      </div>

      {/* ── Problem Modal ── */}
      <Dialog open={isProblemModalOpen} onOpenChange={setIsProblemModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <span className="rounded-full bg-primary/10 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest text-primary">
                {question.difficulty}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {question.category}
              </span>
            </div>
            <DialogTitle className="text-2xl">{question.title}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {question.context && (
              <section>
                <h3 className="text-sm font-medium mb-2 text-foreground">The Concept</h3>
                <div className="markdown text-sm leading-relaxed text-muted-foreground/90">
                  <Streamdown>{question.context}</Streamdown>
                </div>
              </section>
            )}
            <section>
              <h3 className="text-sm font-medium mb-2 text-foreground">What to Build</h3>
              <div className="rounded-xl border border-border/50 bg-surface/30 p-4 sm:p-6">
                <div className="markdown text-sm leading-relaxed text-muted-foreground/90">
                  <Streamdown>{question.prompt}</Streamdown>
                </div>
              </div>
            </section>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Phase content ── */}
      <AnimatePresence mode="wait" initial={false}>
        {phase === 'build' && (
          <motion.div
            key="build"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="relative flex flex-1 w-full min-h-0 overflow-hidden"
          >
            <BuildPhase
              question={question}
              layoutMode={layoutMode}
              solutionViewed={solutionViewed}
              viewMode={viewMode}
              onToggleMode={toggleMode}
              isConsoleOpen={isConsoleOpen}
              setIsConsoleOpen={setIsConsoleOpen}
            />
          </motion.div>
        )}

        {phase === 'review' && (
          <ReviewPhase
            key="review"
            question={question}
            solutionViewed={solutionViewed}
            onViewSolution={() => {
              handleViewSolutionClick();
              onPhaseChange('build');
            }}
            onGrade={onGrade}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// BUILD phase — split layout with file tree, editor, preview, console
// ---------------------------------------------------------------------------

interface EditorHeaderTabsProps {
  viewMode: 'problem' | 'solution';
  onToggleMode: (mode: 'problem' | 'solution') => void;
  solutionViewed: boolean;
}

function EditorHeaderTabs({ viewMode, onToggleMode, solutionViewed }: EditorHeaderTabsProps) {
  if (!solutionViewed) return null;
  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        onClick={() => onToggleMode('problem')}
        className={cn(
          'rounded-md px-3 py-1 text-[11px] font-medium transition-colors',
          viewMode === 'problem'
            ? 'bg-primary/20 text-primary'
            : 'text-muted-foreground hover:bg-surface hover:text-foreground',
        )}
      >
        Your Code
      </button>
      <button
        type="button"
        onClick={() => onToggleMode('solution')}
        className={cn(
          'rounded-md px-3 py-1 text-[11px] font-medium transition-all active:scale-[0.97]',
          viewMode === 'solution'
            ? 'bg-primary/20 text-primary'
            : 'text-muted-foreground hover:bg-surface hover:text-foreground',
        )}
      >
        Reference Solution
      </button>
    </div>
  );
}

function BuildPhase({
  question,
  layoutMode,
  solutionViewed,
  viewMode,
  onToggleMode,
  isConsoleOpen,
  setIsConsoleOpen,
}: {
  question: ReactQuestion;
  layoutMode: LayoutMode;
  solutionViewed: boolean;
  viewMode: 'problem' | 'solution';
  onToggleMode: (mode: 'problem' | 'solution') => void;
  isConsoleOpen: boolean;
  setIsConsoleOpen: (open: boolean) => void;
}) {
  // Important: keep preview + console mounted while switching modes.
  // Unmounting SandpackPreview can stall the iframe/runtime in some browsers.
  const showLeft = layoutMode !== 'preview' && layoutMode !== 'console';
  const showRight = layoutMode !== 'editor';
  const showPreview = question.previewVisible && layoutMode !== 'console';
  const showConsole = layoutMode === 'console' || (layoutMode !== 'preview' && isConsoleOpen);

  const leftSize = showRight ? 55 : 100;
  const rightSize = showLeft ? 45 : 100;

  const previewSize = showConsole ? 70 : 100;
  const consoleSize = showPreview ? 30 : 100;

  return (
    <ResizablePanelGroup direction="horizontal" className="w-full h-full min-h-0 items-stretch">
      {/* Left: file tree + editor */}
      {showLeft && (
        <ResizablePanel
          defaultSize={leftSize}
          minSize={30}
          className="flex flex-col min-h-0 h-full"
        >
          <ResizablePanelGroup
            direction="horizontal"
            className="flex flex-1 w-full h-full min-h-0 items-stretch"
          >
            {/* File tree */}
            <ResizablePanel
              defaultSize={20}
              minSize={10}
              className="hidden lg:flex flex-col h-full min-h-0"
            >
              <div className="flex flex-1 w-full h-full flex-col overflow-hidden border-r border-border/40 bg-code min-h-0">
                <div className="flex items-center justify-between border-b border-border/40 px-3 py-1.5 shrink-0 bg-code">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <IconFolder className="w-3.5 h-3.5" />
                    Explorer
                  </span>
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto">
                  <CustomFileTree />
                </div>
              </div>
            </ResizablePanel>

            <ResizableHandle direction="horizontal" className="hidden lg:flex" />

            {/* Editor */}
            <ResizablePanel defaultSize={80} minSize={40} className="flex flex-col min-h-0 h-full">
              <div className="flex flex-1 min-h-0 h-full w-full flex-col overflow-hidden bg-code">
                <SandpackCodeMirrorEditor
                  headerLeft={
                    <EditorHeaderTabs
                      viewMode={viewMode}
                      onToggleMode={onToggleMode}
                      solutionViewed={solutionViewed}
                    />
                  }
                />
                {solutionViewed && viewMode === 'solution' && <SolutionBadge />}
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      )}

      {showLeft && showRight && <ResizableHandle direction="horizontal" />}

      {/* Right: preview + console */}
      {showRight && (
        <ResizablePanel
          defaultSize={rightSize}
          minSize={20}
          className="flex flex-col h-full min-h-0"
        >
          {question.previewVisible ? (
            <ResizablePanelGroup
              direction="vertical"
              className="w-full h-full min-h-0 items-stretch"
            >
              {showPreview && (
                <ResizablePanel
                  defaultSize={previewSize}
                  minSize={20}
                  className="flex flex-col min-h-0 h-full w-full"
                >
                  <div className="flex items-center justify-between border-b border-border/40 px-3 py-1.5 shrink-0 bg-code">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <IconEye className="w-3.5 h-3.5" />
                      Preview
                    </span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setIsConsoleOpen(!isConsoleOpen)}
                        className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-border/40 hover:bg-surface/50 transition-colors text-[10px] font-medium text-muted-foreground"
                      >
                        <IconTerminal2 className="w-3 h-3" />
                        Console
                        {isConsoleOpen ? (
                          <IconChevronDown className="w-3 h-3" />
                        ) : (
                          <IconChevronUp className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-1 min-h-0 h-full w-full overflow-hidden bg-code">
                    <SandpackPreview
                      showNavigator={false}
                      showOpenInCodeSandbox={false}
                      showRefreshButton
                      className="w-full h-full min-h-0 flex-1 [&_.sp-preview-actions]:bg-transparent! [&_.sp-preview-actions]:border-0!"
                    />
                  </div>
                </ResizablePanel>
              )}
              {showPreview && showConsole && <ResizableHandle direction="vertical" />}
              {showConsole && (
                <ResizablePanel
                  defaultSize={consoleSize}
                  minSize={15}
                  className="flex flex-col min-h-0 h-full w-full"
                >
                  <div className="flex items-center justify-between border-b border-border/40 px-3 py-1.5 shrink-0 bg-code">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <IconTerminal2 className="w-3.5 h-3.5" />
                      Console
                    </span>
                    {!showPreview && (
                      <button
                        type="button"
                        onClick={() => setIsConsoleOpen(false)}
                        className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-border/40 hover:bg-surface/50 transition-colors text-[10px] font-medium text-muted-foreground"
                      >
                        Close
                      </button>
                    )}
                  </div>
                  <div className="flex flex-1 min-h-0 h-full w-full overflow-hidden bg-void">
                    <SandpackConsole className="w-full h-full min-h-0 flex-1" />
                  </div>
                </ResizablePanel>
              )}
            </ResizablePanelGroup>
          ) : (
            <div className="flex flex-1 min-h-0 h-full w-full flex-col overflow-hidden bg-void">
              <div className="flex items-center justify-between border-b border-border/40 px-3 py-1.5 shrink-0 bg-code">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <IconTerminal2 className="w-3.5 h-3.5" />
                  Console
                </span>
              </div>
              <div className="flex flex-1 min-h-0 h-full w-full overflow-hidden bg-void">
                <SandpackConsole className="w-full h-full min-h-0 flex-1" />
              </div>
            </div>
          )}
        </ResizablePanel>
      )}
    </ResizablePanelGroup>
  );
}

function SolutionBadge() {
  return (
    <div className="border-t border-primary/20 bg-primary/5 px-3 py-1.5 text-center text-[10px] font-semibold uppercase tracking-widest text-primary">
      Solution
    </div>
  );
}

// ---------------------------------------------------------------------------
// REVIEW phase
// ---------------------------------------------------------------------------

const GRADE_CONFIG = {
  hard: {
    label: 'Hard',
    description: 'Needed hints or the solution.',
    defaultClass: 'border-danger/20 bg-danger/5 hover:border-danger/40 hover:bg-danger/10',
    activeClass: 'border-danger/50 bg-danger/15 ring-1 ring-danger/25',
    textClass: 'text-danger',
    dotClass: 'bg-danger',
  },
  good: {
    label: 'Got it',
    description: 'Solid with minor pauses.',
    defaultClass: 'border-primary/20 bg-primary/5 hover:border-primary/40 hover:bg-primary/10',
    activeClass: 'border-primary/50 bg-primary/15 ring-1 ring-primary/25',
    textClass: 'text-primary',
    dotClass: 'bg-primary',
  },
  easy: {
    label: 'Easy',
    description: 'Felt natural and repeatable.',
    defaultClass: 'border-success/20 bg-success/5 hover:border-success/40 hover:bg-success/10',
    activeClass: 'border-success/50 bg-success/15 ring-1 ring-success/25',
    textClass: 'text-success',
    dotClass: 'bg-success',
  },
} as const;

function ReviewPhase({
  question,
  solutionViewed,
  onViewSolution,
  onGrade,
}: {
  question: ReactQuestion;
  solutionViewed: boolean;
  onViewSolution: () => void;
  onGrade: (grade: Grade) => void;
}) {
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);

  function handleGrade(grade: Grade) {
    setSelectedGrade(grade);
    onGrade(grade);
  }

  return (
    <motion.div
      key="review"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="relative flex-1 overflow-y-auto scrollbar-thin bg-void pb-20"
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 py-12 lg:px-8">
        {/* Header Section */}
        <header className="flex flex-col items-center justify-center text-center">
          <p className="mb-4 font-mono text-[10px] font-semibold uppercase tracking-[0.26em] text-primary">
            Session Review
          </p>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {question.title}
          </h2>
          <p className="mt-5 max-w-xl text-base text-secondary/90 leading-relaxed">
            {solutionViewed
              ? 'You reviewed the reference solution. Grade how difficult the concepts felt to accurately lock in your next review interval.'
              : 'Great work executing the requirements. Grade your independent attempt to allow the algorithm to schedule your next review.'}
          </p>
        </header>

        {/* Self-Grade Interactive Section */}
        <section className="mx-auto w-full max-w-2xl px-2">
          {selectedGrade ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-between rounded-2xl border border-border/40 bg-surface/50 p-6 shadow-sm"
            >
              <div>
                <p className="text-sm font-medium text-foreground">Next review scheduled</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your response was recorded as{' '}
                  <span className={cn('font-semibold', GRADE_CONFIG[selectedGrade].textClass)}>
                    {GRADE_CONFIG[selectedGrade].label}
                  </span>
                  .
                </p>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <svg
                  className="h-5 w-5"
                  aria-hidden="true"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </motion.div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-3">
              {(['hard', 'good', 'easy'] as const).map((id) => {
                const cfg = GRADE_CONFIG[id];
                const isSelected = selectedGrade === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleGrade(id)}
                    className={cn(
                      'group relative flex flex-col items-start overflow-hidden rounded-2xl border p-5 text-left transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98]',
                      isSelected ? cfg.activeClass : cfg.defaultClass,
                    )}
                  >
                    <div className="absolute inset-0 bg-white/2 opacity-0 transition-opacity duration-300 group-hover:opacity-100 mix-blend-overlay" />

                    <div className="mb-3 flex items-center gap-3">
                      <span
                        className={cn(
                          'h-2 w-2 rounded-sm transition-all',
                          isSelected ? cfg.dotClass : 'bg-border/60 group-hover:bg-border',
                        )}
                      />
                      <p
                        className={cn(
                          'font-mono text-[11px] font-bold uppercase tracking-wider',
                          isSelected ? cfg.textClass : 'text-foreground',
                        )}
                      >
                        {cfg.label}
                      </p>
                    </div>
                    <p className="text-sm leading-snug text-muted-foreground transition-colors group-hover:text-foreground/90">
                      {cfg.description}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Resources Panel (if any) */}
        {question.resources && question.resources.length > 0 && (
          <div className="mx-auto w-full max-w-2xl px-2">
            <h3 className="mb-4 font-display text-lg font-medium text-foreground">
              Recommended Material
            </h3>
            <div className="rounded-2xl border border-border/40 bg-surface/30 overflow-hidden shadow-xs">
              <ResourcesPanel resources={question.resources} />
            </div>
          </div>
        )}

        {/* View reference solution fallback action */}
        {!solutionViewed && (
          <div className="mx-auto mt-4 w-full flex justify-center">
            <Button
              variant="ghost"
              onClick={onViewSolution}
              className="h-10 rounded-full border border-border/40 bg-surface/30 px-6 text-sm font-medium text-muted-foreground transition-all hover:border-border hover:bg-surface hover:text-foreground"
            >
              Analyze the reference implementation
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function SandpackCodeMirrorEditor({ headerLeft }: { headerLeft?: React.ReactNode }) {
  const { code, updateCode } = useActiveCode();
  const { sandpack } = useSandpack();
  const { activeFile } = sandpack;

  const language = activeFile.endsWith('.html')
    ? 'html'
    : activeFile.endsWith('.ts') || activeFile.endsWith('.tsx')
      ? 'typescript'
      : 'javascript';

  async function handleFormat() {
    try {
      const formatted = await prettier.format(code, {
        parser: 'babel',
        plugins: [prettierBabel, prettierEstree],
        singleQuote: true,
        printWidth: 100,
        trailingComma: 'all',
      });
      updateCode(formatted);
    } catch (e) {
      console.error('Format failed', e);
    }
  }

  function handleReset() {
    sandpack.resetAllFiles();
  }

  return (
    <div className="relative flex-1 min-h-0 h-full w-full flex flex-col overflow-hidden bg-code">
      <div className="flex items-center justify-between border-b border-border/40 bg-surface/50 px-2 py-1.5 shrink-0">
        <div className="flex items-center min-w-0">{headerLeft}</div>
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          <button
            type="button"
            onClick={handleFormat}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-border/40 hover:bg-surface/50 transition-colors text-[10px] font-medium text-muted-foreground active:scale-[0.97]"
            title="Format Code (Shift+Alt+F)"
          >
            Format
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-border/40 hover:bg-surface/50 transition-colors text-[10px] font-medium text-muted-foreground active:scale-[0.97]"
            title="Reset to Starter Code"
          >
            Reset
          </button>
        </div>
      </div>
      <div className="relative flex-1 min-h-0 w-full">
        <CodeMirrorEditor
          key={activeFile}
          path={activeFile}
          value={code}
          onChange={(newCode) => updateCode(newCode || '')}
          language={language as 'html' | 'javascript' | 'typescript'}
        />
      </div>
    </div>
  );
}
