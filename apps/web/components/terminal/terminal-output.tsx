'use client';

import {
  IconCopy as Copy,
  IconLoader2 as Loader2,
  IconTerminal2 as Terminal,
} from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { TerminalLogEntry } from '@/lib/run/terminal';
import { cn } from '@/lib/utils';

interface TerminalOutputProps {
  logs: TerminalLogEntry[];
  isRunning?: boolean;
  emptyMessage?: string;
}

export function TerminalOutput({
  logs,
  isRunning = false,
  emptyMessage = 'Run code to see output...',
}: TerminalOutputProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (logs.length === 0) {
      return;
    }

    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const handleCopy = () => {
    const text = logs.map((l) => l.content).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getTypeColor = (type: TerminalLogEntry['type']) => {
    switch (type) {
      case 'error':
        return 'text-[#ef4444]';
      case 'trace':
        return 'text-muted-foreground/62';
      case 'warn':
        return 'text-[#f59e0b]';
      case 'info':
        return 'text-[#3b82f6]';
      default:
        return 'text-[#22c55e]';
    }
  };

  const getTypePrefix = (type: TerminalLogEntry['type']) => {
    switch (type) {
      case 'error':
        return '✕';
      case 'trace':
        return '›';
      case 'warn':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return '$';
    }
  };

  const getLineClassName = (type: TerminalLogEntry['type']) => {
    if (type === 'trace') {
      return 'pl-4 text-[11px]';
    }

    if (type === 'error') {
      return 'font-medium';
    }

    return '';
  };

  const logKeyCounts = new Map<string, number>();

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl bg-[#0a0a0a] shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_4px_24px_rgba(0,0,0,0.4)]">
      {/* Terminal Header */}
      <div className="flex items-center justify-between border-b border-white/5 bg-[#0f0f0f] px-3 py-2">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5 ml-1">
            <div className="h-3 w-3 rounded-full bg-[#ff5f56] shadow-sm" />
            <div className="h-3 w-3 rounded-full bg-[#ffbd2e] shadow-sm" />
            <div className="h-3 w-3 rounded-full bg-[#27c93f] shadow-sm" />
          </div>
          <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground/80">
            <Terminal className="h-3.5 w-3.5" />
            Console
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            disabled={logs.length === 0}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground transition-[color,transform] duration-150 ease-out active:scale-[0.96]"
          >
            {copied ? (
              <span className="text-[#22c55e]">Copied!</span>
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>

      {/* Terminal Output */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed selection:bg-primary/30"
      >
        {logs.length === 0 ? (
          <div className="flex h-full items-center justify-center text-muted-foreground/40">
            <div className="flex items-center gap-2">
              {isRunning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Running...</span>
                </>
              ) : (
                <>
                  <span className="animate-pulse font-bold">{'>'}</span>
                  <span>{emptyMessage}</span>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {logs.map((log) => {
              const baseKey = `${log.timestamp}-${log.type}-${log.content}`;
              const occurrence = (logKeyCounts.get(baseKey) ?? 0) + 1;
              logKeyCounts.set(baseKey, occurrence);

              return (
                <div
                  key={`${baseKey}-${occurrence}`}
                  className={cn(
                    'flex items-start gap-2.5 whitespace-pre-wrap',
                    getTypeColor(log.type),
                    getLineClassName(log.type),
                  )}
                >
                  <span className="select-none opacity-50 mt-0.5">{getTypePrefix(log.type)}</span>
                  <span className="tracking-tight">{log.content}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
