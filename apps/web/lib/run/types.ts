// Base timeline types (used by simple timeline view)
export type TimelineKind = 'sync' | 'macro' | 'micro' | 'output';
export type TimelinePhase = 'enqueue' | 'start' | 'end' | 'instant';

export interface TimelineEvent {
  id: number;
  at: number;
  kind: TimelineKind;
  phase: TimelinePhase;
  label: string;
}

// Enhanced timeline types (used by Visual Debugger)
export type EnhancedTimelineKind = TimelineKind | 'scope' | 'raf';
export type EnhancedTimelinePhase = TimelinePhase | 'enter' | 'exit';

export interface SourceLocation {
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
}

export interface SerializedValue {
  type: 'primitive' | 'object' | 'array' | 'function' | 'undefined' | 'null';
  preview: string;
  value?: unknown;
}

export interface ScopeSnapshot {
  type: 'global' | 'function' | 'block';
  name: string;
  variables: Record<string, SerializedValue>;
}

export interface ExecutionContext {
  functionName: string | null;
  scopeChain: ScopeSnapshot[];
  thisBinding: string;
}

export interface ApiMeta {
  type: 'timer' | 'raf' | 'fetch' | 'event';
  delay?: number;
  url?: string;
  eventType?: string;
  targetSelector?: string;
}

export interface EnhancedTimelineEvent {
  id: number;
  at: number;
  kind: EnhancedTimelineKind;
  phase: EnhancedTimelinePhase;
  label: string;
  loc?: SourceLocation;
  context?: ExecutionContext;
  apiMeta?: ApiMeta;
}

export interface EnhancedSandboxRunResult {
  logs: string[];
  errors: SandboxError[];
  timeline: TimelineEvent[];
  enhancedTimeline: EnhancedTimelineEvent[];
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
