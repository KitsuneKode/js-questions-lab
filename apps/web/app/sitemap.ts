import type { MetadataRoute } from 'next';

import { getLocaleIndex, getManifest, getQuestions } from '@/lib/content/loaders';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@/lib/i18n/config';
import { getBaseUrl } from '@/lib/seo/config';

export const revalidate = false;

/**
 * Dynamic sitemap generation for all locales and questions.
 * Generates URLs for:
 * - Landing pages (/{locale})
 * - Questions list pages (/{locale}/questions)
 * - Individual question pages (/{locale}/questions/{id})
 * - Contact pages (/{locale}/contact)
 * - Credits pages (/{locale}/credits)
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseUrl();
  const questions = getQuestions(DEFAULT_LOCALE);
  const localeIndexGeneratedAt =
    getLocaleIndex()?.generatedAt ?? getManifest(DEFAULT_LOCALE).generatedAt;

  // Static pages per locale
  const staticPages: MetadataRoute.Sitemap = SUPPORTED_LOCALES.flatMap((locale) => {
    const lastModified = getManifest(locale).generatedAt ?? localeIndexGeneratedAt;

    return [
      {
        url: `${baseUrl}/${locale}`,
        lastModified,
        changeFrequency: 'weekly',
        priority: 1.0,
      },
      {
        url: `${baseUrl}/${locale}/questions`,
        lastModified,
        changeFrequency: 'weekly',
        priority: 0.9,
      },
      {
        url: `${baseUrl}/${locale}/contact`,
        lastModified,
        changeFrequency: 'yearly',
        priority: 0.4,
      },
      {
        url: `${baseUrl}/${locale}/credits`,
        lastModified,
        changeFrequency: 'yearly',
        priority: 0.3,
      },
    ];
  });

  // Question pages for all locales
  const questionPages: MetadataRoute.Sitemap = SUPPORTED_LOCALES.flatMap((locale) => {
    const lastModified = getManifest(locale).generatedAt ?? localeIndexGeneratedAt;

    return questions.map((q) => ({
      url: `${baseUrl}/${locale}/questions/${q.id}`,
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    }));
  });

  return [...staticPages, ...questionPages];
}
