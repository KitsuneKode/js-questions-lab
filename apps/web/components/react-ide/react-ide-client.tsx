'use client';

// Sandpack runs user code inside a cross-origin sandboxed iframe (*.csb.io).
// Executed code cannot access the host page's window, document, localStorage, or cookies.
// No additional security hardening is required — the iframe sandbox handles isolation.

import {
  SandpackConsole,
  SandpackPreview,
  SandpackProvider,
  useSandpack,
} from '@codesandbox/sandpack-react';
import {
  IconArrowRight,
  IconChevronDown,
  IconChevronUp,
  IconCode,
  IconColumns,
  IconEye,
  IconFolder,
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
  const { saveReactAttempt, saveReactSelfGrade, reactState } = useProgress();
  const existingProgress = reactState.questions[question.id];
  const isAlreadyAttempted = (existingProgress?.attempts?.length ?? 0) > 0;

  const [phase, setPhase] = useState<ReactIDEPhase>('read');
  const [solutionViewed, setSolutionViewed] = useState(false);
  const [hasAttempted, setHasAttempted] = useState(false);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('split');
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);

  // useProgress hydrates from localStorage asynchronously — isAlreadyAttempted is false
  // on first render. Correct phase and hasAttempted once the real value is known.
  useEffect(() => {
    if (isAlreadyAttempted) {
      setHasAttempted(true);
      setPhase((prev) => (prev === 'read' ? 'build' : prev));
    }
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
        <div style={{
          padding: '20px',
          backgroundColor: '#0d0d12',
          color: '#ef4444',
          fontFamily: 'JetBrains Mono, ui-monospace, monospace',
          height: '100%',
          minHeight: '100vh',
        }}>
          <h2 style={{ marginBottom: '8px', fontSize: '14px' }}>Runtime Error</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px', opacity: 0.8 }}>{this.state.error?.toString()}</pre>
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

    if (!result['/App.tsx'] && question.entryFile && result[`/${question.entryFile}`]) {
      const importedName = 'Exercise';
      result['/App.tsx'] = {
        code: `import ${importedName} from './${question.entryFile}';\n\nexport default function App() {\n  return <${importedName} />;\n}\n`,
      };
    }

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
        options={{
          activeFile: `/${question.entryFile}`,
          recompileMode: 'delayed',
          recompileDelay: 100,
          initMode: 'immediate',
        }}
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
      <div className="relative z-10 shrink-0 flex-none flex flex-wrap items-center gap-3 border-b border-border/50 bg-background px-4 py-2 lg:px-5">
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
            {/* Layout mode toggle */}
            <div className="hidden items-center rounded-lg border border-border/40 bg-background/60 p-1 lg:inline-flex gap-0.5">
              {layoutOptions.map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => onLayoutModeChange(id)}
                  title={label}
                  className={cn(
                    'min-h-8 min-w-8 rounded-md p-1.5 transition-[color,background-color,transform] duration-150 ease-out active:scale-[0.96]',
                    layoutMode === id
                      ? 'bg-primary/12 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-surface/50',
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
                className="h-7 border border-border/40 bg-transparent px-3 text-xs text-muted-foreground hover:border-border/70 hover:text-foreground transition-[color,background-color,border-color,transform] duration-150 active:scale-[0.97]"
              >
                Solution
              </Button>
            )}
          </div>
        )}
      </div>

      {/* ── Phase content ── */}
      <AnimatePresence mode="wait" initial={false}>
        {phase === 'read' && (
          <motion.div
            key="read"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="relative flex flex-1 w-full min-h-0 overflow-hidden"
          >
            <ReadPhase
              question={question}
              onStartBuilding={() => onPhaseChange('build')}
              isAlreadyAttempted={hasAttempted}
            />
          </motion.div>
        )}

        {phase === 'build' && (
          <motion.div
            key="build"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
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
// READ phase — concept + static preview
// ---------------------------------------------------------------------------

function ReadPhase({
  question,
  onStartBuilding,
  isAlreadyAttempted,
}: {
  question: ReactQuestion;
  onStartBuilding: () => void;
  isAlreadyAttempted: boolean;
}) {
  const entryFileName = question.entryFile;
  const previewCode =
    question.starterCode[entryFileName] ?? Object.values(question.starterCode)[0] ?? '';

  return (
    <div className="flex flex-1 w-full h-full min-h-0 divide-x divide-border/30">
      {/* Left: concept + prompt */}
      <div className="flex flex-col w-full lg:w-[60%] h-full min-h-0 overflow-y-auto scrollbar-thin px-6 py-8 lg:px-10 gap-6">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <span
            className={cn(
              'rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
              question.difficulty === 'beginner'
                ? 'border-green-500/30 bg-green-500/10 text-green-400'
                : question.difficulty === 'intermediate'
                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                  : 'border-red-500/30 bg-red-500/10 text-red-400',
            )}
          >
            {question.difficulty}
          </span>
          <span className="rounded-full border border-border/40 bg-surface/50 px-2.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            {question.category}
          </span>
        </div>

        <h2 className="text-2xl font-semibold text-foreground tracking-tight text-balance shrink-0">
          {question.title}
        </h2>

        {/* Concept */}
        {question.context && (
          <section className="shrink-0">
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-primary/70 mb-3">
              The Concept
            </h3>
            <div className="markdown text-sm leading-relaxed text-muted-foreground/90 prose prose-sm prose-invert max-w-none">
              <Streamdown>{question.context}</Streamdown>
            </div>
          </section>
        )}

        {/* What to build */}
        <section className="shrink-0">
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-primary/70 mb-3">
            What to Build
          </h3>
          <div className="rounded-lg border border-border/50 bg-surface/30 p-4 sm:p-5">
            <div className="markdown text-sm leading-relaxed text-muted-foreground/90 prose prose-sm prose-invert max-w-none">
              <Streamdown>{question.prompt}</Streamdown>
            </div>
          </div>
        </section>

        {/* CTA */}
        {!isAlreadyAttempted && (
          <div className="shrink-0 pt-2">
            <Button onClick={onStartBuilding} className="gap-2 px-5 h-9 text-sm font-medium">
              Start Building
              <IconArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* Right: static code preview (desktop only) */}
      <div className="hidden lg:flex flex-col w-[40%] h-full min-h-0 overflow-hidden bg-code">
        <div className="flex items-center justify-between border-b border-border/40 px-3 py-1.5 shrink-0">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <IconCode className="w-3.5 h-3.5" />
            {entryFileName}
          </span>
          <span className="text-[10px] text-muted-foreground/50">starter</span>
        </div>
        <div className="flex-1 min-h-0 overflow-hidden">
          <CodeMirrorEditor
            value={previewCode}
            onChange={() => {}}
            readOnly
            language={
              entryFileName.endsWith('.html')
                ? 'html'
                : entryFileName.endsWith('.ts') || entryFileName.endsWith('.tsx')
                  ? 'typescript'
                  : 'javascript'
            }
          />
        </div>
      </div>
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
          'rounded-md px-3 py-1 text-[11px] font-medium transition-[color,background-color,transform] duration-150 ease-out active:scale-[0.96]',
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
          'rounded-md px-3 py-1 text-[11px] font-medium transition-[color,background-color,transform] duration-150 ease-out active:scale-[0.96]',
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
  const { sandpack } = useSandpack();
  const hasError = !!sandpack.error;

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
                  viewMode={viewMode}
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
                        className="relative flex items-center gap-1.5 px-2 py-0.5 rounded border border-border/40 hover:bg-surface/50 transition-colors text-[10px] font-medium text-muted-foreground"
                      >
                        <IconTerminal2 className="w-3 h-3" />
                        Console
                        {/* Error badge */}
                        {hasError && !isConsoleOpen && (
                          <span className="absolute -top-1 -right-1 h-1.5 w-1.5 rounded-full bg-danger" />
                        )}
                        {/* Chevron cross-fade */}
                        <span className="relative h-3 w-3">
                          <IconChevronDown
                            className={cn(
                              'absolute inset-0 w-3 h-3 transition-[opacity,transform] duration-150',
                              isConsoleOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-75',
                            )}
                          />
                          <IconChevronUp
                            className={cn(
                              'absolute inset-0 w-3 h-3 transition-[opacity,transform] duration-150',
                              isConsoleOpen ? 'opacity-0 scale-75' : 'opacity-100 scale-100',
                            )}
                          />
                        </span>
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
                      {hasError && <span className="h-1.5 w-1.5 rounded-full bg-danger" />}
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
                  {hasError && <span className="h-1.5 w-1.5 rounded-full bg-danger" />}
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
      Solution — Reference Only
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
          <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl text-balance">
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
              {(['hard', 'good', 'easy'] as const).map((id, index) => {
                const cfg = GRADE_CONFIG[id];
                const isSelected = selectedGrade === id;
                return (
                  <motion.button
                    key={id}
                    type="button"
                    onClick={() => handleGrade(id)}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.08, ease: 'easeOut' }}
                    className={cn(
                      'group relative flex flex-col items-start overflow-hidden rounded-2xl border p-5 text-left',
                      'transition-[colors,transform,box-shadow] duration-150 ease-out hover:scale-[1.01] active:scale-[0.98]',
                      isSelected ? cfg.activeClass : cfg.defaultClass,
                    )}
                  >
                    <div className="absolute inset-0 bg-white/2 opacity-0 transition-opacity duration-300 group-hover:opacity-100 mix-blend-overlay" />

                    <div className="mb-3 flex items-center gap-3">
                      <span
                        className={cn(
                          'h-2 w-2 rounded-sm transition-colors duration-150',
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
                  </motion.button>
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
              className="h-10 rounded-full border border-border/40 bg-surface/30 px-6 text-sm font-medium text-muted-foreground transition-[color,background-color,border-color] duration-150 hover:border-border hover:bg-surface hover:text-foreground"
            >
              Analyze the reference implementation
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Editor (CodeMirror bridge to Sandpack)
// ---------------------------------------------------------------------------

function SandpackCodeMirrorEditor({
  headerLeft,
  viewMode,
}: {
  headerLeft?: React.ReactNode;
  viewMode: 'problem' | 'solution';
}) {
  const { sandpack } = useSandpack();
  const { files, activeFile, updateFile } = sandpack;
  const code = files[activeFile]?.code || '';

  const language = activeFile.endsWith('.html')
    ? 'html'
    : activeFile.endsWith('.ts') || activeFile.endsWith('.tsx')
      ? 'typescript'
      : 'javascript';

  const isReadOnly = viewMode === 'solution';

  async function handleFormat() {
    if (isReadOnly) return;
    try {
      const formatted = await prettier.format(code, {
        parser: 'babel',
        plugins: [prettierBabel, prettierEstree],
        singleQuote: true,
        printWidth: 100,
        trailingComma: 'all',
      });
      updateFile(activeFile, formatted);
    } catch (e) {
      console.error('Format failed', e);
    }
  }

  function handleReset() {
    if (isReadOnly) return;
    sandpack.resetAllFiles();
  }

  return (
    <div className="relative flex-1 min-h-0 h-full w-full flex flex-col overflow-hidden bg-code">
      <div className="flex items-center justify-between border-b border-border/40 bg-surface/50 px-2 py-1.5 shrink-0">
        <div className="flex items-center min-w-0">{headerLeft}</div>
        {!isReadOnly && (
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
        )}
      </div>
      <div className="relative flex-1 min-h-0 w-full">
        <CodeMirrorEditor
          key={activeFile}
          path={activeFile}
          value={code}
          onChange={(newCode) => updateFile(activeFile, newCode)}
          language={language as 'html' | 'javascript' | 'typescript'}
          readOnly={isReadOnly}
        />
      </div>
    </div>
  );
}
