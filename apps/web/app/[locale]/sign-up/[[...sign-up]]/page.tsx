import { SignUp } from '@clerk/nextjs';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { Container } from '@/components/container';
import { SUPPORTED_LOCALES } from '@/lib/i18n/config';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export default async function SignUpPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <main className="bg-void py-12">
      <Container>
        <div className="flex items-center justify-center min-h-[calc(100vh-350px)]">
          <SignUp />
        </div>
      </Container>
    </main>
  );
}
