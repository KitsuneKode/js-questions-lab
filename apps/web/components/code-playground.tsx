'use client';

import { useMemo, useState } from 'react';
import { Play, RotateCcw, AlertTriangle } from 'lucide-react';

import type { QuestionRecord } from '@/lib/content/types';
import type { TimelineEvent } from '@/lib/run/types';
import { runJavaScriptInSandbox } from '@/lib/run/sandbox';
import type { TerminalLogEntry } from '@/lib/run/terminal';
import { toTerminalLogEntries } from '@/lib/run/terminal';
import { Button } from '@/components/ui/button';
import { SimpleCodeEditor } from '@/components/editor/simple-code-editor';
import { TerminalOutput } from '@/components/terminal/terminal-output';
import { TimelineChart } from '@/components/visualization/timeline-chart';
import { cn } from '@/lib/utils';

interface CodePlaygroundProps {
  question: QuestionRecord;
  onTimelineUpdate?: (timeline: TimelineEvent[]) => void;
}

export function CodePlayground({ question, onTimelineUpdate }: CodePlaygroundProps) {
  const runnableBlocks = useMemo(
    () => question.codeBlocks.filter((block) => block.language === 'javascript' || block.language === 'js'),
    [question.codeBlocks],
  );

  const [selectedId, setSelectedId] = useState<string | null>(runnableBlocks[0]?.id ?? null);
  const currentBlock = runnableBlocks.find((block) => block.id === selectedId) ?? runnableBlocks[0] ?? null;
  const [code, setCode] = useState(currentBlock?.code ?? '');
  const [logs, setLogs] = useState<TerminalLogEntry[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [running, setRunning] = useState(false);

  function resetCode() {
    if (!currentBlock) return;
    setCode(currentBlock.code);
    setLogs([]);
    setTimeline([]);
  }

  async function runTimeline() {
    if (!currentBlock) {
      setTimeline([]);
      setLogs([
        {
          type: 'error',
          content: 'No runnable JavaScript snippet is available for this question.',
          timestamp: Date.now(),
        },
      ]);
      return;
    }

    setRunning(true);
    setLogs([]);
    setTimeline([]);

    try {
      const result = await runJavaScriptInSandbox(code);
      setLogs(toTerminalLogEntries(result));
      setTimeline(result.timeline);
      onTimelineUpdate?.(result.timeline);
    } catch (error) {
      setLogs([
        {
          type: 'error',
          content: String(error),
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setRunning(false);
    }
  }

  if (!currentBlock) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/40 bg-card/20 p-8 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/50">
          <AlertTriangle className="h-4 w-4 text-muted-foreground/60" />
        </div>
        <p className="text-sm text-muted-foreground/70">
          This question has no runnable JavaScript snippet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {/* Snippet selector */}
      {runnableBlocks.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          {runnableBlocks.map((block, index) => {
            const active = block.id === currentBlock.id;
            return (
              <button
                key={block.id}
                type="button"
                onClick={() => {
                  setSelectedId(block.id);
                  setCode(block.code);
                  setLogs([]);
                  setTimeline([]);
                }}
                className={cn(
                  'rounded-md px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider transition-colors',
                  active
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground/60 hover:bg-muted/40 hover:text-foreground'
                )}
              >
                Snippet {index + 1}
              </button>
            );
          })}
        </div>
      )}

      {/* Editor */}
      <div className="overflow-hidden rounded-lg border border-border/30 bg-[#0d1117]">
        <SimpleCodeEditor value={code} onChange={setCode} />
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          onClick={runTimeline}
          disabled={running}
          className="h-8 gap-1.5 px-3 text-xs"
        >
          <Play className="h-3.5 w-3.5" />
          {running ? 'Running...' : 'Run'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={resetCode}
          className="h-8 gap-1.5 px-3 text-xs text-muted-foreground"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </Button>
      </div>

      {/* Console output */}
      <div className="space-y-3">
        <div className="h-48 overflow-hidden rounded-lg border border-border/30 bg-black/30">
          <TerminalOutput logs={logs} isRunning={running} />
        </div>

        {/* Timeline */}
        {timeline.length > 0 && (
          <div className="rounded-lg border border-border/30 bg-black/30 p-3">
            <div className="mb-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60">
              Event Loop Replay
            </div>
            <TimelineChart events={timeline} />
          </div>
        )}
      </div>
    </div>
  );
}
