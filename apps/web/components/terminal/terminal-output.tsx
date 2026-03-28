'use client';

import { useRef, useEffect, useState } from 'react';
import { Copy, Terminal, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TerminalLogEntry } from '@/lib/run/terminal';

interface TerminalOutputProps {
  logs: TerminalLogEntry[];
  isRunning?: boolean;
  emptyMessage?: string;
}

export function TerminalOutput({ logs, isRunning = false, emptyMessage = 'Run code to see output...' }: TerminalOutputProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs.length]);

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

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-[#262626] bg-[#0a0a0a]">
      {/* Terminal Header */}
      <div className="flex items-center justify-between border-b border-[#262626] bg-[#0d0d0d] px-3 py-2">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-[#ff5f56]" />
            <div className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
            <div className="h-3 w-3 rounded-full bg-[#27c93f]" />
          </div>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Terminal className="h-3 w-3" />
            Console
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            disabled={logs.length === 0}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            {copied ? (
              <span className="text-[#22c55e]">Copied!</span>
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>

      {/* Terminal Output */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-auto p-3 font-mono text-xs leading-relaxed"
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
                  <span className="animate-pulse">{'>'}</span>
                  <span>{emptyMessage}</span>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-0.5">
            {logs.map((log, i) => (
              <div
                key={`${log.timestamp}-${i}`}
                className={`flex items-start gap-2 whitespace-pre-wrap ${getTypeColor(
                  log.type
                )} ${getLineClassName(log.type)}`}
              >
                <span className="select-none opacity-50">
                  {getTypePrefix(log.type)}
                </span>
                <span>{log.content}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Blinking Cursor */}
      {logs.length > 0 && (
        <div className="absolute bottom-2 left-4">
          <span className="animate-pulse text-[#22c55e]">▋</span>
        </div>
      )}
    </div>
  );
}
