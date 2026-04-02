import { ImageResponse } from 'next/og';
import { getTranslations } from 'next-intl/server';

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
        background: 'linear-gradient(135deg, #F59E0B 0%, #38BDF8 100%)',
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
          marginBottom: '40px',
        }}
      >
        <div
          style={{
            display: 'flex',
            height: 120,
            width: 120,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 28,
            border: '4px solid rgba(255,255,255,0.3)',
            background: 'rgba(255,255,255,0.15)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            color: 'white',
            fontSize: 48,
            fontWeight: 800,
          }}
        >
          JS
        </div>
      </div>
      <h1
        style={{
          fontSize: 72,
          fontWeight: 800,
          color: 'white',
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
          color: 'rgba(255,255,255,0.9)',
          textAlign: 'center',
          maxWidth: '900px',
          lineHeight: 1.5,
        }}
      >
        {t('description')}
      </p>
    </div>,
    {
      ...size,
    },
  );
}
