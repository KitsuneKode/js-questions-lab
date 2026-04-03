import { SignIn } from '@clerk/nextjs';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { Container } from '@/components/container';
import { withLocale } from '@/lib/locale-paths';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = 'force-dynamic';

export default async function SignInPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const fallbackRedirectUrl = withLocale(locale, '/');

  return (
    <main className="bg-void py-12">
      <Container>
        <div className="flex items-center justify-center min-h-[calc(100vh-350px)]">
          <SignIn
            fallbackRedirectUrl={fallbackRedirectUrl}
            signUpFallbackRedirectUrl={fallbackRedirectUrl}
          />
        </div>
      </Container>
    </main>
  );
}
