import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 128, height: 128 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        height: '100%',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#09090b',
        borderRadius: 28,
        border: '4px solid #facc15',
        boxShadow: 'inset 0 0 32px rgba(250,204,21,0.2)',
      }}
    >
      <div
        style={{
          display: 'flex',
          color: '#facc15',
          fontSize: 64,
          fontWeight: 900,
          letterSpacing: '-0.1em',
          textShadow: '0 4px 16px rgba(250,204,21,0.4)',
        }}
      >
        JS
      </div>
    </div>,
    { ...size },
  );
}
