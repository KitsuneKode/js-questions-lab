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
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Streamdown } from 'streamdown';
import { MonacoCodeEditor } from '@/components/editor/monaco-code-editor';
import { DomEventSimulator } from '@/components/ide/dom-event-simulator';
import { KeyboardHintBar } from '@/components/ide/keyboard-hint-bar';
import { ResourcesPanel } from '@/components/ide/resources-panel';
import { IntentPrefetchLink } from '@/components/intent-prefetch-link';
import { useScratchpad } from '@/components/scratchpad/scratchpad-context';
import { TerminalOutput } from '@/components/terminal/terminal-output';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  applyServerFilters,
  applyStatusFilter,
  buildQuestionScopeQuery,
  parseQuestionScope,
} from '@/lib/content/query';
import type { QuestionDiscoveryItem, QuestionRecord } from '@/lib/content/types';
import { useQuestionKeyboard } from '@/lib/keyboard/use-question-keyboard';
import { useProgress } from '@/lib/progress/progress-context';
import { useSectionProgressStore } from '@/lib/progress/section-progress-store';
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
  locale?: string;
  questionIndex?: QuestionDiscoveryItem[];
  breadcrumbs?: React.ReactNode;
}

const EDITOR_DEFAULT_CODE = `// Write your code here
// Press Ctrl/Cmd + Enter to run

console.log("Hello, JavaScript!");

const arr = [1, 2, 3, 4, 5];
const sum = arr.reduce((a, b) => a + b, 0);
console.log("Sum:", sum);
`;

const selfGradeLabelKeys = {
  hard: 'gradeHard',
  good: 'gradeGood',
  easy: 'gradeEasy',
} as const;

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

export function QuestionIDEClient({
  question,
  locale,
  questionIndex = [],
  breadcrumbs,
}: QuestionIDEClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scope = useMemo(() => {
    const params: Record<string, string | string[]> = {};
    for (const key of searchParams.keys()) {
      const values = searchParams.getAll(key);
      params[key] = values.length > 1 ? values : (values[0] ?? '');
    }
    return parseQuestionScope(params);
  }, [searchParams]);

  const { state: progress, ready: progressReady } = useProgress();
  const [preferredMode, setPreferredMode] = useState<'quiz' | 'hard'>('quiz');
  const isRecallMode = preferredMode === 'hard';

  const [selected, setSelected] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [recallAnswer, setRecallAnswer] = useState('');
  const [hasSubmittedRecall, setHasSubmittedRecall] = useState(false);
  const [isRecallCorrect, setIsRecallCorrect] = useState<boolean | null>(null);
  const [selfGrade, setSelfGrade] = useState<'hard' | 'good' | 'easy' | null>(null);
  const [explanationVisible, setExplanationVisible] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorType, setErrorType] = useState('');

  const updateSection = useSectionProgressStore((state) => state.updateSection);
  const markQuestionAnswered = useSectionProgressStore((state) => state.markQuestionAnswered);
  const primaryTag = question.tags[0];
  const t = useTranslations('ide');
  const tQuestion = useTranslations('question');
  const tScratchpad = useTranslations('scratchpad');

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
  const [hasRunOnce, setHasRunOnce] = useState(false);
  const [runnerError, setRunnerError] = useState<string | null>(null);
  const [_debuggerMode, setDebuggerMode] = useState<'timeline' | 'visual'>('timeline');
  const wasAnsweredRef = useRef(false);

  const { item, saveAttempt, toggleBookmark, saveSelfGrade } = useQuestionProgress(question.id);
  const [frozenStatusScope, setFrozenStatusScope] = useState<{
    key: string;
    ids: number[];
  } | null>(null);

  const isAnswered = selected !== null || hasSubmittedRecall;
  const isCorrect =
    selected !== null ? selected === question.correctOption : isRecallCorrect === true;

  const hasAsyncEvents = useMemo(() => {
    return (
      isJavascriptRuntime &&
      timeline.some((event) => event.kind === 'macro' || event.kind === 'micro')
    );
  }, [isJavascriptRuntime, timeline]);

  // Compute question counts per tag from questionIndex for progress tracking
  const tagQuestionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    questionIndex.forEach((q) => {
      (q.tags || []).forEach((tag) => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
    return counts;
  }, [questionIndex]);

  const runCode = useCallback(async () => {
    if (isRunning) {
      return;
    }

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
      setHasRunOnce(true);
      setIsRunning(false);
    }
  }, [isAnswered, isJavascriptRuntime, javascriptCodeBlock, isRunning]);

  const handleRecallSubmit = useCallback(() => {
    if (!recallAnswer.trim()) return;
    if (!question.correctOption) {
      setHasSubmittedRecall(true);
      return;
    }

    const correctKey = question.correctOption.toLowerCase();
    const correctOpt = question.options.find((o) => o.key === question.correctOption);
    const recallStr = recallAnswer.trim().toLowerCase();

    // Check if what they typed exactly matches the key or the text
    const isStrictMatch =
      recallStr === correctKey ||
      recallStr === `option ${correctKey}` ||
      (correctOpt !== undefined && recallStr === correctOpt.text.toLowerCase().trim());

    setHasSubmittedRecall(true);
    setIsRecallCorrect(isStrictMatch);
    saveAttempt(null, isStrictMatch ? 'correct' : 'incorrect', {
      difficulty: question.difficulty,
      recallAnswer,
      locale,
    });

    // Update section progress
    if (primaryTag) {
      const existing = useSectionProgressStore.getState().sections[primaryTag];
      if (!existing || existing.totalQuestions === 0) {
        updateSection(primaryTag, { totalQuestions: tagQuestionCounts[primaryTag] || 1 });
      }
      markQuestionAnswered(primaryTag, isStrictMatch);
    }
  }, [
    recallAnswer,
    question.correctOption,
    question.options,
    question.difficulty,
    saveAttempt,
    primaryTag,
    updateSection,
    markQuestionAnswered,
    tagQuestionCounts,
    locale,
  ]);

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
      const isCorrect = key === question.correctOption;
      saveAttempt(optionKey, isCorrect ? 'correct' : 'incorrect', {
        difficulty: question.difficulty,
        locale,
      });
      // Update section progress using markQuestionAnswered for proper incrementing
      if (primaryTag) {
        // Initialize totalQuestions if first answer in this tag
        const existing = useSectionProgressStore.getState().sections[primaryTag];
        if (!existing || existing.totalQuestions === 0) {
          updateSection(primaryTag, { totalQuestions: tagQuestionCounts[primaryTag] || 1 });
        }
        // Increment answered/correct counts
        markQuestionAnswered(primaryTag, isCorrect);
      }
    },
    [
      isAnswered,
      question.correctOption,
      question.difficulty,
      saveAttempt,
      primaryTag,
      updateSection,
      markQuestionAnswered,
      tagQuestionCounts,
      locale,
    ],
  );

  const filterQuery = useMemo(
    () => buildQuestionScopeQuery(scope, { includePage: false }),
    [scope],
  );
  const staticScopedQuestions = useMemo(
    () => applyServerFilters(questionIndex, scope),
    [questionIndex, scope],
  );
  const staticScopedIds = useMemo(
    () => staticScopedQuestions.map((scopedQuestion) => scopedQuestion.id),
    [staticScopedQuestions],
  );
  const liveStatusScopedIds = useMemo(
    () =>
      applyStatusFilter(staticScopedQuestions, scope.status, progress.questions).map(
        (scopedQuestion) => scopedQuestion.id,
      ),
    [progress.questions, scope.status, staticScopedQuestions],
  );
  const allQuestionIds = useMemo(
    () => questionIndex.map((availableQuestion) => availableQuestion.id),
    [questionIndex],
  );

  useEffect(() => {
    if (scope.status === 'all') {
      setFrozenStatusScope((current) => (current === null ? current : null));
      return;
    }

    if (!progressReady) {
      return;
    }

    setFrozenStatusScope((current) => {
      if (current?.key === filterQuery) {
        return current;
      }

      return {
        key: filterQuery,
        ids: liveStatusScopedIds,
      };
    });
  }, [filterQuery, liveStatusScopedIds, progressReady, scope.status]);

  const scopedNavigationIds = useMemo(() => {
    if (scope.status !== 'all' && !progressReady) {
      return [];
    }

    if (scope.status === 'all') {
      return staticScopedIds;
    }

    if (frozenStatusScope?.key === filterQuery) {
      return frozenStatusScope.ids;
    }

    return liveStatusScopedIds;
  }, [
    filterQuery,
    frozenStatusScope,
    liveStatusScopedIds,
    progressReady,
    scope.status,
    staticScopedIds,
  ]);

  const navigationIds = useMemo(() => {
    if (scope.status !== 'all' && !progressReady) {
      return [];
    }

    if (scopedNavigationIds.includes(question.id)) {
      return scopedNavigationIds;
    }

    if (staticScopedIds.includes(question.id)) {
      return staticScopedIds;
    }

    return allQuestionIds;
  }, [
    allQuestionIds,
    progressReady,
    question.id,
    scope.status,
    scopedNavigationIds,
    staticScopedIds,
  ]);

  const currentIndex = navigationIds.indexOf(question.id);
  const prevId = currentIndex > 0 ? navigationIds[currentIndex - 1] : null;
  const nextId =
    currentIndex >= 0 && currentIndex < navigationIds.length - 1
      ? navigationIds[currentIndex + 1]
      : null;
  const prevHref = prevId
    ? `${linkPrefix}/questions/${prevId}${filterQuery ? `?${filterQuery}` : ''}`
    : null;
  const nextHref = nextId
    ? `${linkPrefix}/questions/${nextId}${filterQuery ? `?${filterQuery}` : ''}`
    : null;

  useEffect(() => {
    if (prevHref) {
      router.prefetch(prevHref);
    }

    if (nextHref) {
      router.prefetch(nextHref);
    }
  }, [nextHref, prevHref, router]);

  useEffect(() => {
    const justAnswered = !wasAnsweredRef.current && isAnswered;
    wasAnsweredRef.current = isAnswered;

    if (!justAnswered) return;
    if (!isJavascriptRuntime) return;
    if (!javascriptCodeBlock?.code.trim()) return;

    void runCode();
  }, [isAnswered, isJavascriptRuntime, javascriptCodeBlock, runCode]);

  useQuestionKeyboard({
    isAnswered,
    options: question.options,
    prevHref,
    nextHref,
    onSelectOption: handleOptionSelect,
    onRevealToggle: () => setExplanationVisible((v) => !v),
    onRunCode: isJavascriptRuntime ? runCode : undefined,
    onOpenSearch: questionIndex.length > 0 ? () => setSearchOpen(true) : undefined,
  });

  return (
    <div className="h-full min-h-0 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 bg-linear-to-r from-background via-background to-muted/5 px-6 py-4 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-lg font-semibold tracking-tight text-foreground uppercase">
                {question.tags[0] || 'JavaScript'} {t('practice')}
              </h1>
              <Badge
                variant="secondary"
                className="px-2 py-0.5 text-[10px] uppercase tracking-widest opacity-80"
                style={{ viewTransitionName: `question-num-${question.id}` }}
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
            <IntentPrefetchLink href={prevHref ?? '#'}>
              <Button
                variant="secondary"
                size="sm"
                className="h-9 gap-2 px-4 text-xs font-medium active:scale-[0.97] transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
                {tQuestion('prev')}
              </Button>
            </IntentPrefetchLink>
          )}
          <Button
            variant={item.bookmarked ? 'default' : 'secondary'}
            size="sm"
            onClick={toggleBookmark}
            className="h-9 gap-2 px-4 text-xs font-medium active:scale-[0.97] transition-all"
          >
            <Bookmark className={`h-4 w-4 ${item.bookmarked ? 'fill-current' : ''}`} />
            {item.bookmarked ? tQuestion('saved') : tQuestion('save')}
          </Button>
          {nextId && (
            <IntentPrefetchLink href={nextHref ?? '#'}>
              <Button
                variant="secondary"
                size="sm"
                className="h-9 gap-2 px-4 text-xs font-medium active:scale-[0.97] transition-all"
              >
                {tQuestion('next')}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </IntentPrefetchLink>
          )}
        </div>
      </div>

      {/* IDE Layout */}
      <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0">
        {/* Left: Question & Context */}
        <ResizablePanel defaultSize={40} minSize={25} className="flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {breadcrumbs && <div className="-mt-2 mb-4">{breadcrumbs}</div>}
            <div className="space-y-4">
              <h2
                className="font-display text-2xl font-medium tracking-tight text-foreground"
                style={{ viewTransitionName: `question-title-${question.id}` }}
              >
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
                              {tScratchpad('open')}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => openScratchpad(questionCode, 'append')}
                            >
                              <Terminal className="h-4 w-4 mr-2" />
                              {tScratchpad('append')}
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
                    ? t('unlockRuntime')
                    : runnerError
                      ? `Last run failed: ${runnerError}`
                      : 'Run the snippet here or send it to Scratchpad to experiment without losing the original.'
                  : isDomEventRuntime
                    ? !isAnswered
                      ? t('unlockDom')
                      : t('domHint')
                    : t('staticNotice')}
              </p>
            )}

            {isJavascriptRuntime && primaryCodeBlock && (
              <div className="mt-4 flex flex-col h-48 rounded-lg overflow-hidden border border-border/30 bg-black/40">
                <TerminalOutput
                  logs={logs}
                  isRunning={isRunning}
                  emptyMessage={
                    !isAnswered
                      ? t('unlockRuntime')
                      : runnerError
                        ? runnerError
                        : hasRunOnce
                          ? 'No console output.'
                          : 'Run code to see output...'
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
                          <DialogDescription>
                            Replay the recorded macro and microtask timeline for this snippet.
                          </DialogDescription>
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
                      <DialogContent className="h-[90vh] w-[95vw] max-w-7xl overflow-hidden border-border-subtle bg-surface p-0 shadow-glow sm:max-w-7xl">
                        <DialogHeader className="sr-only">
                          <DialogTitle>
                            <VisuallyHidden>Visual Debugger</VisuallyHidden>
                          </DialogTitle>
                          <DialogDescription>
                            Step through expression-level execution, queues, and logs for this
                            snippet.
                          </DialogDescription>
                        </DialogHeader>
                        <VisualDebugger
                          code={javascriptCodeBlock?.code ?? ''}
                          enhancedTimeline={enhancedTimeline}
                          logs={logs.map((l) => `[${l.type}] ${l.content}`)}
                        />
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
                  {isRecallMode ? t('activeRecall') : t('selectAnswer')}
                </h3>
                {!isAnswered && (
                  <button
                    type="button"
                    onClick={() => setPreferredMode(isRecallMode ? 'quiz' : 'hard')}
                    className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-primary/80 hover:text-primary transition-colors"
                  >
                    <Zap className="h-3 w-3" />
                    {isRecallMode ? t('quizMode') : t('hardMode')}
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
                    placeholder={t('typeOutput')}
                    className="w-full min-h-[100px] resize-none rounded-lg border border-border/50 bg-[#0a0a0c] p-3 font-mono text-sm text-foreground placeholder:text-muted-foreground/30 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                  {!isAnswered && (
                    <Button onClick={handleRecallSubmit} className="w-full" size="sm">
                      {t('submitAnswer')}
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
                      <span>
                        {explanationVisible ? t('hideExplanation') : t('showExplanation')}
                      </span>
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
                              {t('explanationHeader')}
                            </h3>
                            <div className="markdown text-sm leading-relaxed text-muted-foreground/80">
                              <Streamdown>{question.explanationMarkdown}</Streamdown>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {!isCorrect && !errorType && (
                      <div className="flex flex-col gap-2 rounded-xl border border-border/50 bg-muted/10 p-4">
                        <label
                          className="text-sm font-medium text-foreground"
                          htmlFor="error-type-select"
                        >
                          {t('whatWrong')}
                        </label>
                        <select
                          id="error-type-select"
                          className="w-full rounded-lg border border-border-subtle bg-background p-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all shadow-sm"
                          onChange={(e) => setErrorType(e.target.value)}
                          value={errorType}
                        >
                          <option value="">{t('selectError')}</option>
                          <option value="misread">{t('errorMisread')}</option>
                          <option value="forgot">{t('errorForgot')}</option>
                          <option value="wrong_concept">{t('errorConcept')}</option>
                          <option value="guess">{t('errorGuess')}</option>
                        </select>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-2">
                      {(['hard', 'good', 'easy'] as const).map((grade) => (
                        <button
                          key={grade}
                          type="button"
                          disabled={!isCorrect && !errorType}
                          onClick={() => handleSelfGrade(grade)}
                          className={`rounded-lg border p-2 text-center text-xs font-medium uppercase transition-all ${
                            !isCorrect && !errorType
                              ? 'opacity-50 cursor-not-allowed border-border/20 bg-muted/20 text-muted-foreground'
                              : selfGrade === grade
                                ? grade === 'hard'
                                  ? 'border-danger/50 bg-danger/20 text-danger'
                                  : grade === 'good'
                                    ? 'border-warning/50 bg-warning/20 text-warning'
                                    : 'border-success/50 bg-success/20 text-success'
                                : 'border-border/40 bg-card hover:bg-muted/40 text-muted-foreground'
                          }`}
                        >
                          {t(selfGradeLabelKeys[grade])}
                        </button>
                      ))}
                    </div>

                    {question.resources && question.resources.length > 0 && (
                      <ResourcesPanel resources={question.resources} />
                    )}
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

      {/* Search Dialog */}
      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
        <Command className="flex h-full flex-col overflow-hidden rounded-xl border border-border-subtle bg-popover shadow-2xl">
          <CommandInput
            placeholder="Type a keyword, concept, or question number..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList className="h-[400px]">
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Questions">
              {questionIndex
                .filter(
                  (q) =>
                    q.searchText.includes((searchQuery || '').toLowerCase()) ||
                    q.id === Number(searchQuery),
                )
                .slice(0, 10)
                .map((q) => (
                  <CommandItem
                    key={q.id}
                    onSelect={() => {
                      setSearchOpen(false);
                      setSearchQuery('');
                      router.push(
                        `${linkPrefix}/questions/${q.id}${filterQuery ? `?${filterQuery}` : ''}`,
                      );
                    }}
                    className="flex cursor-pointer items-center justify-between py-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[10px] text-tertiary">#{q.id}</span>
                      <span className="text-sm font-medium text-foreground">{q.title}</span>
                    </div>
                    <div className="flex gap-2">
                      {q.tags.slice(0, 2).map((t) => (
                        <span
                          key={t}
                          className="rounded border border-border-subtle bg-surface px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-tertiary"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </div>
  );
}
