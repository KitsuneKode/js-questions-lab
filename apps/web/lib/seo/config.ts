/**
 * SEO configuration utilities.
 * Centralized helpers for consistent URL generation and metadata across the app.
 */

import { type LocaleCode, SUPPORTED_LOCALES } from '@/lib/i18n/config';

/**
 * Returns the base URL for the site, preferring the environment variable
 * but falling back to localhost for development.
 */
export function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'https://jsquestionslab.kitsunelabs.xyz';
}

/**
 * Builds the canonical URL for a given path and locale.
 */
export function getCanonicalUrl(locale: LocaleCode, path = ''): string {
  const baseUrl = getBaseUrl();
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return cleanPath ? `${baseUrl}/${locale}/${cleanPath}` : `${baseUrl}/${locale}`;
}

/**
 * Builds alternate language URLs for hreflang tags.
 * Returns a record mapping locale codes to full URLs, plus x-default.
 */
export function getAlternateLanguages(
  path = '',
  defaultLocale: LocaleCode = 'en',
): Record<string, string> {
  const baseUrl = getBaseUrl();
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;

  const languages: Record<string, string> = {};

  for (const locale of SUPPORTED_LOCALES) {
    languages[locale] = cleanPath ? `${baseUrl}/${locale}/${cleanPath}` : `${baseUrl}/${locale}`;
  }

  // x-default points to the default locale version
  languages['x-default'] = cleanPath
    ? `${baseUrl}/${defaultLocale}/${cleanPath}`
    : `${baseUrl}/${defaultLocale}`;

  return languages;
}

/**
 * Truncates text to a maximum length, breaking at sentence boundaries when possible.
 * Used for meta descriptions.
 */
export function truncateDescription(text: string, maxLength = 155): string {
  if (!text) return '';

  // Remove markdown formatting
  const clean = text
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/`[^`]+`/g, '') // Remove inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to text
    .replace(/[#*_~]/g, '') // Remove markdown symbols
    .replace(/\n+/g, ' ') // Replace newlines with spaces
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  if (clean.length <= maxLength) return clean;

  // Try to break at sentence boundary
  const truncated = clean.slice(0, maxLength);
  const lastPeriod = truncated.lastIndexOf('.');
  const lastQuestion = truncated.lastIndexOf('?');
  const lastExclaim = truncated.lastIndexOf('!');

  const sentenceEnd = Math.max(lastPeriod, lastQuestion, lastExclaim);

  if (sentenceEnd > maxLength * 0.5) {
    return clean.slice(0, sentenceEnd + 1);
  }

  // Fall back to word boundary
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > maxLength * 0.7) {
    return `${clean.slice(0, lastSpace)}...`;
  }

  return `${truncated}...`;
}
