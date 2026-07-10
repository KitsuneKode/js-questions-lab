'use client';

import { IconLogin, IconTrophy } from '@tabler/icons-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { withLocale } from '@/lib/locale-paths';

interface LeaderboardGuestCtaProps {
  locale: string;
  signedIn: boolean;
}

export function LeaderboardGuestCta({ locale, signedIn }: LeaderboardGuestCtaProps) {
  const t = useTranslations('leaderboard');

  if (signedIn) return null;

  return (
    <section className="rounded-2xl border border-primary/25 bg-primary/5 p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary">
            <IconTrophy className="h-3.5 w-3.5" />
            {t('guestCtaTitle')}
          </div>
          <p className="max-w-xl text-sm leading-relaxed text-secondary">{t('guestCtaBody')}</p>
        </div>
        <Button asChild className="shrink-0 gap-2">
          <Link href={withLocale(locale, '/sign-in')}>
            <IconLogin className="h-4 w-4" />
            {t('guestCtaButton')}
          </Link>
        </Button>
      </div>
    </section>
  );
}
