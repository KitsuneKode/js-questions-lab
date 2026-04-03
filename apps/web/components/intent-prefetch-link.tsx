'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef } from 'react';

const INTENT_PREFETCH_DELAY_MS = 80;
const prefetchedHrefs = new Set<string>();

type IntentPrefetchLinkProps = Omit<
  React.ComponentPropsWithoutRef<typeof Link>,
  'href' | 'prefetch'
> & {
  href: string;
};

export function IntentPrefetchLink({
  href,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  ...props
}: IntentPrefetchLinkProps) {
  const router = useRouter();
  const timerRef = useRef<number | null>(null);

  const clearScheduledPrefetch = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const schedulePrefetch = () => {
    if (prefetchedHrefs.has(href) || timerRef.current !== null) {
      return;
    }

    timerRef.current = window.setTimeout(() => {
      prefetchedHrefs.add(href);
      router.prefetch(href);
      timerRef.current = null;
    }, INTENT_PREFETCH_DELAY_MS);
  };

  return (
    <Link
      {...props}
      href={href}
      prefetch={false}
      onMouseEnter={(event) => {
        onMouseEnter?.(event);
        schedulePrefetch();
      }}
      onMouseLeave={(event) => {
        onMouseLeave?.(event);
        clearScheduledPrefetch();
      }}
      onFocus={(event) => {
        onFocus?.(event);
        schedulePrefetch();
      }}
      onBlur={(event) => {
        onBlur?.(event);
        clearScheduledPrefetch();
      }}
    />
  );
}
