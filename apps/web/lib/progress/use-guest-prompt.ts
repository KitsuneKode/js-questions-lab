'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { clerkEnabled, useSafeAuth } from '@/lib/auth-utils';
import { useProgress } from '@/lib/progress/progress-context';

const DISMISS_KEY = 'jsq_signup_dismissed';
const THRESHOLD = 3;

export function useGuestPrompt() {
  const { isLoaded, isSignedIn } = useSafeAuth();
  const { state, ready } = useProgress();
  const shownRef = useRef(false);

  useEffect(() => {
    if (!clerkEnabled || !isLoaded || !ready || isSignedIn || shownRef.current) return;

    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed) return;

    const answered = Object.values(state.questions).filter((q) => q.attempts.length > 0).length;

    if (answered < THRESHOLD) return;

    shownRef.current = true;

    toast('Sign up to sync your progress across devices', {
      duration: 10000,
      action: {
        label: 'Sign Up',
        onClick: () => {
          window.location.href = '/sign-up';
        },
      },
      cancel: {
        label: "Don't show again",
        onClick: () => {
          localStorage.setItem(DISMISS_KEY, '1');
        },
      },
    });
  }, [isLoaded, isSignedIn, ready, state]);
}
