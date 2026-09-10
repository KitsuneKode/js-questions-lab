import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const contentSecurityPolicy = [
  "default-src 'self'",
  // unsafe-eval is required for Monaco; do not treat it as a substitute for worker network nulling.
  // @monaco-editor/react loads editor + workers from jsDelivr by default.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://*.clerk.com https://challenges.cloudflare.com https://*.protect.clerk.com https://va.vercel-scripts.com https://cdn.jsdelivr.net",
  "worker-src 'self' blob: data: https://cdn.jsdelivr.net",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.clerk.com https://*.clerk.accounts.dev https://*.protect.clerk.com:* https://api.anthropic.com https://*.lemonsqueezy.com https://api.web3forms.com https://va.vercel-scripts.com https://vitals.vercel-insights.com https://cdn.jsdelivr.net",
  "img-src 'self' data: blob: https: https://img.clerk.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "frame-src 'self' https://*.clerk.com https://*.clerk.accounts.dev https://*.lemonsqueezy.com https://challenges.cloudflare.com https://*.protect.clerk.com",
  "form-action 'self' https://*.clerk.com https://*.clerk.accounts.dev https://*.protect.clerk.com https://api.web3forms.com",
].join('; ');

const nextConfig: NextConfig = {
  // Enable gzip/Brotli compression for better performance and SEO
  compress: true,
  // Explicitly declare the external content files used by loaders.ts so
  // Turbopack can build a precise file-trace instead of sweeping the project.
  outputFileTracingIncludes: {
    '/**': ['../../content/generated/**/*'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: contentSecurityPolicy,
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/en',
        permanent: true,
      },
      {
        source: '/:locale/about',
        destination: '/:locale/credits',
        permanent: true,
      },
    ];
  },
  experimental: {
    viewTransition: true,
  },
};

export default withNextIntl(nextConfig);
