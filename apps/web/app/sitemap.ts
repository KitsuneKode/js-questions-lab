import type { MetadataRoute } from 'next';

import { getQuestions } from '@/lib/content/loaders';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@/lib/i18n/config';
import { getBaseUrl } from '@/lib/seo/config';

/**
 * Dynamic sitemap generation for all locales and questions.
 * Generates URLs for:
 * - Landing pages (/{locale})
 * - Questions list pages (/{locale}/questions)
 * - Individual question pages (/{locale}/questions/{id})
 * - Dashboard pages (/{locale}/dashboard)
 * - Credits pages (/{locale}/credits)
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseUrl();
  const questions = getQuestions(DEFAULT_LOCALE);
  const now = new Date();

  // Static pages per locale
  const staticPages: MetadataRoute.Sitemap = SUPPORTED_LOCALES.flatMap((locale) => [
    {
      url: `${baseUrl}/${locale}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/${locale}/questions`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/${locale}/credits`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]);

  // Question pages for all locales
  const questionPages: MetadataRoute.Sitemap = SUPPORTED_LOCALES.flatMap((locale) =>
    questions.map((q) => ({
      url: `${baseUrl}/${locale}/questions/${q.id}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  );

  return [...staticPages, ...questionPages];
}
