'use client';

import { useMemo, useState } from 'react';
import { Play, RotateCcw, Terminal, AlertTriangle } from 'lucide-react';

import type { QuestionRecord } from '@/lib/content/types';
import type { TimelineEvent } from '@/lib/run/types';
import { runJavaScriptInSandbox } from '@/lib/run/sandbox';
import { Button } from '@/components/ui/button';
import { SimpleCodeEditor } from '@/components/editor/simple-code-editor';
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
  const [logs, setLogs] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [running, setRunning] = useState(false);

  function resetCode() {
    if (!currentBlock) return;
    setCode(currentBlock.code);
    setLogs([]);
    setErrors([]);
    setTimeline([]);
  }

  async function runTimeline() {
    if (!currentBlock) {
      setErrors(['No runnable JavaScript snippet is available for this question.']);
      return;
    }

    setRunning(true);
    setLogs([]);
    setErrors([]);
    setTimeline([]);

    const result = await runJavaScriptInSandbox(code);
    setLogs(result.logs);
    setErrors(result.errors);
    setTimeline(result.timeline);
    onTimelineUpdate?.(result.timeline);
    setRunning(false);
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
                  setErrors([]);
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
        <div className="rounded-lg border border-border/30 bg-black/30 p-3">
          <div className="mb-2 flex items-center gap-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60">
            <Terminal className="h-3 w-3" />
            Console
          </div>
          <pre className="max-h-48 overflow-auto font-mono text-xs leading-relaxed">
            {logs.length === 0 && errors.length === 0 ? (
              <span className="text-muted-foreground/40">Run the code to see output...</span>
            ) : (
              <>
                {logs.map((log, i) => (
                  <div key={`log-${i}-${log.slice(0, 20)}`} className="text-emerald-400/90">{log}</div>
                ))}
                {errors.map((err, i) => (
                  <div key={`err-${i}-${err.slice(0, 20)}`} className="text-rose-400/90">[error] {err}</div>
                ))}
              </>
            )}
          </pre>
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
