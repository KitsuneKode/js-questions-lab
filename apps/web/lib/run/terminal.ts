import type { SandboxError, SandboxRunResult, SandboxStackFrame } from '@/lib/run/types';

export interface TerminalLogEntry {
  type: 'log' | 'warn' | 'error' | 'info' | 'trace';
  content: string;
  timestamp: number;
}

function formatFrameLocation(frame: SandboxStackFrame) {
  const line = frame.line ?? 1;
  const column = frame.column ?? 1;

  return `${frame.file}:${line}:${column}`;
}

export function formatSandboxStackFrame(frame: SandboxStackFrame) {
  const location = formatFrameLocation(frame);

  return frame.functionName ? `at ${frame.functionName} (${location})` : `at ${location}`;
}

export function getPrimaryErrorMessage(error: SandboxError | null | undefined) {
  return error?.summary ?? null;
}

export function getSandboxErrorLines(error: SandboxError): string[] {
  const seen = new Set<string>();
  const lines = [error.summary];

  for (const frame of error.frames) {
    const formattedFrame = formatSandboxStackFrame(frame);

    if (seen.has(formattedFrame)) {
      continue;
    }

    seen.add(formattedFrame);
    lines.push(formattedFrame);
  }

  return lines;
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
    getSandboxErrorLines(error).forEach((line, lineIndex) => {
      entries.push({
        type: lineIndex === 0 ? 'error' : 'trace',
        content: line,
        timestamp: startedAt + result.logs.length + index + lineIndex / 10,
      });
    });
  });

  return entries;
}
