'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { buildAuthEntryHref } from '@/lib/auth-redirects';
import { clerkEnabled, useSafeAuth } from '@/lib/auth-utils';

export function LeaderboardGuestCta() {
  const t = useTranslations('leaderboard');
  const locale = useLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isSignedIn, isLoaded } = useSafeAuth();

  if (!clerkEnabled || !isLoaded || isSignedIn) {
    return null;
  }

  const href = buildAuthEntryHref(locale, pathname, searchParams.toString(), '/sign-up');

  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{t('guestCtaTitle')}</p>
        <p className="text-sm text-secondary">{t('guestCtaBody')}</p>
      </div>
      <Link
        href={href}
        className="inline-flex shrink-0 items-center justify-center rounded-lg bg-primary px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        {t('guestCtaAction')}
      </Link>
    </div>
  );
}
