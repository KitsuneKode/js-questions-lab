'use client';

import { useUser } from '@clerk/nextjs';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { createProCheckout } from '@/lib/payments/actions';

interface UpgradeButtonProps {
  className?: string;
}

/**
 * Button that initiates a Lemon Squeezy Pro checkout flow.
 * Calls the createProCheckout server action and redirects to the hosted checkout URL.
 */
export function UpgradeButton({ className }: UpgradeButtonProps) {
  const { user } = useUser();
  const [isPending, startTransition] = useTransition();
  const email = user?.primaryEmailAddress?.emailAddress ?? null;

  function handleUpgrade() {
    if (!user) return;
    if (!email) {
      toast.error('Please add a primary email before upgrading.');
      return;
    }

    startTransition(async () => {
      try {
        const { checkoutUrl } = await createProCheckout(user.id, email);
        window.location.assign(checkoutUrl);
      } catch (err) {
        console.error('Failed to create checkout:', err);
        toast.error('Could not start checkout. Please try again.');
      }
    });
  }

  return (
    <Button onClick={handleUpgrade} disabled={isPending || !user || !email} className={className}>
      {isPending ? 'Redirecting…' : 'Upgrade to Pro — $9/mo'}
    </Button>
  );
}
