'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { buildAuthEntryHref } from '@/lib/auth-redirects';
import { clerkEnabled, useSafeAuth } from '@/lib/auth-utils';
import { useProgress } from '@/lib/progress/progress-context';

const DISMISS_KEY = 'jsq_signup_dismissed';
const SESSION_KEY = 'jsq_signup_prompt_seen_session';

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

    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed) return;
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
        label: "Don't show again",
        onClick: () => {
          localStorage.setItem(DISMISS_KEY, '1');
        },
      },
    });
  }, [isLoaded, isSignedIn, ready, signUpHref]);
}
