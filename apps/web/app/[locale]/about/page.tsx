import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import type { LocaleCode } from '@/lib/i18n/config';

export default async function AboutPage({ params }: { params: Promise<{ locale: LocaleCode }> }) {
  const { locale } = await params;

  redirect(`/${locale}/credits`);
}
