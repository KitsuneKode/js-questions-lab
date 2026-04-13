'use client';

import type { OnMount } from '@monaco-editor/react';
import {
  IconActivity as Activity,
  IconPlayerPlay as Play,
  IconRotateClockwise2 as RotateCcw,
  IconSparkles as Sparkles,
} from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { MonacoCodeEditor } from '@/components/editor/monaco-code-editor';
import { TerminalOutput } from '@/components/terminal/terminal-output';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { TimelineChart } from '@/components/visualization/timeline-chart';
import { runJavaScript } from '@/lib/run/sandbox';
import type { TerminalLogEntry } from '@/lib/run/terminal';
import { toTerminalLogEntries } from '@/lib/run/terminal';
import type { TimelineEvent } from '@/lib/run/types';
import { useScratchpad } from './scratchpad-context';

function ShortcutHint({ keys, label }: { keys: string[]; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="flex items-center gap-0.5">
        {keys.map((k) => (
          <kbd
            key={k}
            className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-border/60 bg-elevated px-1.5 font-mono text-[10px] font-semibold text-muted-foreground shadow-[0_1px_0_0_rgba(0,0,0,0.4)]"
          >
            {k}
          </kbd>
        ))}
      </span>
      <span className="text-xs text-muted-foreground/70">{label}</span>
    </div>
  );
}

export function FloatingScratchpad() {
  const { isOpen, closeScratchpad, code, setCode } = useScratchpad();
  const t = useTranslations('scratchpad');
  const [logs, setLogs] = useState<TerminalLogEntry[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);

  // Re-focus editor whenever the sheet opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => editorRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const hasAsyncEvents = timeline.some((event) => event.kind === 'macro' || event.kind === 'micro');

  const runCode = useCallback(async () => {
    if (!code.trim()) return;

    setIsRunning(true);
    setLogs([]);
    setTimeline([]);

    try {
      const result = await runJavaScript(code, { enableTracing: false });
      setLogs(toTerminalLogEntries(result));
      setTimeline(result.timeline);
    } catch (error) {
      const message = String(error);
      setLogs([{ type: 'error', content: message, timestamp: Date.now() }]);
    } finally {
      setIsRunning(false);
    }
  }, [code]);

  const resetCode = useCallback(() => {
    setCode('');
    setLogs([]);
    setTimeline([]);
  }, [setCode]);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeScratchpad()}>
      <SheetContent
        side="right"
        showCloseButton={false}
        data-testid="scratchpad-sheet"
        className="flex w-[95vw] sm:w-[90vw] lg:w-[85vw] max-w-[1200px] flex-col overflow-hidden border-l border-border-subtle bg-surface p-0 shadow-[-20px_0_40px_rgba(0,0,0,0.4)] backdrop-blur-xl pt-10"
      >
        <SheetHeader className="border-b border-border-subtle bg-elevated/80 px-6 py-4 text-left shrink-0">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <SheetTitle className="text-xl text-foreground font-display font-medium truncate">
                  {t('title')}
                </SheetTitle>
                <SheetDescription className="hidden sm:block text-[11px] text-secondary truncate">
                  {t('subtitle')}
                </SheetDescription>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
              <div className="hidden lg:flex items-center gap-3">
                <ShortcutHint keys={['⌘', '↵']} label={t('run')} />
                <ShortcutHint keys={['⌘', '⇧', '⌫']} label={t('reset')} />
              </div>

              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={!hasAsyncEvents}
                    className={`h-8 gap-2 text-[11px] transition-all duration-300 ${
                      hasAsyncEvents
                        ? 'border-primary/50 bg-primary/10 text-primary shadow-[0_0_15px_rgba(245,158,11,0.15)] hover:bg-primary/20 hover:scale-[1.02]'
                        : 'border-border/40 text-muted-foreground opacity-50'
                    }`}
                  >
                    <Activity className="h-3.5 w-3.5" />
                    <span className="hidden xs:inline">{t('eventLoop')}</span>
                  </Button>
                </DialogTrigger>
                <DialogContent
                  showCloseButton={false}
                  className="max-h-[88vh] w-[96vw] max-w-5xl sm:max-w-5xl lg:max-w-6xl overflow-y-auto border-border-subtle bg-surface p-4 md:p-6 shadow-glow z-[100]"
                >
                  <DialogHeader>
                    <DialogTitle>
                      {t('eventLoop')} ({t('title')})
                    </DialogTitle>
                    <DialogDescription>{t('subtitle')}</DialogDescription>
                  </DialogHeader>
                  <div className="mt-4 pb-2">
                    <TimelineChart events={timeline} />
                  </div>
                </DialogContent>
              </Dialog>

              <Button
                variant="ghost"
                size="sm"
                onClick={resetCode}
                title={t('resetTooltip')}
                className="h-8 text-[11px] text-secondary hover:text-primary transition-colors px-2 sm:px-3"
              >
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                {t('reset')}
              </Button>
              <Button
                size="sm"
                onClick={runCode}
                disabled={isRunning}
                data-testid="scratchpad-run-code"
                className="h-8 gap-2 rounded-lg px-3 sm:px-4 text-[11px] font-semibold bg-primary text-background hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)]"
              >
                <Play className="h-3.5 w-3.5" />
                {isRunning ? '...' : t('run')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeScratchpad}
                className="h-8 px-2 sm:px-3 text-[11px] text-secondary hover:text-foreground"
              >
                {t('close')}
              </Button>
            </div>
          </div>
        </SheetHeader>

        <div className="flex flex-1 flex-col overflow-hidden bg-void divide-y divide-border-subtle">
          {/* Editor Section */}
          <section className="flex flex-col flex-1 min-h-[40vh]">
            <div className="flex items-center justify-between border-b border-border-subtle px-4 py-2 text-[10px] uppercase tracking-widest text-tertiary bg-surface/50 font-mono shrink-0">
              <span>{t('editor')}</span>
              <span>{t('javaScript')}</span>
            </div>
            <div className="relative flex-1 overflow-hidden bg-code">
              <div data-testid="scratchpad-editor" className="h-full">
                <MonacoCodeEditor
                  path="floating-scratchpad.js"
                  value={code}
                  onChange={setCode}
                  onRun={runCode}
                  onReset={resetCode}
                  autoFocus
                  onEditorMount={(editor) => {
                    editorRef.current = editor;
                  }}
                />
              </div>
            </div>
          </section>

          {/* Results Area */}
          <section className="flex flex-col flex-1 overflow-hidden bg-surface max-h-[40vh]">
            <div className="border-b border-border-subtle px-4 py-2 text-[10px] uppercase tracking-widest text-tertiary bg-surface/50 font-mono flex items-center justify-between shrink-0">
              <span>{t('output')}</span>
            </div>
            <div className="flex-1 p-4 bg-void overflow-auto">
              <div data-testid="scratchpad-terminal">
                <TerminalOutput
                  logs={logs}
                  isRunning={isRunning}
                  emptyMessage={t('emptyTerminal')}
                />
              </div>
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
