import type { MetadataRoute } from 'next';
import { SUPPORTED_LOCALES } from '@/lib/i18n/config';
import { getBaseUrl } from '@/lib/seo/config';

/**
 * Dynamic robots.txt generation.
 * - Allows all crawlers including AI bots (GPTBot, Claude, Perplexity, etc.)
 * - Points to sitemap and llms.txt for discovery
 * - Blocks internal API and Next.js paths
 * - Blocks auth pages (sign-in, sign-up) from indexing
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();

  // Auth pages across all locales should not be indexed
  const authDisallows = SUPPORTED_LOCALES.flatMap((locale) => [
    `/${locale}/sign-in`,
    `/${locale}/sign-up`,
  ]);

  return {
    rules: [
      // General crawlers
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/_next/', ...authDisallows],
      },
      // AI/LLM crawlers - explicitly allowed
      {
        userAgent: 'GPTBot',
        allow: '/',
      },
      {
        userAgent: 'ChatGPT-User',
        allow: '/',
      },
      {
        userAgent: 'Claude-Web',
        allow: '/',
      },
      {
        userAgent: 'Anthropic-AI',
        allow: '/',
      },
      {
        userAgent: 'PerplexityBot',
        allow: '/',
      },
      {
        userAgent: 'Bytespider',
        allow: '/',
      },
      {
        userAgent: 'CCBot',
        allow: '/',
      },
      {
        userAgent: 'Google-Extended',
        allow: '/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
