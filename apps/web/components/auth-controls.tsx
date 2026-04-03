'use client';

import { Show, UserButton } from '@clerk/nextjs';
import { IconLogin2 as LogIn } from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { buildAuthEntryHref } from '@/lib/auth-redirects';
import { clerkEnabled } from '@/lib/auth-utils';
import { withLocale } from '@/lib/locale-paths';
import { siteLinks } from '@/lib/site-config';

export function AuthControls() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (!clerkEnabled) return null;

  const signInHref = buildAuthEntryHref(locale, pathname, searchParams.toString(), '/sign-in');

  return (
    <Show
      when="signed-in"
      fallback={
        <Link
          href={signInHref}
          className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm no-underline text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <LogIn className="h-4 w-4" />
          <span className="hidden sm:inline">{t('signIn')}</span>
        </Link>
      }
    >
      <div className="flex items-center gap-2">
        <Link
          href={withLocale(locale, siteLinks.dashboard)}
          className="hidden rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:inline-flex"
        >
          {t('account')}
        </Link>
        <UserButton />
      </div>
    </Show>
  );
}
