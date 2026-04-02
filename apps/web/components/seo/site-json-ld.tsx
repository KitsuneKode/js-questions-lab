import { getBaseUrl } from '@/lib/seo/config';
import { siteConfig } from '@/lib/site-config';

/**
 * Safely stringify JSON-LD data by replacing `<` with its unicode equivalent.
 * This prevents XSS injection attacks where malicious content could include
 * `</script>` tags to break out of the JSON-LD context.
 *
 * @see https://nextjs.org/docs/app/guides/json-ld
 */
function safeJsonLd(data: object): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

/**
 * Site-wide JSON-LD structured data component.
 * Renders WebSite, EducationalOrganization, and Course schemas
 * to help search engines and LLMs understand the site's purpose.
 *
 * Include this in the locale layout for global coverage.
 */
export function SiteJsonLd() {
  const baseUrl = getBaseUrl();

  // WebSite schema with SearchAction for sitelinks search box
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${baseUrl}/#website`,
    name: siteConfig.name,
    alternateName: siteConfig.shortName,
    url: baseUrl,
    description: siteConfig.description,
    publisher: {
      '@type': 'Person',
      name: siteConfig.creator.name,
      url: siteConfig.creator.githubUrl,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/en/questions?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
    inLanguage: ['en', 'es', 'fr', 'de', 'ja', 'pt-BR'],
  };

  // EducationalOrganization schema
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    '@id': `${baseUrl}/#organization`,
    name: siteConfig.name,
    url: baseUrl,
    description: 'Free JavaScript interview preparation platform',
    sameAs: [siteConfig.repoUrl, siteConfig.creator.xUrl, siteConfig.creator.githubUrl],
    founder: {
      '@type': 'Person',
      name: siteConfig.creator.name,
      url: siteConfig.creator.githubUrl,
    },
  };

  // Course schema for the learning experience
  const courseSchema = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    '@id': `${baseUrl}/#course`,
    name: 'JavaScript Interview Preparation',
    description:
      '156+ JavaScript questions with detailed explanations, runnable code snippets, and event loop visualization for interview preparation.',
    provider: {
      '@id': `${baseUrl}/#organization`,
    },
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'online',
      courseWorkload: 'PT10H',
    },
    educationalLevel: 'Intermediate',
    about: [
      { '@type': 'Thing', name: 'JavaScript' },
      { '@type': 'Thing', name: 'Interview Preparation' },
      { '@type': 'Thing', name: 'Frontend Development' },
      { '@type': 'Thing', name: 'Event Loop' },
      { '@type': 'Thing', name: 'Closures' },
      { '@type': 'Thing', name: 'Promises' },
      { '@type': 'Thing', name: 'Async/Await' },
    ],
    teaches: [
      'JavaScript fundamentals',
      'Closures and scope',
      'Promises and async programming',
      'Event loop mechanics',
      'Prototypes and inheritance',
      'Type coercion',
      'Hoisting behavior',
    ],
    isAccessibleForFree: true,
    inLanguage: ['en', 'es', 'fr', 'de', 'ja', 'pt-BR'],
    creator: {
      '@type': 'Person',
      name: siteConfig.source.creatorName,
      url: siteConfig.source.websiteUrl,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(courseSchema) }}
      />
    </>
  );
}
