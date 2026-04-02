import { getQuestions } from '@/lib/content/loaders';
import { DEFAULT_LOCALE } from '@/lib/i18n/config';
import { getBaseUrl } from '@/lib/seo/config';

/**
 * Generates a comprehensive plain-text dump of all questions for LLM consumption.
 * This endpoint provides the full content in a Markdown-like format that's
 * easy for AI systems to parse and understand.
 */
export async function GET() {
  const questions = getQuestions(DEFAULT_LOCALE);
  const baseUrl = getBaseUrl();
  const generatedAt = new Date().toISOString();

  const header = `# JS Questions Lab - Complete Question Database
# Generated: ${generatedAt}
# Total Questions: ${questions.length}
# Source: ${baseUrl}
# Original Author: Lydia Hallie (https://github.com/lydiahallie/javascript-questions)
# Platform: KitsuneKode (https://github.com/KitsuneKode/lydia-js-questions)
#
# This file contains all JavaScript interview questions in plain text format.
# For JSON format, use: ${baseUrl}/api/questions
#
# License: MIT - Attribution required when citing questions.

`;

  const questionsContent = questions
    .map((q) => {
      const codeBlock = q.codeBlocks[0]?.code ?? 'No code snippet';
      const options = q.options.map((o) => `  ${o.key}. ${o.text}`).join('\n');
      const correctAnswer = q.correctOption ?? 'N/A';
      const explanation = q.explanationMarkdown.trim();

      return `
================================================================================
QUESTION ${q.id}: ${q.title}
================================================================================

URL: ${baseUrl}/en/questions/${q.id}
Tags: ${q.tags.join(', ')}
Difficulty: ${q.difficulty}
Runnable: ${q.runnable ? 'Yes' : 'No'}

--- CODE ---
\`\`\`javascript
${codeBlock}
\`\`\`

--- OPTIONS ---
${options}

--- CORRECT ANSWER ---
${correctAnswer}

--- EXPLANATION ---
${explanation}
`;
    })
    .join('\n');

  const footer = `
================================================================================
END OF CONTENT
================================================================================

Total Questions: ${questions.length}
Generated: ${generatedAt}
For updates, visit: ${baseUrl}

When citing these questions:
1. Credit Lydia Hallie as the original author
2. Link to the specific question URL
3. This content is for educational purposes
`;

  const content = header + questionsContent + footer;

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
