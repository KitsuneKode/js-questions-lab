import { describe, expect, it } from 'vitest';
import { normalizeDisplayName } from '@/lib/engagement/display-name';

describe('normalizeDisplayName', () => {
  it('accepts valid names with trimming and collapsed whitespace', () => {
    expect(normalizeDisplayName('  kitsune  ')).toEqual({
      ok: true,
      displayName: 'kitsune',
    });
    expect(normalizeDisplayName('neo  dev')).toEqual({
      ok: true,
      displayName: 'neo dev',
    });
  });

  it('rejects names that are too short or too long', () => {
    expect(normalizeDisplayName('a')).toEqual({
      ok: false,
      error: 'Name must be 2–24 characters',
    });
    expect(normalizeDisplayName('a'.repeat(25))).toEqual({
      ok: false,
      error: 'Name must be 2–24 characters',
    });
  });

  it('rejects unsupported characters', () => {
    expect(normalizeDisplayName('bad@name')).toEqual({
      ok: false,
      error: 'Use letters, numbers, spaces, _ . - only',
    });
  });
});
