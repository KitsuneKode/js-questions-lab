import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const SNOOZE_DURATION_MS = 1000 * 60 * 60 * 24;
const LEGACY_DISMISS_KEY = 'jsq_signup_dismissed';
const SESSION_KEY = 'jsq_signup_prompt_seen_session';
const SNOOZE_UNTIL_KEY = 'jsq_signup_snooze_until';

const toastMock = vi.hoisted(() => vi.fn());
const buildAuthEntryHrefMock = vi.hoisted(() => vi.fn(() => '/en/sign-up'));
const authState = vi.hoisted(() => ({ isLoaded: true, isSignedIn: false }));
const progressState = vi.hoisted(() => ({ ready: true }));
const pathnameState = vi.hoisted(() => ({ value: '/en/questions' }));
const searchState = vi.hoisted(() => ({ value: new URLSearchParams('') }));
const localeState = vi.hoisted(() => ({ value: 'en' }));

vi.mock('sonner', () => ({
  toast: toastMock,
}));

vi.mock('@/lib/auth-redirects', () => ({
  buildAuthEntryHref: buildAuthEntryHrefMock,
}));

vi.mock('@/lib/auth-utils', () => ({
  clerkEnabled: true,
  useSafeAuth: () => authState,
}));

vi.mock('@/lib/progress/progress-context', () => ({
  useProgress: () => progressState,
}));

vi.mock('next-intl', () => ({
  useLocale: () => localeState.value,
}));

vi.mock('next/navigation', () => ({
  usePathname: () => pathnameState.value,
  useSearchParams: () => searchState.value,
}));

import { useGuestPrompt } from '@/lib/progress/use-guest-prompt';

describe('useGuestPrompt', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    toastMock.mockReset();
    buildAuthEntryHrefMock.mockReset();
    buildAuthEntryHrefMock.mockReturnValue('/en/sign-up');
    authState.isLoaded = true;
    authState.isSignedIn = false;
    progressState.ready = true;
    pathnameState.value = '/en/questions';
    searchState.value = new URLSearchParams('');
    localeState.value = 'en';
    vi.restoreAllMocks();
  });

  it('migrates legacy dismiss key to a snooze timestamp', async () => {
    const now = 1_716_000_000_000;
    vi.spyOn(Date, 'now').mockReturnValue(now);
    localStorage.setItem(LEGACY_DISMISS_KEY, '');

    renderHook(() => useGuestPrompt());

    await waitFor(() => {
      expect(localStorage.getItem(LEGACY_DISMISS_KEY)).toBeNull();
      expect(localStorage.getItem(SNOOZE_UNTIL_KEY)).toBe(String(now + SNOOZE_DURATION_MS));
    });
    expect(toastMock).not.toHaveBeenCalled();
  });

  it('suppresses toast when snooze is active', async () => {
    const now = 1_716_000_000_000;
    vi.spyOn(Date, 'now').mockReturnValue(now);
    localStorage.setItem(SNOOZE_UNTIL_KEY, String(now + 60_000));

    renderHook(() => useGuestPrompt());

    await waitFor(() => {
      expect(toastMock).not.toHaveBeenCalled();
    });
  });

  it('shows toast when snooze has expired', async () => {
    const now = 1_716_000_000_000;
    vi.spyOn(Date, 'now').mockReturnValue(now);
    localStorage.setItem(SNOOZE_UNTIL_KEY, String(now - 1));

    renderHook(() => useGuestPrompt());

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledTimes(1);
    });
    expect(sessionStorage.getItem(SESSION_KEY)).toBe('1');
    expect(buildAuthEntryHrefMock).toHaveBeenCalledWith('en', '/en/questions', '', '/sign-up');
  });

  it('suppresses toast when session dedupe key exists', async () => {
    sessionStorage.setItem(SESSION_KEY, '1');

    renderHook(() => useGuestPrompt());

    await waitFor(() => {
      expect(toastMock).not.toHaveBeenCalled();
    });
  });
});
