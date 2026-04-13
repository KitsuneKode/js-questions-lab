export type ReplaySpeed = 'slow' | 'normal' | 'fast';

export const PLAYBACK_SPEEDS = [
  { value: 'slow', label: 'Slow', multiplier: 1.6 },
  { value: 'normal', label: 'Normal', multiplier: 1.1 },
  { value: 'fast', label: 'Fast', multiplier: 0.7 },
] as const satisfies ReadonlyArray<{
  value: ReplaySpeed;
  label: string;
  multiplier: number;
}>;

const PLAYBACK_SPEED_MULTIPLIERS: Record<ReplaySpeed, number> = Object.fromEntries(
  PLAYBACK_SPEEDS.map((speed) => [speed.value, speed.multiplier]),
) as Record<ReplaySpeed, number>;

const MINIMUM_DELAY_BY_SPEED: Record<ReplaySpeed, number> = {
  slow: 450,
  normal: 320,
  fast: 220,
};

export function getReplayStepDelay(durationMs: number, speed: ReplaySpeed): number {
  return Math.max(
    MINIMUM_DELAY_BY_SPEED[speed],
    Math.round(durationMs * PLAYBACK_SPEED_MULTIPLIERS[speed]),
  );
}
