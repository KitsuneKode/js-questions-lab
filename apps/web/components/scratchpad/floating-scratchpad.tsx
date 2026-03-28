'use client';

import { useState, useCallback } from 'react';
import { Play, RotateCcw, PanelBottomOpen, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { MonacoCodeEditor } from '@/components/editor/monaco-code-editor';
import { TerminalOutput } from '@/components/terminal/terminal-output';
import { runJavaScriptInSandbox } from '@/lib/run/sandbox';
import type { TerminalLogEntry } from '@/lib/run/terminal';
import { getPrimaryErrorMessage, toTerminalLogEntries } from '@/lib/run/terminal';
import { useScratchpad } from './scratchpad-context';

export function FloatingScratchpad() {
  const { isOpen, closeScratchpad, code, setCode } = useScratchpad();
  const [logs, setLogs] = useState<TerminalLogEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [runnerError, setRunnerError] = useState<string | null>(null);

  const runCode = useCallback(async () => {
    if (!code.trim()) return;

    setIsRunning(true);
    setLogs([]);
    setRunnerError(null);

    try {
      const result = await runJavaScriptInSandbox(code);
      setLogs(toTerminalLogEntries(result));

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
  }, [code]);

  const resetCode = useCallback(() => {
    setCode('');
    setLogs([]);
    setRunnerError(null);
  }, [setCode]);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeScratchpad()}>
      <SheetContent className="mx-auto flex h-[90vh] w-[min(1280px,calc(100vw-1rem))] flex-col overflow-hidden rounded-t-[30px] border border-b-0 border-border/40 bg-[#040405]/96 p-0 shadow-[0_-24px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl">
        <SheetHeader className="border-b border-border/30 bg-gradient-to-r from-background via-background to-muted/10 px-5 py-4 text-left sm:px-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.22em] text-primary/85">
                <PanelBottomOpen className="h-3.5 w-3.5" />
                Scratchpad
              </div>
              <SheetTitle className="flex items-center gap-2 text-base text-foreground">
                <Sparkles className="h-4 w-4 text-primary/85" />
                Scratchpad
              </SheetTitle>
              <SheetDescription className="max-w-2xl text-xs leading-relaxed text-muted-foreground/72">
                Edit freely, run instantly in an isolated worker, and keep the original interview snippet untouched.
              </SheetDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="rounded-full border border-border/40 bg-black/20 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">
                Cmd/Ctrl + Enter to run
              </div>
              <Button variant="ghost" size="sm" onClick={resetCode} className="h-8 text-xs text-muted-foreground">
                <RotateCcw className="mr-1.5 h-3 w-3" />
                Reset
              </Button>
              <Button
                size="sm"
                onClick={runCode}
                disabled={isRunning}
                className="h-8 gap-1.5 rounded-full px-4 text-xs"
              >
                <Play className="h-3 w-3" />
                {isRunning ? 'Running...' : 'Run'}
              </Button>
            </div>
          </div>
        </SheetHeader>

        <div className="grid flex-1 gap-px overflow-hidden bg-border/20 lg:grid-cols-[minmax(0,1.18fr)_minmax(340px,0.82fr)]">
          <section className="flex min-h-[340px] flex-col overflow-hidden bg-[#151517]">
            <div className="flex items-center justify-between border-b border-border/25 px-4 py-2.5 text-[11px] uppercase tracking-[0.18em] text-muted-foreground/68">
              <span>Editor</span>
              <span>JavaScript</span>
            </div>
            <div className="relative flex-1 overflow-hidden">
              <MonacoCodeEditor
                path="floating-scratchpad.js"
                value={code}
                onChange={setCode}
                onRun={runCode}
              />
            </div>
          </section>

          <section className="flex min-h-[280px] flex-col overflow-hidden bg-[#09090a]">
            <div className="border-b border-border/25 px-4 py-2.5 text-[11px] uppercase tracking-[0.18em] text-muted-foreground/68">
              Output
            </div>
            <div className="flex-1 p-4">
              <TerminalOutput
                logs={logs}
                isRunning={isRunning}
                emptyMessage={runnerError ?? 'Run code to see output...'}
              />
            </div>
            {runnerError && (
              <div className="border-t border-rose-500/20 bg-rose-500/5 px-4 py-3 text-xs text-rose-200/90">
                {runnerError}
              </div>
            )}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
