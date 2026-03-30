'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { clerkEnabled, useSafeAuth } from '@/lib/auth-utils';
import { useProgress } from './progress-context';

const SESSION_KEY = 'jsq_sync_toast_shown';

export function useSyncToast() {
  const { isSignedIn } = useSafeAuth();
  const { syncStatus } = useProgress();
  const shownRef = useRef(false);
  const [toastShown, setToastShown] = useState(false);

  useEffect(() => {
    if (!clerkEnabled || !isSignedIn || shownRef.current || toastShown) return;

    const alreadyShown = sessionStorage.getItem(SESSION_KEY);
    if (alreadyShown) return;

    // Wait for sync to complete before showing toast
    if (syncStatus === 'syncing') {
      return;
    }

    if (syncStatus === 'error') {
      shownRef.current = true;
      sessionStorage.setItem(SESSION_KEY, '1');
      setToastShown(true);

      toast.error('Sync failed', {
        description: 'Could not save progress to cloud. Using local storage.',
        duration: 5000,
        action: {
          label: 'Retry',
          onClick: () => {
            shownRef.current = false;
            sessionStorage.removeItem(SESSION_KEY);
            setToastShown(false);
          },
        },
      });
      return;
    }

    // Sync completed successfully
    if (syncStatus === 'idle') {
      shownRef.current = true;
      sessionStorage.setItem(SESSION_KEY, '1');
      setToastShown(true);

      toast.success('Progress synced', {
        description: 'Your progress is saved to the cloud.',
        duration: 3000,
      });
    }
  }, [isSignedIn, syncStatus, toastShown]);
}
