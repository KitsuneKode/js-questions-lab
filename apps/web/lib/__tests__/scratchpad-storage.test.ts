import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearScratchpadCode,
  isAllowedScratchpadImport,
  readImportedScratchpadFile,
  readScratchpadCode,
  writeScratchpadCode,
} from '@/lib/scratchpad/storage';

const KEY = 'jsq_scratchpad_v1';

describe('scratchpad storage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('persists and reads code as an object payload', () => {
    writeScratchpadCode('console.log(1)');
    const raw = window.localStorage.getItem(KEY);
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw as string)).toMatchObject({ code: 'console.log(1)' });
    expect(readScratchpadCode()).toBe('console.log(1)');
  });

  it('reads legacy plain-string payloads', () => {
    window.localStorage.setItem(KEY, JSON.stringify('legacy code'));
    expect(readScratchpadCode()).toBe('legacy code');
  });

  it('returns empty string for missing or corrupt data', () => {
    expect(readScratchpadCode()).toBe('');
    window.localStorage.setItem(KEY, '{not-json');
    expect(readScratchpadCode()).toBe('');
  });

  it('clears stored code', () => {
    writeScratchpadCode('x');
    clearScratchpadCode();
    expect(window.localStorage.getItem(KEY)).toBeNull();
  });

  it('validates import extensions', () => {
    expect(isAllowedScratchpadImport(new File([''], 'a.js'))).toBe(true);
    expect(isAllowedScratchpadImport(new File([''], 'a.ts'))).toBe(true);
    expect(isAllowedScratchpadImport(new File([''], 'a.txt'))).toBe(true);
    expect(isAllowedScratchpadImport(new File([''], 'a.py'))).toBe(false);
  });

  it('reads imported file text', async () => {
    const file = new File(['const x = 1'], 'demo.js', { type: 'text/javascript' });
    await expect(readImportedScratchpadFile(file)).resolves.toBe('const x = 1');
  });

  it('rejects unsupported imports', async () => {
    const file = new File(['print(1)'], 'demo.py');
    await expect(readImportedScratchpadFile(file)).rejects.toThrow(/Unsupported/);
  });
});

describe('copyScratchpadCode', () => {
  it('returns false when clipboard is unavailable', async () => {
    const { copyScratchpadCode } = await import('@/lib/scratchpad/storage');
    const original = navigator.clipboard;
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    await expect(copyScratchpadCode('hi')).resolves.toBe(false);
    Object.defineProperty(navigator, 'clipboard', { value: original, configurable: true });
  });

  it('writes to clipboard when available', async () => {
    const { copyScratchpadCode } = await import('@/lib/scratchpad/storage');
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    await expect(copyScratchpadCode('hi')).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith('hi');
  });
});
