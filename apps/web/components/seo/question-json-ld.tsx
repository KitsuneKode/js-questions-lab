import type { QuestionRecord } from '@/lib/content/types';
import { getBaseUrl } from '@/lib/seo/config';
import { siteConfig } from '@/lib/site-config';

interface QuestionJsonLdProps {
  question: QuestionRecord;
  locale: string;
}

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
 * Question-specific JSON-LD structured data component.
 * Renders FAQPage, LearningResource, and SoftwareSourceCode schemas
 * to help search engines display rich results and help LLMs understand the content.
 *
 * Include this in individual question detail pages.
 */
export function QuestionJsonLd({ question, locale }: QuestionJsonLdProps) {
  const baseUrl = getBaseUrl();
  const questionUrl = `${baseUrl}/${locale}/questions/${question.id}`;

  // Get the correct option text
  const correctOption = question.options.find((o) => o.key === question.correctOption);
  const correctAnswerText = correctOption
    ? `${correctOption.key}: ${correctOption.text}`
    : (question.correctOption ?? 'See explanation');

  // FAQPage schema - good for rich results in search
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${questionUrl}#faq`,
    mainEntity: [
      {
        '@type': 'Question',
        name: question.title,
        text: question.promptMarkdown?.slice(0, 1000) ?? question.title,
        acceptedAnswer: {
          '@type': 'Answer',
          text: question.explanationMarkdown,
        },
        url: questionUrl,
      },
    ],
  };

  // LearningResource schema - signals educational content
  const learningResourceSchema = {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    '@id': `${questionUrl}#resource`,
    name: question.title,
    description: question.promptMarkdown?.slice(0, 300) ?? question.title,
    educationalLevel: question.difficulty,
    learningResourceType: 'Practice Problem',
    interactivityType: 'active',
    isAccessibleForFree: true,
    about: question.tags.map((tag) => ({
      '@type': 'Thing',
      name: tag,
    })),
    teaches: question.tags,
    author: {
      '@type': 'Person',
      name: siteConfig.source.creatorName,
      url: siteConfig.source.websiteUrl,
    },
    provider: {
      '@type': 'Organization',
      name: siteConfig.name,
      url: baseUrl,
    },
    inLanguage: locale,
    url: questionUrl,
    identifier: question.id,
    keywords: question.tags.join(', '),
    educationalUse: ['practice', 'assessment', 'self-assessment'],
  };

  // SoftwareSourceCode schema for the code snippet
  const codeBlock = question.codeBlocks[0];
  const codeSchema = codeBlock
    ? {
        '@context': 'https://schema.org',
        '@type': 'SoftwareSourceCode',
        '@id': `${questionUrl}#code`,
        codeRepository: siteConfig.source.repoUrl,
        programmingLanguage: {
          '@type': 'ComputerLanguage',
          name: codeBlock.language === 'js' ? 'JavaScript' : codeBlock.language,
        },
        text: codeBlock.code,
        codeSampleType: 'snippet',
        abstract: `Code example demonstrating ${question.tags.join(', ')} in JavaScript`,
      }
    : null;

  // Quiz schema for the multiple choice aspect
  const quizSchema = {
    '@context': 'https://schema.org',
    '@type': 'Quiz',
    '@id': `${questionUrl}#quiz`,
    name: question.title,
    about: question.tags.map((tag) => ({
      '@type': 'Thing',
      name: tag,
    })),
    educationalLevel: question.difficulty,
    hasPart: {
      '@type': 'Question',
      name: question.title,
      text: question.promptMarkdown ?? question.title,
      eduQuestionType: 'Multiple choice',
      suggestedAnswer: question.options
        .filter((o) => o.key !== question.correctOption)
        .map((o) => ({
          '@type': 'Answer',
          text: `${o.key}: ${o.text}`,
        })),
      acceptedAnswer: {
        '@type': 'Answer',
        text: correctAnswerText,
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(learningResourceSchema) }}
      />
      {codeSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(codeSchema) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(quizSchema) }}
      />
    </>
  );
}
