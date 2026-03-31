import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  // Explicitly declare the external content files used by loaders.ts so
  // Turbopack can build a precise file-trace instead of sweeping the project.
  outputFileTracingIncludes: {
    '/**': ['../../content/generated/**/*'],
  },
  experimental: {
    viewTransition: true,
  },
};

export default withNextIntl(nextConfig);
