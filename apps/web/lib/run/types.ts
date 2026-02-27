export type TimelineKind = 'sync' | 'macro' | 'micro' | 'output';
export type TimelinePhase = 'enqueue' | 'start' | 'end' | 'instant';

export interface TimelineEvent {
  id: number;
  at: number;
  kind: TimelineKind;
  phase: TimelinePhase;
  label: string;
}

export interface SandboxRunResult {
  logs: string[];
  errors: string[];
  timeline: TimelineEvent[];
}
