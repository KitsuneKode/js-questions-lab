import { NextResponse } from 'next/server';

import { getQuestionById } from '@/lib/content/loaders';
import { DEFAULT_LOCALE } from '@/lib/i18n/config';
import { getBaseUrl } from '@/lib/seo/config';
import { siteConfig } from '@/lib/site-config';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/questions/[id]
 *
 * Returns a single question by ID in JSON format.
 */
export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const questionId = Number.parseInt(id, 10);

  if (!Number.isFinite(questionId) || questionId < 1) {
    return NextResponse.json(
      {
        error: 'Invalid question ID',
        message: 'Question ID must be a positive integer',
      },
      { status: 400 },
    );
  }

  const question = getQuestionById(DEFAULT_LOCALE, questionId);

  if (!question) {
    return NextResponse.json(
      {
        error: 'Question not found',
        message: `No question exists with ID ${questionId}`,
      },
      { status: 404 },
    );
  }

  const baseUrl = getBaseUrl();

  const data = {
    meta: {
      source: {
        author: siteConfig.source.creatorName,
        repository: siteConfig.source.repoUrl,
      },
      generatedAt: new Date().toISOString(),
    },
    question: {
      id: question.id,
      title: question.title,
      slug: question.slug,
      tags: question.tags,
      difficulty: question.difficulty,
      runnable: question.runnable,
      code: question.codeBlocks[0]?.code ?? null,
      codeLanguage: question.codeBlocks[0]?.language ?? null,
      allCodeBlocks: question.codeBlocks.map((block) => ({
        language: block.language,
        code: block.code,
      })),
      options: question.options.map((o) => ({
        key: o.key,
        text: o.text,
      })),
      correctAnswer: question.correctOption,
      promptMarkdown: question.promptMarkdown,
      explanation: question.explanationMarkdown,
      url: `${baseUrl}/en/questions/${question.id}`,
      relatedUrls: {
        en: `${baseUrl}/en/questions/${question.id}`,
        es: `${baseUrl}/es/questions/${question.id}`,
        fr: `${baseUrl}/fr/questions/${question.id}`,
        de: `${baseUrl}/de/questions/${question.id}`,
        ja: `${baseUrl}/ja/questions/${question.id}`,
        'pt-BR': `${baseUrl}/pt-BR/questions/${question.id}`,
      },
    },
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
 * OPTIONS /api/questions/[id]
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
