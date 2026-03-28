export type TimelineKind = 'sync' | 'macro' | 'micro' | 'output';
export type TimelinePhase = 'enqueue' | 'start' | 'end' | 'instant';

export interface TimelineEvent {
  id: number;
  at: number;
  kind: TimelineKind;
  phase: TimelinePhase;
  label: string;
}

export interface SandboxStackFrame {
  functionName: string | null;
  file: string;
  line: number | null;
  column: number | null;
}

export interface SandboxError {
  kind: 'runtime' | 'syntax' | 'timeout';
  name: string;
  message: string;
  summary: string;
  rawStack: string | null;
  frames: SandboxStackFrame[];
  userLine: number | null;
  userColumn: number | null;
}

export interface SandboxRunResult {
  logs: string[];
  errors: SandboxError[];
  timeline: TimelineEvent[];
}
