'use client';

import { useUser } from '@clerk/nextjs';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { createProCheckout } from '@/lib/payments/actions';
import { useIsPro } from '@/lib/payments/pro-gate.client';

interface UpgradeButtonProps {
  className?: string;
}

export function UpgradeButton({ className }: UpgradeButtonProps) {
  const { user } = useUser();
  const isPro = useIsPro();
  const [isPending, startTransition] = useTransition();
  const email = user?.primaryEmailAddress?.emailAddress ?? null;

  if (isPro) {
    return (
      <p className="text-sm font-medium text-primary" data-testid="pro-active">
        You are on Pro.
      </p>
    );
  }

  function handleUpgrade() {
    if (!user) return;
    if (!email) {
      toast.error('Please add a primary email before upgrading.');
      return;
    }

    startTransition(async () => {
      try {
        const { checkoutUrl } = await createProCheckout();
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
