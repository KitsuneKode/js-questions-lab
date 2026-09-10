import { describe, expect, it } from 'vitest';
import { isSafeHttpUrl } from '@/lib/content/safe-url';

describe('isSafeHttpUrl', () => {
  it('accepts http and https URLs', () => {
    expect(isSafeHttpUrl('https://react.dev/learn')).toBe(true);
    expect(isSafeHttpUrl('http://example.com/docs')).toBe(true);
  });

  it('rejects javascript, data, and relative URLs', () => {
    expect(isSafeHttpUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeHttpUrl('data:text/html,hi')).toBe(false);
    expect(isSafeHttpUrl('/local/path')).toBe(false);
    expect(isSafeHttpUrl('not a url')).toBe(false);
  });
});
