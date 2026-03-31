'use client';

import {
  IconActivity as Activity,
  IconBookmark as Bookmark,
  IconCircleCheck as CheckCircle2,
  IconChevronDown as ChevronDown,
  IconChevronLeft as ChevronLeft,
  IconChevronRight as ChevronRight,
  IconAlertCircle as CircleAlert,
  IconEye as Eye,
  IconPlayerPlay as Play,
  IconSparkles as Sparkles,
  IconTerminal2 as Terminal,
  IconBolt as Zap,
} from '@tabler/icons-react';
import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import { Streamdown } from 'streamdown';
import { MonacoCodeEditor } from '@/components/editor/monaco-code-editor';
import { DomEventSimulator } from '@/components/ide/dom-event-simulator';
import { KeyboardHintBar } from '@/components/ide/keyboard-hint-bar';
import { useScratchpad } from '@/components/scratchpad/scratchpad-context';
import { TerminalOutput } from '@/components/terminal/terminal-output';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  VisuallyHidden,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable-panel';
import { TimelineChart } from '@/components/visualization/timeline-chart';
import { VisualDebugger } from '@/components/visualization/visual-debugger';
import type { QuestionRecord } from '@/lib/content/types';
import { useQuestionKeyboard } from '@/lib/keyboard/use-question-keyboard';
import { useQuestionProgress } from '@/lib/progress/use-question-progress';
import { runJavaScriptInEnhancedSandbox } from '@/lib/run/sandbox';
import type { TerminalLogEntry } from '@/lib/run/terminal';
import { getPrimaryErrorMessage, toTerminalLogEntries } from '@/lib/run/terminal';
import type { EnhancedTimelineEvent, TimelineEvent } from '@/lib/run/types';

type QuestionRuntimeKind = 'javascript' | 'dom-click-propagation' | 'static';

type RuntimeAwareQuestion = QuestionRecord & {
  runtime?: {
    kind?: QuestionRuntimeKind;
  };
};

interface QuestionIDEClientProps {
  question: RuntimeAwareQuestion;
  prevId: number | null;
  nextId: number | null;
  locale?: string;
}

const EDITOR_DEFAULT_CODE = `// Write your code here
// Press Ctrl/Cmd + Enter to run

console.log("Hello, JavaScript!");

const arr = [1, 2, 3, 4, 5];
const sum = arr.reduce((a, b) => a + b, 0);
console.log("Sum:", sum);
`;

function inferRuntimeKind(question: RuntimeAwareQuestion): QuestionRuntimeKind {
  if (question.runtime?.kind) {
    return question.runtime.kind;
  }

  const hasJavascriptSnippet = question.codeBlocks.some(
    (block) => block.language === 'javascript' || block.language === 'js',
  );

  if (hasJavascriptSnippet || question.runnable) {
    return 'javascript';
  }

  const hasInlineDomClickSnippet = question.codeBlocks.some(
    (block) => block.language === 'html' && /onclick\s*=/.test(block.code),
  );

  if (hasInlineDomClickSnippet && (question.id === 31 || question.id === 32)) {
    return 'dom-click-propagation';
  }

  return 'static';
}

export function QuestionIDEClient({ question, prevId, nextId, locale }: QuestionIDEClientProps) {
  const [selected, setSelected] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [isRecallMode, setIsRecallMode] = useState(false);
  const [recallAnswer, setRecallAnswer] = useState('');
  const [hasSubmittedRecall, setHasSubmittedRecall] = useState(false);
  const [selfGrade, setSelfGrade] = useState<'hard' | 'good' | 'easy' | null>(null);
  const [explanationVisible, setExplanationVisible] = useState(true);

  const cleanPromptMarkdown = question.promptMarkdown
    .replace(/```[a-z]*\n[\s\S]*?\n```/g, '')
    .trim();
  const primaryCodeBlock = question.codeBlocks[0] ?? null;
  const javascriptCodeBlock = useMemo(
    () =>
      question.codeBlocks.find(
        (block) => block.language === 'javascript' || block.language === 'js',
      ) ?? null,
    [question.codeBlocks],
  );
  const runtimeKind = inferRuntimeKind(question);
  const isJavascriptRuntime = runtimeKind === 'javascript';
  const isDomEventRuntime = runtimeKind === 'dom-click-propagation';
  const questionCode = isJavascriptRuntime
    ? (javascriptCodeBlock?.code ?? EDITOR_DEFAULT_CODE)
    : (primaryCodeBlock?.code ?? '');
  const codePanelTitle =
    primaryCodeBlock?.language === 'html'
      ? 'Question HTML'
      : isJavascriptRuntime
        ? 'Question Code'
        : 'Question Snippet';
  const editorLanguage = primaryCodeBlock?.language === 'html' ? 'html' : 'javascript';
  const editorPath = `question-${question.id}.${editorLanguage === 'html' ? 'html' : 'js'}`;
  const linkPrefix = locale ? `/${locale}` : '';

  const { openScratchpad } = useScratchpad();
  const [logs, setLogs] = useState<TerminalLogEntry[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [enhancedTimeline, setEnhancedTimeline] = useState<EnhancedTimelineEvent[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [runnerError, setRunnerError] = useState<string | null>(null);
  const [_debuggerMode, setDebuggerMode] = useState<'timeline' | 'visual'>('timeline');

  const { item, saveAttempt, toggleBookmark, saveSelfGrade } = useQuestionProgress(question.id);

  const isAnswered = selected !== null || hasSubmittedRecall;
  const isCorrect = selected !== null ? selected === question.correctOption : hasSubmittedRecall;

  const hasAsyncEvents = useMemo(() => {
    return (
      isJavascriptRuntime &&
      timeline.some((event) => event.kind === 'macro' || event.kind === 'micro')
    );
  }, [isJavascriptRuntime, timeline]);

  const runCode = useCallback(async () => {
    if (!isJavascriptRuntime || !javascriptCodeBlock?.code.trim()) {
      return;
    }

    if (!isAnswered) {
      return;
    }

    setIsRunning(true);
    setLogs([]);
    setTimeline([]);
    setEnhancedTimeline([]);
    setRunnerError(null);

    try {
      // Use enhanced sandbox for Visual Debugger support
      const result = await runJavaScriptInEnhancedSandbox(javascriptCodeBlock.code, {
        enableTracing: true,
      });
      setLogs(toTerminalLogEntries(result));
      setTimeline(result.timeline);
      setEnhancedTimeline(result.enhancedTimeline);

      if (result.errors.length > 0 && result.logs.length === 0) {
        setRunnerError(getPrimaryErrorMessage(result.errors[0]));
      } else {
        setRunnerError(null);
      }
    } catch (error) {
      const message = String(error);
      setRunnerError(message);
      setLogs([{ type: 'error', content: message, timestamp: Date.now() }]);
    } finally {
      setIsRunning(false);
    }
  }, [isAnswered, isJavascriptRuntime, javascriptCodeBlock]);

  const handleRecallSubmit = useCallback(() => {
    if (!recallAnswer.trim()) return;
    if (!question.correctOption) {
      setHasSubmittedRecall(true);
      return;
    }
    setHasSubmittedRecall(true);
    saveAttempt(question.correctOption, 'correct');
  }, [recallAnswer, question.correctOption, saveAttempt]);

  const handleSelfGrade = useCallback(
    (grade: 'hard' | 'good' | 'easy') => {
      setSelfGrade(grade);
      saveSelfGrade(grade);
    },
    [saveSelfGrade],
  );

  const handleOptionSelect = useCallback(
    (key: string) => {
      if (isAnswered) return;
      const optionKey = key as 'A' | 'B' | 'C' | 'D';
      setSelected(optionKey);
      saveAttempt(optionKey, key === question.correctOption ? 'correct' : 'incorrect');
    },
    [isAnswered, question.correctOption, saveAttempt],
  );

  const prevHref = prevId ? `${linkPrefix}/questions/${prevId}` : null;
  const nextHref = nextId ? `${linkPrefix}/questions/${nextId}` : null;

  useQuestionKeyboard({
    isAnswered,
    options: question.options,
    prevHref,
    nextHref,
    onSelectOption: handleOptionSelect,
    onRevealToggle: () => setExplanationVisible((v) => !v),
    onRunCode: isJavascriptRuntime ? runCode : undefined,
    onOpenScratchpad: isJavascriptRuntime
      ? () => openScratchpad(questionCode, 'replace')
      : undefined,
  });

  return (
    <div className="h-full min-h-0 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 bg-linear-to-r from-background via-background to-muted/5 px-6 py-4 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-lg font-semibold tracking-tight text-foreground uppercase">
                {question.tags[0] || 'JavaScript'} Practice
              </h1>
              <Badge
                variant="secondary"
                className="px-2 py-0.5 text-[10px] uppercase tracking-widest opacity-80"
              >
                #{question.id}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="px-2 py-0.5 text-[10px] uppercase tracking-widest border-border/60"
              >
                {question.difficulty}
              </Badge>
              {question.tags.slice(1, 3).map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="bg-muted/30 px-2 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {prevId && (
            <Link href={prevHref ?? '#'}>
              <Button
                variant="secondary"
                size="sm"
                className="h-9 gap-2 px-4 text-xs font-medium active:scale-[0.97] transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </Button>
            </Link>
          )}
          <Button
            variant={item.bookmarked ? 'default' : 'secondary'}
            size="sm"
            onClick={toggleBookmark}
            className="h-9 gap-2 px-4 text-xs font-medium active:scale-[0.97] transition-all"
          >
            <Bookmark className={`h-4 w-4 ${item.bookmarked ? 'fill-current' : ''}`} />
            {item.bookmarked ? 'Saved' : 'Save'}
          </Button>
          {nextId && (
            <Link href={nextHref ?? '#'}>
              <Button
                variant="secondary"
                size="sm"
                className="h-9 gap-2 px-4 text-xs font-medium active:scale-[0.97] transition-all"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* IDE Layout */}
      <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0">
        {/* Left: Question & Context */}
        <ResizablePanel defaultSize={40} minSize={25} className="flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="space-y-4">
              <h2 className="font-display text-2xl font-medium tracking-tight text-foreground">
                {question.title}
              </h2>
              {cleanPromptMarkdown && (
                <div className="markdown text-sm leading-relaxed text-muted-foreground/90">
                  <Streamdown>{cleanPromptMarkdown}</Streamdown>
                </div>
              )}
            </div>

            {primaryCodeBlock && (
              <div className="flex h-[18rem] flex-col overflow-hidden rounded-xl border border-border/30 bg-[#1e1e1e] md:h-[22rem]">
                <div className="flex items-center justify-between px-3 py-1.5 bg-muted/20 border-b border-border/30">
                  <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                    {codePanelTitle}
                  </span>
                  <div className="flex items-center gap-2">
                    {isJavascriptRuntime ? (
                      <>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-[10px] gap-1 px-2"
                            >
                              Scratchpad <ChevronDown className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={() => openScratchpad(questionCode, 'replace')}
                            >
                              <Terminal className="h-4 w-4 mr-2" />
                              Open Scratchpad
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => openScratchpad(questionCode, 'append')}
                            >
                              <Terminal className="h-4 w-4 mr-2" />
                              Append to Scratchpad
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <Button
                          size="sm"
                          onClick={runCode}
                          disabled={!isAnswered || isRunning}
                          className="h-6 text-[10px] gap-1"
                        >
                          <Play className="h-3 w-3" />
                          {isRunning ? 'Running...' : 'Run Code'}
                        </Button>
                      </>
                    ) : isDomEventRuntime ? (
                      <Badge
                        variant="secondary"
                        className="bg-primary/10 text-[10px] uppercase tracking-widest text-primary"
                      >
                        DOM Replay
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="bg-muted/30 text-[10px] uppercase tracking-widest text-muted-foreground"
                      >
                        Static
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="min-h-0 flex-1 overflow-hidden">
                  <MonacoCodeEditor
                    path={editorPath}
                    value={questionCode}
                    onChange={() => {}}
                    language={editorLanguage}
                    readOnly
                  />
                </div>
              </div>
            )}

            {primaryCodeBlock && (
              <p className="mt-2 text-[11px] text-muted-foreground/65">
                {isJavascriptRuntime
                  ? !isAnswered
                    ? 'Submit an answer first to unlock the isolated worker runtime and event-loop tools.'
                    : runnerError
                      ? `Last run failed: ${runnerError}`
                      : 'Run the snippet here or send it to Scratchpad to experiment without losing the original.'
                  : isDomEventRuntime
                    ? !isAnswered
                      ? 'Submit an answer first to unlock the DOM event replay for this snippet.'
                      : 'Use the replay panel below to inspect event.target, currentTarget, and bubbling order.'
                    : 'This snippet is shown for context only. No interactive runtime is attached to this question.'}
              </p>
            )}

            {isJavascriptRuntime && primaryCodeBlock && (
              <div className="mt-4 flex flex-col h-48 rounded-lg overflow-hidden border border-border/30 bg-black/40">
                <TerminalOutput
                  logs={logs}
                  isRunning={isRunning}
                  emptyMessage={
                    !isAnswered
                      ? 'Answer first to unlock the isolated worker runtime.'
                      : runnerError
                        ? runnerError
                        : 'Run code to inspect the output.'
                  }
                />
              </div>
            )}

            {isDomEventRuntime && primaryCodeBlock && (
              <div className="mt-4">
                <DomEventSimulator html={questionCode} unlocked={isAnswered} />
              </div>
            )}

            <AnimatePresence>
              {isJavascriptRuntime && primaryCodeBlock && isAnswered && hasAsyncEvents && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
                  className="overflow-hidden"
                >
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="secondary"
                          className="flex-1 gap-2 text-xs border border-primary/50 bg-primary/10 text-primary shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:bg-primary/20 transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                          onClick={() => setDebuggerMode('timeline')}
                        >
                          <Activity className="h-3 w-3" />
                          Event Loop Replay
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-h-[88vh] w-[96vw] max-w-5xl sm:max-w-5xl lg:max-w-6xl overflow-y-auto border-border-subtle bg-surface p-4 md:p-6 shadow-glow">
                        <DialogHeader>
                          <DialogTitle>Event Loop Replay</DialogTitle>
                        </DialogHeader>
                        <div className="mt-4 pb-2">
                          <TimelineChart events={timeline} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-4">
                          Simple timeline view of macro/micro tasks. For detailed expression-level
                          tracing, use the Visual Debugger.
                        </p>
                      </DialogContent>
                    </Dialog>

                    <Dialog
                      open={_debuggerMode === 'visual'}
                      onOpenChange={(open) => setDebuggerMode(open ? 'visual' : 'timeline')}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="secondary"
                          className="flex-1 gap-2 text-xs border border-violet-500/50 bg-violet-500/10 text-violet-300 shadow-[0_0_20px_rgba(139,92,246,0.2)] hover:bg-violet-500/20 transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                          onClick={() => setDebuggerMode('visual')}
                        >
                          <Eye className="h-3 w-3" />
                          Visual Debugger
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-h-[95vh] w-[98vw] max-w-[1800px] p-0 bg-[#0A0A0A] border-border-subtle overflow-hidden">
                        <DialogTitle>
                          <VisuallyHidden>Visual Debugger</VisuallyHidden>
                        </DialogTitle>
                        <div className="h-[calc(95vh-3rem)] overflow-auto">
                          <VisualDebugger
                            code={javascriptCodeBlock?.code ?? ''}
                            enhancedTimeline={enhancedTimeline}
                            logs={logs.map((l) => `[${l.type}] ${l.content}`)}
                          />
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ResizablePanel>

        <ResizableHandle className="w-px bg-border/60 hover:bg-primary/50 transition-colors" />

        {/* Right: Practice Area */}
        <ResizablePanel defaultSize={60} minSize={35} className="flex flex-col">
          <div className="flex h-full flex-col overflow-hidden bg-background">
            <div className="border-b border-border/40 bg-muted/10 py-4 px-6 shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {isRecallMode ? 'Active Recall' : 'Select Answer'}
                </h3>
                {!isAnswered && (
                  <button
                    type="button"
                    onClick={() => setIsRecallMode(!isRecallMode)}
                    className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-primary/80 hover:text-primary transition-colors"
                  >
                    <Zap className="h-3 w-3" />
                    {isRecallMode ? 'Quiz Mode' : 'Hard Mode'}
                  </button>
                )}
              </div>
            </div>
            <div className="flex-1 p-6 overflow-y-auto">
              {!isRecallMode ? (
                <div className="grid gap-2">
                  {question.options.map((option) => {
                    const disabled = isAnswered;
                    const picked = selected === option.key;
                    const correct = option.key === question.correctOption;

                    let optionStyles =
                      'border-border/40 bg-black/20 text-foreground/80 hover:bg-muted/30 hover:border-border/80';
                    if (isAnswered) {
                      if (correct) {
                        optionStyles =
                          'border-success/50 bg-success/10 text-success ring-1 ring-success/30';
                      } else if (picked) {
                        optionStyles =
                          'border-danger/50 bg-danger/10 text-danger ring-1 ring-danger/30';
                      } else {
                        optionStyles =
                          'border-border/20 bg-black/10 text-muted-foreground/40 opacity-50';
                      }
                    }

                    return (
                      <button
                        key={option.key}
                        type="button"
                        disabled={disabled}
                        onClick={() => handleOptionSelect(option.key)}
                        className={`group flex items-start gap-3 rounded-lg border p-3 text-left text-sm transition-all duration-200 ${optionStyles} ${
                          !disabled
                            ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:translate-y-0'
                            : 'cursor-default'
                        }`}
                      >
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs font-bold ${
                            picked || (correct && isAnswered)
                              ? 'border-current bg-current/10'
                              : 'border-border/50 bg-black/20 group-hover:border-border'
                          }`}
                        >
                          {option.key}
                        </span>
                        <span className="flex-1 leading-snug">{option.text}</span>
                        {isAnswered && correct && (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                        )}
                        {isAnswered && picked && !correct && (
                          <CircleAlert className="h-4 w-4 shrink-0 text-danger" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-4">
                  <textarea
                    value={recallAnswer}
                    onChange={(e) => setRecallAnswer(e.target.value)}
                    disabled={isAnswered}
                    placeholder="Type the exact output..."
                    className="w-full min-h-[100px] resize-none rounded-lg border border-border/50 bg-[#0a0a0c] p-3 font-mono text-sm text-foreground placeholder:text-muted-foreground/30 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                  {!isAnswered && (
                    <Button onClick={handleRecallSubmit} className="w-full" size="sm">
                      Submit Answer
                    </Button>
                  )}
                </div>
              )}

              <AnimatePresence>
                {isAnswered && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-6 space-y-6 overflow-hidden"
                  >
                    {/* Explanation visibility toggle */}
                    <button
                      type="button"
                      onClick={() => setExplanationVisible((v) => !v)}
                      className="flex w-full items-center justify-between rounded-lg border border-border/30 bg-muted/10 px-3 py-2 text-[11px] font-medium uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <span>{explanationVisible ? 'Hide Explanation' : 'Show Explanation'}</span>
                      <span className="font-mono text-[9px] opacity-50">Space</span>
                    </button>
                    <div
                      className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${
                        isCorrect
                          ? 'border-success/30 bg-success/5 text-success'
                          : 'border-danger/30 bg-danger/5 text-danger'
                      }`}
                    >
                      {isCorrect ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <CircleAlert className="h-4 w-4" />
                      )}
                      <span>{isCorrect ? 'Correct!' : `Answer: ${question.correctOption}`}</span>
                    </div>

                    <AnimatePresence>
                      {explanationVisible && (
                        <motion.div
                          key="explanation"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-linear-to-b from-card/60 to-background/80 p-6">
                            <div className="absolute top-0 right-0 p-4 opacity-5">
                              <Sparkles className="h-20 w-20" />
                            </div>
                            <h3 className="mb-4 font-display text-lg font-medium tracking-tight text-foreground flex items-center gap-2">
                              <CheckCircle2 className="h-5 w-5 text-primary" />
                              Explanation
                            </h3>
                            <div className="markdown text-sm leading-relaxed text-muted-foreground/80">
                              <Streamdown>{question.explanationMarkdown}</Streamdown>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="grid grid-cols-3 gap-2">
                      {(['hard', 'good', 'easy'] as const).map((grade) => (
                        <button
                          key={grade}
                          type="button"
                          onClick={() => handleSelfGrade(grade)}
                          className={`rounded-lg border p-2 text-center text-xs font-medium uppercase transition-all ${
                            selfGrade === grade
                              ? grade === 'hard'
                                ? 'border-danger/50 bg-danger/20 text-danger'
                                : grade === 'good'
                                  ? 'border-warning/50 bg-warning/20 text-warning'
                                  : 'border-success/50 bg-success/20 text-success'
                              : 'border-border/40 bg-card hover:bg-muted/40 text-muted-foreground'
                          }`}
                        >
                          {grade}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      <KeyboardHintBar
        isAnswered={isAnswered}
        isRunnable={isJavascriptRuntime}
        hasPrev={!!prevId}
        hasNext={!!nextId}
      />
    </div>
  );
}
