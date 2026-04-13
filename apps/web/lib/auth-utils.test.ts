import { describe, expect, test } from 'vitest';
import { isValidClerkKey } from './auth-utils';

describe('isValidClerkKey', () => {
  test('returns true for valid keys', () => {
    expect(isValidClerkKey('pk_live_Y2xlcmsuYWNjb3VudHMuZGV2JA')).toBe(true);
    expect(isValidClerkKey('pk_test_Y2xlcmsuYWNjb3VudHMuZGV2JA')).toBe(true);
  });

  test('returns false for missing keys', () => {
    expect(isValidClerkKey()).toBe(false);
    expect(isValidClerkKey('')).toBe(false);
  });

  test('returns false for keys that do not start with pk_', () => {
    expect(isValidClerkKey('sk_test_123456')).toBe(false);
    expect(isValidClerkKey('some_random_key')).toBe(false);
  });

  test('returns false for keys containing REPLACE', () => {
    expect(isValidClerkKey('pk_test_REPLACE_ME')).toBe(false);
    expect(isValidClerkKey('pk_live_REPLACE_WITH_YOUR_KEY')).toBe(false);
  });

  test('returns false for keys containing placeholder (case-insensitive)', () => {
    expect(isValidClerkKey('pk_test_placeholder')).toBe(false);
    expect(isValidClerkKey('pk_test_PLACEHOLDER_key')).toBe(false);
    expect(isValidClerkKey('pk_live_some_PlaceHolder_key')).toBe(false);
  });
});
