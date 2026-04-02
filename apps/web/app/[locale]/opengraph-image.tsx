import { ImageResponse } from 'next/og';
import { getTranslations } from 'next-intl/server';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function LocaleOpenGraphImage({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale, namespace: 'meta' });

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
      {...(params.locale === 'ja'
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
        {t('title')}
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
        {t('description')}
      </p>
    </div>,
    { ...size },
  );
}
