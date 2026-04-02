import { NextResponse } from 'next/server';

import { getQuestions } from '@/lib/content/loaders';
import { DEFAULT_LOCALE } from '@/lib/i18n/config';
import { getBaseUrl } from '@/lib/seo/config';
import { siteConfig } from '@/lib/site-config';

/**
 * GET /api/questions
 *
 * Returns all questions in JSON format for programmatic access.
 * Designed for LLM consumption and third-party integrations.
 */
export async function GET() {
  const questions = getQuestions(DEFAULT_LOCALE);
  const baseUrl = getBaseUrl();

  const data = {
    meta: {
      name: siteConfig.name,
      description: siteConfig.description,
      total: questions.length,
      source: {
        repository: siteConfig.source.repoUrl,
        author: siteConfig.source.creatorName,
        authorUrl: siteConfig.source.websiteUrl,
      },
      platform: {
        repository: siteConfig.repoUrl,
        author: siteConfig.creator.name,
        authorUrl: siteConfig.creator.githubUrl,
      },
      generatedAt: new Date().toISOString(),
      endpoints: {
        allQuestions: `${baseUrl}/api/questions`,
        singleQuestion: `${baseUrl}/api/questions/{id}`,
        fullTextDump: `${baseUrl}/llms-full.txt`,
        llmsInfo: `${baseUrl}/llms.txt`,
      },
    },
    questions: questions.map((q) => ({
      id: q.id,
      title: q.title,
      slug: q.slug,
      tags: q.tags,
      difficulty: q.difficulty,
      runnable: q.runnable,
      code: q.codeBlocks[0]?.code ?? null,
      codeLanguage: q.codeBlocks[0]?.language ?? null,
      options: q.options.map((o) => ({
        key: o.key,
        text: o.text,
      })),
      correctAnswer: q.correctOption,
      explanation: q.explanationMarkdown,
      url: `${baseUrl}/en/questions/${q.id}`,
    })),
  };

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

/**
 * OPTIONS /api/questions
 *
 * CORS preflight handler.
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
