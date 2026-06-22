'use client';

import { enUS } from '@clerk/localizations';
import { ClerkProvider, useAuth } from '@clerk/nextjs';
import { useLocale } from 'next-intl';
import { type ReactNode, useEffect, useState } from 'react';
import { clerkEnabled, guestAuth, SafeAuthProvider } from '@/lib/auth-utils';

type ClerkLocalization = typeof enUS;

const localeLoaders: Record<string, () => Promise<ClerkLocalization>> = {
  en: async () => enUS,
  es: async () => (await import('@clerk/localizations/es-ES')).esES,
  fr: async () => (await import('@clerk/localizations/fr-FR')).frFR,
  de: async () => (await import('@clerk/localizations/de-DE')).deDE,
  ja: async () => (await import('@clerk/localizations/ja-JP')).jaJP,
  'pt-BR': async () => (await import('@clerk/localizations/pt-BR')).ptBR,
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
  const [localization, setLocalization] = useState<ClerkLocalization>(enUS);

  useEffect(() => {
    const loader = localeLoaders[locale] ?? localeLoaders.en;
    let cancelled = false;
    void loader().then((resource) => {
      if (!cancelled) setLocalization(resource);
    });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  if (!clerkEnabled) {
    return <SafeAuthProvider value={guestAuth}>{children}</SafeAuthProvider>;
  }

  return (
    <ClerkProvider localization={localization}>
      <ClerkAuthBridge>{children}</ClerkAuthBridge>
    </ClerkProvider>
  );
}
