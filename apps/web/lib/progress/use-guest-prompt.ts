'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { buildAuthEntryHref } from '@/lib/auth-redirects';
import { clerkEnabled, useSafeAuth } from '@/lib/auth-utils';
import { useProgress } from '@/lib/progress/progress-context';

const LEGACY_DISMISS_KEY = 'jsq_signup_dismissed';
const SESSION_KEY = 'jsq_signup_prompt_seen_session';
const SNOOZE_UNTIL_KEY = 'jsq_signup_snooze_until';
const SNOOZE_DURATION_MS = 1000 * 60 * 60 * 24; // 24h

export function useGuestPrompt() {
  const { isLoaded, isSignedIn } = useSafeAuth();
  const { ready } = useProgress();
  const locale = useLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const shownRef = useRef(false);
  const signUpHref = buildAuthEntryHref(locale, pathname, searchParams.toString(), '/sign-up');

  useEffect(() => {
    if (!clerkEnabled || !isLoaded || !ready || isSignedIn || shownRef.current) return;

    // Migrate old permanent-dismiss behavior to snooze-based behavior.
    if (localStorage.getItem(LEGACY_DISMISS_KEY)) {
      localStorage.removeItem(LEGACY_DISMISS_KEY);
      localStorage.setItem(SNOOZE_UNTIL_KEY, String(Date.now() + SNOOZE_DURATION_MS));
    }

    const snoozeUntil = Number(localStorage.getItem(SNOOZE_UNTIL_KEY) || '0');
    if (Number.isFinite(snoozeUntil) && snoozeUntil > Date.now()) return;

    const seenThisSession = sessionStorage.getItem(SESSION_KEY);
    if (seenThisSession) return;

    shownRef.current = true;
    sessionStorage.setItem(SESSION_KEY, '1');

    toast('Sign up to sync your progress across devices', {
      duration: 10000,
      action: {
        label: 'Sign Up',
        onClick: () => {
          window.location.href = signUpHref;
        },
      },
      cancel: {
        label: 'Remind me tomorrow',
        onClick: () => {
          localStorage.setItem(SNOOZE_UNTIL_KEY, String(Date.now() + SNOOZE_DURATION_MS));
        },
      },
    });
  }, [isLoaded, isSignedIn, ready, signUpHref]);
}
