import { describe, expect, test } from 'vitest';
import {
  assertClerkKeySafeForEnvironment,
  isClerkEnabled,
  isValidClerkKey,
} from './auth/clerk-key';

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

describe('isClerkEnabled', () => {
  test('mirrors isValidClerkKey for explicit keys', () => {
    expect(isClerkEnabled('pk_test_Y2xlcmsuYWNjb3VudHMuZGV2JA')).toBe(true);
    expect(isClerkEnabled('pk_test_placeholder')).toBe(false);
    expect(isClerkEnabled(undefined)).toBe(false);
  });
});

describe('assertClerkKeySafeForEnvironment', () => {
  test('passes when a valid key is present regardless of environment', () => {
    expect(() => assertClerkKeySafeForEnvironment('production', 'pk_live_abc123')).not.toThrow();
  });

  test('passes with a placeholder key outside production', () => {
    expect(() =>
      assertClerkKeySafeForEnvironment('development', 'pk_test_placeholder'),
    ).not.toThrow();
    expect(() => assertClerkKeySafeForEnvironment('test', undefined)).not.toThrow();
  });

  test('throws in production with a missing/placeholder key', () => {
    expect(() => assertClerkKeySafeForEnvironment('production', 'pk_test_placeholder')).toThrow(
      /CLERK_ALLOW_PLACEHOLDER_KEY/,
    );
    expect(() => assertClerkKeySafeForEnvironment('production', undefined)).toThrow(
      /CLERK_ALLOW_PLACEHOLDER_KEY/,
    );
  });

  test('escape hatch allows placeholder keys in production for CI/local runs', () => {
    expect(() =>
      assertClerkKeySafeForEnvironment('production', 'pk_test_placeholder', 'true'),
    ).not.toThrow();
  });
});
