'use client';

import { Badge } from '@/components/ui/badge';
import { useIsPro } from '@/lib/payments/pro-gate.client';
import { cn } from '@/lib/utils';

interface ProBadgeProps {
  className?: string;
}

/**
 * Small amber "PRO" badge chip.
 * Only renders when the current user has an active Pro plan.
 */
export function ProBadge({ className }: ProBadgeProps) {
  const isPro = useIsPro();

  if (!isPro) return null;

  return (
    <Badge className={cn('bg-primary text-background font-semibold tracking-wide', className)}>
      PRO
    </Badge>
  );
}
