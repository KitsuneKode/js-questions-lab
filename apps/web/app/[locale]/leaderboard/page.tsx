import { auth } from '@clerk/nextjs/server';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Container } from '@/components/container';
import { LeaderboardTable } from '@/components/leaderboard/leaderboard-table';
import { getAllTimeLeaderboard, getWeeklyLeaderboard } from '@/lib/engagement/leaderboard';
import type { LocaleCode } from '@/lib/i18n/config';
import { getCanonicalUrl } from '@/lib/seo/config';
import { siteConfig } from '@/lib/site-config';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: LocaleCode }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'leaderboard' });
  const canonicalUrl = getCanonicalUrl(locale, 'leaderboard');
  return {
    title: `${t('title')} — ${siteConfig.name}`,
    description: t('description'),
    alternates: { canonical: canonicalUrl },
  };
}

export const dynamic = 'force-dynamic';

export default async function LeaderboardPage({
  params,
}: {
  params: Promise<{ locale: LocaleCode }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { userId } = await auth();

  const [weekly, allTime] = await Promise.all([
    getWeeklyLeaderboard(50),
    getAllTimeLeaderboard(50),
  ]);

  const t = await getTranslations({ locale, namespace: 'leaderboard' });

  return (
    <main className="bg-void min-h-screen pt-32 pb-16 md:pt-40">
      <Container>
        <div className="max-w-2xl mx-auto space-y-12">
          {/* Header */}
          <header className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <span className="uppercase tracking-widest font-bold">{t('eyebrow')}</span>
            </div>
            <h1 className="font-display text-5xl font-normal tracking-tight text-foreground">
              {t('title')}
            </h1>
            <p className="text-secondary text-lg">{t('subtitle')}</p>
          </header>

          {/* Weekly */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-widest text-primary">
                {t('weeklyTitle')}
              </h2>
              <span className="text-[10px] text-tertiary font-mono">{t('resetsMonday')}</span>
            </div>
            <LeaderboardTable entries={weekly} currentUserId={userId} />
          </section>

          {/* All-time */}
          <section className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-tertiary">
              {t('allTimeTitle')}
            </h2>
            <LeaderboardTable entries={allTime} currentUserId={userId} />
          </section>
        </div>
      </Container>
    </main>
  );
}
