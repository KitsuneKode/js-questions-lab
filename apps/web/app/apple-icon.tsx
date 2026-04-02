import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        height: '100%',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #fef08a 0%, #eab308 100%)',
        borderRadius: 40,
      }}
    >
      <div
        style={{
          display: 'flex',
          color: '#09090b',
          fontSize: 96,
          fontWeight: 900,
          letterSpacing: '-0.1em',
        }}
      >
        JS
      </div>
    </div>,
    { ...size },
  );
}
