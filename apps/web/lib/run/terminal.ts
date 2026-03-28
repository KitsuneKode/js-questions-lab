import type { SandboxRunResult } from '@/lib/run/types';

export interface TerminalLogEntry {
  type: 'log' | 'warn' | 'error' | 'info';
  content: string;
  timestamp: number;
}

export function toTerminalLogEntries(result: SandboxRunResult, startedAt = Date.now()): TerminalLogEntry[] {
  const entries: TerminalLogEntry[] = [];

  result.logs.forEach((log, index) => {
    let type: TerminalLogEntry['type'] = 'log';

    if (log.startsWith('[warn]')) {
      type = 'warn';
    } else if (log.startsWith('[error]')) {
      type = 'error';
    } else if (log.startsWith('[info]')) {
      type = 'info';
    }

    entries.push({
      type,
      content: log.replace(/^\[(log|warn|error|info)\]\s*/, ''),
      timestamp: startedAt + index,
    });
  });

  result.errors.forEach((error, index) => {
    entries.push({
      type: 'error',
      content: error,
      timestamp: startedAt + result.logs.length + index,
    });
  });

  return entries;
}
