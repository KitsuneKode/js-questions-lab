import { ImageResponse } from 'next/og';

import { isValidLocale, type LocaleCode, SUPPORTED_LOCALES } from '@/lib/i18n/config';
import deMessages from '@/messages/de.json';
import enMessages from '@/messages/en.json';
import esMessages from '@/messages/es.json';
import frMessages from '@/messages/fr.json';
import jaMessages from '@/messages/ja.json';
import ptBrMessages from '@/messages/pt-BR.json';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const META_COPY: Record<LocaleCode, { title: string; description: string }> = {
  de: deMessages.meta,
  en: enMessages.meta,
  es: esMessages.meta,
  fr: frMessages.meta,
  ja: jaMessages.meta,
  'pt-BR': ptBrMessages.meta,
};

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export default async function LocaleOpenGraphImage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const activeLocale = isValidLocale(locale) ? locale : 'en';
  const meta = META_COPY[activeLocale];

  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        height: '100%',
        width: '100%',
        background: '#09090b',
        backgroundImage: 'radial-gradient(circle at center, rgba(250,204,21,0.1), transparent 70%)',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px',
      }}
      {...(activeLocale === 'ja'
        ? { fontFamily: '"Noto Sans JP", sans-serif' }
        : { fontFamily: 'sans-serif' })}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '48px',
        }}
      >
        <div
          style={{
            display: 'flex',
            height: 140,
            width: 140,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 36,
            border: '4px solid #facc15',
            background: '#09090b',
            boxShadow: '0 0 60px rgba(250,204,21,0.25)',
            color: '#facc15',
            fontSize: 64,
            fontWeight: 900,
            letterSpacing: '-0.1em',
          }}
        >
          JS
        </div>
      </div>
      <h1
        style={{
          fontSize: 72,
          fontWeight: 800,
          color: '#fafafa',
          textAlign: 'center',
          marginBottom: '24px',
          letterSpacing: '-0.02em',
        }}
      >
        {meta.title}
      </h1>
      <p
        style={{
          fontSize: 32,
          color: '#a1a1aa',
          textAlign: 'center',
          maxWidth: '900px',
          lineHeight: 1.5,
        }}
      >
        {meta.description}
      </p>
    </div>,
    { ...size },
  );
}
