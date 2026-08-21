import { describe, expect, test } from 'vitest';
import { isApiOrTrpcPath } from '@/lib/auth/proxy-path';

describe('isApiOrTrpcPath', () => {
  test('treats /api routes as non-i18n', () => {
    expect(isApiOrTrpcPath('/api/questions')).toBe(true);
    expect(isApiOrTrpcPath('/api/questions/1')).toBe(true);
    expect(isApiOrTrpcPath('/trpc/foo')).toBe(true);
  });

  test('leaves locale app routes for i18n', () => {
    expect(isApiOrTrpcPath('/en')).toBe(false);
    expect(isApiOrTrpcPath('/en/questions/2')).toBe(false);
    expect(isApiOrTrpcPath('/en/api/questions')).toBe(false);
  });
});
