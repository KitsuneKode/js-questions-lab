'use client';

import { deDE, enUS, esES, frFR, jaJP, ptBR } from '@clerk/localizations';
import { ClerkProvider, useAuth } from '@clerk/nextjs';
import { useLocale } from 'next-intl';
import type { ReactNode } from 'react';
import { clerkEnabled, guestAuth, SafeAuthProvider } from '@/lib/auth-utils';

const locales: Record<string, typeof enUS> = {
  en: enUS,
  es: esES,
  fr: frFR,
  de: deDE,
  ja: jaJP,
  'pt-BR': ptBR,
};

function ClerkAuthBridge({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, userId } = useAuth();

  return (
    <SafeAuthProvider
      value={{
        isLoaded,
        isSignedIn: Boolean(isSignedIn),
        userId: userId ?? null,
      }}
    >
      {children}
    </SafeAuthProvider>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const locale = useLocale();

  if (!clerkEnabled) {
    return <SafeAuthProvider value={guestAuth}>{children}</SafeAuthProvider>;
  }

  return (
    <ClerkProvider localization={locales[locale] || enUS}>
      <ClerkAuthBridge>{children}</ClerkAuthBridge>
    </ClerkProvider>
  );
}
