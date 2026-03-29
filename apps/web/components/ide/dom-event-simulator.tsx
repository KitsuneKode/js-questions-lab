'use client';

import {
  IconAlertTriangle as AlertTriangle,
  IconHandClick as MousePointerClick,
  IconRotateClockwise2 as RotateCcw,
  IconRoute2 as Waypoints,
  IconTarget as Target,
} from '@tabler/icons-react';
import { useMemo, useState } from 'react';

import { TerminalOutput } from '@/components/terminal/terminal-output';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  buildDomEventModel,
  type DomEventNode,
  simulateDomClick,
} from '@/lib/dom-events/simulator';
import type { TerminalLogEntry } from '@/lib/run/terminal';
import { cn } from '@/lib/utils';

interface DomEventSimulatorProps {
  html: string;
  unlocked: boolean;
}

interface DomNodeCardProps {
  node: DomEventNode;
  activeNodeId: string | null;
  unlocked: boolean;
  onSelect: (nodeId: string) => void;
}

function DomNodeCard({ node, activeNodeId, unlocked, onSelect }: DomNodeCardProps) {
  const isActive = node.id === activeNodeId;
  const isInteractive =
    node.handlerSource !== null || node.actions.length > 0 || node.unsupportedHandler;

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => isInteractive && unlocked && onSelect(node.id)}
        disabled={!isInteractive || !unlocked}
        className={cn(
          'w-full rounded-xl border px-4 py-3 text-left transition-all duration-200',
          isActive
            ? 'border-primary/60 bg-primary/10 shadow-[0_0_0_1px_rgba(245,158,11,0.15),0_14px_28px_rgba(245,158,11,0.12)]'
            : 'border-border/40 bg-card/40 hover:border-border/70 hover:bg-card/70',
          !isInteractive || !unlocked ? 'cursor-not-allowed opacity-70' : 'hover:-translate-y-0.5',
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-foreground">{`<${node.tagName}>`}</span>
              {isInteractive && (
                <Badge
                  variant="secondary"
                  className="bg-primary/10 text-[10px] uppercase tracking-widest text-primary"
                >
                  Clickable
                </Badge>
              )}
            </div>
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground/60">
              {node.label}
            </p>
            {node.handlerSummary && (
              <p className="font-mono text-xs text-muted-foreground/75">{node.handlerSummary}</p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {node.unsupportedHandler && <AlertTriangle className="h-4 w-4 text-amber-400" />}
            <MousePointerClick
              className={cn(
                'h-4 w-4',
                isActive
                  ? 'text-primary'
                  : isInteractive
                    ? 'text-muted-foreground/60'
                    : 'text-muted-foreground/30',
              )}
            />
          </div>
        </div>
      </button>

      {node.children.length > 0 && (
        <div className="ml-4 border-l border-border/40 pl-4">
          <div className="space-y-3">
            {node.children.map((child) => (
              <DomNodeCard
                key={child.id}
                node={child}
                activeNodeId={activeNodeId}
                unlocked={unlocked}
                onSelect={onSelect}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function DomEventSimulator({ html, unlocked }: DomEventSimulatorProps) {
  const model = useMemo(() => buildDomEventModel(html), [html]);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(model.defaultTargetId);
  const activeTargetId =
    selectedTargetId && model.byId[selectedTargetId] ? selectedTargetId : model.defaultTargetId;

  const simulation = useMemo(
    () => (activeTargetId ? simulateDomClick(model, activeTargetId) : null),
    [activeTargetId, model],
  );

  const terminalLogs = useMemo<TerminalLogEntry[]>(
    () =>
      simulation?.logs.map((content, index) => ({
        type: 'log',
        content,
        timestamp: index,
      })) ?? [],
    [simulation],
  );

  if (model.roots.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/40 bg-card/20 p-6 text-sm text-muted-foreground">
        Unable to parse this HTML snippet into a DOM event tree.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-primary/20 bg-[linear-gradient(180deg,rgba(245,158,11,0.08),rgba(0,0,0,0))] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-primary/80">
              <Waypoints className="h-3.5 w-3.5" />
              DOM Event Simulator
            </div>
            <h3 className="font-display text-xl tracking-tight text-foreground">
              Replay target and bubbling without a fake browser runtime
            </h3>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground/80">
              Click a highlighted node to simulate the event path. The simulator keeps
              <code className="mx-1 rounded bg-black/30 px-1.5 py-0.5 font-mono text-[11px] text-foreground/90">
                event.target
              </code>
              fixed on the deepest clicked element while
              <code className="mx-1 rounded bg-black/30 px-1.5 py-0.5 font-mono text-[11px] text-foreground/90">
                currentTarget
              </code>
              moves outward during bubbling.
            </p>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setSelectedTargetId(model.defaultTargetId)}
            disabled={!unlocked || !model.defaultTargetId}
            className="gap-2"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Replay
          </Button>
        </div>
      </div>

      {!unlocked ? (
        <div className="rounded-2xl border border-dashed border-border/40 bg-card/20 p-6 text-sm text-muted-foreground">
          Submit an answer first to unlock the DOM event replay for this question.
        </div>
      ) : (
        <>
          {model.hasUnsupportedHandlers && (
            <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-200/80">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
              <span>
                This simulator only executes inline
                <code className="mx-1 rounded bg-black/20 px-1.5 py-0.5 font-mono text-[11px]">
                  console.log(...)
                </code>
                and
                <code className="mx-1 rounded bg-black/20 px-1.5 py-0.5 font-mono text-[11px]">
                  event.stopPropagation()
                </code>
                calls. Other handler logic is shown but not executed.
              </span>
            </div>
          )}

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div className="rounded-2xl border border-border/40 bg-card/25 p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground/60">
                    Click Path
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground/75">
                    Choose the node that receives the click.
                  </p>
                </div>
                <Badge variant="outline" className="border-border/60 font-mono text-[10px]">
                  {simulation?.target.label ?? 'No target'}
                </Badge>
              </div>

              <div className="space-y-3">
                {model.roots.map((node) => (
                  <DomNodeCard
                    key={node.id}
                    node={node}
                    activeNodeId={activeTargetId}
                    unlocked={unlocked}
                    onSelect={setSelectedTargetId}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-border/40 bg-card/30 p-4">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
                    <Target className="h-3.5 w-3.5 text-primary" />
                    Event Target
                  </div>
                  <p className="mt-3 font-mono text-lg text-foreground">
                    {simulation?.target.tagName ?? '—'}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/40 bg-card/30 p-4">
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
                    Replay Steps
                  </div>
                  <p className="mt-3 font-mono text-lg text-foreground">
                    {simulation?.steps.length ?? 0}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/40 bg-card/30 p-4">
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
                    Console Lines
                  </div>
                  <p className="mt-3 font-mono text-lg text-foreground">
                    {simulation?.logs.length ?? 0}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-border/40 bg-card/25 p-4">
                <div className="mb-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground/60">
                    Propagation Replay
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground/75">
                    Each row shows the current node handling the click as bubbling moves outward.
                  </p>
                </div>

                <div className="space-y-3">
                  {simulation?.steps.map((step) => (
                    <div
                      key={`${step.nodeId}-${step.phase}`}
                      className="rounded-xl border border-border/40 bg-black/20 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className={cn(
                              'text-[10px] uppercase tracking-widest',
                              step.phase === 'target'
                                ? 'bg-primary/15 text-primary'
                                : 'bg-sky-500/10 text-sky-300',
                            )}
                          >
                            {step.phase}
                          </Badge>
                          <span className="font-mono text-sm text-foreground">
                            {step.currentTarget}
                          </span>
                        </div>

                        {step.stoppedPropagation && (
                          <Badge
                            variant="outline"
                            className="border-amber-500/30 text-[10px] uppercase tracking-widest text-amber-300"
                          >
                            stopPropagation()
                          </Badge>
                        )}
                      </div>

                      <div className="mt-3 grid gap-2 text-xs text-muted-foreground/75 sm:grid-cols-2">
                        <div>
                          <span className="uppercase tracking-widest text-muted-foreground/50">
                            event.target
                          </span>
                          <p className="mt-1 font-mono text-foreground">{step.eventTarget}</p>
                        </div>
                        <div>
                          <span className="uppercase tracking-widest text-muted-foreground/50">
                            currentTarget
                          </span>
                          <p className="mt-1 font-mono text-foreground">{step.currentTarget}</p>
                        </div>
                      </div>

                      {step.logs.length > 0 && (
                        <div className="mt-3 rounded-lg border border-border/30 bg-black/30 px-3 py-2 font-mono text-xs text-emerald-300/90">
                          {step.logs.map((log) => (
                            <p key={`${step.nodeId}-${log}`}>{log}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="h-52 overflow-hidden rounded-2xl border border-border/40 bg-black/30">
                <TerminalOutput
                  logs={terminalLogs}
                  emptyMessage="Click a node to inspect the propagated console output."
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
