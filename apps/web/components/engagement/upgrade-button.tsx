'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
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
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleUpgrade() {
    if (!user) return;

    const email = user.primaryEmailAddress?.emailAddress ?? '';

    startTransition(async () => {
      try {
        const { checkoutUrl } = await createProCheckout(user.id, email);
        router.push(checkoutUrl);
      } catch (err) {
        console.error('Failed to create checkout:', err);
      }
    });
  }

  return (
    <Button onClick={handleUpgrade} disabled={isPending || !user} className={className}>
      {isPending ? 'Redirecting…' : 'Upgrade to Pro — $9/mo'}
    </Button>
  );
}
