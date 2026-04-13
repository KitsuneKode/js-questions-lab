export interface XPLevel {
  level: number;
  name: string;
  minXP: number;
  maxXP: number | null; // null for the top level
}

export const XP_LEVELS: XPLevel[] = [
  { level: 1, name: 'Apprentice', minXP: 0, maxXP: 499 },
  { level: 2, name: 'Practitioner', minXP: 500, maxXP: 1499 },
  { level: 3, name: 'Engineer', minXP: 1500, maxXP: 3999 },
  { level: 4, name: 'Architect', minXP: 4000, maxXP: 9999 },
  { level: 5, name: 'Principal', minXP: 10000, maxXP: 24999 },
  { level: 6, name: 'Distinguished', minXP: 25000, maxXP: null },
];

export interface LevelInfo {
  level: number;
  name: string;
  /** XP within the current level band (0-based). */
  currentBandXP: number;
  /** Total width of the current level band. */
  bandWidth: number;
  /** Progress through current level as 0–1. */
  progress: number;
}

export function getLevelInfo(totalXP: number): LevelInfo {
  const clamped = Math.max(0, totalXP);
  const current = [...XP_LEVELS].reverse().find((l) => clamped >= l.minXP) ?? XP_LEVELS[0];
  const next = XP_LEVELS.find((l) => l.level === current.level + 1);

  const bandWidth = next ? next.minXP - current.minXP : 1;
  const currentBandXP = clamped - current.minXP;
  const progress = next ? Math.min(1, currentBandXP / bandWidth) : 1;

  return { level: current.level, name: current.name, currentBandXP, bandWidth, progress };
}
