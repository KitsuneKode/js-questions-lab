import { ImageResponse } from 'next/og';
import { siteConfig } from '@/lib/site-config';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = `${siteConfig.name} social card`;

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        height: '100%',
        width: '100%',
        background: '#000000',
        backgroundImage:
          'radial-gradient(circle at top left, rgba(250,204,21,0.15), transparent 50%), radial-gradient(circle at bottom right, rgba(250,204,21,0.1), transparent 50%)',
        color: '#fafafa',
        padding: '64px',
        fontFamily: 'sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          borderRadius: 48,
          border: '1px solid rgba(250,204,21,0.2)',
          background: 'rgba(9,9,11,0.8)',
          padding: '56px',
          boxShadow: '0 32px 96px rgba(0,0,0,0.5)',
          gap: '48px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            flex: 1,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                borderRadius: 999,
                border: '1px solid rgba(250,204,21,0.3)',
                background: 'rgba(250,204,21,0.1)',
                padding: '12px 24px',
                color: '#facc15',
                fontSize: 24,
                fontWeight: 800,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
              }}
            >
              {siteConfig.shortName}
              <span style={{ color: '#a1a1aa', letterSpacing: '0.15em' }}>
                Built by @kitsunekode
              </span>
            </div>
            <div
              style={{ fontSize: 76, lineHeight: 1.1, fontWeight: 900, letterSpacing: '-0.05em' }}
            >
              {siteConfig.name}
            </div>
            <div
              style={{
                maxWidth: 720,
                fontSize: 36,
                lineHeight: 1.4,
                color: '#d4d4d8',
                fontWeight: 500,
              }}
            >
              Practice JavaScript interview questions with runnable snippets, event-loop visuals,
              and a tighter answer-to-feedback loop.
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              gap: '24px',
              fontSize: 28,
              color: '#a1a1aa',
              fontWeight: 600,
            }}
          >
            <span>Based on Lydia Hallie&apos;s JS Questions</span>
            <span style={{ color: '#facc15' }}>•</span>
            <span>{siteConfig.creator.displayHandle}</span>
          </div>
        </div>

        <div
          style={{
            position: 'relative',
            display: 'flex',
            minWidth: 320,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              height: 280,
              width: 280,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 72,
              border: '8px solid #facc15',
              background: '#09090b',
              boxShadow: '0 0 80px rgba(250,204,21,0.25), inset 0 0 40px rgba(250,204,21,0.2)',
            }}
          >
            <div
              style={{
                display: 'flex',
                color: '#facc15',
                fontSize: 144,
                fontWeight: 900,
                letterSpacing: '-0.1em',
                textShadow: '0 8px 32px rgba(250,204,21,0.5)',
              }}
            >
              JS
            </div>
          </div>
        </div>
      </div>
    </div>,
    { ...size },
  );
}
